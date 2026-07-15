import { create } from 'zustand'
import {
  STOCK_DEFS,
  INDEX_DEFS,
  MOCK_NEWS,
  MARKET_NEWS,
  SECTORS,
  buildInitialStocks,
  buildInitialIndices,
  tickStocks,
  tickIndices,
  makeSynthMarketNews,
  makeSynthStockNews,
} from './mockData'
import { fetchQuotes } from './quotes'
import { fetchNews } from './newsSource'
import {
  loadWatchlist,
  saveWatchlistItem,
  removeWatchlistItem,
  loadAlerts,
  saveAlert,
  deleteAlert,
  loadHoldings,
  saveHolding,
  removeHolding as dbRemoveHolding,
  loadNewsCache,
  saveNewsCache,
  loadProfile,
  saveProfile,
} from './db'

const DEFAULT_WATCHLIST = [
  'sh600519', 'sz300750', 'sz002594', 'sh601318', 'sh600036', 'sz000858',
]

// Local date string (YYYY-MM-DD) in the user's timezone.
function localDate(d = new Date()) {
  const z = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`
}

// Local HH:MM string for synthetic news timestamps.
function nowHM() {
  const z = (n) => String(n).padStart(2, '0')
  const d = new Date()
  return `${z(d.getHours())}:${z(d.getMinutes())}`
}

// A-share trading session (Beijing time, Mon–Fri).
// Morning 09:30–11:30, afternoon 13:00–15:00.
function isTradingNow() {
  const d = new Date()
  const day = d.getDay()
  if (day === 0 || day === 6) return false
  const mins = d.getHours() * 60 + d.getMinutes()
  const m1 = 9 * 60 + 30, m2 = 11 * 60 + 30
  const m3 = 13 * 60, m4 = 15 * 60
  return (mins >= m1 && mins <= m2) || (mins >= m3 && mins <= m4)
}

// Refresh fast during trading hours, slow otherwise to save resources.
function refreshIntervalMs() {
  return isTradingNow() ? 3000 : 30000
}

// Illustrative market breadth derived from the tracked universe (scaled up).
// Not a real all-market count — labelled 「示意」 in the UI.
function computeBreadth(stocks) {
  const list = Object.values(stocks)
  if (!list.length) return { up: 0, limitUp: 0, down: 0, limitDown: 0 }
  const upCount = list.filter((s) => s.changePercent >= 0).length
  const downCount = list.filter((s) => s.changePercent < 0).length
  const scale = 4800 / list.length
  const up = Math.round(upCount * scale)
  const down = Math.round(downCount * scale)
  const limitUp = list.filter((s) => s.changePercent >= 9.5).length * 4 + 18
  const limitDown = list.filter((s) => s.changePercent <= -9.5).length * 4 + 6
  return { up, limitUp, down, limitDown }
}

const ALL_NEWS = [...MOCK_NEWS, ...MARKET_NEWS]

export const useStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────────────────────────
  currentPage: 'watchlist', // watchlist | news | alerts | heatmap | holdings | profile
  stocks: buildInitialStocks(STOCK_DEFS),
  indices: buildInitialIndices(INDEX_DEFS),
  watchlist: DEFAULT_WATCHLIST,
  commandOpen: false,
  selectedStock: null,
  detailOpen: false,
  alerts: [],
  news: ALL_NEWS,
  sectors: SECTORS,
  holdings: {}, // { [code]: { costPrice, shares } } — record only, no trading
  profile: { name: '', avatar: null, firstDay: null, lastDay: null, streak: 0, totalDays: 0 },
  marketBreadth: computeBreadth(buildInitialStocks(STOCK_DEFS)),
  newsTickId: null,
  lastNewsPrices: {}, // code -> last notified changePercent (for movement news)
  lastRealCtime: 0, // newest ctime seen from the real feed (dedupe)
  selectedSector: null, // name of sector whose detail panel is open
  _tid: null,

  // ── Navigation ───────────────────────────────────────────────────────────────
  setCurrentPage: (page) => set({ currentPage: page }),

  // ── Watchlist (state + IndexedDB) ─────────────────────────────────────────────
  addToWatchlist: (code) => {
    if (get().watchlist.includes(code)) return
    set({ watchlist: [...get().watchlist, code] })
    saveWatchlistItem(code)
  },
  removeFromWatchlist: (code) => {
    set({ watchlist: get().watchlist.filter((c) => c !== code) })
    removeWatchlistItem(code)
  },

  // ── Manual holdings (state + IndexedDB) ───────────────────────────────────────
  addHolding: (code, { costPrice, shares }) => {
    set({
      holdings: { ...get().holdings, [code]: { costPrice, shares } },
    })
    saveHolding(code, costPrice, shares)
  },
  removeHolding: (code) => {
    const next = { ...get().holdings }
    delete next[code]
    set({ holdings: next })
    dbRemoveHolding(code)
  },

  // ── Command palette ───────────────────────────────────────────────────────────
  toggleCommand: () => set({ commandOpen: !get().commandOpen }),
  closeCommand: () => set({ commandOpen: false }),

  // ── Detail panel ──────────────────────────────────────────────────────────────
  openDetail: (code) => set({ selectedStock: code, detailOpen: true }),
  closeDetail: () => set({ detailOpen: false }),

  // ── Sector detail panel ───────────────────────────────────────────────────────
  openSector: (name) => set({ selectedSector: name }),
  closeSector: () => set({ selectedSector: null }),

  // ── Alerts (state + IndexedDB) ─────────────────────────────────────────────────
  addAlert: (alert) => {
    const full = {
      ...alert,
      id: `alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: Date.now(),
    }
    set({ alerts: [...get().alerts, full] })
    saveAlert(full)
  },
  removeAlert: (id) => {
    set({ alerts: get().alerts.filter((a) => a.id !== id) })
    deleteAlert(id)
  },

  // ── Profile (account name + avatar + streak) ──────────────────────────────────
  setProfile: ({ name, avatar }) => {
    const cur = get().profile
    const next = {
      ...cur,
      name: name !== undefined ? name : cur.name,
      avatar: avatar !== undefined ? avatar : cur.avatar,
    }
    set({ profile: next })
    saveProfile(next)
  },

  // ── Live ticking (main-process proxy, with local fallback) ─────────────────────
  startTicking: () => {
    if (get()._tid) return
    const tick = async () => {
      const { stocks, indices } = get()
      const res = await fetchQuotes({ stocks, indices })
      set({
        stocks: res.stocks,
        indices: res.indices,
        marketBreadth: computeBreadth(res.stocks),
      })
    }
    // Self-rescheduling loop so the interval can adapt to trading hours.
    const loop = () => {
      tick().finally(() => {
        const id = setTimeout(loop, refreshIntervalMs())
        set({ _tid: id })
      })
    }
    tick()
    set({ _tid: setTimeout(loop, refreshIntervalMs()) })
  },
  stopTicking: () => {
    const tid = get()._tid
    if (tid) clearTimeout(tid)
    set({ _tid: null })
  },

  // ── News ticking: keep the feed live ──────────────────────────────────────────
  // Every ~45s:
  //  - pull the real market feed (Sina) and prepend only brand-new items;
  //  - if any held/watched stock moved >= 2% since last notice, synthesize a
  //    related news card (auto-tagged into 持仓/自选 tabs);
  //  - if nothing new came in, synthesize one 大盘 news so the feed stays alive.
  // All synthetic items are clearly marked 示意 in the UI.
  startNewsTicking: () => {
    if (get().newsTickId) return
    // Seed the movement baseline from current prices.
    const base = {}
    Object.values(get().stocks).forEach((s) => {
      base[s.code] = s.changePercent
    })
    set({ lastNewsPrices: base })

    const tickNews = async () => {
      const st = get()
      const now = nowHM()
      const codes = [
        ...new Set([...st.watchlist, ...Object.keys(st.holdings)]),
      ]
      let added = []
      let lastCtime = st.lastRealCtime

      // 1) Real market feed — only items newer than what we've seen.
      try {
        const real = await fetchNews()
        if (real && real.length) {
          const fresh = real.filter((n) => (n.ctime || 0) > lastCtime).slice(0, 4)
          if (fresh.length) {
            added = added.concat(fresh)
            lastCtime = Math.max(lastCtime, ...fresh.map((n) => n.ctime || 0))
          }
        }
      } catch (e) {
        // ignore — fall through to simulated fallback
      }

      // 2) Holdings / watchlist movement → synthetic related news.
      const prices = { ...st.lastNewsPrices }
      codes.forEach((code) => {
        const s = st.stocks[code]
        if (!s) return
        const prev = prices[code]
        if (prev === undefined) {
          prices[code] = s.changePercent
          return
        }
        if (Math.abs(s.changePercent - prev) >= 2) {
          added.push(makeSynthStockNews(s, now))
          prices[code] = s.changePercent
        }
      })

      // 3) Fallback: if nothing arrived this tick, keep 大盘 alive.
      if (added.length === 0) {
        added.push(makeSynthMarketNews(now))
      }

      if (added.length) {
        const next = [...added, ...st.news].slice(0, 80)
        set({ news: next, lastNewsPrices: prices, lastRealCtime: lastCtime })
        saveNewsCache(next)
      } else {
        set({ lastNewsPrices: prices, lastRealCtime: lastCtime })
      }
    }

    tickNews()
    const id = setInterval(tickNews, 45000)
    set({ newsTickId: id })
  },
  stopNewsTicking: () => {
    const id = get().newsTickId
    if (id) clearInterval(id)
    set({ newsTickId: null })
  },

  // ── Init: restore persisted state ───────────────────────────────────────────
  init: async () => {
    try {
      const [wl, al, hd, cachedNews, prof] = await Promise.all([
        loadWatchlist(),
        loadAlerts(),
        loadHoldings(),
        loadNewsCache(),
        loadProfile(),
      ])
      const today = localDate()
      const yesterday = localDate(new Date(Date.now() - 86400000))
      const profile = {
        name: '',
        avatar: null,
        firstDay: today,
        lastDay: today,
        streak: 1,
        totalDays: 1,
        ...(prof || {}),
      }
      if (prof) {
        if (profile.lastDay === today) {
          // already counted today
        } else if (profile.lastDay === yesterday) {
          profile.streak = (profile.streak || 0) + 1
          profile.lastDay = today
          profile.totalDays = (profile.totalDays || 0) + 1
        } else {
          profile.streak = 1
          profile.lastDay = today
          profile.totalDays = (profile.totalDays || 0) + 1
        }
        saveProfile(profile)
      }

      const patch = { profile }
      if (wl && wl.length) patch.watchlist = wl.map((x) => x.code)
      if (al) patch.alerts = al
      if (hd && hd.length) {
        const h = {}
        hd.forEach((x) => {
          h[x.code] = { costPrice: x.costPrice, shares: x.shares }
        })
        patch.holdings = h
      }
      if (cachedNews && cachedNews.news) {
        patch.news = cachedNews.news
      } else {
        saveNewsCache(ALL_NEWS) // seed cache on first run
      }
      set(patch)
    } catch (e) {
      // IndexedDB unavailable (e.g. private mode) — keep defaults.
      console.warn('Glance: failed to load persisted state', e)
    }
  },
}))

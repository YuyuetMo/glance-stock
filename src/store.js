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
  loadCustomStocks,
  saveCustomStock,
  removeCustomStock,
} from './db'

const DEFAULT_WATCHLIST = [
  'sh600519', 'sz300750', 'sz002594', 'sh601318', 'sh600036', 'sz000858',
]

const round2 = (n) => Math.round(n * 100) / 100

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
  customStocks: {}, // { [code]: def } added by 6-digit code (persisted)
  // Add-holding modal flow (any code, incl. outside the built-in universe).
  addHoldingOpen: false,
  addHoldingInput: '',
  addHoldingDef: null,
  addHoldingResolving: false,
  // GitHub update prompt.
  updateInfo: null,
  _tid: null,
  _bid: null, // breadth fetch interval id

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

  // ── Custom stocks (added by 6-digit code, outside the built-in universe) ─────
  // Ensure a stock exists in the live `stocks` map; persist it if it's not a
  // built-in def so holdings survive a restart.
  ensureStock: (def, quote) => {
    const code = def.code
    const isBuiltin = STOCK_DEFS.some((d) => d.code === code)
    const price = (quote && quote.price) || def.prevClose || 0
    set({
      stocks: {
        ...get().stocks,
        [code]: {
          ...def,
          ...(quote || {}),
          price: round2(price),
          prevClose: round2(def.prevClose || price),
          changePercent: (quote && quote.changePercent) || 0,
          change: (quote && quote.change) || 0,
          sparkline: [round2(price)],
        },
      },
    })
    if (!isBuiltin) {
      set({ customStocks: { ...get().customStocks, [code]: def } })
      saveCustomStock(def)
    }
  },

  // Resolve a raw input (6-digit code, optionally sh/sz/bj-prefixed) to a real
  // A-share quote via the main-process Tencent proxy. Returns the stock def or
  // null on failure.
  resolveStock: async (raw) => {
    const m = String(raw).match(/^(sh|sz|bj)?\s*(\d{6})$/i)
    if (!m) return null
    const symbol = m[2]
    let prefix = (m[1] || '').toLowerCase()
    if (!prefix) {
      if (/^[69]/.test(symbol)) prefix = 'sh'
      else if (/^[03]/.test(symbol)) prefix = 'sz'
      else if (/^[48]/.test(symbol)) prefix = 'bj'
      else prefix = 'sh'
    }
    const code = prefix + symbol
    if (get().stocks[code]) return get().stocks[code]
    try {
      const res = await window.electronAPI.getQuotes({
        stocks: [{ code, symbol, prevClose: 0 }],
        indices: [],
      })
      const q = res && res.stocks && res.stocks[0]
      if (q && q.price) {
        const def = {
          code,
          symbol,
          name: q.name || code,
          market: prefix,
          prevClose: q.prevClose || q.price,
        }
        get().ensureStock(def, q)
        return get().stocks[code]
      }
    } catch (e) {
      console.warn('[Glance] resolveStock failed:', e.message)
    }
    return null
  },

  // ── Add-holding modal flow (supports any code) ───────────────────────────────
  openAddHolding: (input) => {
    set({
      addHoldingOpen: true,
      addHoldingInput: input,
      addHoldingDef: null,
      addHoldingResolving: true,
    })
    const finish = (def) => {
      if (def) {
        set({ addHoldingDef: def, addHoldingResolving: false })
      } else {
        set({ addHoldingResolving: false })
      }
    }
    // If it's already a known stock, use it directly; otherwise resolve by code.
    if (get().stocks[input]) {
      finish(get().stocks[input])
      return
    }
    get()
      .resolveStock(input)
      .then(finish)
  },
  submitAddHolding: (costPrice, shares) => {
    const def = get().addHoldingDef
    if (!def) return
    get().ensureStock(def, get().stocks[def.code])
    get().addHolding(def.code, { costPrice, shares })
    set({ addHoldingOpen: false, addHoldingInput: '', addHoldingDef: null })
  },
  closeAddHolding: () =>
    set({
      addHoldingOpen: false,
      addHoldingInput: '',
      addHoldingDef: null,
      addHoldingResolving: false,
    }),

  // ── Real market breadth (advance/decline) ────────────────────────────────────
  fetchBreadth: async () => {
    try {
      const real = await window.electronAPI.getBreadth?.()
      if (real && real.up != null) {
        set({ marketBreadth: real })
        return
      }
    } catch (e) {
      // ignore — fall back to simulated below
    }
    set({ marketBreadth: computeBreadth(get().stocks) })
  },

  // ── GitHub update check ───────────────────────────────────────────────────────
  checkUpdate: async () => {
    try {
      const r = await window.electronAPI.checkUpdate?.()
      if (r && r.hasUpdate) set({ updateInfo: r })
    } catch (e) {
      // ignore — no prompt if the check fails
    }
  },
  dismissUpdate: () => set({ updateInfo: null }),

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
    // Real all-market breadth (advance/decline) on a slower cadence.
    get().fetchBreadth()
    const bid = setInterval(() => get().fetchBreadth(), 30000)
    set({ _bid: bid })
  },
  stopTicking: () => {
    const tid = get()._tid
    if (tid) clearTimeout(tid)
    if (get()._bid) clearInterval(get()._bid)
    set({ _tid: null, _bid: null })
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
      const [wl, al, hd, cachedNews, prof, custom] = await Promise.all([
        loadWatchlist(),
        loadAlerts(),
        loadHoldings(),
        loadNewsCache(),
        loadProfile(),
        loadCustomStocks(),
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
      // Merge any custom (code-added) stocks into the live quote map so
      // holdings/watchlist entries referencing them keep working after restart.
      if (custom && custom.length) {
        const cmap = {}
        custom.forEach((d) => {
          cmap[d.code] = d
        })
        patch.customStocks = cmap
        const merged = { ...get().stocks }
        custom.forEach((d) => {
          if (!merged[d.code]) {
            merged[d.code] = {
              ...d,
              price: d.prevClose || 0,
              change: 0,
              changePercent: 0,
              sparkline: [d.prevClose || 0],
            }
          }
        })
        patch.stocks = merged
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

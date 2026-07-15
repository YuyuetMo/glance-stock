const { app, BrowserWindow, ipcMain, Notification, Tray, Menu, shell } = require('electron')
const path = require('path')
const https = require('https')

// ── Quote proxy layer ────────────────────────────────────────────────────────
// The renderer cannot talk to exchanges directly (CORS + auth), so all quotes
// are forwarded through the main process, which owns a small in-memory cache.
//
// Data source is configurable via env:
//   GLANCE_QUOTE_SOURCE = 'http' (default, uses Tencent free quote API)
//                       | 'mock' (offline simulation)
//   GLANCE_CACHE_TTL    = cache lifetime in ms (default 1500)
//
// On any network/parse error the real source gracefully falls back to the local
// mock engine, so the app never breaks.
const QUOTE_SOURCE = process.env.GLANCE_QUOTE_SOURCE || 'http'
const CACHE_TTL = Number(process.env.GLANCE_CACHE_TTL || 1500)
const cache = new Map() // 'batch' -> { ts, data }

const round2 = (n) => Math.round(n * 100) / 100

// Tencent finance code for a stock/index. Glance codes like sh600519/sz300750
// already match Tencent's format. Indices use our internal 'idx-*' prefix and
// must be mapped to Tencent's sh000001 / sz399001 / sz399006.
function tencentCode(item) {
  if (item.code === 'idx-sh') return 'sh000001'
  if (item.code === 'idx-sz') return 'sz399001'
  if (item.code === 'idx-cy') return 'sz399006'
  return item.code
}

// Local simulation engine: small random walk, ±10% A-share limit, sparkline grows.
function mockAdvance(item) {
  const prevClose = item.prevClose
  const isIndex = item.code && item.code.startsWith('idx')
  const maxStep = isIndex ? 0.003 : 0.006
  const up = Math.random() < 0.52
  const step = Math.random() * maxStep
  const changePct = up ? step : -step
  let price = item.price * (1 + changePct)
  price = Math.min(prevClose * 1.1, Math.max(prevClose * 0.9, price))
  price = round2(price)

  let spark = (item.sparkline || []).concat(price)
  if (spark.length > 120) spark = spark.slice(spark.length - 120)

  return {
    ...item,
    price,
    high: Math.max(item.high, price),
    low: Math.min(item.low, price),
    change: round2(price - prevClose),
    changePercent: round2(((price - prevClose) / prevClose) * 100),
    volume: (item.volume || 0) + Math.floor(Math.random() * 5000),
    sparkline: spark,
  }
}

async function httpFetchAll(items) {
  const codes = items.map(tencentCode).join(',')
  const url = `https://qt.gtimg.cn/q=${codes}`
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      const chunks = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`))
          return
        }
        const text = new TextDecoder('gbk').decode(Buffer.concat(chunks))
        resolve(text)
      })
    })
    req.on('error', reject)
    req.setTimeout(8000, () => reject(new Error('request timeout')))
  })
}

function parseTencent(body, items) {
  const map = {}
  items.forEach((item) => {
    const tc = tencentCode(item)
    const match = body.match(new RegExp(`v_${tc}="([^"]+)"`))
    if (!match) return
    const parts = match[1].split('~')
    if (parts.length < 36) return
    const price = parseFloat(parts[3])
    const prevClose = parseFloat(parts[4])
    const open = parseFloat(parts[5])
    const high = parseFloat(parts[33])
    const low = parseFloat(parts[34])
    const volume = parseInt(parts[6], 10) || 0
    if (Number.isNaN(price) || Number.isNaN(prevClose)) return
    map[item.code] = {
      name: parts[1] || item.name || item.code,
      price: round2(price),
      open: round2(open),
      prevClose: round2(prevClose),
      high: round2(high),
      low: round2(low),
      change: round2(price - prevClose),
      changePercent: round2(((price - prevClose) / prevClose) * 100),
      volume,
    }
  })
  return map
}

async function httpAdvance(items) {
  const text = await httpFetchAll(items)
  const realMap = parseTencent(text, items)
  return items.map((item) => {
    const real = realMap[item.code]
    if (!real) return mockAdvance(item)
    const price = real.price
    let spark = (item.sparkline || []).concat(price)
    if (spark.length > 120) spark = spark.slice(spark.length - 120)
    return {
      ...item,
      ...real,
      price,
      high: Math.max(item.high, real.high),
      low: Math.min(item.low, real.low),
      sparkline: spark,
    }
  })
}

async function advance(items) {
  if (QUOTE_SOURCE === 'mock') return items.map(mockAdvance)
  const cached = cache.get('batch')
  const now = Date.now()
  if (cached && now - cached.ts < CACHE_TTL) return cached.data
  try {
    const data = await httpAdvance(items)
    cache.set('batch', { ts: now, data })
    return data
  } catch (e) {
    console.warn('[Glance] quote proxy failed, falling back to mock:', e.message)
    return items.map(mockAdvance)
  }
}

ipcMain.handle('get-quotes', async (_event, payload) => {
  const allItems = [...(payload.stocks || []), ...(payload.indices || [])]
  const advanced = await advance(allItems)
  const byCode = new Map(advanced.map((x) => [x.code, x]))
  return {
    stocks: (payload.stocks || []).map((s) => byCode.get(s.code)),
    indices: (payload.indices || []).map((i) => byCode.get(i.code)),
  }
})

// ── News proxy layer ─────────────────────────────────────────────────────────
// Real market news is fetched through the main process (no CORS in the
// renderer). We use Sina's public finance roll feed (no auth, JSON).
// On any failure the handler returns null so the renderer falls back to its
// local simulated generator — the app never breaks and the feed stays alive.
function buildNewsUrl() {
  // lid=2509 → 股票/财经 rolling feed.
  return 'https://feed.mix.sina.com.cn/api/roll/get?pageid=153&lid=2509&num=20&page=1'
}

function fetchRealNews() {
  return new Promise((resolve) => {
    const req = https.get(
      buildNewsUrl(),
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Accept: 'application/json',
        },
      },
      (res) => {
        const chunks = []
        res.on('data', (c) => chunks.push(c))
        res.on('end', () => {
          try {
            if (res.statusCode !== 200) return resolve(null)
            const json = JSON.parse(Buffer.concat(chunks).toString('utf8'))
            const list = json && json.result && json.result.data
            if (!Array.isArray(list) || !list.length) return resolve(null)
            const items = list
              .filter((x) => x && x.title)
              .map((x) => {
                const ts = Number(x.ctime) || Date.now() / 1000
                const d = new Date(ts * 1000)
                const hh = String(d.getHours()).padStart(2, '0')
                const mm = String(d.getMinutes()).padStart(2, '0')
                return {
                  id: 'sina-' + (x.docid || x.ctime || String(Math.random())),
                  title: String(x.title),
                  time: `${hh}:${mm}`,
                  stockCode: null,
                  stockName: '大盘',
                  kind: 'market',
                  source: 'sina',
                  real: true,
                  ctime: ts,
                }
              })
            resolve(items.length ? items : null)
          } catch (e) {
            resolve(null)
          }
        })
      }
    )
    req.on('error', () => resolve(null))
    req.setTimeout(8000, () => {
      req.destroy()
      resolve(null)
    })
  })
}

ipcMain.handle('get-news', async () => {
  const items = await fetchRealNews()
  return items // array of market news, or null on failure
})

// ── Real market breadth (advance / decline / limit-up / limit-down) ──────────
// Source: Eastmoney's public stock list. The endpoint caps at 100 rows per
// page, so we read page 1 (to learn the total), then fetch every remaining
// page in parallel and count change% across the whole A-share universe.
// Result is cached for 60s. On any failure we return null so the renderer
// falls back to its illustrative simulator — the app never breaks.
const BREADTH_FS = 'm:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23'
const BREADTH_URL = `https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=100&po=1&np=1&fltt=2&invt=2&fid=f3&fs=${BREADTH_FS}&fields=f12,f14,f3`
const BREADTH_TTL = 60000
let breadthCache = { ts: 0, data: null }

function emGet(url) {
  return new Promise((resolve) => {
    const req = https.get(
      url,
      { headers: { 'User-Agent': 'Mozilla/5.0' } },
      (res) => {
        const chunks = []
        res.on('data', (c) => chunks.push(c))
        res.on('end', () => {
          try {
            if (res.statusCode !== 200) return resolve(null)
            resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
          } catch {
            resolve(null)
          }
        })
      }
    )
    req.on('error', () => resolve(null))
    req.setTimeout(8000, () => {
      req.destroy()
      resolve(null)
    })
  })
}

async function fetchRealBreadth() {
  const first = await emGet(BREADTH_URL)
  const total = (first && first.data && first.data.total) || 0
  const pages = Math.min(60, Math.max(1, Math.ceil(total / 100)))
  const all = (first && first.data && first.data.diff) || []
  const reqs = []
  for (let pn = 2; pn <= pages; pn++) {
    reqs.push(
      emGet(
        `https://push2.eastmoney.com/api/qt/clist/get?pn=${pn}&pz=100&po=1&np=1&fltt=2&invt=2&fid=f3&fs=${BREADTH_FS}&fields=f12,f14,f3`
      )
    )
  }
  const rest = await Promise.all(reqs)
  rest.forEach((j) => {
    if (j && j.data && Array.isArray(j.data.diff)) all.push(...j.data.diff)
  })
  let up = 0
  let down = 0
  let limitUp = 0
  let limitDown = 0
  all.forEach((x) => {
    const c = parseFloat(x.f3)
    if (Number.isNaN(c)) return
    if (c > 0) up++
    else if (c < 0) down++
    if (c >= 9.9) limitUp++
    if (c <= -9.9) limitDown++
  })
  if (!up && !down) return null
  return { up, down, limitUp, limitDown }
}

ipcMain.handle('get-breadth', async () => {
  const now = Date.now()
  if (breadthCache.data && now - breadthCache.ts < BREADTH_TTL) {
    return breadthCache.data
  }
  try {
    const data = await fetchRealBreadth()
    if (data) {
      breadthCache = { ts: now, data }
      return data
    }
  } catch (e) {
    console.warn('[Glance] breadth fetch failed:', e.message)
  }
  return null // renderer falls back to simulated breadth
})

// ── App version + GitHub update check ─────────────────────────────────────────
ipcMain.handle('get-app-version', () => app.getVersion())

function compareVer(a, b) {
  const pa = String(a).split('.').map((n) => parseInt(n, 10) || 0)
  const pb = String(b).split('.').map((n) => parseInt(n, 10) || 0)
  for (let i = 0; i < 3; i++) {
    const x = pa[i] || 0
    const y = pb[i] || 0
    if (x > y) return 1
    if (x < y) return -1
  }
  return 0
}

ipcMain.handle('check-update', async () => {
  try {
    const json = await new Promise((resolve) => {
      const req = https.get(
        'https://api.github.com/repos/YuyuetMo/glance-stock/releases/latest',
        {
          headers: {
            'User-Agent': 'glance',
            Accept: 'application/vnd.github+json',
          },
        },
        (res) => {
          const chunks = []
          res.on('data', (c) => chunks.push(c))
          res.on('end', () => {
            try {
              if (res.statusCode !== 200) return resolve(null)
              resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
            } catch {
              resolve(null)
            }
          })
        }
      )
      req.on('error', () => resolve(null))
      req.setTimeout(8000, () => {
        req.destroy()
        resolve(null)
      })
    })
    if (!json || !json.tag_name) return null
    const latest = json.tag_name.replace(/^v/i, '')
    const current = app.getVersion()
    const hasUpdate = compareVer(latest, current) > 0
    const assets = json.assets || []
    const portable =
      assets.find((a) => /portable/i.test(a.name)) || assets[0] || null
    return {
      hasUpdate,
      latest,
      current,
      notes: json.body || '',
      htmlUrl: json.html_url || '',
      portableUrl: portable ? portable.browser_download_url : '',
    }
  } catch (e) {
    console.warn('[Glance] update check failed:', e.message)
    return null
  }
})

ipcMain.handle('open-external', (_event, url) => {
  if (url && /^https?:\/\//.test(url)) shell.openExternal(url)
})

// ── Window + System Tray ──────────────────────────────────────────────────────
let mainWindow
let tray
app.isQuiting = false

const ICON = path.join(__dirname, '..', 'build', 'icon.ico')

function createWindow() {
  const windowOptions = {
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#160c0e',
    icon: ICON,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  }

  // macOS: hide the title bar but keep the native traffic lights.
  // Other platforms: auto-hide the application menu instead.
  if (process.platform === 'darwin') {
    windowOptions.titleBarStyle = 'hiddenInset'
    windowOptions.trafficLightPosition = { x: 16, y: 16 }
  } else {
    windowOptions.autoHideMenuBar = true
  }

  mainWindow = new BrowserWindow(windowOptions)

  mainWindow.once('ready-to-show', () => mainWindow.show())

  // Closing the window quits the app cleanly (no background process left behind).
  // The only way to keep it in the tray is the explicit "minimise to tray" button.
  mainWindow.on('close', () => {
    app.isQuiting = true
  })

  if (!app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

function createTray() {
  if (process.platform === 'darwin') return // macOS uses the dock
  try {
    tray = new Tray(ICON)
    tray.setToolTip('盯一眼 Glance')
    tray.setContextMenu(
      Menu.buildFromTemplate([
        { label: '显示窗口', click: () => mainWindow.show() },
        { type: 'separator' },
        {
          label: '退出',
          click: () => {
            app.isQuiting = true
            app.quit()
          },
        },
      ])
    )
    tray.on('click', () => {
      if (mainWindow.isVisible()) mainWindow.hide()
      else {
        mainWindow.show()
        mainWindow.focus()
      }
    })
  } catch (e) {
    console.warn('[Glance] tray init failed:', e.message)
  }
}

// System notification bridge used by the renderer via window.electronAPI.
ipcMain.handle('show-notification', (_event, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({ title, body }).show()
  }
})

// Renderer asks to minimise the window into the system tray (without quitting).
ipcMain.on('minimize-to-tray', () => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.hide()
})

// Clean up the tray icon when the app actually quits.
app.on('before-quit', () => {
  if (tray) {
    tray.destroy()
    tray = null
  }
})

app.whenReady().then(() => {
  createWindow()
  createTray()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

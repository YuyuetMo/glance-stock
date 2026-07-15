// IndexedDB persistence via the `idb` library.
// A single module-level promise is reused so the DB is never opened twice.
import { openDB } from 'idb'

let dbPromise = null

export function initDB() {
  if (!dbPromise) {
    dbPromise = openDB('glance-db', 4, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('watchlist')) {
          db.createObjectStore('watchlist', { keyPath: 'code' })
        }
        if (!db.objectStoreNames.contains('alerts')) {
          db.createObjectStore('alerts', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('holdings')) {
          db.createObjectStore('holdings', { keyPath: 'code' })
        }
        if (!db.objectStoreNames.contains('news')) {
          // keyed cache: single record with key 'news'
          db.createObjectStore('news', { keyPath: 'key' })
        }
        if (!db.objectStoreNames.contains('profile')) {
          // single record keyed 'profile'
          db.createObjectStore('profile', { keyPath: 'key' })
        }
        if (!db.objectStoreNames.contains('customStocks')) {
          // stocks added by 6-digit code (outside the built-in universe)
          db.createObjectStore('customStocks', { keyPath: 'code' })
        }
        if (!db.objectStoreNames.contains('ui')) {
          // UI preferences, e.g. home dashboard widget order (key 'home')
          db.createObjectStore('ui', { keyPath: 'key' })
        }
      },
    })
  }
  return dbPromise
}

// ── Watchlist ────────────────────────────────────────────────────────────────
export async function loadWatchlist() {
  const db = await initDB()
  return db.getAll('watchlist')
}

export async function saveWatchlistItem(code) {
  const db = await initDB()
  return db.put('watchlist', { code })
}

export async function removeWatchlistItem(code) {
  const db = await initDB()
  return db.delete('watchlist', code)
}

// ── Alerts ─────────────────────────────────────────────────────────────────────
export async function loadAlerts() {
  const db = await initDB()
  return db.getAll('alerts')
}

export async function saveAlert(alert) {
  const db = await initDB()
  return db.put('alerts', alert)
}

export async function deleteAlert(id) {
  const db = await initDB()
  return db.delete('alerts', id)
}

// ── Manual holdings (cost price + shares) ──────────────────────────────────────
// Pure record-keeping only — no buy/sell, no trading.
export async function loadHoldings() {
  const db = await initDB()
  return db.getAll('holdings')
}

export async function saveHolding(code, costPrice, shares) {
  const db = await initDB()
  return db.put('holdings', { code, costPrice, shares })
}

export async function removeHolding(code) {
  const db = await initDB()
  return db.delete('holdings', code)
}

// ── News cache ─────────────────────────────────────────────────────────────────
// Persist the latest news so the app shows content even before the first
// network/provider fetch. Stored under a single fixed key.
export async function loadNewsCache() {
  const db = await initDB()
  return db.get('news', 'news')
}

export async function saveNewsCache(news) {
  const db = await initDB()
  return db.put('news', { key: 'news', news })
}

// ── Profile (account name + avatar + streak) ───────────────────────────────────
// Single record keyed 'profile'. Avatar is stored as a data URL string.
export async function loadProfile() {
  const db = await initDB()
  return db.get('profile', 'profile')
}

export async function saveProfile(profile) {
  const db = await initDB()
  return db.put('profile', { key: 'profile', ...profile })
}

// ── Custom stocks (added by 6-digit code, outside the built-in universe) ──────
export async function loadCustomStocks() {
  const db = await initDB()
  return db.getAll('customStocks')
}

export async function saveCustomStock(def) {
  const db = await initDB()
  return db.put('customStocks', def)
}

export async function removeCustomStock(code) {
  const db = await initDB()
  return db.delete('customStocks', code)
}

// ── UI preferences (e.g. home dashboard widget order) ─────────────────────────
export async function loadUILayout() {
  const db = await initDB()
  return db.get('ui', 'home')
}

export async function saveUILayout(order) {
  const db = await initDB()
  return db.put('ui', { key: 'home', order })
}

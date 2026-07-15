import { tickStocks, tickIndices } from './mockData'

// Bridge between the renderer and the quote source.
//
// In Electron the main process owns the quote proxy (forwarding + caching +
// real data source), so we call window.electronAPI.getQuotes. When running the
// plain Vite dev server (no Electron), there is no main process — we fall back
// to the local mock engine so the UI is still fully exercisable.
export async function fetchQuotes({ stocks, indices }) {
  const hasAPI =
    typeof window !== 'undefined' &&
    window.electronAPI &&
    typeof window.electronAPI.getQuotes === 'function'

  if (hasAPI) {
    try {
      const payload = {
        stocks: Object.values(stocks),
        indices: Object.values(indices),
      }
      const res = await window.electronAPI.getQuotes(payload)
      const rekey = (arr) => {
        const map = {}
        ;(arr || []).forEach((x) => {
          map[x.code] = { ...stocks[x.code], ...x }
        })
        return map
      }
      return { stocks: rekey(res.stocks), indices: rekey(res.indices) }
    } catch (e) {
      // Proxy unavailable — degrade to local simulation.
    }
  }

  return {
    stocks: tickStocks(stocks),
    indices: tickIndices(indices),
  }
}

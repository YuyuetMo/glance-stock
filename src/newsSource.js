// Bridge to the main-process news proxy. Returns an array of real market news
// items, or null if the proxy is unavailable / the fetch failed. The caller is
// expected to fall back to its local simulated generator on null.
export async function fetchNews() {
  try {
    if (window.electronAPI && typeof window.electronAPI.getNews === 'function') {
      const items = await window.electronAPI.getNews()
      if (Array.isArray(items) && items.length) return items
    }
  } catch (e) {
    // ignore — fall through to null
  }
  return null
}

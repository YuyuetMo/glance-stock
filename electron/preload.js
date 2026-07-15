const { contextBridge, ipcRenderer } = require('electron')

// Expose a minimal, safe API to the renderer. No Node internals leak through.
contextBridge.exposeInMainWorld('electronAPI', {
  showNotification: (title, body) =>
    ipcRenderer.invoke('show-notification', { title, body }),
  // Ask the main-process quote proxy for the next snapshot.
  getQuotes: (payload) => ipcRenderer.invoke('get-quotes', payload),
  // Ask the main-process news proxy for the latest real market news.
  getNews: () => ipcRenderer.invoke('get-news'),
  // Ask the main process for the real all-market breadth (advance/decline/limit).
  getBreadth: () => ipcRenderer.invoke('get-breadth'),
  // App version + GitHub update check.
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  checkUpdate: () => ipcRenderer.invoke('check-update'),
  // Open an external URL in the default browser (update download / release page).
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  // Ask the main process to hide the window into the system tray (not quit).
  minimizeToTray: () => ipcRenderer.send('minimize-to-tray'),
})

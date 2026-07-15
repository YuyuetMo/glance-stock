import { useEffect } from 'react'
import { useStore } from './store'
import TopBar from './components/TopBar'
import Sidebar from './components/Sidebar'
import BottomNav from './components/BottomNav'
import WatchlistPage from './components/WatchlistPage'
import NewsPage from './components/NewsPage'
import AlertsPage from './components/AlertsPage'
import HeatMapPage from './components/HeatMapPage'
import HoldingsPage from './components/HoldingsPage'
import ProfilePage from './components/ProfilePage'
import CommandPalette from './components/CommandPalette'
import DetailPanel from './components/DetailPanel'
import SectorDetailPanel from './components/SectorDetailPanel'

const PAGES = {
  watchlist: WatchlistPage,
  news: NewsPage,
  alerts: AlertsPage,
  heatmap: HeatMapPage,
  holdings: HoldingsPage,
  profile: ProfilePage,
}

export default function App() {
  const currentPage = useStore((s) => s.currentPage)
  const commandOpen = useStore((s) => s.commandOpen)
  const detailOpen = useStore((s) => s.detailOpen)
  const selectedStock = useStore((s) => s.selectedStock)
  const init = useStore((s) => s.init)
  const startTicking = useStore((s) => s.startTicking)
  const stopTicking = useStore((s) => s.stopTicking)
  const startNewsTicking = useStore((s) => s.startNewsTicking)
  const stopNewsTicking = useStore((s) => s.stopNewsTicking)
  const toggleCommand = useStore((s) => s.toggleCommand)
  const closeCommand = useStore((s) => s.closeCommand)
  const closeDetail = useStore((s) => s.closeDetail)
  const selectedSector = useStore((s) => s.selectedSector)

  // Boot: restore persisted state, start the market + news ticks.
  useEffect(() => {
    init()
    startTicking()
    startNewsTicking()
    return () => {
      stopTicking()
      stopNewsTicking()
    }
  }, [init, startTicking, stopTicking, startNewsTicking, stopNewsTicking])

  // Global shortcuts: Ctrl/Cmd+K toggles the palette, Escape closes overlays.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        toggleCommand()
      } else if (e.key === 'Escape') {
        if (commandOpen) closeCommand()
        else if (detailOpen) closeDetail()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [commandOpen, detailOpen, toggleCommand, closeCommand, closeDetail])

  const Page = PAGES[currentPage] || WatchlistPage

  return (
    <div className="app">
      <TopBar />
      <div className="app-body">
        <Sidebar />
        <main className="main-content">
          <Page />
        </main>
      </div>
      {commandOpen && <CommandPalette />}
      {detailOpen && <DetailPanel key={selectedStock} />}
      {selectedSector && <SectorDetailPanel />}
      <BottomNav />
    </div>
  )
}

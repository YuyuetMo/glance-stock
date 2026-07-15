import { useStore } from '../store'

const ITEMS = [
  { key: 'watchlist', icon: '★', label: '自选' },
  { key: 'news', icon: '◉', label: '资讯' },
  { key: 'alerts', icon: '◆', label: '预警' },
  { key: 'heatmap', icon: '▦', label: '板块' },
  { key: 'profile', icon: '●', label: '我的' },
]

// Bottom tab bar for narrow (mobile) widths. Hidden on desktop via CSS.
export default function BottomNav() {
  const currentPage = useStore((s) => s.currentPage)
  const setCurrentPage = useStore((s) => s.setCurrentPage)

  return (
    <nav className="bottom-nav">
      {ITEMS.map((it) => (
        <button
          key={it.key}
          className={`bottom-nav-item ${currentPage === it.key ? 'active' : ''}`}
          onClick={() => setCurrentPage(it.key)}
        >
          <span className="bottom-nav-icon">{it.icon}</span>
          <span className="bottom-nav-label">{it.label}</span>
        </button>
      ))}
    </nav>
  )
}

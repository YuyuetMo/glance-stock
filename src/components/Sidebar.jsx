import { useStore } from '../store'

const ITEMS = [
  { key: 'watchlist', icon: '★', label: '自选' },
  { key: 'news', icon: '◉', label: '资讯' },
  { key: 'alerts', icon: '◆', label: '预警' },
  { key: 'heatmap', icon: '▦', label: '板块' },
  { key: 'profile', icon: '●', label: '我的' },
]

export default function Sidebar() {
  const currentPage = useStore((s) => s.currentPage)
  const setCurrentPage = useStore((s) => s.setCurrentPage)

  return (
    <nav className="sidebar">
      <div className="sidebar-title">控制台</div>
      {ITEMS.map((it) => (
        <button
          key={it.key}
          className={`sidebar-item ${currentPage === it.key ? 'active' : ''}`}
          onClick={() => setCurrentPage(it.key)}
        >
          <span className="sidebar-icon">{it.icon}</span>
          <span className="sidebar-label">{it.label}</span>
        </button>
      ))}
      <div className="sidebar-footer">按 Ctrl+K 快速搜索</div>
    </nav>
  )
}

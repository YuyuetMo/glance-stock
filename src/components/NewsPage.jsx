import { useState } from 'react'
import { useStore } from '../store'
import { classifyNews } from '../newsClassifier'

const FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'holdings', label: '持仓' },
  { key: 'watchlist', label: '自选' },
  { key: 'market', label: '市场' },
]

export default function NewsPage() {
  const news = useStore((s) => s.news)
  const watchlist = useStore((s) => s.watchlist)
  const holdings = useStore((s) => s.holdings)
  const [filter, setFilter] = useState('all')
  const [tip, setTip] = useState(null)

  const counts = { holdings: 0, watchlist: 0, market: 0 }
  news.forEach((n) => {
    if (n.kind === 'market' || n.stockCode == null) counts.market++
    if (n.stockCode && holdings[n.stockCode]) counts.holdings++
    if (n.stockCode && watchlist.includes(n.stockCode)) counts.watchlist++
  })

  const list = news.filter((n) => {
    if (filter === 'all') return true
    if (filter === 'market') return n.kind === 'market' || n.stockCode == null
    if (filter === 'holdings') return n.stockCode && holdings[n.stockCode]
    if (filter === 'watchlist') return n.stockCode && watchlist.includes(n.stockCode)
    return true
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">今日资讯</h1>
          <p className="page-subtitle">实时资讯 · 部分来自公开财经接口，其余为示意，仅供演示</p>
        </div>
      </div>

      <div className="news-filters">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`filter-btn ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            {f.key !== 'all' ? ` (${counts[f.key]})` : ''}
          </button>
        ))}
      </div>

      <div className="news-list">
        {list.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📰</div>
            <div>这个分类下还没有相关资讯</div>
          </div>
        ) : (
          list.map((n) => {
            const c = classifyNews(n.title)
            return (
              <div key={n.id} className="news-item">
                <span className={`news-dot ${c.sentiment}`} />
                <div className="news-body">
                  <div className="news-title">{n.title}</div>
                  <div className="news-meta">
                    <span>{n.stockName}</span>
                    <span
                      className={`tag tag-${c.sentiment}`}
                      onMouseEnter={() => setTip(n.id)}
                      onMouseLeave={() => setTip(null)}
                    >
                      {c.sentiment === 'positive'
                        ? '利好'
                        : c.sentiment === 'negative'
                        ? '利空'
                        : '中性'}
                      {tip === n.id && <span className="tag-tooltip">{c.reason}</span>}
                    </span>
                    <span className="news-time">{n.time}</span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 风险提示盾牌卡 */}
      <div className="risk-card">
        <span className="risk-shield">🛡️</span>
        <div>
          <div className="risk-title">股市有风险，投资需谨慎</div>
          <div className="risk-text">
            本工具仅作信息展示，所有数据为示意，不构成任何投资建议。
          </div>
        </div>
      </div>
    </div>
  )
}

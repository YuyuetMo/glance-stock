import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store'
import { greeting } from '../utils'
import { computeMarketSentiment } from '../mockData'
import Gauge from './Gauge'

const DEFAULT_ORDER = ['hero', 'sentiment', 'unified', 'risk']

function reorder(list, from, to) {
  const next = list.slice()
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

export default function WatchlistPage() {
  const watchlist = useStore((s) => s.watchlist)
  const holdings = useStore((s) => s.holdings)
  const alerts = useStore((s) => s.alerts)
  const profile = useStore((s) => s.profile)
  const breadth = useStore((s) => s.marketBreadth)
  const indices = useStore((s) => s.indices)
  const stocks = useStore((s) => s.stocks)
  const homeLayout = useStore((s) => s.homeLayout)
  const setHomeLayout = useStore((s) => s.setHomeLayout)
  const toggleCommand = useStore((s) => s.toggleCommand)
  const openDetail = useStore((s) => s.openDetail)
  const removeFromWatchlist = useStore((s) => s.removeFromWatchlist)
  const removeHolding = useStore((s) => s.removeHolding)

  const [tab, setTab] = useState('all')
  const [order, setOrder] = useState(homeLayout && homeLayout.length ? homeLayout : DEFAULT_ORDER)
  const dragKey = useRef(null)

  useEffect(() => {
    if (homeLayout && homeLayout.length) setOrder(homeLayout)
  }, [homeLayout])

  const streak = profile.streak || 0
  const sentiment = computeMarketSentiment(breadth, indices)
  const moodText =
    sentiment >= 66
      ? '情绪偏热，注意追高风险'
      : sentiment >= 33
      ? '多空均衡，按节奏来'
      : '情绪偏冷，控制仓位'

  // Combined universe: watchlist ∪ holdings, de-duplicated.
  const allCodes = Array.from(new Set([...watchlist, ...Object.keys(holdings)]))
  const visibleCodes = allCodes.filter((code) => {
    const isHold = !!holdings[code]
    const isWatch = watchlist.includes(code)
    if (tab === 'watch') return isWatch
    if (tab === 'hold') return isHold
    return true
  })

  const onDragStart = (key) => (e) => {
    dragKey.current = key
    e.dataTransfer.effectAllowed = 'move'
  }
  const onDragOver = (key) => (e) => {
    e.preventDefault()
    if (!dragKey.current || dragKey.current === key) return
    const from = order.indexOf(dragKey.current)
    const to = order.indexOf(key)
    if (from < 0 || to < 0) return
    const next = reorder(order, from, to)
    setOrder(next)
    dragKey.current = key
  }
  const onDragEnd = () => {
    if (dragKey.current) setHomeLayout(order)
    dragKey.current = null
  }

  const renderWidget = (key) => {
    if (key === 'hero') {
      return (
        <section
          key="hero"
          className="dash-widget card-enter"
          draggable
          onDragStart={onDragStart('hero')}
          onDragOver={onDragOver('hero')}
          onDragEnd={onDragEnd}
        >
          <span className="dash-handle" title="拖动排序">⠿</span>
          <div className="hero">
            <div className="hero-left">
              {profile.avatar ? (
                <img className="hero-avatar" src={profile.avatar} alt="" />
              ) : (
                <div className="hero-avatar hero-avatar--empty">👤</div>
              )}
              <div>
                <div className="hero-greet">{greeting(profile.name)}</div>
                <div className="hero-sub">
                  连续看盘 <b>{streak}</b> 天 · 扫一眼，今天也要稳住
                </div>
              </div>
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <b>{watchlist.length}</b>
                <span>自选</span>
              </div>
              <div className="hero-stat">
                <b>{Object.keys(holdings).length}</b>
                <span>持仓</span>
              </div>
              <div className="hero-stat">
                <b>{alerts.length}</b>
                <span>预警</span>
              </div>
            </div>
          </div>
        </section>
      )
    }
    if (key === 'sentiment') {
      return (
        <section
          key="sentiment"
          className="dash-widget card-enter"
          draggable
          onDragStart={onDragStart('sentiment')}
          onDragOver={onDragOver('sentiment')}
          onDragEnd={onDragEnd}
        >
          <span className="dash-handle" title="拖动排序">⠿</span>
          <div className="sentiment-card">
            <div className="sentiment-head">
              <span className="sentiment-title">大盘情绪</span>
              <span className="sentiment-tag">实时</span>
            </div>
            <Gauge value={sentiment} label="恐慌 / 贪婪指数" sub={moodText} />
          </div>
        </section>
      )
    }
    if (key === 'unified') {
      return (
        <section
          key="unified"
          className="dash-widget card-enter"
          draggable
          onDragStart={onDragStart('unified')}
          onDragOver={onDragOver('unified')}
          onDragEnd={onDragEnd}
        >
          <span className="dash-handle" title="拖动排序">⠿</span>
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">自选 / 持仓</h1>
                <p className="page-subtitle">
                  共 {allCodes.length} 个标的 · 按 Ctrl+K 搜索添加（A股/港股/美股/期货）
                </p>
              </div>
              <div className="wl-tabs">
                {[
                  { k: 'all', t: '全部' },
                  { k: 'watch', t: '观望' },
                  { k: 'hold', t: '持仓' },
                ].map((x) => (
                  <button
                    key={x.k}
                    className={`wl-tab ${tab === x.k ? 'active' : ''}`}
                    onClick={() => setTab(x.k)}
                  >
                    {x.t}
                  </button>
                ))}
              </div>
            </div>

            {visibleCodes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">★</div>
                <div>{tab === 'hold' ? '还没有持仓记录' : '还没有添加标的'}</div>
                <div className="empty-hint">按 Ctrl+K 搜索并添加</div>
              </div>
            ) : (
              <div className="cards-grid">
                {visibleCodes.map((code) => {
                  const st = stocks[code]
                  if (!st) return null
                  const h = holdings[code]
                  const isHold = !!h
                  const up = st.changePercent >= 0
                  const p = isHold && h.costPrice > 0
                  const value = isHold ? st.price * h.shares : 0
                  const cost = isHold ? h.costPrice * h.shares : 0
                  const pnl = value - cost
                  const pct = isHold && cost > 0 ? (pnl / cost) * 100 : 0
                  const prof = pnl >= 0
                  return (
                    <div
                      key={code}
                      className="stock-card"
                      onClick={() => openDetail(code)}
                    >
                      <button
                        className="card-remove"
                        title="移除"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (watchlist.includes(code)) removeFromWatchlist(code)
                          else if (isHold) removeHolding(code)
                        }}
                      >
                        ×
                      </button>
                      <span className={`wl-badge ${isHold ? 'hold' : 'watch'}`}>
                        {isHold ? '持仓' : '观望'}
                      </span>
                      {(st.market === 'hk' || st.market === 'us' || st.market === 'future') && (
                        <span className="wl-mkt">
                          {st.market === 'hk' ? '港股' : st.market === 'us' ? '美股' : '期货'}
                        </span>
                      )}
                      <div className="card-header">
                        <span
                          className="card-badge"
                          style={{ background: up ? 'var(--rise-soft)' : 'var(--fall-soft)' }}
                        >
                          {st.name ? st.name.charAt(0) : '?'}
                        </span>
                        <div className="card-head-text">
                          <span className="stock-name">{st.name}</span>
                          <span className="stock-code font-mono">{st.code.toUpperCase()}</span>
                        </div>
                      </div>
                      <div className={`card-price font-mono ${up ? 'rise' : 'fall'}`}>
                        {st.price != null ? st.price.toFixed(2) : '--'}
                      </div>
                      <div className="card-change-wrap">
                        <span className={`card-change ${up ? 'rise' : 'fall'}`}>
                          {up ? '+' : ''}
                          {st.change != null ? st.change.toFixed(2) : '0.00'}　
                          {up ? '+' : ''}
                          {st.changePercent != null ? st.changePercent.toFixed(2) : '0.00'}%
                        </span>
                      </div>
                      {isHold && (
                        <>
                          <div className="holding-grid">
                            <div>
                              <span className="hg-label">成本</span>
                              <span className="hg-val font-mono">{h.costPrice.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="hg-label">{st.market === 'future' ? '手数' : '持仓'}</span>
                              <span className="hg-val font-mono">
                                {h.shares} {st.market === 'future' ? '手' : '股'}
                              </span>
                            </div>
                            <div>
                              <span className="hg-label">市值</span>
                              <span className="hg-val font-mono">{value.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="hg-label">盈亏</span>
                              <span className={`hg-val font-mono ${prof ? 'rise' : 'fall'}`}>
                                {prof ? '+' : '-'}
                                {Math.abs(pnl).toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <div className={`holding-rate font-mono ${prof ? 'rise' : 'fall'}`}>
                            收益率 {prof ? '+' : '-'}
                            {Math.abs(pct).toFixed(2)}%
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
                <button className="add-stock-btn" onClick={toggleCommand}>
                  + 添加标的
                </button>
              </div>
            )}
          </div>
        </section>
      )
    }
    if (key === 'risk') {
      return (
        <section
          key="risk"
          className="dash-widget card-enter"
          draggable
          onDragStart={onDragStart('risk')}
          onDragOver={onDragOver('risk')}
          onDragEnd={onDragEnd}
        >
          <span className="dash-handle" title="拖动排序">⠿</span>
          <div className="risk-card">
            <span className="risk-shield">🛡️</span>
            <div>
              <div className="risk-title">股市有风险，投资需谨慎</div>
              <div className="risk-text">
                本工具仅作信息展示，行情来自第三方公开接口，不构成任何投资建议。
              </div>
            </div>
          </div>
        </section>
      )
    }
    return null
  }

  return <div>{order.map((key) => renderWidget(key))}</div>
}

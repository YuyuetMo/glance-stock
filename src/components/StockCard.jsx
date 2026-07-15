import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import SparkLine from './SparkLine'

function statusText(cp) {
  if (cp > 3) return '今日强势上涨'
  if (cp > 0) return '今日小幅上涨'
  if (cp > -3) return '今日小幅回调'
  if (cp < 0) return '今日弱势下行'
  return '横盘震荡'
}

export default function StockCard({ code }) {
  const stock = useStore((s) => s.stocks[code])
  const openDetail = useStore((s) => s.openDetail)
  const removeFromWatchlist = useStore((s) => s.removeFromWatchlist)
  const holding = useStore((s) => s.holdings[code])

  const prevPrice = useRef(stock ? stock.price : null)
  const [flash, setFlash] = useState('')

  useEffect(() => {
    if (!stock) return
    const prev = prevPrice.current
    if (prev != null && stock.price !== prev) {
      const cls = stock.price > prev ? 'flash-rise' : 'flash-fall'
      setFlash(cls)
      const t = setTimeout(() => setFlash(''), 600)
      prevPrice.current = stock.price
      return () => clearTimeout(t)
    }
    prevPrice.current = stock.price
  }, [stock && stock.price])

  if (!stock) return null

  const up = stock.changePercent >= 0
  const span = stock.high - stock.low || 1
  const pos = Math.max(2, Math.min(98, ((stock.price - stock.low) / span) * 100))
  const rangeText =
    pos > 75 ? '接近全天最高，偏贵' : pos < 25 ? '接近全天最低，偏便宜' : '处于当日中间区间'

  return (
    <div className={`stock-card card-enter ${flash}`} onClick={() => openDetail(code)}>
      <button
        className="card-remove"
        title="移除自选"
        onClick={(e) => {
          e.stopPropagation()
          removeFromWatchlist(code)
        }}
      >
        ×
      </button>

      <div className="card-header">
        <span className="card-badge" style={{ background: up ? 'var(--rise-soft)' : 'var(--fall-soft)' }}>
          {stock.name.charAt(0)}
        </span>
        <div className="card-head-text">
          <span className="stock-name">{stock.name}</span>
          <span className="stock-code font-mono">{stock.code.toUpperCase()}</span>
        </div>
      </div>

      <div className={`card-price font-mono ${up ? 'rise' : 'fall'}`}>
        {stock.price.toFixed(2)}
      </div>

      <div className="card-change-wrap">
        <span className={`card-change ${up ? 'rise' : 'fall'}`}>
          {up ? '+' : ''}
          {stock.change.toFixed(2)}　{up ? '+' : ''}
          {stock.changePercent.toFixed(2)}%
        </span>
      </div>

      <div className="card-sparkline">
        <SparkLine data={stock.sparkline} width={220} height={36} />
      </div>

      <div className="card-status">{statusText(stock.changePercent)}</div>

      <div className="card-range">
        <div className="range-track">
          <span
            className="range-dot"
            style={{ left: `${pos}%`, background: up ? 'var(--rise)' : 'var(--fall)' }}
          />
        </div>
        <div className="range-labels">
          <span className="font-mono">{stock.low.toFixed(2)}</span>
          <span className="range-hint">{rangeText}</span>
          <span className="font-mono">{stock.high.toFixed(2)}</span>
        </div>
      </div>

      {holding && (() => {
        const cost = holding.costPrice
        const shares = holding.shares
        const pnl = (stock.price - cost) * shares
        const pnlPct = ((stock.price - cost) / cost) * 100
        const profit = pnl >= 0
        return (
          <div className="card-holding">
            <span className="holding-label">持仓 {shares} 股</span>
            <span className="holding-cost font-mono">成本 {cost.toFixed(2)}</span>
            <span className={`holding-pnl font-mono ${profit ? 'rise' : 'fall'}`}>
              {profit ? '浮盈 +' : '浮亏 '}{pnl.toFixed(2)}（{profit ? '+' : ''}{pnlPct.toFixed(2)}%）
            </span>
          </div>
        )
      })()}
    </div>
  )
}

import { useStore } from '../store'

export default function HoldingsPage() {
  const holdings = useStore((s) => s.holdings)
  const stocks = useStore((s) => s.stocks)
  const toggleCommand = useStore((s) => s.toggleCommand)
  const openDetail = useStore((s) => s.openDetail)

  const codes = Object.keys(holdings)
  let totalCost = 0
  let totalValue = 0
  codes.forEach((code) => {
    const h = holdings[code]
    const st = stocks[code]
    if (!st) return
    totalValue += st.price * h.shares
    totalCost += h.costPrice * h.shares
  })
  const totalPnl = totalValue - totalCost
  const totalPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0
  const profit = totalPnl >= 0

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">我的持仓</h1>
          <p className="page-subtitle">记录你买了什么，盈亏一眼看明白</p>
        </div>
        <button className="btn-primary" onClick={toggleCommand}>
          + 添加持仓
        </button>
      </div>

      {/* 资产驾驶舱：汇总 */}
      <div className="holdings-summary card-enter">
        <div className="hs-item">
          <span className="hs-label">持仓市值</span>
          <span className="hs-value font-mono">{totalValue.toFixed(2)}</span>
        </div>
        <div className="hs-item">
          <span className="hs-label">总浮动盈亏</span>
          <span className={`hs-value font-mono ${profit ? 'rise' : 'fall'}`}>
            {profit ? '+' : '-'}
            {Math.abs(totalPnl).toFixed(2)}
          </span>
        </div>
        <div className="hs-item">
          <span className="hs-label">总收益率</span>
          <span className={`hs-value font-mono ${profit ? 'rise' : 'fall'}`}>
            {profit ? '+' : '-'}
            {Math.abs(totalPct).toFixed(2)}%
          </span>
        </div>
      </div>

      {codes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">◈</div>
          <div>还没有持仓记录</div>
          <div className="empty-hint">点「+ 添加持仓」，搜股票后填成本价和数量</div>
        </div>
      ) : (
        <div className="cards-grid">
          {codes.map((code) => {
            const h = holdings[code]
            const st = stocks[code]
            if (!st) return null
            const up = st.changePercent >= 0
            const value = st.price * h.shares
            const cost = h.costPrice * h.shares
            const pnl = value - cost
            const pct = h.costPrice > 0 ? (pnl / cost) * 100 : 0
            const p = pnl >= 0
            return (
              <div
                key={code}
                className="holding-card card-enter"
                onClick={() => openDetail(code)}
              >
                <div className="card-header">
                  <span
                    className="card-badge"
                    style={{ background: up ? 'var(--rise-soft)' : 'var(--fall-soft)' }}
                  >
                    {st.name.charAt(0)}
                  </span>
                  <div className="card-head-text">
                    <span className="stock-name">{st.name}</span>
                    <span className="stock-code font-mono">{st.code.toUpperCase()}</span>
                  </div>
                </div>
                <div className={`card-price font-mono ${up ? 'rise' : 'fall'}`}>
                  {st.price.toFixed(2)}
                </div>
                <div className="card-change-wrap">
                  <span className={`card-change ${up ? 'rise' : 'fall'}`}>
                    {up ? '+' : ''}
                    {st.change.toFixed(2)}　{up ? '+' : ''}
                    {st.changePercent.toFixed(2)}%
                  </span>
                </div>
                <div className="holding-grid">
                  <div>
                    <span className="hg-label">持仓</span>
                    <span className="hg-val font-mono">{h.shares} 股</span>
                  </div>
                  <div>
                    <span className="hg-label">成本</span>
                    <span className="hg-val font-mono">{h.costPrice.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="hg-label">市值</span>
                    <span className="hg-val font-mono">{value.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="hg-label">盈亏</span>
                    <span className={`hg-val font-mono ${p ? 'rise' : 'fall'}`}>
                      {p ? '+' : '-'}
                      {Math.abs(pnl).toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className={`holding-rate font-mono ${p ? 'rise' : 'fall'}`}>
                  收益率 {p ? '+' : '-'}
                  {Math.abs(pct).toFixed(2)}%
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="risk-card">
        <span className="risk-shield">🛡️</span>
        <div>
          <div className="risk-title">持仓仅作记录，不构成投资建议</div>
          <div className="risk-text">本工具不连接任何券商，不会代你交易。</div>
        </div>
      </div>
    </div>
  )
}

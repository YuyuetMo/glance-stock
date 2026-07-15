import { useState } from 'react'
import { useStore } from '../store'
import SparkLine from './SparkLine'
import { classifyNews } from '../newsClassifier'
import { computeMainFunds } from '../mockData'

// Stable pseudo-random seed from a stock symbol (deterministic per stock).
function hashNum(sym) {
  let h = 0
  for (let i = 0; i < sym.length; i++) h = (h * 31 + sym.charCodeAt(i)) % 100000
  return Math.abs(h)
}

export default function DetailPanel() {
  const code = useStore((s) => s.selectedStock)
  const stock = useStore((s) => (code ? s.stocks[code] : null))
  const news = useStore((s) => s.news)
  const closeDetail = useStore((s) => s.closeDetail)
  const holdings = useStore((s) => s.holdings)
  const addHolding = useStore((s) => s.addHolding)
  const removeHolding = useStore((s) => s.removeHolding)
  const holding = holdings[code]
  const [costInput, setCostInput] = useState(
    holding ? String(holding.costPrice) : ''
  )
  const [sharesInput, setSharesInput] = useState(
    holding ? String(holding.shares) : ''
  )

  if (!stock) return null

  const up = stock.changePercent >= 0

  // ── 现在贵不贵：simulated one-year range + percentile ──────────────────────
  const seed = hashNum(stock.symbol)
  const lowPct = 0.25 + (seed % 11) / 100 // 25% ~ 35%
  const highPct = 0.25 + ((seed >> 3) % 11) / 100
  const yearLow = +(stock.prevClose * (1 - lowPct)).toFixed(2)
  const yearHigh = +(stock.prevClose * (1 + highPct)).toFixed(2)
  const percentile = Math.max(
    0,
    Math.min(100, ((stock.price - yearLow) / (yearHigh - yearLow || 1)) * 100)
  )
  const expText = percentile > 66 ? '偏贵' : percentile < 33 ? '便宜' : '中间'

  // ── 今日走势 position ───────────────────────────────────────────────────────
  const lowPos =
    stock.high === stock.low
      ? 50
      : ((stock.price - stock.low) / (stock.high - stock.low)) * 100

  // ── 赚不赚钱：simulated growth rates ─────────────────────────────────────────
  const revGrowth = Math.round((Math.sin(seed) * 25 + 15) * 10) / 10
  const profitGrowth = Math.round((Math.cos(seed) * 30 + 10) * 10) / 10

  const related = news.filter((n) => n.stockCode === code)

  return (
    <>
      <div className="detail-overlay" onClick={closeDetail} />
      <aside className="detail-panel">
        <button className="detail-close" onClick={closeDetail}>
          ×
        </button>

        {/* Header */}
        <div className="detail-header">
          <div className="detail-stock-name">{stock.name}</div>
          <div className="detail-stock-meta">
            {stock.code.toUpperCase()} · {stock.market.toUpperCase()}
          </div>
          <div className={`detail-price ${up ? 'rise' : 'fall'}`}>
            {stock.price.toFixed(2)}
          </div>
          <span className={`detail-change ${up ? 'rise' : 'fall'}`}>
            {up ? '+' : ''}
            {stock.change.toFixed(2)}　{up ? '+' : ''}
            {stock.changePercent.toFixed(2)}%
          </span>
          <div className="detail-spark">
            <SparkLine data={stock.sparkline} width={370} height={60} />
          </div>
        </div>

        {/* 今日走势 */}
        <div className="detail-section">
          <div className="detail-section-title">今日走势</div>
          <div className="detail-range-track">
            <div className="detail-range-fill" style={{ width: `${lowPos}%` }} />
            <div className="detail-range-dot" style={{ left: `${lowPos}%` }} />
          </div>
          <div className="detail-range-labels">
            <span>今低 {stock.low.toFixed(2)}</span>
            <span>现在 {stock.price.toFixed(2)}</span>
            <span>今高 {stock.high.toFixed(2)}</span>
          </div>
        </div>

        {/* 主力资金 / 资金流向（示意图，非真实数据） */}
        <div className="detail-section">
          <div className="detail-section-title">主力资金</div>
          {(() => {
            const mf = computeMainFunds(stock.symbol)
            return (
              <div className="detail-verdict">
                <div className="detail-metric">
                  <span>主力净流入</span>
                  <span className={`font-mono ${mf.inflow ? 'rise' : 'fall'}`}>
                    {mf.inflow ? '+' : '-'}
                    {Math.abs(mf.net).toFixed(1)} 亿
                  </span>
                </div>
                <div className="detail-conclusion">
                  {mf.sentence}（数据为示意，仅供参考）
                </div>
              </div>
            )
          })()}
        </div>

        {/* 现在贵不贵 */}
        <div className="detail-section">
          <div className="detail-section-title">现在贵不贵？</div>
          <div className="detail-verdict">
            过去一年大致在 <b>{yearLow}</b> ~ <b>{yearHigh}</b> 之间波动，当前价处于约{' '}
            <b>{Math.round(percentile)}%</b> 分位，相对 <b>{expText}</b>。
          </div>
          <div className="detail-range-track">
            <div className="detail-range-fill" style={{ width: `${percentile}%` }} />
            <div className="detail-range-dot" style={{ left: `${percentile}%` }} />
          </div>
          <div className="detail-range-labels">
            <span>{yearLow}</span>
            <span>一年区间</span>
            <span>{yearHigh}</span>
          </div>
        </div>

        {/* 赚不赚钱 */}
        <div className="detail-section">
          <div className="detail-section-title">赚不赚钱？</div>
          <div className="detail-verdict">
            <div className="detail-metric">
              <span>营收增速</span>
              <span className={revGrowth >= 0 ? 'rise' : 'fall'}>
                {revGrowth >= 0 ? '↑' : '↓'} {Math.abs(revGrowth).toFixed(1)}%
              </span>
            </div>
            <div className="detail-metric">
              <span>净利润增速</span>
              <span className={profitGrowth >= 0 ? 'rise' : 'fall'}>
                {profitGrowth >= 0 ? '↑' : '↓'} {Math.abs(profitGrowth).toFixed(1)}%
              </span>
            </div>
            <div className="detail-conclusion">
              {revGrowth >= 0 && profitGrowth >= 0
                ? '公司正在赚钱且越赚越多，基本面不错。'
                : revGrowth < 0 && profitGrowth < 0
                ? '营收和利润都在下滑，需要留意风险。'
                : '有赚有赔，整体还算稳。'}
            </div>
          </div>
        </div>

        {/* 我的持仓（仅记录成本价与股数，不提供任何交易功能） */}
        <div className="detail-section">
          <div className="detail-section-title">我的持仓</div>
          <div className="detail-holding-form">
            <input
              className="form-input"
              type="number"
              inputMode="decimal"
              placeholder={`成本价（当前 ${stock.price.toFixed(2)}）`}
              value={costInput}
              onChange={(e) => setCostInput(e.target.value)}
            />
            <input
              className="form-input"
              type="number"
              inputMode="numeric"
              placeholder="持仓股数"
              value={sharesInput}
              onChange={(e) => setSharesInput(e.target.value)}
            />
            <div className="holding-actions">
              <button
                className="btn-primary"
                onClick={() =>
                  addHolding(code, {
                    costPrice: parseFloat(costInput) || 0,
                    shares: parseInt(sharesInput, 10) || 0,
                  })
                }
              >
                {holding ? '更新持仓' : '记录持仓'}
              </button>
              {holding && (
                <button
                  className="btn-secondary"
                  onClick={() => {
                    removeHolding(code)
                    setCostInput('')
                    setSharesInput('')
                  }}
                >
                  移除
                </button>
              )}
            </div>
          </div>
          {holding && (() => {
            const pnl = (stock.price - holding.costPrice) * holding.shares
            const pnlPct =
              ((stock.price - holding.costPrice) / holding.costPrice) * 100
            const profit = pnl >= 0
            return (
              <div className="detail-holding-summary">
                <div className="detail-metric">
                  <span>成本价</span>
                  <span className="font-mono">{holding.costPrice.toFixed(2)}</span>
                </div>
                <div className="detail-metric">
                  <span>持仓</span>
                  <span className="font-mono">{holding.shares} 股</span>
                </div>
                <div className="detail-metric">
                  <span>浮动{profit ? '盈利' : '亏损'}</span>
                  <span className={`font-mono ${profit ? 'rise' : 'fall'}`}>
                    {profit ? '+' : ''}
                    {pnl.toFixed(2)}（{profit ? '+' : ''}
                    {pnlPct.toFixed(2)}%）
                  </span>
                </div>
              </div>
            )
          })()}
        </div>

        {/* 相关资讯 */}
        <div className="detail-section">
          <div className="detail-section-title">相关资讯</div>
          {related.length === 0 ? (
            <div className="detail-news-item text-3">暂无相关资讯</div>
          ) : (
            related.map((n) => {
              const c = classifyNews(n.title)
              return (
                <div key={n.id} className="detail-news-item">
                  <div className="detail-news-title">{n.title}</div>
                  <div className="detail-news-meta">
                    <span className={`tag tag-${c.sentiment}`}>
                      {c.sentiment === 'positive'
                        ? '利好'
                        : c.sentiment === 'negative'
                        ? '利空'
                        : '中性'}
                    </span>
                    <span>{n.time}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </aside>
    </>
  )
}

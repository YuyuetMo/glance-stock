import { useStore } from '../store'
import { computeMarketFunds } from '../mockData'

export default function HeatMapPage() {
  const sectors = useStore((s) => s.sectors)
  const stocks = useStore((s) => s.stocks)
  const openSector = useStore((s) => s.openSector)
  const mf = computeMarketFunds(stocks)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">板块热力</h1>
          <p className="page-subtitle">红涨绿跌，颜色越深涨跌幅越大</p>
        </div>
      </div>

      {/* 主力资金 / 资金流向（示意） */}
      <div className="funds-overview card-enter">
        <div className="funds-head">
          <span className="funds-title">今日主力资金</span>
          <span className="funds-tag">示意</span>
        </div>
        <div className={`funds-value font-mono ${mf.inflow ? 'rise' : 'fall'}`}>
          {mf.inflow ? '+' : '-'}
          {Math.abs(mf.net).toFixed(1)} 亿
        </div>
        <div className="funds-sentence">{mf.sentence}</div>
      </div>

      <div className="heatmap-grid">
        {sectors.map((s) => {
          const up = s.change >= 0
          // intensity 0.08 ~ 0.43, scaled by magnitude
          const intensity = Math.min(0.43, 0.08 + (Math.abs(s.change) / 6) * 0.35)
          const bg = up
            ? `rgba(255, 69, 58, ${intensity.toFixed(3)})`
            : `rgba(48, 209, 88, ${intensity.toFixed(3)})`
          return (
            <div
              key={s.name}
              className="heatmap-cell"
              style={{ background: bg }}
              role="button"
              tabIndex={0}
              title="点击查看板块详情"
              onClick={() => openSector(s.name)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') openSector(s.name)
              }}
            >
              <div className="heatmap-name">{s.name}</div>
              <div
                className="heatmap-value font-mono"
                style={{ color: up ? 'var(--rise)' : 'var(--fall)' }}
              >
                {up ? '+' : ''}
                {s.change.toFixed(2)}%
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

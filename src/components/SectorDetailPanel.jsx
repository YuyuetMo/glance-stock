import { useStore } from '../store'
import Gauge from './Gauge'

// Sector detail: 板块简介 + 观望指仪表盘 + 投资潜力. Reuses the slide-out style.
export default function SectorDetailPanel() {
  const name = useStore((s) => s.selectedSector)
  const sectors = useStore((s) => s.sectors)
  const closeSector = useStore((s) => s.closeSector)
  if (!name) return null
  const s = sectors.find((x) => x.name === name)
  if (!s) return null

  const up = s.change >= 0
  const watch = Math.max(5, Math.min(95, Math.round(50 + s.change * 6)))
  const pot = Math.max(0, Math.min(100, Math.round(50 + s.change * 5)))
  const rating = pot >= 66 ? '高' : pot >= 33 ? '中' : '低'
  const ratingColor =
    rating === '高' ? 'var(--rise)' : rating === '中' ? '#e8a33d' : 'var(--fall)'
  const potReason = up
    ? `板块近期走强，资金关注度高，投资潜力${rating}（示意）。`
    : `板块近期走弱，建议暂观望，投资潜力${rating}（示意）。`

  return (
    <>
      <div className="detail-overlay" onClick={closeSector} />
      <aside className="detail-panel">
        <button className="detail-close" onClick={closeSector}>
          ×
        </button>

        {/* Header */}
        <div className="detail-header">
          <div className="detail-stock-name">{s.name}</div>
          <span className={`detail-change ${up ? 'rise' : 'fall'}`}>
            {up ? '+' : ''}
            {s.change.toFixed(2)}%
          </span>
        </div>

        {/* 板块简介 */}
        <div className="detail-section">
          <div className="detail-section-title">板块简介</div>
          <div className="detail-verdict">{s.desc}</div>
        </div>

        {/* 观望指仪表盘 */}
        <div className="detail-section">
          <div className="detail-section-title">观望指仪表盘</div>
          <Gauge value={watch} label="观望指数" sub="数值越高越值得关注（示意）" />
        </div>

        {/* 投资潜力 */}
        <div className="detail-section">
          <div className="detail-section-title">投资潜力</div>
          <div className="detail-verdict">
            <div className="detail-metric">
              <span>评级</span>
              <span style={{ color: ratingColor, fontWeight: 700, fontSize: 18 }}>
                {rating}
              </span>
            </div>
            <div className="detail-conclusion">{potReason}</div>
          </div>
        </div>
      </aside>
    </>
  )
}

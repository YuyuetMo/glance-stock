// Reusable semicircle gauge (0..max). Used for the 观望指数 and 大盘情绪.
// value grows left→right over the top; color shifts green→amber→red by zone.
export default function Gauge({ value = 0, max = 100, label = '', sub = '' }) {
  const v = Number(value) || 0
  const m = Number(max) || 100
  const pct = Math.max(0, Math.min(1, v / m))
  const R = 80
  const CX = 100
  const CY = 100
  const len = Math.PI * R // semicircle length
  const color =
    pct < 0.34 ? '#34d77a' : pct < 0.67 ? '#e8a33d' : '#ff4d4f'

  // Needle endpoint (math angle from +x axis, going over the top).
  const ang = (1 - pct) * Math.PI
  const nx = CX + (R - 10) * Math.cos(ang)
  const ny = CY - (R - 10) * Math.sin(ang)

  return (
    <div className="gauge">
      <svg viewBox="0 0 200 120" className="gauge-svg" role="img" aria-label={label}>
        <path
          d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 0 ${CX + R} ${CY}`}
          className="gauge-bg"
        />
        <path
          d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 0 ${CX + R} ${CY}`}
          className="gauge-fg"
          style={{
            stroke: color,
            strokeDasharray: len,
            strokeDashoffset: len * (1 - pct),
          }}
        />
        <line
          x1={CX}
          y1={CY}
          x2={nx}
          y2={ny}
          className="gauge-needle"
          style={{ stroke: color }}
        />
        <circle cx={CX} cy={CY} r={5} className="gauge-hub" style={{ fill: color }} />
        <text x={CX} y={CY - 16} className="gauge-value" style={{ fill: color }}>
          {Math.round(v)}
        </text>
      </svg>
      {label && <div className="gauge-label">{label}</div>}
      {sub && <div className="gauge-sub">{sub}</div>}
    </div>
  )
}

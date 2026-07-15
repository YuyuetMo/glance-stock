import { useId } from 'react'

// Pure-SVG sparkline. No chart library.
// Colour is decided by first vs last point (red up / green down), or overridden
// via the `color` prop. A subtle gradient fills the area under the line.
export default function SparkLine({ data = [], width = 200, height = 36, color }) {
  const rawId = useId()
  const gid = rawId.replace(/[:]/g, '')

  if (!data || data.length < 2) {
    return <div className="sparkline-empty" style={{ width, height }} />
  }

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const stepX = width / (data.length - 1)

  const points = data.map((v, i) => {
    const x = i * stepX
    const y = height - ((v - min) / range) * (height - 4) - 2
    return [x, y]
  })

  const line = points.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ')
  const area = `0,${height} ${line} ${width},${height}`

  const stroke =
    color || (data[data.length - 1] >= data[0] ? 'var(--rise)' : 'var(--fall)')

  return (
    <svg
      width={width}
      height={height}
      className="sparkline"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`spark-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#spark-${gid})`} />
      <polyline
        points={line}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

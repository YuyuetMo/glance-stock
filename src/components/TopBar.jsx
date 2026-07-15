import { useStore } from '../store'
import { greeting } from '../utils'

const INDEX_ORDER = ['idx-sh', 'idx-sz', 'idx-cy']

export default function TopBar() {
  const indices = useStore((s) => s.indices)
  const profile = useStore((s) => s.profile)
  const breadth = useStore((s) => s.marketBreadth)

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-brand">
          <span className="brand-mark">盯</span>
          <div className="brand-text">
            <span className="brand-name">盯一眼</span>
            <small>Yuyuet Mo 出品</small>
          </div>
        </div>
      </div>

      <div className="topbar-right">
        <div className="topbar-greet">
          {profile.avatar ? (
            <img className="greet-avatar" src={profile.avatar} alt="" />
          ) : (
            <span className="greet-avatar greet-avatar--empty">👤</span>
          )}
          <span>{greeting(profile.name)}</span>
        </div>
        <div className="topbar-indices">
          {INDEX_ORDER.map((code) => {
            const idx = indices[code]
            if (!idx) return null
            const up = idx.changePercent >= 0
            return (
              <div key={code} className={`index-pill ${up ? 'rise' : 'fall'}`}>
                <span className="index-name">{idx.name}</span>
                <span className="index-price font-mono">{idx.price.toFixed(2)}</span>
                <span className="index-chg font-mono">
                  {up ? '+' : ''}
                  {idx.changePercent.toFixed(2)}%
                </span>
              </div>
            )
          })}
        </div>
        <div className="topbar-breadth">
          <span className="bx rise">上涨 <b className="font-mono">{breadth.up}</b></span>
          <span className="bx rise">涨停 <b className="font-mono">{breadth.limitUp}</b></span>
          <span className="bx-divider">|</span>
          <span className="bx fall">下跌 <b className="font-mono">{breadth.down}</b></span>
          <span className="bx fall">跌停 <b className="font-mono">{breadth.limitDown}</b></span>
          <span className="breadth-note">示意</span>
        </div>
        <button
          className="topbar-min-btn"
          title="最小化到托盘"
          onClick={() => window.electronAPI?.minimizeToTray?.()}
        >
          —
        </button>
      </div>
    </header>
  )
}

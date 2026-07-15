import { useStore } from '../store'

export default function UpdateModal() {
  const info = useStore((s) => s.updateInfo)
  const dismiss = useStore((s) => s.dismissUpdate)

  if (!info) return null

  const open = (url) => {
    if (url && window.electronAPI && window.electronAPI.openExternal) {
      window.electronAPI.openExternal(url)
    }
    dismiss()
  }

  return (
    <div className="cmd-overlay" onClick={dismiss}>
      <div className="cmd-modal update-modal" onClick={(e) => e.stopPropagation()}>
        <div className="up-head">
          <span className="up-badge">新版本</span>
          <span className="up-version font-mono">v{info.latest}</span>
          <span className="up-current font-mono">（当前 v{info.current}）</span>
        </div>
        <div className="up-title">发现新版本，建议更新</div>
        <div className="up-notes">
          {info.notes
            ? info.notes
                .split('\n')
                .filter((l) => l.trim().length)
                .map((line, i) => <div key={i} className="up-line">{line}</div>)
            : '查看 Release 页面了解更新内容。'}
        </div>
        <div className="up-actions">
          <button className="btn-ghost" onClick={dismiss}>
            稍后
          </button>
          {info.htmlUrl && (
            <button className="btn-ghost" onClick={() => open(info.htmlUrl)}>
              查看更新
            </button>
          )}
          {info.portableUrl && (
            <button className="btn-primary" onClick={() => open(info.portableUrl)}>
              下载新版本
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

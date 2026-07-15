import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { STOCK_DEFS } from '../mockData'

const QUICK = [
  { key: 'goto-watchlist', label: '前往：我的自选', page: 'watchlist' },
  { key: 'goto-holdings', label: '前往：我的持仓', page: 'holdings' },
  { key: 'goto-news', label: '前往：今日资讯', page: 'news' },
  { key: 'goto-alerts', label: '前往：设置预警', page: 'alerts' },
  { key: 'goto-heatmap', label: '前往：板块热力图', page: 'heatmap' },
]

export default function CommandPalette() {
  const [query, setQuery] = useState('')
  const [sel, setSel] = useState(0)
  const inputRef = useRef(null)

  const closeCommand = useStore((s) => s.closeCommand)
  const addToWatchlist = useStore((s) => s.addToWatchlist)
  const watchlist = useStore((s) => s.watchlist)
  const openDetail = useStore((s) => s.openDetail)
  const setCurrentPage = useStore((s) => s.setCurrentPage)
  const stocks = useStore((s) => s.stocks)

  useEffect(() => {
    inputRef.current && inputRef.current.focus()
  }, [])

  // Reset highlighted row whenever the query changes.
  useEffect(() => {
    setSel(0)
  }, [query])

  const q = query.trim().toLowerCase()
  const results = q
    ? STOCK_DEFS.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.symbol.includes(q) ||
          d.code.toLowerCase().includes(q) ||
          (d.pinyin || '').toLowerCase().includes(q)
      ).slice(0, 10)
    : []

  const listCount = q ? results.length : QUICK.length

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSel((i) => Math.min(i + 1, listCount - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSel((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      confirm(sel)
    }
  }

  const confirm = (i) => {
    if (!q) {
      const cmd = QUICK[i]
      if (cmd) {
        setCurrentPage(cmd.page)
        closeCommand()
      }
      return
    }
    const d = results[i]
    if (d) {
      openDetail(d.code)
      closeCommand()
    }
  }

  return (
    <div className="cmd-overlay" onClick={closeCommand}>
      <div
        className="cmd-modal"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <input
          ref={inputRef}
          className="cmd-input"
          placeholder="搜索股票、拼音首字母，或输入命令…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="cmd-results">
          {!q &&
            QUICK.map((c, i) => (
              <div
                key={c.key}
                className={`cmd-item ${i === sel ? 'selected' : ''}`}
                onMouseEnter={() => setSel(i)}
                onClick={() => confirm(i)}
              >
                <span className="cmd-item-label">⚡ {c.label}</span>
                <span className="cmd-item-badge">命令</span>
              </div>
            ))}

          {q &&
            results.map((d, i) => {
              const st = stocks[d.code]
              const up = st ? st.changePercent >= 0 : true
              const inWl = watchlist.includes(d.code)
              return (
                <div
                  key={d.code}
                  className={`cmd-item ${i === sel ? 'selected' : ''}`}
                  onMouseEnter={() => setSel(i)}
                  onClick={() => confirm(i)}
                >
                  <span className="cmd-item-label">
                    <span className="cmd-item-name">{d.name}</span>
                    <span className="cmd-item-code font-mono">{d.code.toUpperCase()}</span>
                  </span>
                  <span className="cmd-item-right">
                    {st && (
                      <span className={`cmd-item-price font-mono ${up ? 'rise' : 'fall'}`}>
                        {st.price.toFixed(2)} {up ? '+' : ''}
                        {st.changePercent.toFixed(2)}%
                      </span>
                    )}
                    {!inWl && (
                      <span
                        className="cmd-item-badge"
                        onClick={(e) => {
                          e.stopPropagation()
                          addToWatchlist(d.code)
                        }}
                      >
                        + 自选
                      </span>
                    )}
                  </span>
                </div>
              )
            })}

          {q && results.length === 0 && <div className="cmd-empty">没有找到相关股票</div>}
        </div>
      </div>
    </div>
  )
}

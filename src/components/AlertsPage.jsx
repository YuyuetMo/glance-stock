import { useState } from 'react'
import { useStore } from '../store'
import { STOCK_DEFS } from '../mockData'

export default function AlertsPage() {
  const alerts = useStore((s) => s.alerts)
  const addAlert = useStore((s) => s.addAlert)
  const removeAlert = useStore((s) => s.removeAlert)
  const stocks = useStore((s) => s.stocks)

  const [search, setSearch] = useState('')
  const [picked, setPicked] = useState(null)
  const [type, setType] = useState(null)
  const [target, setTarget] = useState('')

  const q = search.trim()
  const matches = q
    ? STOCK_DEFS.filter(
        (d) =>
          d.name.includes(q) ||
          d.symbol.includes(q) ||
          d.code.toLowerCase().includes(q.toLowerCase())
      ).slice(0, 8)
    : []

  const reset = () => {
    setSearch('')
    setPicked(null)
    setType(null)
    setTarget('')
  }

  const submit = () => {
    if (!picked || !type || !target) return
    addAlert({
      code: picked.code,
      name: picked.name,
      type,
      target: parseFloat(target),
    })
    reset()
  }

  const currentPrice = picked ? stocks[picked.code]?.price.toFixed(2) : ''

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">价格预警</h1>
          <p className="page-subtitle">到价了就提醒你，躺着也能盯盘</p>
        </div>
      </div>

      {/* Progressive form */}
      <div className="alert-form">
        <h3 className="form-title">新建预警</h3>

        <div className="form-field">
          <label className="form-label">1. 选择股票</label>
          <input
            className="form-input"
            placeholder="输入股票名称或代码搜索"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPicked(null)
            }}
          />
          {matches.length > 0 && !picked && (
            <div className="form-dropdown">
              {matches.map((d) => (
                <div
                  key={d.code}
                  className="form-option-row"
                  onClick={() => {
                    setPicked(d)
                    setSearch(d.name)
                  }}
                >
                  <span>{d.name}</span>
                  <span className="font-mono text-3">{d.symbol}</span>
                </div>
              ))}
            </div>
          )}
          {picked && <div className="form-picked">已选：{picked.name}（{picked.symbol}）</div>}
        </div>

        {picked && (
          <div className="form-field">
            <label className="form-label">2. 预警类型</label>
            <div className="form-select">
              <button
                className={`form-option ${type === 'price' ? 'selected' : ''}`}
                onClick={() => setType('price')}
              >
                价格
              </button>
              <button
                className={`form-option ${type === 'percent' ? 'selected' : ''}`}
                onClick={() => setType('percent')}
              >
                涨跌幅
              </button>
            </div>
          </div>
        )}

        {picked && type && (
          <div className="form-field">
            <label className="form-label">3. 目标数值</label>
            <input
              className="form-input"
              type="number"
              placeholder={picked ? `当前价 ${currentPrice}` : ''}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
          </div>
        )}

        <div className="form-actions">
          <button className="btn-primary" onClick={submit}>
            确认添加
          </button>
          <button className="btn-secondary" onClick={reset}>
            重置
          </button>
        </div>
      </div>

      {/* Existing alerts */}
      <div style={{ marginTop: 28 }}>
        {alerts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">◆</div>
            <div>还没有设置预警</div>
          </div>
        ) : (
          alerts.map((a) => {
            const st = stocks[a.code]
            const triggered = st
              ? a.type === 'price'
                ? st.price >= a.target
                : st.changePercent >= a.target
              : false
            const desc =
              a.type === 'price'
                ? `价格达到 ${a.target}`
                : `涨跌幅达到 +${a.target}%`
            return (
              <div key={a.id} className="alert-item">
                <div>
                  <div className="alert-name">{a.name}</div>
                  <div className="alert-desc text-2">{desc}</div>
                </div>
                <div className="alert-right">
                  <span className={`alert-status ${triggered ? 'triggered' : 'pending'}`}>
                    {triggered ? '已触发' : '监控中'}
                  </span>
                  <button className="alert-del" onClick={() => removeAlert(a.id)}>
                    删除
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

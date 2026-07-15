import { useEffect, useState } from 'react'
import { useStore } from '../store'

export default function AddHoldingModal() {
  const open = useStore((s) => s.addHoldingOpen)
  const def = useStore((s) => s.addHoldingDef)
  const resolving = useStore((s) => s.addHoldingResolving)
  const input = useStore((s) => s.addHoldingInput)
  const stocks = useStore((s) => s.stocks)
  const submit = useStore((s) => s.submitAddHolding)
  const close = useStore((s) => s.closeAddHolding)

  const [cost, setCost] = useState('')
  const [shares, setShares] = useState('')

  // Reset the form whenever a new stock is being added.
  useEffect(() => {
    if (def && stocks[def.code]) {
      setCost(stocks[def.code].price.toFixed(2))
      setShares('')
    }
  }, [def, stocks])

  if (!open) return null

  const live = def ? stocks[def.code] : null
  const canSubmit = def && cost !== '' && shares !== '' && Number(shares) > 0

  const onSubmit = () => {
    if (!canSubmit) return
    submit(Number(cost), Number(shares))
  }

  return (
    <div className="cmd-overlay" onClick={close}>
      <div className="cmd-modal add-holding-modal" onClick={(e) => e.stopPropagation()}>
        {resolving ? (
          <div className="ah-loading">正在实时查询 {input.toUpperCase()} …</div>
        ) : !def ? (
          <div className="ah-loading">
            没查到「{input}」对应的标的。支持：A股6位 / 港股 hk00700 / 美股 AAPL / 期货 沪金。
            <button className="btn-primary ah-close" onClick={close}>
              关闭
            </button>
          </div>
        ) : (
          <>
            <div className="ah-head">
              <span className="ah-name">{def.name}</span>
              <span className="ah-code font-mono">{def.code.toUpperCase()}</span>
            </div>
            {live && (
              <div className={`ah-price font-mono ${live.changePercent >= 0 ? 'rise' : 'fall'}`}>
                现价 {live.price.toFixed(2)}　{live.changePercent >= 0 ? '+' : ''}
                {live.changePercent.toFixed(2)}%
              </div>
            )}
            <label className="ah-field">
              <span>{def.type === 'future' ? '成本价（元）' : '成本价（元/股）'}</span>
              <input
                className="ah-input font-mono"
                type="number"
                inputMode="decimal"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="例如 12.50"
              />
            </label>
            <label className="ah-field">
              <span>{def.type === 'future' ? '持有数量（手）' : '持有数量（股）'}</span>
              <input
                className="ah-input font-mono"
                type="number"
                inputMode="numeric"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                placeholder="例如 100"
              />
            </label>
            <div className="ah-actions">
              <button className="btn-ghost" onClick={close}>
                取消
              </button>
              <button className="btn-primary" disabled={!canSubmit} onClick={onSubmit}>
                保存持仓
              </button>
            </div>
            <div className="ah-hint">仅作记录，不连接任何券商、不会代你交易。</div>
          </>
        )}
      </div>
    </div>
  )
}

import { useStore } from '../store'
import { greeting } from '../utils'
import { computeMarketSentiment } from '../mockData'
import StockCard from './StockCard'
import Gauge from './Gauge'

export default function WatchlistPage() {
  const watchlist = useStore((s) => s.watchlist)
  const holdings = useStore((s) => s.holdings)
  const alerts = useStore((s) => s.alerts)
  const profile = useStore((s) => s.profile)
  const breadth = useStore((s) => s.marketBreadth)
  const indices = useStore((s) => s.indices)
  const toggleCommand = useStore((s) => s.toggleCommand)

  const streak = profile.streak || 0
  const sentiment = computeMarketSentiment(breadth, indices)
  const moodText =
    sentiment >= 66
      ? '情绪偏热，注意追高风险'
      : sentiment >= 33
      ? '多空均衡，按节奏来'
      : '情绪偏冷，控制仓位'

  return (
    <div>
      {/* 首页 Hero：问候 + 账号 + 连续看盘天数 */}
      <div className="hero card-enter">
        <div className="hero-left">
          {profile.avatar ? (
            <img className="hero-avatar" src={profile.avatar} alt="" />
          ) : (
            <div className="hero-avatar hero-avatar--empty">👤</div>
          )}
          <div>
            <div className="hero-greet">{greeting(profile.name)}</div>
            <div className="hero-sub">
              连续看盘 <b>{streak}</b> 天 · 扫一眼，今天也要稳住
            </div>
          </div>
        </div>
        <div className="hero-stats">
          <div className="hero-stat">
            <b>{watchlist.length}</b>
            <span>自选</span>
          </div>
          <div className="hero-stat">
            <b>{Object.keys(holdings).length}</b>
            <span>持仓</span>
          </div>
          <div className="hero-stat">
            <b>{alerts.length}</b>
            <span>预警</span>
          </div>
        </div>
      </div>

      {/* 大盘情绪仪表盘 */}
      <div className="sentiment-card card-enter">
        <div className="sentiment-head">
          <span className="sentiment-title">大盘情绪</span>
          <span className="sentiment-tag">示意</span>
        </div>
        <Gauge value={sentiment} label="恐慌 / 贪婪指数" sub={moodText} />
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">我的自选</h1>
          <p className="page-subtitle">
            {watchlist.length} 只股票 · 按 Ctrl+K 搜索添加
          </p>
        </div>
      </div>

      {watchlist.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">★</div>
          <div>还没有添加自选股</div>
          <div className="empty-hint">按 Ctrl+K 搜索并添加</div>
        </div>
      ) : (
        <div className="cards-grid">
          {watchlist.map((code) => (
            <StockCard key={code} code={code} />
          ))}
          <button className="add-stock-btn" onClick={toggleCommand}>
            + 添加股票
          </button>
        </div>
      )}

      {/* 风险提示盾牌卡 */}
      <div className="risk-card">
        <span className="risk-shield">🛡️</span>
        <div>
          <div className="risk-title">股市有风险，投资需谨慎</div>
          <div className="risk-text">
            本工具仅作信息展示，行情为示意数据，不构成任何投资建议。
          </div>
        </div>
      </div>
    </div>
  )
}

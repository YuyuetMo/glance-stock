// ─────────────────────────────────────────────────────────────────────────────
// Glance · mock market data
// All numbers are simulated client-side. No network, no real quotes.
// ─────────────────────────────────────────────────────────────────────────────

// 25 popular A-share stocks.
// code: full code (market + symbol)  ·  symbol: 6-digit  ·  market: sh | sz
// prevClose: prior close (used as the 0% baseline)  ·  pinyin: initials for search
export const STOCK_DEFS = [
  { code: 'sh600519', symbol: '600519', name: '贵州茅台', market: 'sh', prevClose: 1758, pinyin: 'gzmt' },
  { code: 'sz300750', symbol: '300750', name: '宁德时代', market: 'sz', prevClose: 182.5, pinyin: 'ndsd' },
  { code: 'sz002594', symbol: '002594', name: '比亚迪', market: 'sz', prevClose: 278, pinyin: 'byd' },
  { code: 'sh601318', symbol: '601318', name: '中国平安', market: 'sh', prevClose: 48.2, pinyin: 'zgpa' },
  { code: 'sh600036', symbol: '600036', name: '招商银行', market: 'sh', prevClose: 35.6, pinyin: 'zsyh' },
  { code: 'sz000858', symbol: '000858', name: '五粮液', market: 'sz', prevClose: 142, pinyin: 'wly' },
  { code: 'sh601012', symbol: '601012', name: '隆基绿能', market: 'sh', prevClose: 22.8, pinyin: 'ljln' },
  { code: 'sz000001', symbol: '000001', name: '平安银行', market: 'sz', prevClose: 11.5, pinyin: 'payh' },
  { code: 'sh600900', symbol: '600900', name: '长江电力', market: 'sh', prevClose: 28.9, pinyin: 'cjdl' },
  { code: 'sh601899', symbol: '601899', name: '紫金矿业', market: 'sh', prevClose: 16.8, pinyin: 'zjky' },
  { code: 'sz002475', symbol: '002475', name: '立讯精密', market: 'sz', prevClose: 32.5, pinyin: 'lxjm' },
  { code: 'sz300059', symbol: '300059', name: '东方财富', market: 'sz', prevClose: 15.2, pinyin: 'dfcf' },
  { code: 'sh601888', symbol: '601888', name: '中国中免', market: 'sh', prevClose: 85.6, pinyin: 'zgzm' },
  { code: 'sh600030', symbol: '600030', name: '中信证券', market: 'sh', prevClose: 22.4, pinyin: 'zxzq' },
  { code: 'sz002304', symbol: '002304', name: '洋河股份', market: 'sz', prevClose: 98.5, pinyin: 'yhgf' },
  { code: 'sh600276', symbol: '600276', name: '恒瑞医药', market: 'sh', prevClose: 45.2, pinyin: 'hryy' },
  { code: 'sh601166', symbol: '601166', name: '兴业银行', market: 'sh', prevClose: 17.8, pinyin: 'xyyh' },
  { code: 'sz000333', symbol: '000333', name: '美的集团', market: 'sz', prevClose: 62.5, pinyin: 'mdjt' },
  { code: 'sh600887', symbol: '600887', name: '伊利股份', market: 'sh', prevClose: 30.2, pinyin: 'ylgf' },
  { code: 'sh603259', symbol: '603259', name: '药明康德', market: 'sh', prevClose: 52.8, pinyin: 'ymkd' },
  { code: 'sh688981', symbol: '688981', name: '中芯国际', market: 'sh', prevClose: 48.6, pinyin: 'zxgj' },
  { code: 'sz002352', symbol: '002352', name: '顺丰控股', market: 'sz', prevClose: 38.9, pinyin: 'sfkg' },
  { code: 'sz300760', symbol: '300760', name: '迈瑞医疗', market: 'sz', prevClose: 285, pinyin: 'mryl' },
  { code: 'sh601919', symbol: '601919', name: '中远海控', market: 'sh', prevClose: 12.5, pinyin: 'zyhk' },
  { code: 'sz000651', symbol: '000651', name: '格力电器', market: 'sz', prevClose: 38.2, pinyin: 'gldq' },
]

// 3 major indices.
export const INDEX_DEFS = [
  { code: 'idx-sh', symbol: '000001', name: '上证指数', prevClose: 3125.8 },
  { code: 'idx-sz', symbol: '399001', name: '深证成指', prevClose: 10280.5 },
  { code: 'idx-cy', symbol: '399006', name: '创业板指', prevClose: 2055.3 },
]

// 18 mock news items (mixed sentiment). Sentiment is computed on the fly by
// newsClassifier — these only carry id / title / stock / time.
export const MOCK_NEWS = [
  { id: 1, title: '贵州茅台一季度营收同比增长18.5%，净利润超预期', stockCode: 'sh600519', stockName: '贵州茅台', time: '09:32' },
  { id: 2, title: '宁德时代获特斯拉新订单，签订长期供货协议', stockCode: 'sz300750', stockName: '宁德时代', time: '09:41' },
  { id: 3, title: '比亚迪6月新能源车销量创新高，海外交付加速', stockCode: 'sz002594', stockName: '比亚迪', time: '09:48' },
  { id: 4, title: '中国平安启动股份回购，首期金额超50亿元', stockCode: 'sh601318', stockName: '中国平安', time: '10:05' },
  { id: 5, title: '招商银行获多家机构上调目标价至45元', stockCode: 'sh600036', stockName: '招商银行', time: '10:22' },
  { id: 6, title: '五粮液控股股东增持，传递积极信号', stockCode: 'sz000858', stockName: '五粮液', time: '10:40' },
  { id: 7, title: '隆基绿能中标沙特光伏项目，金额超30亿元', stockCode: 'sh601012', stockName: '隆基绿能', time: '11:03' },
  { id: 8, title: '平安银行上半年业绩预增，盈利能力回升', stockCode: 'sz000001', stockName: '平安银行', time: '11:20' },
  { id: 9, title: '长江电力发电量同比增长12%，来水好于预期', stockCode: 'sh600900', stockName: '长江电力', time: '13:12' },
  { id: 10, title: '紫金矿业海外矿权获批，资源储量大幅提升', stockCode: 'sh601899', stockName: '紫金矿业', time: '13:35' },
  { id: 11, title: '立讯精密与大客户合作深化，新品出货放量', stockCode: 'sz002475', stockName: '立讯精密', time: '13:50' },
  { id: 12, title: '东方财富用户规模突破2亿，市占率提升', stockCode: 'sz300059', stockName: '东方财富', time: '14:08' },
  { id: 13, title: '中国中免发布月度经营数据，免税销售环比平稳', stockCode: 'sh601888', stockName: '中国中免', time: '14:25' },
  { id: 14, title: '中信证券发布半年报，各项业务保持稳健运行', stockCode: 'sh600030', stockName: '中信证券', time: '14:40' },
  { id: 15, title: '伊利股份披露分红预案，股息率维持行业前列', stockCode: 'sh600887', stockName: '伊利股份', time: '15:02' },
  { id: 16, title: '兴业银行股价盘中跌停，市场担忧地产链风险', stockCode: 'sh601166', stockName: '兴业银行', time: '15:31' },
  { id: 17, title: '药明康德遭重要股东减持，套现规模超10亿元', stockCode: 'sh603259', stockName: '药明康德', time: '15:45' },
  { id: 18, title: '中远海控业绩预减，运价回落拖累盈利', stockCode: 'sh601919', stockName: '中远海控', time: '15:58' },
]

// 24 sectors with intraday change (%) + a one-line plain-language intro.
export const SECTORS = [
  { name: '人工智能', change: 3.15, desc: '涵盖 AI 芯片、大模型与算力，政策与产业催化多，波动大。' },
  { name: '白酒', change: 2.35, desc: '消费核心资产，业绩确定性强，机构与北向资金重仓。' },
  { name: '汽车零部件', change: 2.08, desc: '受益新能源车放量，出海与智能化为双主线。' },
  { name: '消费电子', change: 1.92, desc: '手机/PC/可穿戴产业链，看新品周期与需求复苏。' },
  { name: '传媒', change: 1.78, desc: '游戏、影视、营销，受内容供给与监管影响明显。' },
  { name: '新能源车', change: 1.68, desc: '整车与电池链，价格战与渗透率仍是焦点。' },
  { name: '食品饮料', change: 1.45, desc: '刚需消费，防御属性强，估值看业绩兑现。' },
  { name: '半导体', change: 1.24, desc: '国产替代主线，周期与政策共振，弹性高。' },
  { name: '计算机', change: 2.52, desc: '信创、软件与 AI 应用，主题催化活跃。' },
  { name: '通信', change: 0.92, desc: '运营商、光模块、算力网络，分红与 AI 双驱动。' },
  { name: '银行', change: 0.82, desc: '高股息防御板块，看息差与地产链风险。' },
  { name: '有色金属', change: 0.75, desc: '铜铝金等周期品，受全球供需与美元影响。' },
  { name: '电力', change: 0.65, desc: '火电反转与绿电成长，防御+红利属性。' },
  { name: '证券', change: 0.56, desc: '行情风向标，与成交活跃度和 IPO 节奏高度相关。' },
  { name: '保险', change: 0.38, desc: '资产端受益利率与股市，负债端看寿险复苏。' },
  { name: '化工', change: 0.28, desc: '油价与供需定价，细分龙头分化明显。' },
  { name: '军工', change: -0.42, desc: '装备放量+改革，计划性强，受事件驱动。' },
  { name: '物流', change: -0.35, desc: '电商与制造业晴雨表，价格竞争仍激烈。' },
  { name: '钢铁', change: -0.55, desc: '地产链上游，需求偏弱，供给端限产托底。' },
  { name: '光伏', change: -0.95, desc: '产能过剩出清中，价格触底与新技术是关键。' },
  { name: '煤炭', change: -0.88, desc: '高股息红利资产，受供给与电价影响。' },
  { name: '医疗器械', change: -1.02, desc: '集采常态化，看创新器械与出海突破。' },
  { name: '医药', change: -1.35, desc: '创新药与消费医疗，长期空间大但波动高。' },
  { name: '房地产', change: -2.1, desc: '政策托底与基本面博弈，高弹性高波动。' },
]

// ── Synthetic news helpers (illustrative fallback when the real feed is quiet) ─
const SYNTH_MARKET_TEMPLATES = [
  'A股三大指数窄幅震荡，市场观望情绪升温',
  '两市成交额温和放大，资金分歧有所加大',
  '北向资金今日小幅净买入，蓝筹板块相对企稳',
  '题材轮动加快，短线资金博弈趋于激烈',
  '政策预期边际回暖，权重股护盘迹象明显',
  '外围市场波动加剧，A股承压整理',
  '低位板块补涨，市场高低切换进行时',
  '量能不足，指数冲高回落，盘面分化明显',
]

// Make a synthetic 大盘 news item (clearly labelled as simulated).
export function makeSynthMarketNews(timeStr) {
  const title =
    SYNTH_MARKET_TEMPLATES[Math.floor(Math.random() * SYNTH_MARKET_TEMPLATES.length)]
  return {
    id: `syn-m-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title,
    time: timeStr,
    stockCode: null,
    stockName: '大盘',
    kind: 'market',
    source: 'sim',
    real: false,
  }
}

// Make a synthetic news item when a held/watched stock moves notably.
export function makeSynthStockNews(stock, timeStr) {
  const up = stock.changePercent >= 0
  const title = `${stock.name}盘中${up ? '异动拉升' : '走弱下行'}，现${
    up ? '涨' : '跌'
  }${Math.abs(stock.changePercent).toFixed(2)}%`
  return {
    id: `syn-s-${stock.code}-${Date.now()}`,
    title,
    time: timeStr,
    stockCode: stock.code,
    stockName: stock.name,
    kind: 'stock',
    source: 'sim',
    real: false,
  }
}

// Market sentiment index 0-100 from breadth + index performance (illustrative).
export function computeMarketSentiment(breadth, indices) {
  const up = (breadth && breadth.up) || 0
  const down = (breadth && breadth.down) || 0
  const total = up + down || 1
  const breadthScore = ((up - down) / total) * 40 // -40 .. 40
  const idxList = Object.values(indices || {})
  let idxScore = 0
  if (idxList.length) {
    const avg =
      idxList.reduce((a, s) => a + (s.changePercent || 0), 0) / idxList.length
    idxScore = avg * 4 // ~ -40 .. 40
  }
  return Math.max(0, Math.min(100, Math.round(50 + breadthScore + idxScore)))
}

const round2 = (n) => Math.round(n * 100) / 100

// Build the initial quote map for a list of defs.
function buildInitial(defs) {
  const map = {}
  defs.forEach((d) => {
    const open = round2(d.prevClose * (1 + (Math.random() - 0.5) * 0.01)) // ±0.5%
    map[d.code] = {
      ...d,
      price: open,
      open,
      high: open,
      low: open,
      prevClose: d.prevClose,
      change: round2(open - d.prevClose),
      changePercent: round2(((open - d.prevClose) / d.prevClose) * 100),
      volume: Math.floor(Math.random() * 500000) + 100000,
      sparkline: [open],
    }
  })
  return map
}

export function buildInitialStocks(defs) {
  return buildInitial(defs)
}

export function buildInitialIndices(defs) {
  return buildInitial(defs)
}

// Advance one tick. Per-step move ~±0.3%, with a slight 52/48 upward bias.
// Cumulative change is capped at ±10% from prevClose (A-share limit).
function tick(prev, maxStep) {
  const next = {}
  Object.values(prev).forEach((s) => {
    const up = Math.random() < 0.52
    const step = Math.random() * maxStep
    const changePct = up ? step : -step
    let price = s.price * (1 + changePct)
    const maxUp = s.prevClose * 1.1
    const maxDown = s.prevClose * 0.9
    price = Math.min(maxUp, Math.max(maxDown, price))
    price = round2(price)

    let spark = s.sparkline.concat(price)
    if (spark.length > 120) spark = spark.slice(spark.length - 120)

    next[s.code] = {
      ...s,
      price,
      high: Math.max(s.high, price),
      low: Math.min(s.low, price),
      change: round2(price - s.prevClose),
      changePercent: round2(((price - s.prevClose) / s.prevClose) * 100),
      volume: s.volume + Math.floor(Math.random() * 5000),
      sparkline: spark,
    }
  })
  return next
}

export function tickStocks(prev) {
  return tick(prev, 0.006) // ±0.6% → ~0.3% on average
}

export function tickIndices(prev) {
  return tick(prev, 0.003) // ±0.15%
}

// ── Major market news (no single stock) ────────────────────────────────────────
// Shown under the 「市场」 tab. Sentiment is still auto-classified by title.
export const MARKET_NEWS = [
  { id: 101, title: 'A股三大指数集体收涨，创业板指领涨超2%', stockCode: null, stockName: '大盘', time: '09:15', kind: 'market' },
  { id: 102, title: '两市成交额重回万亿，北向资金净买入68亿元', stockCode: null, stockName: '大盘', time: '10:30', kind: 'market' },
  { id: 103, title: '央行宣布降准0.5个百分点，释放长期资金约1万亿元', stockCode: null, stockName: '大盘', time: '11:45', kind: 'market' },
  { id: 104, title: '证监会：将进一步优化交易机制，提升市场活跃度', stockCode: null, stockName: '大盘', time: '13:20', kind: 'market' },
  { id: 105, title: '国际油价大跌，航空、化工板块成本端减压', stockCode: null, stockName: '大盘', time: '13:55', kind: 'market' },
  { id: 106, title: '美债收益率攀升，全球风险资产承压', stockCode: null, stockName: '大盘', time: '14:30', kind: 'market' },
  { id: 107, title: '部分高位题材股遭资金抛售，市场波动加大', stockCode: null, stockName: '大盘', time: '15:05', kind: 'market' },
  { id: 108, title: '新股申购升温，打新收益回暖', stockCode: null, stockName: '大盘', time: '15:40', kind: 'market' },
]

// Stable symbol hash for deterministic mock values (per-stock).
function hashSym(sym) {
  let h = 0
  for (let i = 0; i < sym.length; i++) h = (h * 31 + sym.charCodeAt(i)) % 100000
  return Math.abs(h)
}

// Mock 主力资金 (main-fund net inflow, in 亿元). Illustrative only — not real data.
export function computeMainFunds(symbol) {
  const seed = hashSym(symbol)
  const net = Math.round((Math.sin(seed) * 9 + (seed % 7) - 3) * 10) / 10
  const inflow = net >= 0
  const sentence = inflow ? '近几日主力持续流入，资金看好' : '近几日主力净流出，注意风险'
  return { net, inflow, sentence }
}

// Aggregate 主力资金 across the whole stock universe (illustrative).
export function computeMarketFunds(stocks) {
  const list = Object.values(stocks)
  let total = 0
  list.forEach((s) => {
    total += computeMainFunds(s.symbol).net
  })
  const net = Math.round(total * 10) / 10
  const inflow = net >= 0
  const sentence = inflow
    ? '今日全市场主力资金整体净流入，情绪偏暖'
    : '今日全市场主力资金整体净流出，情绪偏冷'
  return { net, inflow, sentence }
}

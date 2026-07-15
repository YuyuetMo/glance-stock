// Lightweight keyword-based news sentiment classifier.
// Negative keywords are checked first so that a clearly bearish headline
// (e.g. "业绩预减但回购") is flagged as negative.

const POSITIVE = [
  '涨停', '中标', '回购', '业绩预增', '签约', '获批', '创新高', '增长',
  '突破', '大涨', '超预期', '合作', '增持', '上调', '加速', '扩张',
  '新高', '销量创', '优化', '提升',
]

const NEGATIVE = [
  '减持', '亏损', '立案调查', '暴雷', '退市风险', '跌停', '违规',
  '处罚', '暴跌', '业绩预减', '质押', '诉讼', '下调', '下降',
]

export function classifyNews(title = '') {
  for (const word of NEGATIVE) {
    if (title.includes(word)) {
      return { sentiment: 'negative', reason: `标题含「${word}」` }
    }
  }
  for (const word of POSITIVE) {
    if (title.includes(word)) {
      return { sentiment: 'positive', reason: `标题含「${word}」` }
    }
  }
  return { sentiment: 'neutral', reason: '未匹配到明确的利好 / 利空关键词' }
}

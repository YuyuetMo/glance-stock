// Small shared UI helpers.

// Time-of-day greeting. Falls back to 「小白投资者」 if no name is set.
export function greeting(name) {
  const h = new Date().getHours()
  const part =
    h < 5 ? '晚上好' : h < 11 ? '早上好' : h < 13 ? '中午好' : h < 18 ? '下午好' : '晚上好'
  const who = name && name.trim() ? name.trim() : '小白投资者'
  return `${part}，${who}`
}

// Compact 亿 formatting for 主力资金 figures.
export function formatYi(n) {
  const v = Math.abs(n)
  return (n < 0 ? '-' : '') + v.toFixed(1)
}

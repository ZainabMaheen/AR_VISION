const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
const timeFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' })

/** "12 Nov 2026" */
export const formatDate = (ms: number) => dateFmt.format(ms)

/** "12 Nov 2026, 14:05" */
export const formatDateTime = (ms: number) => `${dateFmt.format(ms)}, ${timeFmt.format(ms)}`

/** "Just now", "5 minutes ago", "Yesterday", "3 days ago", then the date. */
export function formatRelative(ms: number, now = Date.now()): string {
  const s = Math.round((now - ms) / 1000)
  if (s < 60) return 'Just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m} minute${m === 1 ? '' : 's'} ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`
  const d = Math.round(h / 24)
  if (d === 1) return 'Yesterday'
  if (d < 7) return `${d} days ago`
  return formatDate(ms)
}

/** "1 visualisation", "3 visualisations" */
export const plural = (n: number, word: string, many = `${word}s`) => `${n} ${n === 1 ? word : many}`

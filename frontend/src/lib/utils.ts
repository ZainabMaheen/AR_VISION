/**
 * Short unique id. crypto.randomUUID only exists on https/localhost, so there is
 * a fallback for testing over the local network (http://192.168.x.x).
 */
export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/** Trim and collapse spaces; falls back when empty. */
export function cleanText(value: string, fallback = ''): string {
  const v = value.replace(/\s+/g, ' ').trim()
  return v || fallback
}

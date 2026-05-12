import { formatInTimeZone } from 'date-fns-tz'

const TZ = 'America/New_York'

export function fmtDate(iso, fmt = 'MMM d, yyyy') {
  if (!iso) return ''
  return formatInTimeZone(new Date(iso), TZ, fmt)
}

export function fmtTime(iso, fmt = 'h:mm a') {
  if (!iso) return ''
  return formatInTimeZone(new Date(iso), TZ, fmt)
}

export function fmtDateTime(iso) {
  if (!iso) return ''
  return formatInTimeZone(new Date(iso), TZ, "MMM d, yyyy 'at' h:mm a")
}

export function fmtDuration(seconds) {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

export function fmtPhone(phone) {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('1')) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return phone
}

export const TIMEZONE = TZ

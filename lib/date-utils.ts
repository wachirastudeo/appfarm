// Local-calendar date helpers.
// Records store ISO timestamps, but users think in local calendar days (Asia/Bangkok).
// `value.split("T")[0]` reads the UTC day, which is one day early for anything saved at
// local midnight. Always convert through these helpers instead.

export const MONTHS_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]
export const DAYS_TH = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"]

const pad = (n: number) => String(n).padStart(2, "0")

/** YYYY-MM-DD of a Date in the device's local time zone. */
export function dateKeyOf(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Local calendar day (YYYY-MM-DD) of a stored ISO timestamp. */
export function toDateKey(iso: string | undefined | null) {
  if (!iso) return dateKeyOf(new Date())
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso.slice(0, 10) : dateKeyOf(date)
}

export function todayKey() {
  return dateKeyOf(new Date())
}

/** Parse YYYY-MM-DD as a local date (not UTC). */
export function parseDateKey(key: string) {
  const [y, m, d] = key.split("-").map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

/**
 * ISO timestamp for a calendar day, pinned to local noon so the UTC date part
 * matches the local day for every time zone between UTC-11 and UTC+11.
 */
export function dateKeyToISO(key: string) {
  const date = parseDateKey(key)
  date.setHours(12, 0, 0, 0)
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

export function addDaysToKey(key: string, days: number) {
  const date = parseDateKey(key)
  date.setDate(date.getDate() + days)
  return dateKeyOf(date)
}

/** Whole days from `fromKey` to `toKey` (positive when toKey is later). */
export function daysBetween(fromKey: string, toKey: string) {
  return Math.round((parseDateKey(toKey).getTime() - parseDateKey(fromKey).getTime()) / 86400000)
}

export function formatThaiDate(keyOrIso: string, opts: { weekday?: boolean; year?: boolean } = {}) {
  const date = parseDateKey(toDateKey(keyOrIso))
  const base = `${date.getDate()} ${MONTHS_TH[date.getMonth()]}`
  const withYear = opts.year ? `${base} ${date.getFullYear() + 543}` : base
  return opts.weekday ? `${DAYS_TH[date.getDay()]} ${withYear}` : withYear
}

/** "วันนี้", "พรุ่งนี้", "เมื่อวาน" or a short Thai date. */
export function relativeDayLabel(keyOrIso: string) {
  const key = toDateKey(keyOrIso)
  const diff = daysBetween(todayKey(), key)
  if (diff === 0) return "วันนี้"
  if (diff === 1) return "พรุ่งนี้"
  if (diff === -1) return "เมื่อวาน"
  return formatThaiDate(key, { weekday: true, year: Math.abs(diff) > 300 })
}

/** "3 วันก่อน", "อีก 5 วัน" style distance. */
export function relativeDistance(keyOrIso: string) {
  const diff = daysBetween(todayKey(), toDateKey(keyOrIso))
  if (diff === 0) return "วันนี้"
  if (diff > 0) return diff === 1 ? "พรุ่งนี้" : `อีก ${diff} วัน`
  return diff === -1 ? "เมื่อวาน" : `${-diff} วันก่อน`
}

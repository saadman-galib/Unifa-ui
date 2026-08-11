import type { TimeOfDay } from '@/types'

/**
 * `"07:30"` -> `07:30 AM`. `format.ts`'s `time()` formats ISO instants, but
 * `TimeOfDay` values (pickup/return/stop times) carry no date to hand it —
 * so a tiny manual 12-hour conversion lives here instead of hand-formatting
 * it inline in every page that shows a stop time.
 */
export function timeOfDay(t: TimeOfDay): string {
  const [hStr, m] = t.split(':')
  const h = Number(hStr)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${String(h12).padStart(2, '0')}:${m} ${period}`
}

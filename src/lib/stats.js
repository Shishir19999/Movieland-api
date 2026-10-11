// Viewing statistics. Input is the resolved list of watched movies plus diary and ratings.
import { decadeOf } from './logic.js'
import { sortedDiary } from './library.js'

const tally = (values, limit = 8) => {
  const m = new Map()
  for (const v of values) if (v) m.set(v, (m.get(v) || 0) + 1)
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))
    .slice(0, limit)
    .map(([label, value]) => ({ label: String(label), value }))
}

export const RUNTIME_BUCKETS = [
  ['Under 90 min', 0, 89],
  ['90 to 119 min', 90, 119],
  ['120 to 149 min', 120, 149],
  ['150 min or more', 150, Infinity],
]

// watched: movie objects; mine: {id: {rating}}; diary: entries. `now` is injectable for tests.
export function computeStats({ watched, mine = {}, diary = [] }, now = new Date()) {
  const minutes = watched.reduce((n, m) => n + (m.runtime || 0), 0)
  const rated = watched.map((m) => mine[m.id]?.rating).filter(Boolean)
  const ratingDist = [1, 2, 3, 4, 5].map((r) => ({ label: `${r} star${r > 1 ? 's' : ''}`, value: rated.filter((x) => x === r).length }))
  const months = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleString('en', { month: 'short', year: '2-digit' }), value: 0 })
  }
  for (const e of diary) {
    const slot = months.find((m) => m.key === e.date.slice(0, 7))
    if (slot) slot.value++
  }
  const decades = tally(watched.map((m) => (m.year != null ? `${decadeOf(m.year)}s` : null)), 20).sort((a, b) =>
    a.label.localeCompare(b.label),
  )
  const withRuntime = watched.filter((m) => m.runtime)
  const sorted = sortedDiary(diary)
  return {
    films: watched.length,
    viewings: diary.length,
    minutes,
    hours: Math.round((minutes / 60) * 10) / 10,
    avgRating: rated.length ? Math.round((rated.reduce((a, b) => a + b, 0) / rated.length) * 10) / 10 : null,
    ratedCount: rated.length,
    genres: tally(watched.flatMap((m) => m.genres || [])),
    decades,
    directors: tally(watched.flatMap((m) => String(m.director || '').split(/,\s*/))),
    actors: tally(watched.flatMap((m) => (m.cast || []).slice(0, 3))),
    languages: tally(watched.map((m) => m.language || 'English')),
    ratingDist,
    runtimeBuckets: RUNTIME_BUCKETS.map(([label, lo, hi]) => ({
      label,
      value: withRuntime.filter((m) => m.runtime >= lo && m.runtime <= hi).length,
    })),
    byMonth: months,
    longest: withRuntime.reduce((a, m) => (!a || m.runtime > a.runtime ? m : a), null),
    shortest: withRuntime.reduce((a, m) => (!a || m.runtime < a.runtime ? m : a), null),
    lastSeen: sorted[0] || null,
  }
}

// Movie night picker: build a shortlist from lists with constraints, then pick a winner.
import { shuffle } from './recommend.js'

export function nightCandidates(pool, { maxRuntime = '', genre = '', minRating = '', excludeIds = new Set() } = {}) {
  const maxR = Number(maxRuntime) || 0
  const min = Number(minRating) || 0
  return pool.filter(
    (m) =>
      !excludeIds.has(m.id) &&
      (!maxR || (m.runtime && m.runtime <= maxR)) &&
      (!genre || (m.genres || []).includes(genre)) &&
      (!min || (typeof m.rating === 'number' && m.rating >= min)),
  )
}

export function pickShortlist(candidates, count = 3, rng = Math.random) {
  return shuffle(candidates, rng).slice(0, Math.max(1, count))
}

export const pickWinner = (shortlist, rng = Math.random) =>
  shortlist.length ? shortlist[Math.floor(rng() * shortlist.length)] : null

export const encodeNight = (shortlist, winner) => {
  const q = new URLSearchParams({ p: shortlist.map((m) => m.id).join(',') })
  if (winner) q.set('w', winner.id)
  return q.toString()
}
export function decodeNight(query) {
  const ids = String(query.p || '').split(',').filter((x) => /^[\w.:-]{1,80}$/.test(x)).slice(0, 12)
  return { ids, winner: /^[\w.:-]{1,80}$/.test(query.w || '') ? query.w : null }
}

// Similarity, recommendations and curated rows, all derived from catalogue metadata.
import { decadeOf } from './logic.js'

const set = (v) => new Set(v || [])
const overlap = (a, b) => {
  const sb = set(b)
  return [...set(a)].filter((x) => sb.has(x)).length
}

// 0..1 score: shared genres matter most, then director, cast, era and rating.
export function similarity(a, b) {
  if (!a || !b || a.id === b.id) return 0
  const ga = a.genres || []
  const gb = b.genres || []
  const union = new Set([...ga, ...gb]).size || 1
  const genre = overlap(ga, gb) / union
  const dirA = String(a.director || '').split(/,\s*/).filter(Boolean)
  const dirB = String(b.director || '').split(/,\s*/).filter(Boolean)
  const director = overlap(dirA, dirB) > 0 ? 1 : 0
  const cast = Math.min(overlap(a.cast, b.cast), 2) / 2
  const era =
    a.year != null && b.year != null ? Math.max(0, 1 - Math.abs(decadeOf(a.year) - decadeOf(b.year)) / 40) : 0
  const rate =
    typeof a.rating === 'number' && typeof b.rating === 'number' ? Math.max(0, 1 - Math.abs(a.rating - b.rating) / 2) : 0
  return genre * 0.45 + director * 0.2 + cast * 0.15 + era * 0.1 + rate * 0.1
}

export function similarTo(movie, pool, n = 6) {
  return pool
    .map((m, i) => ({ m, i, s: similarity(movie, m) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || (b.m.rating ?? 0) - (a.m.rating ?? 0) || a.i - b.i)
    .slice(0, n)
    .map((x) => x.m)
}

// "Because you liked X": seeds are liked movies (best rated first); never recommends seen or seed titles.
export function becauseYouLiked(seeds, pool, { exclude = new Set(), rows = 2, per = 8 } = {}) {
  const out = []
  const used = new Set(exclude)
  seeds.forEach((s) => used.add(s.id))
  for (const seed of seeds) {
    if (out.length >= rows) break
    const items = similarTo(seed, pool.filter((m) => !used.has(m.id)), per)
    if (items.length >= 3) {
      items.forEach((m) => used.add(m.id))
      out.push({ seed, items })
    }
  }
  return out
}

export function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffle(list, rng = Math.random) {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Week number since the Unix epoch, so "this week" rows rotate weekly and stay stable within a week.
export const weekSeed = (date = new Date()) => Math.floor(date.getTime() / (7 * 86400000))

const byRating = (a, b) => (b.rating ?? 0) - (a.rating ?? 0)

export function curatedRows(pool, date = new Date()) {
  const top = [...pool].sort(byRating)
  const rng = mulberry32(weekSeed(date))
  return [
    {
      id: 'featured',
      title: 'Featured this week',
      blurb: 'A weekly rotation of well-rated films from the sample catalogue.',
      items: shuffle(top.slice(0, 30), rng).slice(0, 10),
      link: '#/browse?sort=rating',
    },
    { id: 'top', title: 'Top rated', blurb: 'The highest-rated films in the catalogue.', items: top.slice(0, 10), link: '#/browse?sort=rating' },
    {
      id: 'gems',
      title: 'Hidden gems',
      blurb: 'Rated 7.7 to 8.3: great films that rarely top the charts.',
      items: top.filter((m) => m.rating >= 7.7 && m.rating <= 8.3).slice(0, 10),
      link: '#/browse?minRating=7.5&maxRating=8.3&sort=rating',
    },
    {
      id: 'short',
      title: 'Under 100 minutes',
      blurb: 'Short and sweet.',
      items: pool.filter((m) => m.runtime && m.runtime < 100).sort(byRating).slice(0, 10),
      link: '#/browse?maxRuntime=99&sort=rating',
    },
    {
      id: 'world',
      title: 'World cinema',
      blurb: 'Films not in English.',
      items: pool.filter((m) => (m.language || 'English') !== 'English').sort(byRating).slice(0, 10),
      link: '#/browse?language=Japanese',
    },
  ]
}

export function decadeRow(pool, decade) {
  return pool
    .filter((m) => m.year != null && decadeOf(m.year) === Number(decade))
    .sort(byRating)
    .slice(0, 12)
}

const splitPeople = (s) => String(s || '').split(/,\s*/).filter(Boolean)

// Everything a person directed or acted in, newest first.
export function filmographyOf(name, pool) {
  const n = name.toLowerCase()
  return pool
    .map((m) => {
      const roles = []
      if (splitPeople(m.director).some((d) => d.toLowerCase() === n)) roles.push('Director')
      if ((m.cast || []).some((c) => c.toLowerCase() === n)) roles.push('Actor')
      return { movie: m, roles }
    })
    .filter((x) => x.roles.length)
    .sort((a, b) => (b.movie.year ?? 0) - (a.movie.year ?? 0))
}

// People with at least `min` films, most films first.
export function topPeople(pool, role = 'director', min = 2, limit = 12) {
  const counts = new Map()
  for (const m of pool) {
    for (const p of role === 'director' ? splitPeople(m.director) : m.cast || []) counts.set(p, (counts.get(p) || 0) + 1)
  }
  return [...counts.entries()]
    .filter(([, c]) => c >= min)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }))
}

// People who appear most often alongside `name`.
export function collaborators(name, pool, limit = 6) {
  const counts = new Map()
  for (const { movie } of filmographyOf(name, pool)) {
    for (const p of [...splitPeople(movie.director), ...(movie.cast || [])]) {
      if (p.toLowerCase() !== name.toLowerCase()) counts.set(p, (counts.get(p) || 0) + 1)
    }
  }
  return [...counts.entries()]
    .filter(([, c]) => c > 1)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([n, count]) => ({ name: n, count }))
}

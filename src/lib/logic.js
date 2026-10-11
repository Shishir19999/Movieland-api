// Pure helpers: search, filter, sort and pagination. No DOM, no network.

export const PAGE_SIZE = 12

export const DEFAULT_FILTERS = {
  genres: [],
  genreMode: 'all',
  decade: '',
  yearFrom: '',
  yearTo: '',
  minRuntime: '',
  maxRuntime: '',
  minRating: '',
  maxRating: '',
  language: '',
  status: '',
  type: '',
  year: '',
  sort: 'relevance',
}

export const norm = (s) =>
  String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()

export function parseYear(value) {
  const m = /\d{4}/.exec(String(value ?? ''))
  return m ? Number(m[0]) : null
}

export const decadeOf = (year) => Math.floor(year / 10) * 10

// 0 = no match; higher means a better match for the query.
export function matchScore(movie, query) {
  const q = norm(query)
  if (!q) return 1
  const title = norm(movie.title)
  if (title === q) return 5
  if (title.startsWith(q)) return 4
  if (title.split(/[^a-z0-9]+/).some((w) => w.startsWith(q))) return 3
  if (title.includes(q)) return 2
  const people = norm([movie.director, ...(movie.cast || [])].join(' '))
  return people.includes(q) ? 1 : 0
}

const intOrNull = (v) => (v === '' || v == null || !Number.isFinite(Number(v)) ? null : Number(v))

// Advanced filter. `watchedIds` (a Set) is only needed for the status filter.
export function filterMovies(list, f = {}) {
  const { query = '', genre = '', genreMode = 'all', decade = '', language = '', status = '' } = f
  const genres = [...(f.genres || []), ...(genre ? [genre] : [])]
  const min = Number(f.minRating) || 0
  const dec = decade === '' ? null : Number(decade)
  const yFrom = intOrNull(f.yearFrom)
  const yTo = intOrNull(f.yearTo)
  const rMin = intOrNull(f.minRuntime)
  const rMax = intOrNull(f.maxRuntime)
  const maxR = intOrNull(f.maxRating)
  const watched = f.watchedIds || new Set()
  return list.filter((m) => {
    if (matchScore(m, query) === 0) return false
    const g = m.genres || []
    if (genres.length && !(genreMode === 'any' ? genres.some((x) => g.includes(x)) : genres.every((x) => g.includes(x)))) {
      return false
    }
    if (dec !== null && (m.year == null || decadeOf(m.year) !== dec)) return false
    if (yFrom !== null && !(m.year >= yFrom)) return false
    if (yTo !== null && !(m.year <= yTo)) return false
    if (rMin !== null && !(m.runtime >= rMin)) return false
    if (rMax !== null && !(m.runtime <= rMax)) return false
    if (maxR !== null && !(m.rating <= maxR)) return false
    if (min && !(typeof m.rating === 'number' && m.rating >= min)) return false
    if (language && (m.language || 'English') !== language) return false
    if (status === 'unwatched' && watched.has(m.id)) return false
    if (status === 'watched' && !watched.has(m.id)) return false
    return true
  })
}

export function sortMovies(list, { sort = 'relevance', query = '' } = {}) {
  const items = list.map((m, i) => ({ m, i }))
  const num = (v, fallback) => (typeof v === 'number' ? v : fallback)
  const comparators = {
    relevance: (a, b) => (norm(query) ? matchScore(b.m, query) - matchScore(a.m, query) : 0),
    title: (a, b) => a.m.title.localeCompare(b.m.title),
    'year-desc': (a, b) => num(b.m.year, -Infinity) - num(a.m.year, -Infinity),
    'year-asc': (a, b) => num(a.m.year, Infinity) - num(b.m.year, Infinity),
    rating: (a, b) => num(b.m.rating, -1) - num(a.m.rating, -1),
    'runtime-asc': (a, b) => num(a.m.runtime, Infinity) - num(b.m.runtime, Infinity),
    'runtime-desc': (a, b) => num(b.m.runtime, -1) - num(a.m.runtime, -1),
  }
  const cmp = comparators[sort] || (() => 0)
  // the index tiebreak keeps the sort stable and deterministic
  return items.sort((a, b) => cmp(a, b) || a.i - b.i).map((x) => x.m)
}

export function paginate(list, page = 1, size = PAGE_SIZE) {
  const count = Math.max(1, page) * size
  return { items: list.slice(0, count), total: list.length, hasMore: list.length > count }
}

export function suggestTitles(list, query, limit = 6) {
  if (!norm(query)) return []
  const scored = list
    .map((m, i) => ({ title: m.title, i, s: matchScore({ title: m.title }, query) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.i - b.i)
  return [...new Set(scored.map((x) => x.title))].slice(0, limit)
}

export const trailerUrl = (title, year) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${title} ${year ?? ''} official trailer`.replace(/\s+/g, ' ').trim(),
  )}`

export function addRecent(list, term, max = 8) {
  const t = String(term ?? '').trim()
  if (t.length < 2) return list
  return [t, ...list.filter((x) => norm(x) !== norm(t))].slice(0, max)
}

export function toggleById(list, movie) {
  return list.some((m) => m.id === movie.id)
    ? list.filter((m) => m.id !== movie.id)
    : [movie, ...list]
}

// Maps an OMDb error message / HTTP status to a UI error kind.
export function classifyOmdbError(message = '', status = 200) {
  const m = String(message).toLowerCase()
  if (status === 401 || m.includes('invalid api key') || m.includes('no api key')) {
    return 'invalid-key'
  }
  if (status === 429 || m.includes('limit')) return 'rate-limit'
  if (m.includes('too many')) return 'too-many'
  if (m.includes('not found')) return 'not-found'
  return 'api'
}

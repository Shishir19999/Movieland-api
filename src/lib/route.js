// Hash routes: #/browse?genre=Drama, #/person/Christopher%20Nolan, #/m/<id> (details dialog).
export const NAV = [
  ['home', 'Home', '#/'],
  ['browse', 'Browse', '#/browse'],
  ['lists', 'My lists', '#/lists'],
  ['diary', 'Diary', '#/diary'],
  ['stats', 'Stats', '#/stats'],
  ['night', 'Movie night', '#/night'],
  ['quiz', 'Quiz', '#/quiz'],
  ['compare', 'Compare', '#/compare'],
]

const PAGES = new Set(['browse', 'lists', 'diary', 'stats', 'compare', 'night', 'quiz', 'shared'])

export function parseHash(hash = '') {
  const raw = String(hash).replace(/^#/, '')
  const [pathPart, queryPart = ''] = raw.split('?')
  const query = Object.fromEntries(new URLSearchParams(queryPart))
  const segs = pathPart.split('/').filter(Boolean).map((s) => {
    try {
      return decodeURIComponent(s)
    } catch {
      return s
    }
  })
  const [first, ...rest] = segs
  if (!first) return { name: 'home', query, arg: '' }
  if (first === 'm' && rest.length) return { name: 'movie', query, arg: rest.join('/') }
  if (first === 'person' && rest.length) return { name: 'person', query, arg: rest.join('/') }
  if (PAGES.has(first)) return { name: first, query, arg: '' }
  return { name: 'notfound', query, arg: first }
}

export function buildHash(name, { arg, query } = {}) {
  const base = name === 'home' ? '#/' : arg ? `#/${name}/${encodeURIComponent(arg)}` : `#/${name}`
  const q = new URLSearchParams(Object.entries(query || {}).filter(([, v]) => v !== '' && v != null && v !== false))
  const qs = q.toString()
  return qs ? `${base}?${qs}` : base
}

// The user's library: named lists, ratings, notes and a viewing diary.
// Pure functions over a plain object so they are easy to test; the UI keeps the object in localStorage.
import { findCatalogMovie } from '../data/movies.js'
import { norm } from './logic.js'

export const SYSTEM_LISTS = [
  { id: 'watchlist', name: 'Watchlist' },
  { id: 'favorites', name: 'Favorites' },
  { id: 'watched', name: 'Watched' },
]
export const MAX_NAME = 60
export const MAX_NOTE = 2000

export function emptyLibrary() {
  return {
    v: 2,
    lists: SYSTEM_LISTS.map((l) => ({ ...l, ids: [], system: true })),
    mine: {},
    diary: [],
    cache: {},
  }
}

export const isoDate = (d = new Date()) => {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
const validDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s))
let counter = 0
export const uid = (prefix = 'x') =>
  `${prefix}-${Date.now().toString(36)}${(counter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`
const cleanName = (n) => String(n ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_NAME)

export const resolveMovie = (lib, id) => findCatalogMovie(id) || lib.cache[id] || null
const rememberMovie = (lib, movie) =>
  movie && movie.source === 'omdb' ? { ...lib, cache: { ...lib.cache, [movie.id]: snapshot(movie) } } : lib

// Only the fields the UI needs are stored for live (OMDb) titles.
export function snapshot(m) {
  return {
    id: String(m.id),
    source: 'omdb',
    type: m.type || 'movie',
    title: String(m.title || ''),
    year: Number.isFinite(m.year) ? m.year : null,
    yearLabel: m.yearLabel ? String(m.yearLabel) : undefined,
    poster: typeof m.poster === 'string' && /^https?:\/\//.test(m.poster) ? m.poster : null,
    genres: Array.isArray(m.genres) ? m.genres.map(String).slice(0, 8) : [],
    rating: typeof m.rating === 'number' ? m.rating : null,
    runtime: typeof m.runtime === 'number' ? m.runtime : null,
    director: m.director ? String(m.director) : null,
    cast: Array.isArray(m.cast) ? m.cast.map(String).slice(0, 8) : [],
    plot: m.plot ? String(m.plot).slice(0, 1500) : null,
    ratings: [],
    language: m.language || undefined,
    detailed: !!m.detailed,
  }
}

export const getList = (lib, id) => lib.lists.find((l) => l.id === id)
const mapList = (lib, id, fn) => ({ ...lib, lists: lib.lists.map((l) => (l.id === id ? fn(l) : l)) })

export function addToList(lib, listId, movie) {
  const list = getList(lib, listId)
  if (!list || list.ids.includes(movie.id)) return lib
  return mapList(rememberMovie(lib, movie), listId, (l) => ({ ...l, ids: [movie.id, ...l.ids] }))
}
export const removeFromList = (lib, listId, movieId) =>
  mapList(lib, listId, (l) => ({ ...l, ids: l.ids.filter((x) => x !== movieId) }))
export const toggleInList = (lib, listId, movie) =>
  getList(lib, listId)?.ids.includes(movie.id) ? removeFromList(lib, listId, movie.id) : addToList(lib, listId, movie)
export const inList = (lib, listId, movieId) => !!getList(lib, listId)?.ids.includes(movieId)

export function moveInList(lib, listId, from, to) {
  return mapList(lib, listId, (l) => {
    if (from === to || from < 0 || to < 0 || from >= l.ids.length || to >= l.ids.length) return l
    const ids = [...l.ids]
    const [x] = ids.splice(from, 1)
    ids.splice(to, 0, x)
    return { ...l, ids }
  })
}

export function createList(lib, name, id = uid('l')) {
  const n = cleanName(name)
  if (!n) return lib
  if (lib.lists.some((l) => norm(l.name) === norm(n))) return lib
  return { ...lib, lists: [...lib.lists, { id, name: n, ids: [] }] }
}
export function renameList(lib, id, name) {
  const n = cleanName(name)
  if (!n || lib.lists.some((l) => l.id !== id && norm(l.name) === norm(n))) return lib
  return mapList(lib, id, (l) => (l.system ? l : { ...l, name: n }))
}
export const deleteList = (lib, id) => ({ ...lib, lists: lib.lists.filter((l) => l.id !== id || l.system) })

function putMine(lib, movieId, entry) {
  const mine = { ...lib.mine }
  if (Object.keys(entry).length) mine[movieId] = entry
  else delete mine[movieId]
  return { ...lib, mine }
}
export function setRating(lib, movieId, rating) {
  const r = Math.round(Number(rating))
  const next = { ...(lib.mine[movieId] || {}) }
  if (r >= 1 && r <= 5) next.rating = r
  else delete next.rating
  return putMine(lib, movieId, next)
}
export function setNote(lib, movieId, note) {
  const cur = { ...(lib.mine[movieId] || {}) }
  const n = String(note ?? '').slice(0, MAX_NOTE)
  if (n.trim()) cur.note = n
  else delete cur.note
  return putMine(lib, movieId, cur)
}

// Logging a viewing also puts the film on the Watched list.
export function addDiary(lib, movie, date = isoDate(), note = '', id = uid('d')) {
  const d = validDate(date) ? date : isoDate()
  const withMovie = addToList(rememberMovie(lib, movie), 'watched', movie)
  return {
    ...withMovie,
    diary: [{ id, movieId: movie.id, date: d, note: String(note).slice(0, MAX_NOTE) }, ...withMovie.diary],
  }
}
export const updateDiary = (lib, id, patch) => ({
  ...lib,
  diary: lib.diary.map((e) =>
    e.id !== id
      ? e
      : {
          ...e,
          ...(patch.date !== undefined && validDate(patch.date) ? { date: patch.date } : {}),
          ...(patch.note !== undefined ? { note: String(patch.note).slice(0, MAX_NOTE) } : {}),
        },
  ),
})
export const removeDiary = (lib, id) => ({ ...lib, diary: lib.diary.filter((e) => e.id !== id) })
export const sortedDiary = (diary) => [...diary].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

// Drop cached live titles that nothing references any more.
export function pruneCache(lib) {
  const used = new Set([
    ...lib.lists.flatMap((l) => l.ids),
    ...lib.diary.map((d) => d.movieId),
    ...Object.keys(lib.mine),
  ])
  const cache = Object.fromEntries(Object.entries(lib.cache).filter(([id]) => used.has(id)))
  return Object.keys(cache).length === Object.keys(lib.cache).length ? lib : { ...lib, cache }
}

// ---------- validation (imports and saved data are untrusted) ----------
const ID_RE = /^[\w.:-]{1,80}$/
export function sanitizeLibrary(input) {
  const out = emptyLibrary()
  if (!input || typeof input !== 'object') return out
  const seenNames = new Set()
  for (const raw of Array.isArray(input.lists) ? input.lists : []) {
    if (!raw || typeof raw !== 'object' || !ID_RE.test(String(raw.id))) continue
    const sys = SYSTEM_LISTS.find((s) => s.id === raw.id)
    const ids = [...new Set((Array.isArray(raw.ids) ? raw.ids : []).map(String).filter((x) => ID_RE.test(x)))]
    if (sys) {
      out.lists.find((l) => l.id === sys.id).ids = ids
    } else {
      const name = cleanName(raw.name)
      if (!name || seenNames.has(norm(name)) || SYSTEM_LISTS.some((s) => norm(s.name) === norm(name))) continue
      seenNames.add(norm(name))
      out.lists.push({ id: String(raw.id), name, ids })
    }
  }
  if (input.mine && typeof input.mine === 'object') {
    for (const [id, v] of Object.entries(input.mine)) {
      if (!ID_RE.test(id) || !v || typeof v !== 'object') continue
      const e = {}
      const r = Math.round(Number(v.rating))
      if (r >= 1 && r <= 5) e.rating = r
      if (typeof v.note === 'string' && v.note.trim()) e.note = v.note.slice(0, MAX_NOTE)
      if (Object.keys(e).length) out.mine[id] = e
    }
  }
  const seenD = new Set()
  for (const d of Array.isArray(input.diary) ? input.diary : []) {
    if (!d || !ID_RE.test(String(d.movieId)) || !validDate(d.date)) continue
    let id = ID_RE.test(String(d.id)) ? String(d.id) : uid('d')
    if (seenD.has(id)) id = uid('d')
    seenD.add(id)
    out.diary.push({
      id,
      movieId: String(d.movieId),
      date: d.date,
      note: typeof d.note === 'string' ? d.note.slice(0, MAX_NOTE) : '',
    })
  }
  if (input.cache && typeof input.cache === 'object') {
    for (const [id, m] of Object.entries(input.cache)) {
      if (ID_RE.test(id) && m && typeof m === 'object' && typeof m.title === 'string') {
        out.cache[id] = snapshot({ ...m, id })
      }
    }
  }
  return out
}

export function migrateLegacy(favorites, watchlist) {
  let lib = emptyLibrary()
  const take = (arr, listId) => {
    for (const m of [...(Array.isArray(arr) ? arr : [])].reverse()) {
      if (m && typeof m.id === 'string' && typeof m.title === 'string') lib = addToList(lib, listId, m)
    }
  }
  take(favorites, 'favorites')
  take(watchlist, 'watchlist')
  return sanitizeLibrary(lib)
}

// ---------- backup ----------
export const exportJSON = (lib) => JSON.stringify({ app: 'MovieLand', ...lib }, null, 2)

// mode "merge" adds to what exists; "replace" swaps everything.
export function importJSON(lib, text, mode = 'merge') {
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('That file is not valid JSON.')
  }
  if (!data || typeof data !== 'object' || !Array.isArray(data.lists)) {
    throw new Error('This does not look like a MovieLand backup.')
  }
  const inc = sanitizeLibrary(data)
  if (mode === 'replace') return inc
  const lists = lib.lists.map((l) => ({ ...l }))
  for (const il of inc.lists) {
    const match = lists.find((l) => l.id === il.id || (!l.system && !il.system && norm(l.name) === norm(il.name)))
    if (match) match.ids = [...new Set([...match.ids, ...il.ids])]
    else lists.push(il)
  }
  const have = new Set(lib.diary.map((d) => `${d.movieId}|${d.date}`))
  return {
    ...lib,
    lists,
    mine: { ...inc.mine, ...lib.mine },
    diary: [...lib.diary, ...inc.diary.filter((d) => !have.has(`${d.movieId}|${d.date}`))],
    cache: { ...inc.cache, ...lib.cache },
  }
}

// ---------- CSV ----------
const csvCell = (v) => {
  let s = String(v ?? '')
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}` // neutralise spreadsheet formulas
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
const csvLine = (cells) => cells.map(csvCell).join(',')

export function listsToCSV(lib) {
  const rows = [csvLine(['list', 'title', 'year', 'id', 'my_rating'])]
  for (const l of lib.lists) {
    for (const id of l.ids) {
      const m = resolveMovie(lib, id)
      rows.push(csvLine([l.name, m?.title ?? id, m?.year ?? '', id, lib.mine[id]?.rating ?? '']))
    }
  }
  return rows.join('\n')
}
export function diaryToCSV(lib) {
  const rows = [csvLine(['date', 'title', 'year', 'id', 'rating', 'note'])]
  for (const d of sortedDiary(lib.diary)) {
    const m = resolveMovie(lib, d.movieId)
    rows.push(csvLine([d.date, m?.title ?? d.movieId, m?.year ?? '', d.movieId, lib.mine[d.movieId]?.rating ?? '', d.note]))
  }
  return rows.join('\n')
}

export function parseCSV(text) {
  const rows = []
  let row = []
  let cell = ''
  let q = false
  const raw = String(text)
  const s = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (q) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          cell += '"'
          i++
        } else q = false
      } else cell += c
    } else if (c === '"') q = true
    else if (c === ',') {
      row.push(cell)
      cell = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++
      row.push(cell)
      cell = ''
      if (row.some((x) => x !== '')) rows.push(row)
      row = []
    } else cell += c
  }
  row.push(cell)
  if (row.some((x) => x !== '')) rows.push(row)
  return rows
}

// Imports either CSV flavour produced above. Titles are matched against `catalog` and saved live titles.
export function importCSV(lib, text, catalog) {
  const rows = parseCSV(text)
  if (rows.length < 2) throw new Error('The CSV file has no rows.')
  const head = rows[0].map((h) => norm(h))
  const col = (n) => head.indexOf(n)
  const isDiary = col('date') >= 0
  if (!isDiary && col('list') < 0) throw new Error('Expected a "list" or "date" column.')
  if (col('title') < 0 && col('id') < 0) throw new Error('Expected a "title" or "id" column.')
  const known = [...catalog, ...Object.values(lib.cache)]
  const find = (id, title, year) => {
    const byId = id && (resolveMovie(lib, id) || known.find((m) => m.id === id))
    if (byId) return byId
    const t = norm(title)
    return known.find((m) => norm(m.title) === t && (!year || String(m.year) === String(year).trim())) || null
  }
  let next = lib
  let added = 0
  let skipped = 0
  for (const r of rows.slice(1)) {
    const get = (n) => (col(n) >= 0 ? (r[col(n)] ?? '').trim() : '')
    const m = find(get('id'), get('title'), get('year'))
    if (!m) {
      skipped++
      continue
    }
    if (isDiary) {
      if (!next.diary.some((d) => d.movieId === m.id && d.date === get('date'))) {
        next = addDiary(next, m, get('date'), get('note').replace(/^'(?=[=+\-@])/, ''))
      }
      if (get('rating')) next = setRating(next, m.id, get('rating'))
    } else {
      const name = get('list')
      let l = next.lists.find((x) => norm(x.name) === norm(name))
      if (!l) {
        next = createList(next, name)
        l = next.lists.find((x) => norm(x.name) === norm(name))
      }
      if (l) next = addToList(next, l.id, m)
      if (get('my_rating')) next = setRating(next, m.id, get('my_rating'))
    }
    added++
  }
  return { lib: next, added, skipped }
}

// ---------- share links ----------
const b64 = {
  enc: (s) =>
    btoa(String.fromCharCode(...new TextEncoder().encode(s)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, ''),
  dec: (s) => {
    const t = s.replace(/-/g, '+').replace(/_/g, '/')
    const bin = atob(t + '='.repeat((4 - (t.length % 4)) % 4))
    return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))
  },
}
export const encodeShare = (name, ids) => b64.enc(JSON.stringify({ n: cleanName(name), i: ids }))
export function decodeShare(token) {
  try {
    const d = JSON.parse(b64.dec(String(token)))
    const ids = (Array.isArray(d.i) ? d.i : []).map(String).filter((x) => ID_RE.test(x)).slice(0, 200)
    const name = cleanName(d.n) || 'Shared list'
    return ids.length ? { name, ids } : null
  } catch {
    return null
  }
}

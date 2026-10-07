import { classifyOmdbError, parseYear } from './logic.js'

const ENDPOINT = 'https://www.omdbapi.com/'

// A key from the environment is only honoured outside the public "pages" build,
// so it can never be embedded in the published site.
export const ENV_KEY =
  import.meta.env.MODE === 'pages' ? '' : String(import.meta.env.VITE_OMDB_KEY || '').trim()

export class OmdbError extends Error {
  constructor(kind, message) {
    super(message)
    this.kind = kind
  }
}

export const ERROR_COPY = {
  'invalid-key': 'That OMDb API key was not accepted. Check it in Settings, or switch back to demo data.',
  'rate-limit': 'The OMDb daily request limit has been reached for this key. Try again tomorrow, use another key, or switch to demo data.',
  network: 'Could not reach OMDb. Check your connection and try again.',
  'too-many': 'Too many results. Type a longer part of the title to narrow it down.',
  api: 'OMDb returned an unexpected error. Please try again.',
}

async function request(params, { key, signal }) {
  const url = `${ENDPOINT}?${new URLSearchParams({ apikey: key, ...params })}`
  let res
  try {
    res = await fetch(url, { signal })
  } catch (e) {
    if (e.name === 'AbortError') throw e
    throw new OmdbError('network', ERROR_COPY.network)
  }
  let data = null
  try {
    data = await res.json()
  } catch {
    data = null
  }
  if (data && data.Response === 'False') {
    const kind = classifyOmdbError(data.Error, res.status)
    throw new OmdbError(kind, data.Error || ERROR_COPY.api)
  }
  if (!res.ok || !data) {
    throw new OmdbError(classifyOmdbError('', res.status), `Request failed (${res.status})`)
  }
  return data
}

const clean = (v) => (v && v !== 'N/A' ? v : null)
const list = (v) => (clean(v) ? v.split(',').map((s) => s.trim()) : [])

export function fromSearchItem(item) {
  return {
    id: item.imdbID,
    source: 'omdb',
    type: item.Type,
    title: item.Title,
    year: parseYear(item.Year),
    yearLabel: item.Year,
    poster: clean(item.Poster),
    genres: [],
    rating: null,
    runtime: null,
    director: null,
    cast: [],
    plot: null,
    ratings: [],
    detailed: false,
  }
}

export function fromDetails(d) {
  const rating = parseFloat(d.imdbRating)
  return {
    id: d.imdbID,
    source: 'omdb',
    type: d.Type,
    title: d.Title,
    year: parseYear(d.Year),
    yearLabel: d.Year,
    poster: clean(d.Poster),
    genres: list(d.Genre),
    rating: Number.isFinite(rating) ? rating : null,
    runtime: parseInt(d.Runtime, 10) || null,
    rated: clean(d.Rated),
    director: clean(d.Director),
    cast: list(d.Actors),
    plot: clean(d.Plot),
    ratings: Array.isArray(d.Ratings) ? d.Ratings.map((r) => ({ source: r.Source, value: r.Value })) : [],
    detailed: true,
  }
}

export async function searchOmdb({ key, query, page = 1, type = '', year = '', signal }) {
  const params = { s: query, page: String(page) }
  if (type) params.type = type
  if (/^\d{4}$/.test(year)) params.y = year
  try {
    const data = await request(params, { key, signal })
    return { items: data.Search.map(fromSearchItem), total: Number(data.totalResults) || data.Search.length }
  } catch (e) {
    if (e.kind === 'not-found') return { items: [], total: 0 }
    throw e
  }
}

export async function getOmdbDetails({ key, id, signal }) {
  return fromDetails(await request({ i: id, plot: 'full' }, { key, signal }))
}

// Resolves when the key works; throws an OmdbError describing why not.
export async function validateKey(key, signal) {
  await request({ i: 'tt0111161' }, { key, signal })
  return true
}

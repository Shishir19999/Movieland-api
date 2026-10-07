import { test } from 'vitest'
import assert from 'node:assert/strict'
import { CATALOG } from '../data/movies.js'
import {
  filterMovies,
  sortMovies,
  paginate,
  suggestTitles,
  addRecent,
  toggleById,
  classifyOmdbError,
  trailerUrl,
  parseYear,
} from './logic.js'

test('catalogue is complete and unique', () => {
  assert.ok(CATALOG.length >= 60)
  assert.equal(new Set(CATALOG.map((m) => m.id)).size, CATALOG.length)
  for (const m of CATALOG) {
    assert.ok(m.title && m.year && m.genres.length && m.cast.length && m.plot)
  }
})

test('filter by query, genre, decade and rating', () => {
  assert.ok(filterMovies(CATALOG, { query: 'godfather' }).length >= 2)
  assert.ok(filterMovies(CATALOG, { genre: 'Animation' }).every((m) => m.genres.includes('Animation')))
  assert.ok(filterMovies(CATALOG, { decade: '1990' }).every((m) => m.year >= 1990 && m.year < 2000))
  assert.ok(filterMovies(CATALOG, { minRating: '9' }).every((m) => m.rating >= 9))
  assert.equal(filterMovies(CATALOG, { query: 'zzzzqqq' }).length, 0)
  assert.ok(filterMovies(CATALOG, { query: 'nolan' }).length >= 3)
  assert.equal(filterMovies(CATALOG, { query: 'amelie' }).length, 1)
})

test('sorting', () => {
  const byRating = sortMovies(CATALOG, { sort: 'rating' })
  assert.ok(byRating[0].rating >= byRating[1].rating)
  const byYear = sortMovies(CATALOG, { sort: 'year-asc' })
  assert.equal(byYear[0].year, Math.min(...CATALOG.map((m) => m.year)))
  const byTitle = sortMovies(CATALOG, { sort: 'title' })
  assert.ok(byTitle[0].title.localeCompare(byTitle[1].title) <= 0)
  const rel = sortMovies(filterMovies(CATALOG, { query: 'the' }), { sort: 'relevance', query: 'the' })
  assert.ok(rel[0].title.toLowerCase().startsWith('the'))
  assert.notStrictEqual(byTitle, CATALOG)
})

test('pagination', () => {
  const p1 = paginate(CATALOG, 1, 12)
  assert.equal(p1.items.length, 12)
  assert.ok(p1.hasMore)
  const last = paginate(CATALOG, 99, 12)
  assert.equal(last.items.length, CATALOG.length)
  assert.equal(last.hasMore, false)
})

test('suggestions rank prefix matches first', () => {
  const s = suggestTitles(CATALOG, 'the god')
  assert.ok(s[0].startsWith('The Godfather'))
  assert.equal(suggestTitles(CATALOG, '').length, 0)
  assert.ok(suggestTitles(CATALOG, 'a').length <= 6)
})

test('recent searches and saved lists', () => {
  assert.deepEqual(addRecent(['Dune'], 'dune'), ['dune'])
  assert.deepEqual(addRecent(['Dune'], 'a'), ['Dune'])
  assert.equal(addRecent(['1', '2', '3'], 'new', 3).length, 3)
  const m = { id: 'x' }
  assert.equal(toggleById([], m).length, 1)
  assert.equal(toggleById([m], m).length, 0)
})

test('error classification and helpers', () => {
  assert.equal(classifyOmdbError('Invalid API key!'), 'invalid-key')
  assert.equal(classifyOmdbError('Request limit reached!'), 'rate-limit')
  assert.equal(classifyOmdbError('', 401), 'invalid-key')
  assert.equal(classifyOmdbError('Too many results.'), 'too-many')
  assert.equal(classifyOmdbError('Movie not found!'), 'not-found')
  assert.match(trailerUrl('Dune', 2021), /search_query=Dune%202021%20official%20trailer/)
  assert.equal(parseYear('2010–2012'), 2010)
  assert.equal(parseYear('N/A'), null)
})

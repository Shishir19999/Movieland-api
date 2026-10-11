import { test } from 'vitest'
import assert from 'node:assert/strict'
import { CATALOG } from '../data/movies.js'
import { filterMovies, sortMovies } from './logic.js'
import { similarity, similarTo, becauseYouLiked, curatedRows, decadeRow, mulberry32, shuffle, weekSeed, filmographyOf, topPeople, collaborators } from './recommend.js'
import { computeStats } from './stats.js'
import { generateQuiz, maskTitle, QUIZ_MODES } from './quiz.js'
import { nightCandidates, pickShortlist, pickWinner, encodeNight, decodeNight } from './night.js'
import { parseHash, buildHash } from './route.js'

const by = (t) => CATALOG.find((m) => m.title === t)

test('advanced filters: multi genre, year and runtime range, language, status', () => {
  const all = filterMovies(CATALOG, { genres: ['Crime', 'Drama'], genreMode: 'all' })
  assert.ok(all.length && all.every((m) => m.genres.includes('Crime') && m.genres.includes('Drama')))
  const any = filterMovies(CATALOG, { genres: ['Horror', 'Western'], genreMode: 'any' })
  assert.ok(any.length > filterMovies(CATALOG, { genres: ['Horror', 'Western'] }).length)
  const yr = filterMovies(CATALOG, { yearFrom: '1990', yearTo: '1999' })
  assert.ok(yr.length && yr.every((m) => m.year >= 1990 && m.year <= 1999))
  const rt = filterMovies(CATALOG, { minRuntime: '90', maxRuntime: '100' })
  assert.ok(rt.length && rt.every((m) => m.runtime >= 90 && m.runtime <= 100))
  assert.ok(filterMovies(CATALOG, { language: 'Japanese' }).every((m) => m.language === 'Japanese'))
  assert.equal(filterMovies(CATALOG, { language: 'Japanese' }).length, 3)
  const range = filterMovies(CATALOG, { minRating: '8', maxRating: '8.3' })
  assert.ok(range.every((m) => m.rating >= 8 && m.rating <= 8.3))
  const watched = new Set([CATALOG[0].id])
  assert.equal(filterMovies(CATALOG, { status: 'watched', watchedIds: watched }).length, 1)
  assert.equal(filterMovies(CATALOG, { status: 'unwatched', watchedIds: watched }).length, CATALOG.length - 1)
  assert.equal(filterMovies(CATALOG, { yearFrom: '', yearTo: 'abc' }).length, CATALOG.length)
})

test('runtime sorting', () => {
  const s = sortMovies(CATALOG, { sort: 'runtime-asc' })
  assert.ok(s[0].runtime <= s[1].runtime)
  assert.equal(sortMovies(CATALOG, { sort: 'runtime-desc' })[0].runtime, Math.max(...CATALOG.map((m) => m.runtime)))
})

test('similarity favours shared director and genre, never itself', () => {
  const dk = by('The Dark Knight')
  assert.equal(similarity(dk, dk), 0)
  assert.ok(similarity(dk, by('The Prestige')) > similarity(dk, by('Amelie')))
  const top = similarTo(by('The Godfather'), CATALOG, 3)
  assert.equal(top[0].title, 'The Godfather Part II')
  assert.ok(top.every((m) => m.id !== by('The Godfather').id))
})

test('because-you-liked skips seeds and excluded titles', () => {
  const seeds = [by('Inception'), by('Toy Story')]
  const exclude = new Set([by('Interstellar').id])
  const rows = becauseYouLiked(seeds, CATALOG, { exclude })
  assert.ok(rows.length >= 1)
  const ids = rows.flatMap((r) => r.items.map((m) => m.id))
  assert.ok(!ids.includes(by('Inception').id) && !ids.includes(by('Interstellar').id))
  assert.equal(new Set(ids).size, ids.length)
  assert.deepEqual(becauseYouLiked([], CATALOG), [])
})

test('curated rows are non-empty, deterministic per week, and decade rows are in range', () => {
  const d = new Date('2025-03-05')
  const a = curatedRows(CATALOG, d)
  const b = curatedRows(CATALOG, d)
  assert.deepEqual(a.map((r) => r.items.map((m) => m.id)), b.map((r) => r.items.map((m) => m.id)))
  assert.ok(a.every((r) => r.items.length >= 3))
  assert.ok(a.find((r) => r.id === 'short').items.every((m) => m.runtime < 100))
  assert.ok(a.find((r) => r.id === 'gems').items.every((m) => m.rating >= 7.7 && m.rating <= 8.3))
  assert.notEqual(weekSeed(new Date('2025-03-05')), weekSeed(new Date('2025-03-20')))
  assert.ok(decadeRow(CATALOG, 1990).every((m) => m.year >= 1990 && m.year < 2000))
  const r1 = mulberry32(1)
  assert.equal(r1(), mulberry32(1)())
  assert.deepEqual([...shuffle([1, 2, 3, 4], mulberry32(3))].sort(), [1, 2, 3, 4])
})

test('stats aggregate genres, decades, hours and ratings', () => {
  const watched = [by('The Godfather'), by('Pulp Fiction'), by('Toy Story')]
  const st = computeStats(
    {
      watched,
      mine: { [watched[0].id]: { rating: 5 }, [watched[1].id]: { rating: 4 } },
      diary: [{ id: 'a', movieId: watched[0].id, date: '2025-02-10' }, { id: 'b', movieId: watched[1].id, date: '2024-01-01' }],
    },
    new Date('2025-03-15'),
  )
  assert.equal(st.films, 3)
  assert.equal(st.minutes, 175 + 154 + 81)
  assert.equal(st.hours, 6.8)
  assert.equal(st.avgRating, 4.5)
  assert.equal(st.genres[0].label, 'Crime')
  assert.deepEqual(st.decades.map((d) => d.label), ['1970s', '1990s'])
  assert.equal(st.decades[1].value, 2)
  assert.equal(st.byMonth.length, 12)
  assert.equal(st.byMonth.find((m) => m.key === '2025-02').value, 1)
  assert.equal(st.ratingDist[4].value, 1)
  assert.equal(st.longest.title, 'The Godfather')
  assert.equal(st.shortest.title, 'Toy Story')
  const empty = computeStats({ watched: [] })
  assert.equal(empty.avgRating, null)
  assert.equal(empty.films, 0)
})

test('quiz questions always have exactly one correct, distinct option', () => {
  for (const [mode] of QUIZ_MODES) {
    const qs = generateQuiz(CATALOG, { rounds: 8, mode, rng: mulberry32(7) })
    assert.ok(qs.length >= 5, mode)
    for (const q of qs) {
      assert.ok(q.options.includes(q.answer))
      assert.equal(new Set(q.options).size, q.options.length)
    }
  }
  const year = generateQuiz(CATALOG, { rounds: 5, mode: 'year', rng: mulberry32(2) })[0]
  const years = year.options.map((t) => CATALOG.find((m) => m.title === t).year)
  assert.equal(CATALOG.find((m) => m.title === year.answer).year, Math.min(...years))
  assert.equal(maskTitle('Dune is about Dune and sand', 'Dune'), '____ is about ____ and sand')
  assert.deepEqual(
    generateQuiz(CATALOG, { rounds: 4, rng: mulberry32(9) }).map((q) => q.answer),
    generateQuiz(CATALOG, { rounds: 4, rng: mulberry32(9) }).map((q) => q.answer),
  )
})

test('movie night honours constraints and share links round trip', () => {
  const c = nightCandidates(CATALOG, { maxRuntime: '110', genre: 'Comedy', minRating: '8' })
  assert.ok(c.length && c.every((m) => m.runtime <= 110 && m.genres.includes('Comedy') && m.rating >= 8))
  const ex = nightCandidates(CATALOG, { excludeIds: new Set(c.map((m) => m.id)), genre: 'Comedy', maxRuntime: '110', minRating: '8' })
  assert.equal(ex.length, 0)
  const list = pickShortlist(CATALOG, 3, mulberry32(4))
  assert.equal(list.length, 3)
  const win = pickWinner(list, mulberry32(5))
  assert.ok(list.includes(win))
  assert.equal(pickWinner([]), null)
  const q = Object.fromEntries(new URLSearchParams(encodeNight(list, win)))
  assert.deepEqual(decodeNight(q), { ids: list.map((m) => m.id), winner: win.id })
  assert.deepEqual(decodeNight({ p: '<x>,ok', w: '../' }), { ids: ['ok'], winner: null })
})

test('routes parse and build', () => {
  assert.equal(parseHash('').name, 'home')
  assert.equal(parseHash('#/').name, 'home')
  assert.deepEqual(parseHash('#/browse?genre=Drama&sort=rating').query, { genre: 'Drama', sort: 'rating' })
  assert.deepEqual(parseHash('#/person/Christopher%20Nolan'), { name: 'person', arg: 'Christopher Nolan', query: {} })
  assert.equal(parseHash('#/m/s-the-godfather').arg, 's-the-godfather')
  assert.equal(parseHash('#/m/demo-x').name, 'movie')
  assert.equal(parseHash('#/nope').name, 'notfound')
  assert.equal(parseHash('#/person/%E0%A4%A').name, 'person')
  assert.equal(buildHash('person', { arg: 'A B' }), '#/person/A%20B')
  assert.equal(buildHash('browse', { query: { q: 'x', genre: '' } }), '#/browse?q=x')
  assert.equal(buildHash('home'), '#/')
})

test('people: filmography, top directors and collaborators', () => {
  const nolan = filmographyOf('Christopher Nolan', CATALOG)
  assert.ok(nolan.length >= 4 && nolan.every((f) => f.roles.includes('Director')))
  assert.ok(nolan.every((f, i) => i === 0 || nolan[i - 1].movie.year >= f.movie.year))
  const co = filmographyOf('Co-director check', CATALOG)
  assert.equal(co.length, 0)
  assert.ok(filmographyOf('al pacino', CATALOG).every((f) => f.roles.includes('Actor')))
  assert.ok(filmographyOf('Lana Wachowski', CATALOG).length === 1)
  const top = topPeople(CATALOG, 'director', 2, 5)
  assert.equal(top[0].name, 'Christopher Nolan')
  assert.ok(top.every((p) => p.count >= 2))
  assert.ok(collaborators('Christopher Nolan', CATALOG).some((c) => c.name === 'Christian Bale'))
})

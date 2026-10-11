import { test } from 'vitest'
import assert from 'node:assert/strict'
import { CATALOG } from '../data/movies.js'
import {
  emptyLibrary,
  addToList,
  removeFromList,
  toggleInList,
  moveInList,
  createList,
  renameList,
  deleteList,
  setRating,
  setNote,
  addDiary,
  updateDiary,
  removeDiary,
  sortedDiary,
  pruneCache,
  sanitizeLibrary,
  migrateLegacy,
  exportJSON,
  importJSON,
  listsToCSV,
  diaryToCSV,
  parseCSV,
  importCSV,
  encodeShare,
  decodeShare,
  resolveMovie,
} from './library.js'

const [A, B, C] = CATALOG
const live = { id: 'tt0000001', source: 'omdb', title: 'Live Film', year: 2001, genres: ['Drama'], cast: [], poster: 'https://x.test/p.jpg' }

test('system lists exist and cannot be deleted or renamed', () => {
  let lib = emptyLibrary()
  assert.deepEqual(lib.lists.map((l) => l.id), ['watchlist', 'favorites', 'watched'])
  lib = deleteList(lib, 'watchlist')
  assert.equal(lib.lists.length, 3)
  assert.equal(renameList(lib, 'watched', 'Seen').lists[2].name, 'Watched')
})

test('add, toggle, remove and reorder', () => {
  let lib = emptyLibrary()
  lib = addToList(lib, 'watchlist', A)
  lib = addToList(lib, 'watchlist', B)
  lib = addToList(lib, 'watchlist', A)
  assert.deepEqual(lib.lists[0].ids, [B.id, A.id])
  lib = addToList(lib, 'watchlist', C)
  lib = moveInList(lib, 'watchlist', 0, 2)
  assert.deepEqual(lib.lists[0].ids, [B.id, A.id, C.id])
  assert.deepEqual(moveInList(lib, 'watchlist', 0, 9).lists[0].ids, lib.lists[0].ids)
  lib = toggleInList(lib, 'watchlist', A)
  assert.ok(!lib.lists[0].ids.includes(A.id))
  lib = removeFromList(lib, 'watchlist', B.id)
  assert.deepEqual(lib.lists[0].ids, [C.id])
})

test('custom lists: create, reject duplicates, rename, delete', () => {
  let lib = createList(emptyLibrary(), '  Horror   night ', 'l1')
  assert.equal(lib.lists[3].name, 'Horror night')
  assert.equal(createList(lib, 'horror NIGHT', 'l2').lists.length, 4)
  assert.equal(createList(lib, '   ', 'l3').lists.length, 4)
  lib = renameList(lib, 'l1', 'Scary')
  assert.equal(lib.lists[3].name, 'Scary')
  lib = deleteList(lib, 'l1')
  assert.equal(lib.lists.length, 3)
})

test('ratings and notes', () => {
  let lib = setRating(emptyLibrary(), A.id, 4.4)
  assert.equal(lib.mine[A.id].rating, 4)
  lib = setNote(lib, A.id, 'Great ending')
  assert.equal(lib.mine[A.id].note, 'Great ending')
  lib = setRating(lib, A.id, 0)
  assert.equal(lib.mine[A.id].rating, undefined)
  lib = setNote(lib, A.id, '  ')
  assert.equal(lib.mine[A.id], undefined)
  assert.equal(setRating(emptyLibrary(), A.id, 9).mine[A.id], undefined)
})

test('diary logs viewings, marks watched, edits and sorts', () => {
  let lib = addDiary(emptyLibrary(), A, '2024-03-02', 'rewatch', 'd1')
  lib = addDiary(lib, B, '2024-05-10', '', 'd2')
  lib = addDiary(lib, A, 'not-a-date', '', 'd3')
  assert.ok(lib.lists[2].ids.includes(A.id) && lib.lists[2].ids.includes(B.id))
  assert.equal(lib.diary.length, 3)
  assert.equal(sortedDiary(lib.diary)[0].id, 'd3')
  lib = updateDiary(lib, 'd1', { date: '2023-01-01', note: 'x' })
  assert.equal(lib.diary.find((d) => d.id === 'd1').date, '2023-01-01')
  lib = updateDiary(lib, 'd1', { date: 'bad' })
  assert.equal(lib.diary.find((d) => d.id === 'd1').date, '2023-01-01')
  lib = removeDiary(lib, 'd2')
  assert.equal(lib.diary.length, 2)
})

test('live titles are cached once and pruned when unused', () => {
  let lib = addToList(emptyLibrary(), 'watchlist', live)
  assert.equal(resolveMovie(lib, live.id).title, 'Live Film')
  assert.equal(resolveMovie(lib, A.id).id, A.id)
  assert.equal(resolveMovie(lib, 'demo-the-godfather').title, 'The Godfather')
  lib = removeFromList(lib, 'watchlist', live.id)
  assert.equal(Object.keys(pruneCache(lib).cache).length, 0)
})

test('sanitize drops hostile or malformed data', () => {
  const lib = sanitizeLibrary({
    lists: [
      { id: 'watchlist', ids: ['a', 'a', '<script>', 'b'] },
      { id: 'x1', name: 'Mine', ids: ['c'] },
      { id: 'x2', name: 'mine', ids: ['d'] },
      { id: 'x3', name: 'Watchlist', ids: [] },
      { id: '../bad', name: 'Bad', ids: [] },
    ],
    mine: { a: { rating: 7, note: 'ok' }, b: { rating: 3 }, '<x>': { rating: 1 } },
    diary: [{ id: 'd', movieId: 'a', date: '2024-01-01' }, { id: 'd', movieId: 'a', date: '2024-02-30x' }, { movieId: 'b', date: '2024-02-01' }],
    cache: { z: { title: 'Z', poster: 'javascript:alert(1)' }, y: 'nope' },
  })
  assert.deepEqual(lib.lists[0].ids, ['a', 'b'])
  assert.equal(lib.lists.length, 4)
  assert.equal(lib.mine.a.rating, undefined)
  assert.equal(lib.mine.a.note, 'ok')
  assert.equal(lib.mine.b.rating, 3)
  assert.equal(lib.diary.length, 2)
  assert.equal(lib.cache.z.poster, null)
  assert.equal(lib.cache.y, undefined)
  assert.equal(sanitizeLibrary(null).lists.length, 3)
})

test('legacy favorites and watchlist migrate', () => {
  const lib = migrateLegacy([A, { nope: 1 }], [live])
  assert.deepEqual(lib.lists[1].ids, [A.id])
  assert.deepEqual(lib.lists[0].ids, [live.id])
  assert.ok(lib.cache[live.id])
})

test('JSON export/import round trip, merge and replace', () => {
  let lib = addDiary(addToList(createList(emptyLibrary(), 'Picks', 'p'), 'p', A), A, '2024-01-01', 'n', 'd1')
  lib = setRating(lib, A.id, 5)
  const text = exportJSON(lib)
  assert.deepEqual(importJSON(emptyLibrary(), text, 'replace').mine, lib.mine)
  const base = addToList(emptyLibrary(), 'watchlist', B)
  const merged = importJSON(base, text, 'merge')
  assert.ok(merged.lists[0].ids.includes(B.id))
  assert.ok(merged.lists.find((l) => l.name === 'Picks').ids.includes(A.id))
  assert.equal(merged.diary.length, 1)
  assert.equal(importJSON(merged, text, 'merge').diary.length, 1)
  assert.throws(() => importJSON(base, 'nope'), /valid JSON/)
  assert.throws(() => importJSON(base, '{"a":1}'), /backup/)
})

test('CSV export neutralises formulas, parses quotes, and imports by title', () => {
  assert.deepEqual(parseCSV('a,b\n"x, y","he said ""hi"""\r\n1,2'), [['a', 'b'], ['x, y', 'he said "hi"'], ['1', '2']])
  let lib = addDiary(addToList(emptyLibrary(), 'favorites', A), A, '2024-01-01', '=HYPERLINK("x")', 'd1')
  lib = setRating(lib, A.id, 4)
  const diaryCsv = diaryToCSV(lib)
  assert.match(diaryCsv, /'=HYPERLINK/)
  const back = importCSV(emptyLibrary(), diaryCsv, CATALOG)
  assert.equal(back.added, 1)
  assert.equal(back.lib.diary[0].note, '=HYPERLINK("x")')
  assert.equal(back.lib.mine[A.id].rating, 4)
  const listCsv = listsToCSV(lib)
  const l2 = importCSV(emptyLibrary(), `${listCsv}\nMy list,Not A Movie,1999,,`, CATALOG)
  assert.equal(l2.skipped, 1)
  assert.ok(l2.lib.lists.find((l) => l.name === 'Favorites').ids.includes(A.id))
  const byTitle = importCSV(emptyLibrary(), 'list,title,year\nRoad trip,The Godfather,1972', CATALOG)
  assert.equal(byTitle.lib.lists.find((l) => l.name === 'Road trip').ids[0], CATALOG.find((m) => m.title === 'The Godfather').id)
  assert.throws(() => importCSV(emptyLibrary(), 'x,y\n1,2', CATALOG), /column/)
})

test('share tokens round trip unicode and reject junk', () => {
  const t = encodeShare('Café nights ✨', [A.id, B.id])
  assert.deepEqual(decodeShare(t), { name: 'Café nights ✨', ids: [A.id, B.id] })
  assert.equal(decodeShare('%%%'), null)
  assert.equal(decodeShare(encodeShare('x', [])), null)
})

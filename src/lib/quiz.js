// Guess-the-movie questions built from catalogue metadata.
import { shuffle } from './recommend.js'

export const QUIZ_MODES = [
  ['mixed', 'Mixed'],
  ['plot', 'Guess from the plot'],
  ['cast', 'Guess from the cast'],
  ['director', 'Who directed it?'],
  ['year', 'Which came first?'],
  ['rating', 'Which is rated highest?'],
]

const pick = (arr, rng) => arr[Math.floor(rng() * arr.length)]

// Hides the title (and its long words) inside a plot so it does not give itself away.
export function maskTitle(text, title) {
  let out = String(text)
  const words = String(title).split(/[^A-Za-z0-9']+/).filter((w) => w.length > 3)
  for (const w of [title, ...words]) {
    out = out.replace(new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi'), '____')
  }
  return out
}

function build(type, pool, rng) {
  const target = pick(pool, rng)
  const others = shuffle(pool.filter((m) => m.id !== target.id), rng)
  if (type === 'plot') {
    return {
      type,
      prompt: 'Which film is this?',
      clue: maskTitle(target.plot, target.title),
      options: shuffle([target, ...others.slice(0, 3)], rng).map((m) => m.title),
      answer: target.title,
      movieId: target.id,
    }
  }
  if (type === 'cast') {
    return {
      type,
      prompt: 'Which film stars these actors?',
      clue: target.cast.slice(0, 3).join(', '),
      options: shuffle([target, ...others.slice(0, 3)], rng).map((m) => m.title),
      answer: target.title,
      movieId: target.id,
    }
  }
  if (type === 'director') {
    const dirs = [...new Set(others.map((m) => m.director).filter((d) => d && d !== target.director))].slice(0, 3)
    return {
      type,
      prompt: `Who directed ${target.title}?`,
      clue: `${target.year}, ${target.genres.join(' / ')}`,
      options: shuffle([target.director, ...dirs], rng),
      answer: target.director,
      movieId: target.id,
    }
  }
  const key = type === 'year' ? 'year' : 'rating'
  const better = type === 'year' ? (a, b) => a < b : (a, b) => a > b
  // four films with distinct values so exactly one answer is correct
  const chosen = []
  for (const m of shuffle(pool, rng)) {
    if (chosen.every((c) => c[key] !== m[key])) chosen.push(m)
    if (chosen.length === 4) break
  }
  const win = chosen.reduce((a, m) => (better(m[key], a[key]) ? m : a))
  return {
    type,
    prompt: type === 'year' ? 'Which of these was released first?' : 'Which of these has the highest IMDb rating?',
    clue: '',
    options: chosen.map((m) => m.title),
    answer: win.title,
    movieId: win.id,
  }
}

export function generateQuiz(pool, { rounds = 10, mode = 'mixed', rng = Math.random } = {}) {
  const types = mode === 'mixed' ? ['plot', 'cast', 'director', 'year', 'rating'] : [mode]
  const out = []
  const used = new Set()
  let guard = 0
  while (out.length < rounds && guard++ < rounds * 20) {
    const q = build(pick(types, rng), pool, rng)
    const key = `${q.type}|${q.answer}`
    if (used.has(key) || new Set(q.options).size !== q.options.length || q.options.length < 2) continue
    used.add(key)
    out.push(q)
  }
  return out
}

export const gradeLabel = (score, total) => {
  const p = total ? score / total : 0
  return p === 1 ? 'Perfect score. Film buff!' : p >= 0.8 ? 'Excellent' : p >= 0.5 ? 'Nicely done' : 'Time for a marathon'
}

import { useEffect, useRef, useState } from 'react'
import { CATALOG } from '../data/movies.js'
import { QUIZ_MODES, generateQuiz, gradeLabel } from '../lib/quiz.js'
import { useLocalStorage } from '../hooks.js'
import { useApp } from '../context.jsx'
import Poster from '../components/Poster.jsx'

const ROUNDS = 10

export default function Quiz() {
  const { openMovie } = useApp()
  const [best, setBest] = useLocalStorage('ml:quiz-best', {})
  const [mode, setMode] = useState('mixed')
  const [game, setGame] = useState(null) // {questions, index, score, picked, streak, maxStreak}
  const headRef = useRef(null)

  const start = () =>
    setGame({ questions: generateQuiz(CATALOG, { rounds: ROUNDS, mode }), index: 0, score: 0, picked: null, streak: 0, maxStreak: 0 })
  const q = game && game.questions[game.index]
  const done = !!game && game.index >= game.questions.length

  const answer = (opt) => {
    if (!game || game.picked != null || !q) return
    const ok = opt === q.answer
    const streak = ok ? game.streak + 1 : 0
    setGame({ ...game, picked: opt, score: game.score + (ok ? 1 : 0), streak, maxStreak: Math.max(game.maxStreak, streak) })
  }
  const next = () => setGame((g) => ({ ...g, index: g.index + 1, picked: null }))

  useEffect(() => {
    if (done && game.score > (best[mode] || 0)) setBest({ ...best, [mode]: game.score })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done])

  useEffect(() => {
    if (game) headRef.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.index, done])

  // number keys pick an option, Enter moves on
  useEffect(() => {
    if (!game || done || !q) return
    const on = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.target.tagName === 'SELECT') return
      const n = Number(e.key)
      if (game.picked == null && n >= 1 && n <= q.options.length) answer(q.options[n - 1])
      else if (game.picked != null && e.key === 'Enter' && e.target.tagName !== 'BUTTON') next()
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  })

  const movie = q && CATALOG.find((m) => m.id === q.movieId)

  return (
    <div className="page quiz">
      <h1 id="page-title" tabIndex={-1}>
        Guess the movie
      </h1>
      {!game && (
        <section className="card-form" aria-labelledby="start-h">
          <h2 id="start-h">Ten questions, four answers each</h2>
          <p className="muted">
            Questions come from the sample catalogue: plots, casts, directors, release years and ratings. Press 1 to 4 to answer.
          </p>
          <label className="field">
            <span>Question type</span>
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              {QUIZ_MODES.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          {best[mode] != null && (
            <p className="muted">
              Your best in this mode: {best[mode]} of {ROUNDS}
            </p>
          )}
          <div className="dialog-actions">
            <button type="button" className="btn btn-primary" onClick={start}>
              Start quiz
            </button>
          </div>
        </section>
      )}

      {game && !done && q && (
        <section aria-labelledby="q-h" className="card-form">
          <p className="muted" role="status">
            Question {game.index + 1} of {game.questions.length} · Score {game.score}
            {game.streak > 1 ? ` · Streak ${game.streak}` : ''}
          </p>
          <h2 id="q-h" ref={headRef} tabIndex={-1}>
            {q.prompt}
          </h2>
          {q.clue && <blockquote className="clue">{q.clue}</blockquote>}
          <ol className="options">
            {q.options.map((o, i) => {
              const state = game.picked == null ? '' : o === q.answer ? 'right' : o === game.picked ? 'wrong' : ''
              return (
                <li key={o}>
                  <button
                    type="button"
                    className={`btn option ${state}`}
                    disabled={game.picked != null}
                    aria-keyshortcuts={String(i + 1)}
                    onClick={() => answer(o)}
                  >
                    <span className="opt-key" aria-hidden="true">
                      {i + 1}
                    </span>
                    {o}
                    {state === 'right' && <span className="sr-only"> (correct)</span>}
                    {state === 'wrong' && <span className="sr-only"> (your answer, incorrect)</span>}
                  </button>
                </li>
              )
            })}
          </ol>
          {game.picked != null && (
            <div className="reveal-answer" role="status">
              <p>
                <strong>{game.picked === q.answer ? 'Correct!' : `Not quite. The answer is ${q.answer}.`}</strong>
              </p>
              {movie && (
                <div className="answer-film">
                  <Poster movie={movie} className="thumb" />
                  <button type="button" className="link-btn" onClick={() => openMovie(movie)}>
                    About {movie.title}
                  </button>
                </div>
              )}
              <button type="button" className="btn btn-primary" onClick={next} autoFocus>
                {game.index + 1 >= game.questions.length ? 'See my score' : 'Next question'}
              </button>
            </div>
          )}
        </section>
      )}

      {done && (
        <section aria-labelledby="done-h" className="card-form">
          <h2 id="done-h" ref={headRef} tabIndex={-1}>
            You scored {game.score} of {game.questions.length}
          </h2>
          <p className="lead">
            {gradeLabel(game.score, game.questions.length)} Longest streak: {game.maxStreak}. Best in this mode:{' '}
            {Math.max(best[mode] || 0, game.score)}.
          </p>
          <div className="dialog-actions">
            <button type="button" className="btn btn-primary" onClick={start}>
              Play again
            </button>
            <button type="button" className="btn" onClick={() => setGame(null)}>
              Change mode
            </button>
          </div>
        </section>
      )}
    </div>
  )
}

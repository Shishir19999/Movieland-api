import { useMemo, useState } from 'react'
import { CATALOG } from '../data/movies.js'
import { useApp, useLib } from '../context.jsx'
import { diaryToCSV, isoDate, removeDiary, setRating, sortedDiary, updateDiary, addDiary } from '../lib/library.js'
import { download } from '../lib/file.js'
import { remember } from '../registry.js'
import Icon from '../components/Icon.jsx'
import Poster from '../components/Poster.jsx'
import { StarInput, StarsStatic } from '../components/Stars.jsx'
import { EmptyState } from '../components/States.jsx'

const monthLabel = (key) => new Date(`${key}-01T12:00:00`).toLocaleString('en', { month: 'long', year: 'numeric' })

export default function Diary() {
  const { lib, setLib, get, say } = useLib()
  const { openMovie } = useApp()
  const [year, setYear] = useState('')
  const [form, setForm] = useState({ id: '', date: isoDate(), rating: 0, note: '' })

  const options = useMemo(() => {
    const extra = Object.values(lib.cache)
    return [...CATALOG, ...extra].sort((a, b) => a.title.localeCompare(b.title))
  }, [lib.cache])
  const entries = useMemo(() => sortedDiary(lib.diary), [lib.diary])
  const years = useMemo(() => [...new Set(entries.map((e) => e.date.slice(0, 4)))], [entries])
  const shown = entries.filter((e) => !year || e.date.startsWith(year))
  const groups = useMemo(() => {
    const out = []
    for (const e of shown) {
      const key = e.date.slice(0, 7)
      const last = out[out.length - 1]
      if (last && last.key === key) last.items.push(e)
      else out.push({ key, items: [e] })
    }
    return out
  }, [shown])

  const submit = (e) => {
    e.preventDefault()
    const movie = get(form.id)
    if (!movie) return say('Choose a film first')
    remember(movie)
    setLib((l) => {
      let next = addDiary(l, movie, form.date, form.note)
      if (form.rating) next = setRating(next, movie.id, form.rating)
      return next
    })
    say(`Logged ${movie.title}`)
    setForm({ id: '', date: isoDate(), rating: 0, note: '' })
  }

  return (
    <div className="page">
      <h1 id="page-title" tabIndex={-1}>
        Diary
      </h1>
      <p className="lead">A dated log of what you watched. Logging a film also adds it to your Watched list.</p>

      <form className="card-form" onSubmit={submit} aria-labelledby="log-h">
        <h2 id="log-h">Log a viewing</h2>
        <div className="form-grid">
          <label className="field">
            <span>Film</span>
            <select value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} required>
              <option value="">Choose a film</option>
              {options.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({m.year})
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Date watched</span>
            <input type="date" value={form.date} max={isoDate()} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          </label>
          <label className="field wide">
            <span>Note (optional)</span>
            <input value={form.note} maxLength={200} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Where, with whom, what you thought" />
          </label>
        </div>
        <StarInput value={form.rating} onChange={(r) => setForm({ ...form, rating: r })} legend="Rating (optional)" />
        <div className="dialog-actions">
          <button type="submit" className="btn btn-primary">
            <Icon name="plus" size={16} /> Add to diary
          </button>
        </div>
      </form>

      <section aria-labelledby="entries-h" className="diary-entries">
        <div className="results-head">
          <h2 id="entries-h">Your viewings</h2>
          <div className="list-actions">
            {years.length > 1 && (
              <label className="field inline-field">
                <span>Year</span>
                <select value={year} onChange={(e) => setYear(e.target.value)}>
                  <option value="">All years</option>
                  {years.map((y) => (
                    <option key={y}>{y}</option>
                  ))}
                </select>
              </label>
            )}
            <button type="button" className="btn" disabled={!entries.length} onClick={() => download('movieland-diary.csv', diaryToCSV(lib), 'text/csv')}>
              <Icon name="download" size={16} /> Export CSV
            </button>
          </div>
        </div>
        {shown.length === 0 ? (
          <EmptyState title="No viewings yet">Log a film above, or tap the eye on any movie card.</EmptyState>
        ) : (
          groups.map((g) => (
            <section key={g.key} aria-labelledby={`m-${g.key}`}>
              <h3 id={`m-${g.key}`} className="month-h">
                {monthLabel(g.key)}
              </h3>
              <ul className="diary-list">
                {g.items.map((e) => {
                  const m = get(e.movieId)
                  return (
                    <li key={e.id} className="diary-item">
                      {m ? <Poster movie={m} className="thumb" /> : <span className="thumb" />}
                      <div className="row-main">
                        <button type="button" className="row-title" onClick={() => m && openMovie(m)}>
                          {m ? m.title : e.movieId}
                        </button>
                        <StarsStatic value={lib.mine[e.movieId]?.rating} />
                        <div className="inline-form">
                          <label className="sr-only" htmlFor={`dd-${e.id}`}>
                            Date for {m?.title}
                          </label>
                          <input id={`dd-${e.id}`} type="date" value={e.date} max={isoDate()} onChange={(ev) => ev.target.value && setLib((l) => updateDiary(l, e.id, { date: ev.target.value }))} />
                          <label className="sr-only" htmlFor={`dn-${e.id}`}>
                            Note for {m?.title}
                          </label>
                          <input id={`dn-${e.id}`} className="grow" value={e.note} maxLength={200} placeholder="Add a note" onChange={(ev) => setLib((l) => updateDiary(l, e.id, { note: ev.target.value }))} />
                        </div>
                      </div>
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label={`Delete viewing of ${m?.title ?? e.movieId} on ${e.date}`}
                        onClick={() => {
                          setLib((l) => removeDiary(l, e.id))
                          say('Viewing removed')
                        }}
                      >
                        <Icon name="trash" size={18} />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))
        )}
      </section>
    </div>
  )
}

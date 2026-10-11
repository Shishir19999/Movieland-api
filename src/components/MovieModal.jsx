import { useEffect, useId, useRef, useState } from 'react'
import Dialog from './Dialog.jsx'
import Icon from './Icon.jsx'
import Poster from './Poster.jsx'
import MovieCard from './MovieCard.jsx'
import { StarInput } from './Stars.jsx'
import { getOmdbDetails } from '../lib/omdb.js'
import { trailerUrl } from '../lib/logic.js'
import { CATALOG } from '../data/movies.js'
import { similarTo } from '../lib/recommend.js'
import { addToList, createList, isoDate, removeDiary, sortedDiary, uid, updateDiary } from '../lib/library.js'
import { buildHash } from '../lib/route.js'
import { lookup, remember } from '../registry.js'
import { useLib } from '../context.jsx'

const people = (s) => String(s || '').split(/,\s*/).filter(Boolean)

function useMovie(id, apiKey) {
  const { get, refresh } = useLib()
  const base = lookup(id) || get(id)
  const needsFetch = /^tt\d+$/.test(id) && !!apiKey && (!base || (base.source === 'omdb' && !base.detailed))
  const [detail, setDetail] = useState({ id: null, data: null, error: null })
  useEffect(() => {
    if (!needsFetch) return
    const ctrl = new AbortController()
    getOmdbDetails({ key: apiKey, id, signal: ctrl.signal })
      .then((data) => {
        remember(data)
        refresh(data)
        setDetail({ id, data, error: null })
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setDetail({ id, data: null, error: e.message })
      })
    return () => ctrl.abort()
  }, [needsFetch, apiKey, id, refresh])
  const done = detail.id === id
  const movie = done && detail.data ? { ...base, ...detail.data } : base
  return { movie, loading: needsFetch && !done, error: done ? detail.error : null }
}

function ListPicker({ movie }) {
  const { lib, setLib, isIn, toggle, say } = useLib()
  const [name, setName] = useState('')
  const create = (e) => {
    e.preventDefault()
    const id = uid('l')
    const before = lib.lists.length
    setLib((l) => {
      const withList = createList(l, name, id)
      return withList.lists.length > before ? addToList(withList, id, movie) : l
    })
    say(name.trim() ? `Created list ${name.trim()}` : 'Enter a list name')
    setName('')
  }
  return (
    <div className="list-picker">
      <fieldset>
        <legend className="sr-only">Lists containing {movie.title}</legend>
        {lib.lists.map((l) => (
          <label key={l.id} className="check">
            <input type="checkbox" checked={isIn(l.id, movie.id)} onChange={() => toggle(l.id, movie)} />
            <span>{l.name}</span>
          </label>
        ))}
      </fieldset>
      <form className="inline-form" onSubmit={create}>
        <label htmlFor="new-list-modal" className="sr-only">
          New list name
        </label>
        <input id="new-list-modal" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="New list name" />
        <button type="submit" className="btn">
          <Icon name="plus" size={16} /> Create
        </button>
      </form>
    </div>
  )
}

function Content({ id, apiKey, focusTitle, onClose }) {
  const { lib, isIn, toggle, toggleSeen, rate, note, say, setLib, logView } = useLib()
  const { movie: m, loading, error } = useMovie(id, apiKey)
  const titleRef = useRef(null)
  const [showLists, setShowLists] = useState(false)
  const [shared, setShared] = useState('')
  const [logDate, setLogDate] = useState(isoDate())
  const noteId = useId()

  useEffect(() => {
    if (focusTitle) {
      titleRef.current?.focus()
      titleRef.current?.closest('.dialog-body')?.scrollTo(0, 0)
    }
  }, [focusTitle])

  useEffect(() => {
    if (!m) return
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return
      if (e.key === 'f') toggle('favorites', m)
      else if (e.key === 'w') toggle('watchlist', m)
      else if (e.key === 's') toggleSeen(m)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [m, toggle, toggleSeen])

  if (!m) {
    return (
      <>
        <h2 id="movie-title" ref={titleRef} tabIndex={-1}>
          {loading ? 'Loading' : 'Movie not found'}
        </h2>
        <p className="muted">
          {error || (loading ? 'Loading details...' : 'This title is not in the sample catalogue. Add an OMDb key in Settings to open it.')}
        </p>
        <button type="button" className="btn" onClick={onClose}>
          Close
        </button>
      </>
    )
  }

  const share = async () => {
    const url = `${location.origin}${location.pathname}#/m/${encodeURIComponent(m.id)}`
    try {
      await navigator.clipboard.writeText(url)
      setShared('Link copied to clipboard')
    } catch {
      setShared(url)
    }
  }
  const meta = [m.yearLabel || m.year, m.rated, m.runtime ? `${m.runtime} min` : null, m.language, m.type !== 'movie' ? m.type : null]
    .filter(Boolean)
    .join(' · ')
  const isFav = isIn('favorites', m.id)
  const isWatch = isIn('watchlist', m.id)
  const isSeen = isIn('watched', m.id)
  const mine = lib.mine[m.id] || {}
  const views = sortedDiary(lib.diary.filter((d) => d.movieId === m.id))
  const similar = similarTo(m, CATALOG, 6)
  const personLink = (n) => (
    <a key={n} href={buildHash('person', { arg: n })}>
      {n}
    </a>
  )
  const joined = (arr) => arr.map((n, i) => [i ? ', ' : '', personLink(n)])

  return (
    <>
      <div className="movie-detail">
        <Poster movie={m} className="detail-poster" eager />
        <div className="detail-info">
          <h2 id="movie-title" ref={titleRef} tabIndex={-1}>
            {m.title}
          </h2>
          <p className="detail-meta">{meta}</p>
          {m.genres.length > 0 && (
            <ul className="chips" aria-label="Genres">
              {m.genres.map((g) => (
                <li key={g}>
                  <a href={buildHash('browse', { query: { genres: g } })}>{g}</a>
                </li>
              ))}
            </ul>
          )}
          {loading ? (
            <div aria-busy="true" aria-label="Loading details">
              <div className="skeleton sk-line" />
              <div className="skeleton sk-line" />
              <div className="skeleton sk-line short" />
            </div>
          ) : (
            <>
              {m.plot && <p className="plot">{m.plot}</p>}
              {error && <p className="note">Full details could not be loaded: {error}</p>}
              <dl className="facts">
                {m.director && (
                  <>
                    <dt>Director</dt>
                    <dd>{joined(people(m.director))}</dd>
                  </>
                )}
                {m.cast.length > 0 && (
                  <>
                    <dt>Cast</dt>
                    <dd>{joined(m.cast)}</dd>
                  </>
                )}
                {m.ratings.length > 0 && (
                  <>
                    <dt>Ratings</dt>
                    <dd>
                      <ul className="ratings">
                        {m.ratings.map((r) => (
                          <li key={r.source}>
                            <strong>{r.value}</strong> <span>{r.source}</span>
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </>
                )}
              </dl>
            </>
          )}
          <div className="detail-actions">
            <a className="btn btn-primary" href={trailerUrl(m.title, m.year)} target="_blank" rel="noopener noreferrer">
              <Icon name="play" size={16} fill /> Find trailer
              <span className="sr-only"> (opens YouTube in a new tab)</span>
            </a>
            <button type="button" className={`btn ${isSeen ? 'btn-on' : ''}`} aria-pressed={isSeen} onClick={() => toggleSeen(m)}>
              <Icon name="eye" size={16} fill={isSeen} /> {isSeen ? 'Seen it' : 'Mark as seen'}
            </button>
            <button type="button" className={`btn ${isFav ? 'btn-on' : ''}`} aria-pressed={isFav} onClick={() => toggle('favorites', m)}>
              <Icon name="heart" size={16} fill={isFav} /> Favorite
            </button>
            <button type="button" className={`btn ${isWatch ? 'btn-on' : ''}`} aria-pressed={isWatch} onClick={() => toggle('watchlist', m)}>
              <Icon name="bookmark" size={16} fill={isWatch} /> Watchlist
            </button>
            <button type="button" className="btn" aria-expanded={showLists} aria-controls="list-picker-panel" onClick={() => setShowLists((s) => !s)}>
              <Icon name="plus" size={16} /> Add to list
            </button>
            <a className="btn" href={buildHash('compare', { query: { a: m.id } })}>
              Compare
            </a>
            <button type="button" className="btn" onClick={share}>
              <Icon name="share" size={16} /> Share link
            </button>
          </div>
          {showLists && (
            <div id="list-picker-panel">
              <ListPicker movie={m} />
            </div>
          )}
          {shared && (
            <p className="note" role="status">
              {shared}
            </p>
          )}
        </div>
      </div>

      <section className="detail-section" aria-labelledby="mine-h">
        <h3 id="mine-h">Your take</h3>
        <StarInput value={mine.rating || 0} onChange={(r) => rate(m, r)} />
        <label htmlFor={noteId} className="label">
          Private note
        </label>
        <textarea
          id={noteId}
          className="textarea"
          rows={3}
          maxLength={2000}
          value={mine.note || ''}
          onChange={(e) => note(m, e.target.value)}
          placeholder="What did you think? Only saved in this browser."
        />
      </section>

      <section className="detail-section" aria-labelledby="diary-h">
        <h3 id="diary-h">Diary</h3>
        {views.length === 0 ? (
          <p className="muted">No viewings logged yet.</p>
        ) : (
          <ul className="diary-mini">
            {views.map((v) => (
              <li key={v.id}>
                <label className="sr-only" htmlFor={`d-${v.id}`}>
                  Viewing date
                </label>
                <input id={`d-${v.id}`} type="date" value={v.date} onChange={(e) => e.target.value && setLib((l) => updateDiary(l, v.id, { date: e.target.value }))} />
                <button type="button" className="icon-btn" aria-label={`Delete viewing on ${v.date}`} onClick={() => { setLib((l) => removeDiary(l, v.id)); say('Viewing removed') }}>
                  <Icon name="trash" size={18} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <form
          className="inline-form"
          onSubmit={(e) => {
            e.preventDefault()
            logView(m, logDate)
          }}
        >
          <label htmlFor="log-date" className="sr-only">
            Date watched
          </label>
          <input id="log-date" type="date" value={logDate} max={isoDate()} onChange={(e) => setLogDate(e.target.value)} />
          <button type="submit" className="btn">
            Log a viewing
          </button>
        </form>
      </section>

      {similar.length > 0 && (
        <section className="detail-section" aria-labelledby="sim-h">
          <h3 id="sim-h">More like this</h3>
          <ul className="grid grid-small">
            {similar.map((s, i) => (
              <MovieCard key={s.id} movie={s} index={i} />
            ))}
          </ul>
        </section>
      )}
      {m.source !== 'omdb' && (
        <p className="note">Sample catalogue entry. Add your own OMDb key in Settings to search the full database.</p>
      )}
    </>
  )
}

export default function MovieModal({ id, apiKey, onClose }) {
  const [first] = useState(id)
  return (
    <Dialog labelledBy="movie-title" onClose={onClose} className="dialog-movie">
      <button type="button" className="icon-btn dialog-close" onClick={onClose} aria-label="Close details">
        <Icon name="close" />
      </button>
      <Content key={id} id={id} apiKey={apiKey} focusTitle={first !== id} onClose={onClose} />
    </Dialog>
  )
}

import { useMemo, useState } from 'react'
import { CATALOG, GENRES } from '../data/movies.js'
import { useApp, useLib } from '../context.jsx'
import { decodeNight, encodeNight, nightCandidates, pickShortlist, pickWinner } from '../lib/night.js'
import Icon from '../components/Icon.jsx'
import MovieCard from '../components/MovieCard.jsx'

export default function Night({ query }) {
  const { lib, get, say } = useLib()
  const { openMovie } = useApp()
  const shared = useMemo(() => decodeNight(query), [query])
  const sharedMovies = shared.ids.map(get).filter(Boolean)
  const [sources, setSources] = useState(['catalog'])
  const [opts, setOpts] = useState({ maxRuntime: '', genre: '', minRating: '', excludeSeen: true, count: 3 })
  const [shortlist, setShortlist] = useState(sharedMovies)
  const [winner, setWinner] = useState(sharedMovies.find((m) => m.id === shared.winner) || null)
  const [empty, setEmpty] = useState(false)

  const pool = useMemo(() => {
    const m = new Map()
    if (sources.includes('catalog')) CATALOG.forEach((x) => m.set(x.id, x))
    for (const l of lib.lists) {
      if (sources.includes(l.id)) l.ids.forEach((id) => get(id) && m.set(id, get(id)))
    }
    return [...m.values()]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sources, lib])
  const seen = useMemo(() => new Set(lib.lists.find((l) => l.id === 'watched').ids), [lib])
  const candidates = nightCandidates(pool, { ...opts, excludeIds: opts.excludeSeen ? seen : new Set() })

  const toggleSource = (id) => setSources((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const pick = () => {
    const list = pickShortlist(candidates, opts.count)
    setShortlist(list)
    setWinner(null)
    setEmpty(list.length === 0)
    say(list.length ? `Shortlist ready: ${list.length} film${list.length === 1 ? '' : 's'}` : 'No films match those constraints')
  }
  const decide = () => {
    const w = pickWinner(shortlist)
    setWinner(w)
    say(w ? `Tonight's pick: ${w.title}` : '')
  }
  const link = async () => {
    const url = `${location.origin}${location.pathname}#/night?${encodeNight(shortlist, winner)}`
    try {
      await navigator.clipboard.writeText(url)
      say('Share link copied to clipboard')
    } catch {
      window.prompt('Copy this link', url)
    }
  }

  return (
    <div className="page">
      <h1 id="page-title" tabIndex={-1}>
        Movie night picker
      </h1>
      <p className="lead">Choose where to pick from and any limits, get a shortlist, then let the picker decide. Share the shortlist with whoever is joining.</p>
      {shared.ids.length > 0 && sharedMovies.length > 0 && (
        <p className="note" role="note">
          Showing a shared shortlist. Change the options below and pick again to make your own.
        </p>
      )}
      <form className="card-form" onSubmit={(e) => { e.preventDefault(); pick() }} aria-label="Movie night options">
        <fieldset>
          <legend>Pick from</legend>
          <div className="chip-row">
            <label className="check">
              <input type="checkbox" checked={sources.includes('catalog')} onChange={() => toggleSource('catalog')} />
              <span>Sample catalogue</span>
            </label>
            {lib.lists.map((l) => (
              <label key={l.id} className="check">
                <input type="checkbox" checked={sources.includes(l.id)} onChange={() => toggleSource(l.id)} />
                <span>
                  {l.name} ({l.ids.length})
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="form-grid">
          <label className="field">
            <span>Longest runtime</span>
            <select value={opts.maxRuntime} onChange={(e) => setOpts({ ...opts, maxRuntime: e.target.value })}>
              <option value="">No limit</option>
              {[90, 110, 130, 150, 180].map((n) => (
                <option key={n} value={n}>
                  {n} minutes
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Genre</span>
            <select value={opts.genre} onChange={(e) => setOpts({ ...opts, genre: e.target.value })}>
              <option value="">Any genre</option>
              {GENRES.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Min rating</span>
            <select value={opts.minRating} onChange={(e) => setOpts({ ...opts, minRating: e.target.value })}>
              <option value="">Any rating</option>
              {[8.5, 8, 7.5, 7].map((r) => (
                <option key={r} value={r}>
                  {r}+
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Shortlist size</span>
            <select value={opts.count} onChange={(e) => setOpts({ ...opts, count: Number(e.target.value) })}>
              {[2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} films
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="check">
          <input type="checkbox" checked={opts.excludeSeen} onChange={(e) => setOpts({ ...opts, excludeSeen: e.target.checked })} />
          <span>Skip films I have already seen</span>
        </label>
        <p className="muted" role="status">
          {candidates.length} film{candidates.length === 1 ? '' : 's'} match.
        </p>
        <div className="dialog-actions">
          <button type="submit" className="btn btn-primary" disabled={!candidates.length}>
            <Icon name="dice" size={16} /> {shortlist.length ? 'Pick a new shortlist' : 'Pick a shortlist'}
          </button>
        </div>
      </form>

      {empty && <p className="note">Nothing matches. Loosen the limits or add more lists.</p>}
      {shortlist.length > 0 && (
        <section aria-labelledby="short-h" className="night-result">
          <h2 id="short-h">Tonight&apos;s shortlist</h2>
          <ul className="grid">
            {shortlist.map((m, i) => (
              <li key={m.id} className={winner?.id === m.id ? 'is-winner' : ''}>
                <MovieCard movie={m} index={i} as="div" />
                {winner?.id === m.id && <p className="winner-tag">Tonight&apos;s pick</p>}
              </li>
            ))}
          </ul>
          <div className="dialog-actions">
            <button type="button" className="btn btn-primary" onClick={decide}>
              {winner ? 'Decide again' : 'Decide for us'}
            </button>
            <button type="button" className="btn" onClick={link}>
              <Icon name="share" size={16} /> Copy share link
            </button>
          </div>
          {winner && (
            <p className="lead" role="status">
              Tonight you are watching{' '}
              <button type="button" className="link-btn" onClick={() => openMovie(winner)}>
                {winner.title}
              </button>
              .
            </p>
          )}
        </section>
      )}
    </div>
  )
}

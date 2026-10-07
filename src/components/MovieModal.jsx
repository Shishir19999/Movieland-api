import { useEffect, useState } from 'react'
import Dialog from './Dialog.jsx'
import Icon from './Icon.jsx'
import Poster from './Poster.jsx'
import { getOmdbDetails } from '../lib/omdb.js'
import { trailerUrl } from '../lib/logic.js'

export default function MovieModal({ movie, apiKey, onClose, isFav, isWatch, onFav, onWatch }) {
  const [shared, setShared] = useState('')
  const share = async () => {
    const url = `${location.origin}${location.pathname}#/m/${encodeURIComponent(movie.id)}`
    try {
      await navigator.clipboard.writeText(url)
      setShared('Link copied to clipboard')
    } catch {
      setShared(url)
    }
  }
  const needsFetch = movie.source === 'omdb' && !movie.detailed && !!apiKey
  const [detail, setDetail] = useState({ id: null, data: null, error: null })

  useEffect(() => {
    if (!needsFetch) return
    const ctrl = new AbortController()
    getOmdbDetails({ key: apiKey, id: movie.id, signal: ctrl.signal })
      .then((data) => setDetail({ id: movie.id, data, error: null }))
      .catch((e) => {
        if (e.name !== 'AbortError') setDetail({ id: movie.id, data: null, error: e.message })
      })
    return () => ctrl.abort()
  }, [needsFetch, apiKey, movie.id])

  const loading = needsFetch && detail.id !== movie.id
  const m = detail.id === movie.id && detail.data ? { ...movie, ...detail.data } : movie
  const meta = [m.yearLabel || m.year, m.rated, m.runtime ? `${m.runtime} min` : null, m.type !== 'movie' ? m.type : null]
    .filter(Boolean)
    .join(' · ')

  return (
    <Dialog labelledBy="movie-title" onClose={onClose} className="dialog-movie">
      <button type="button" className="icon-btn dialog-close" onClick={onClose} aria-label="Close details">
        <Icon name="close" />
      </button>
      <div className="movie-detail">
        <Poster movie={m} className="detail-poster" eager />
        <div className="detail-info">
          <h2 id="movie-title">{m.title}</h2>
          <p className="detail-meta">{meta}</p>
          {m.genres.length > 0 && (
            <ul className="chips" aria-label="Genres">
              {m.genres.map((g) => (
                <li key={g}>{g}</li>
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
              {detail.error && <p className="note">Full details could not be loaded: {detail.error}</p>}
              <dl className="facts">
                {m.director && (
                  <>
                    <dt>Director</dt>
                    <dd>{m.director}</dd>
                  </>
                )}
                {m.cast.length > 0 && (
                  <>
                    <dt>Cast</dt>
                    <dd>{m.cast.join(', ')}</dd>
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
            <a
              className="btn btn-primary"
              href={trailerUrl(m.title, m.year)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon name="play" size={16} fill /> Find trailer
              <span className="sr-only"> (opens YouTube in a new tab)</span>
            </a>
            <button type="button" className={`btn ${isFav ? 'btn-on' : ''}`} aria-pressed={isFav} onClick={() => onFav(m)}>
              <Icon name="heart" size={16} fill={isFav} /> {isFav ? 'In favorites' : 'Favorite'}
            </button>
            <button type="button" className={`btn ${isWatch ? 'btn-on' : ''}`} aria-pressed={isWatch} onClick={() => onWatch(m)}>
              <Icon name="bookmark" size={16} fill={isWatch} /> {isWatch ? 'In watchlist' : 'Watchlist'}
            </button>
            <button type="button" className="btn" onClick={share}>
              Share link
            </button>
          </div>
          {shared && (
            <p className="note" role="status">
              {shared}
            </p>
          )}
          {m.source === 'demo' && (
            <p className="note">Demo catalogue entry. Add your own OMDb key in Settings to search the full database.</p>
          )}
        </div>
      </div>
    </Dialog>
  )
}

import { memo } from 'react'
import Icon from './Icon.jsx'
import Poster from './Poster.jsx'
import Reveal from './Reveal.jsx'
import { StarsStatic } from './Stars.jsx'
import { useTilt } from '../hooks.js'
import { useApp, useLib } from '../context.jsx'

function MovieCard({ movie, index = 0, as = 'li' }) {
  const { motion, openMovie } = useApp()
  const { lib, isIn, toggle, toggleSeen } = useLib()
  const [tiltRef, onTiltMove, onTiltLeave] = useTilt(motion.tilt)
  const isFav = isIn('favorites', movie.id)
  const isWatch = isIn('watchlist', movie.id)
  const isSeen = isIn('watched', movie.id)
  const mine = lib.mine[movie.id]?.rating
  const meta = [movie.yearLabel || movie.year, movie.genres[0] || (movie.type !== 'movie' ? movie.type : null)]
    .filter(Boolean)
    .join(' · ')
  return (
    <Reveal as={as} index={index} className="card-item">
      <article className="card">
        <button
          type="button"
          className="card-open"
          onClick={() => openMovie(movie)}
          aria-label={`${movie.title}${movie.year ? `, ${movie.year}` : ''}. View details`}
          onPointerMove={onTiltMove}
          onPointerLeave={onTiltLeave}
        >
          <span className="poster" ref={tiltRef}>
            <Poster movie={movie} />
            {movie.rating != null && (
              <span className="badge">
                <Icon name="star" size={12} fill /> {movie.rating.toFixed(1)}
              </span>
            )}
            {isSeen && (
              <span className="seen-tag">
                <Icon name="check" size={12} /> Seen
              </span>
            )}
          </span>
          <span className="card-title">{movie.title}</span>
          <span className="card-meta">
            {meta}
            {mine ? (
              <>
                {' '}
                <StarsStatic value={mine} size={12} />
              </>
            ) : null}
          </span>
        </button>
        <div className="card-actions">
          <button
            type="button"
            className={`icon-btn ${isFav ? 'on fav' : ''}`}
            aria-pressed={isFav}
            aria-label={`Favorite: ${movie.title}`}
            onClick={() => toggle('favorites', movie)}
          >
            <Icon name="heart" size={18} fill={isFav} />
          </button>
          <button
            type="button"
            className={`icon-btn ${isWatch ? 'on' : ''}`}
            aria-pressed={isWatch}
            aria-label={`Watchlist: ${movie.title}`}
            onClick={() => toggle('watchlist', movie)}
          >
            <Icon name="bookmark" size={18} fill={isWatch} />
          </button>
          <button
            type="button"
            className={`icon-btn ${isSeen ? 'on seen' : ''}`}
            aria-pressed={isSeen}
            aria-label={`Seen it: ${movie.title}`}
            onClick={() => toggleSeen(movie)}
          >
            <Icon name="eye" size={18} fill={isSeen} />
          </button>
        </div>
      </article>
    </Reveal>
  )
}

export default memo(MovieCard)

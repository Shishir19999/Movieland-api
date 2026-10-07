import { memo } from 'react'
import Icon from './Icon.jsx'
import Poster from './Poster.jsx'
import Reveal from './Reveal.jsx'
import { useTilt } from '../hooks.js'

function MovieCard({ movie, index, tilt, isFav, isWatch, onOpen, onFav, onWatch }) {
  const [tiltRef, onTiltMove, onTiltLeave] = useTilt(tilt)
  const meta = [movie.yearLabel || movie.year, movie.genres[0] || (movie.type !== 'movie' ? movie.type : null)]
    .filter(Boolean)
    .join(' · ')
  return (
    <Reveal as="li" index={index} className="card-item">
      <article className="card">
        <button
          type="button"
          className="card-open"
          onClick={() => onOpen(movie)}
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
          </span>
          <span className="card-title">{movie.title}</span>
          <span className="card-meta">{meta}</span>
        </button>
        <div className="card-actions">
          <button
            type="button"
            className={`icon-btn ${isFav ? 'on fav' : ''}`}
            aria-pressed={isFav}
            aria-label={`${isFav ? 'Remove from' : 'Add to'} favorites: ${movie.title}`}
            onClick={() => onFav(movie)}
          >
            <Icon name="heart" size={18} fill={isFav} />
          </button>
          <button
            type="button"
            className={`icon-btn ${isWatch ? 'on' : ''}`}
            aria-pressed={isWatch}
            aria-label={`${isWatch ? 'Remove from' : 'Add to'} watchlist: ${movie.title}`}
            onClick={() => onWatch(movie)}
          >
            <Icon name="bookmark" size={18} fill={isWatch} />
          </button>
        </div>
      </article>
    </Reveal>
  )
}

export default memo(MovieCard)

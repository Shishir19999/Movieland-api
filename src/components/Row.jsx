import { useRef } from 'react'
import Icon from './Icon.jsx'
import MovieCard from './MovieCard.jsx'

// A horizontally scrolling row of cards with scroll-snap and previous/next buttons.
export default function Row({ id, title, blurb, items, link, children }) {
  const ref = useRef(null)
  const scroll = (dir) => {
    const el = ref.current
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }
  if (!items.length) return null
  return (
    <section className="row" aria-labelledby={`row-${id}`}>
      <div className="row-head">
        <div>
          <h2 id={`row-${id}`}>{title}</h2>
          {blurb && <p className="muted">{blurb}</p>}
        </div>
        <div className="row-tools">
          {link && (
            <a className="link-btn" href={link}>
              See all<span className="sr-only"> in {title}</span>
            </a>
          )}
          <button type="button" className="icon-btn row-nav" onClick={() => scroll(-1)} aria-label={`Scroll ${title} left`}>
            <Icon name="left" />
          </button>
          <button type="button" className="icon-btn row-nav" onClick={() => scroll(1)} aria-label={`Scroll ${title} right`}>
            <Icon name="right" />
          </button>
        </div>
      </div>
      {children}
      <ul className="row-scroll" ref={ref}>
        {items.map((m, i) => (
          <MovieCard key={m.id} movie={m} index={i} />
        ))}
      </ul>
    </section>
  )
}

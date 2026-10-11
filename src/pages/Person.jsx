import { useMemo } from 'react'
import { CATALOG } from '../data/movies.js'
import { useLib } from '../context.jsx'
import { collaborators, filmographyOf } from '../lib/recommend.js'
import { buildHash } from '../lib/route.js'
import MovieCard from '../components/MovieCard.jsx'
import { EmptyState } from '../components/States.jsx'

export default function Person({ name }) {
  const { lib } = useLib()
  const pool = useMemo(() => [...CATALOG, ...Object.values(lib.cache)], [lib.cache])
  const films = useMemo(() => filmographyOf(name, pool), [name, pool])
  const collab = useMemo(() => collaborators(name, pool), [name, pool])
  const rated = films.filter((f) => typeof f.movie.rating === 'number')
  const avg = rated.length ? (rated.reduce((n, f) => n + f.movie.rating, 0) / rated.length).toFixed(1) : null
  const roles = [...new Set(films.flatMap((f) => f.roles))]
  const web = `https://www.google.com/search?q=${encodeURIComponent(`${name} filmography`)}`

  return (
    <div className="page">
      <p className="crumbs">
        <a href="#/browse">Browse</a> / People
      </p>
      <h1 id="page-title" tabIndex={-1}>
        {name}
      </h1>
      {films.length === 0 ? (
        <EmptyState
          title="No films found for this person"
          action={
            <a className="btn" href="#/browse">
              Browse movies
            </a>
          }
        >
          The sample catalogue and your saved titles have nothing under this name.
        </EmptyState>
      ) : (
        <>
          <p className="lead">
            {roles.join(' and ')} · {films.length} film{films.length === 1 ? '' : 's'} here
            {avg ? ` · average rating ${avg}` : ''}
          </p>
          <p>
            <a href={web} target="_blank" rel="noopener noreferrer">
              Search the web for {name}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </p>
          {collab.length > 0 && (
            <section aria-labelledby="collab-h" className="collab">
              <h2 id="collab-h">Often works with</h2>
              <ul className="chip-row">
                {collab.map((c) => (
                  <li key={c.name}>
                    <a className="chip chip-link" href={buildHash('person', { arg: c.name })}>
                      {c.name} <span className="tab-count">{c.count}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section aria-labelledby="film-h">
            <h2 id="film-h">Filmography</h2>
            <ul className="grid">
              {films.map((f, i) => (
                <MovieCard key={f.movie.id} movie={f.movie} index={i} />
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  )
}

import { useMemo, useState } from 'react'
import { CATALOG } from '../data/movies.js'
import { useApp, useLib } from '../context.jsx'
import { similarity } from '../lib/recommend.js'
import { lookup } from '../registry.js'
import Poster from '../components/Poster.jsx'
import { StarsStatic } from '../components/Stars.jsx'

const overlap = (a = [], b = []) => a.filter((x) => b.includes(x))

// verdict text so the winner is never conveyed by colour alone
function Cell({ value, win, label }) {
  return (
    <td className={win ? 'win' : ''}>
      {value ?? 'Unknown'}
      {win && <span className="win-tag"> ({label})</span>}
    </td>
  )
}

export default function Compare({ query }) {
  const { lib, get } = useLib()
  const { openMovie } = useApp()
  const [ids, setIds] = useState({ a: query.a || '', b: query.b || '' })
  const options = useMemo(() => {
    const m = new Map([...CATALOG, ...Object.values(lib.cache)].map((x) => [x.id, x]))
    for (const id of [ids.a, ids.b]) {
      const x = id && (lookup(id) || get(id))
      if (x) m.set(x.id, x)
    }
    return [...m.values()].sort((x, y) => x.title.localeCompare(y.title))
  }, [lib.cache, ids, get])
  const A = options.find((m) => m.id === ids.a)
  const B = options.find((m) => m.id === ids.b)

  const higher = (k, dir = 1) => {
    if (!A || !B || typeof A[k] !== 'number' || typeof B[k] !== 'number' || A[k] === B[k]) return null
    return (A[k] - B[k]) * dir > 0 ? 'a' : 'b'
  }
  const rows = A && B && [
    ['Year', A.year, B.year, higher('year', -1), 'earlier'],
    ['Runtime', A.runtime ? `${A.runtime} min` : null, B.runtime ? `${B.runtime} min` : null, higher('runtime'), 'longer'],
    ['IMDb rating', A.rating?.toFixed(1), B.rating?.toFixed(1), higher('rating'), 'higher'],
    ['Genres', A.genres.join(', '), B.genres.join(', '), null],
    ['Director', A.director, B.director, null],
    ['Language', A.language || 'English', B.language || 'English', null],
    ['Your rating', lib.mine[A.id]?.rating ? `${lib.mine[A.id].rating} of 5` : 'Not rated', lib.mine[B.id]?.rating ? `${lib.mine[B.id].rating} of 5` : 'Not rated', (lib.mine[A.id]?.rating || 0) === (lib.mine[B.id]?.rating || 0) ? null : (lib.mine[A.id]?.rating || 0) > (lib.mine[B.id]?.rating || 0) ? 'a' : 'b', 'you prefer'],
  ]
  const score = A && B ? Math.round(similarity(A, B) * 100) : null
  const sharedCast = A && B ? overlap(A.cast, B.cast) : []
  const sharedGenres = A && B ? overlap(A.genres, B.genres) : []

  const pickers = [
    ['a', 'First film'],
    ['b', 'Second film'],
  ]
  return (
    <div className="page">
      <h1 id="page-title" tabIndex={-1}>
        Compare two movies
      </h1>
      <div className="compare-pickers">
        {pickers.map(([k, label]) => (
          <label className="field" key={k}>
            <span>{label}</span>
            <select value={ids[k]} onChange={(e) => setIds({ ...ids, [k]: e.target.value })}>
              <option value="">Choose a film</option>
              {options.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({m.year})
                </option>
              ))}
            </select>
          </label>
        ))}
        <button type="button" className="btn" onClick={() => setIds({ a: ids.b, b: ids.a })} disabled={!ids.a && !ids.b}>
          Swap
        </button>
      </div>

      {!A || !B ? (
        <p className="muted">Pick two films to see them side by side.</p>
      ) : (
        <>
          <div className="compare-heads">
            {[A, B].map((m) => (
              <div key={m.id} className="compare-head">
                <Poster movie={m} className="detail-poster" />
                <button type="button" className="row-title" onClick={() => openMovie(m)}>
                  {m.title}
                </button>
                <StarsStatic value={lib.mine[m.id]?.rating} />
              </div>
            ))}
          </div>
          <p className="lead" role="status">
            {A.id === B.id ? 'These are the same film.' : `These two are ${score}% alike by genre, director, cast, era and rating.`}
            {sharedGenres.length > 0 && ` Shared genres: ${sharedGenres.join(', ')}.`}
            {sharedCast.length > 0 && ` Shared cast: ${sharedCast.join(', ')}.`}
          </p>
          <div className="table-wrap">
            <table className="compare-table">
              <caption className="sr-only">
                Comparison of {A.title} and {B.title}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Detail</th>
                  <th scope="col">{A.title}</th>
                  <th scope="col">{B.title}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, a, b, w, word]) => (
                  <tr key={label}>
                    <th scope="row">{label}</th>
                    <Cell value={a} win={w === 'a'} label={word} />
                    <Cell value={b} win={w === 'b'} label={word} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

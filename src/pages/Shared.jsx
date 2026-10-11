import { useEffect, useMemo, useState } from 'react'
import { useApp, useLib } from '../context.jsx'
import { addToList, createList, decodeShare, uid } from '../lib/library.js'
import { findCatalogMovie } from '../data/movies.js'
import { getOmdbDetails } from '../lib/omdb.js'
import { remember } from '../registry.js'
import MovieCard from '../components/MovieCard.jsx'
import { EmptyState } from '../components/States.jsx'

// A list shared by link. Sample-catalogue titles resolve offline; live titles need an OMDb key.
export default function Shared({ query, apiKey }) {
  const { setLib, say, lib } = useLib()
  const { navigate } = useApp()
  const data = useMemo(() => decodeShare(query.d), [query.d])
  const [live, setLive] = useState({})

  const unknown = useMemo(() => (data ? data.ids.filter((id) => !findCatalogMovie(id)) : []), [data])
  useEffect(() => {
    if (!apiKey || !unknown.length) return
    const ctrl = new AbortController()
    unknown
      .filter((id) => /^tt\d+$/.test(id))
      .slice(0, 20)
      .forEach((id) =>
        getOmdbDetails({ key: apiKey, id, signal: ctrl.signal })
          .then((m) => {
            remember(m)
            setLive((l) => ({ ...l, [id]: m }))
          })
          .catch(() => {}),
      )
    return () => ctrl.abort()
  }, [apiKey, unknown])

  if (!data) {
    return (
      <div className="page">
        <h1 id="page-title" tabIndex={-1}>
          Shared list
        </h1>
        <EmptyState title="This link could not be read">The shared list link looks incomplete or damaged.</EmptyState>
      </div>
    )
  }
  const movies = data.ids.map((id) => findCatalogMovie(id) || live[id]).filter(Boolean)
  const missing = data.ids.length - movies.length

  const save = () => {
    let name = data.name
    let n = 2
    while (lib.lists.some((l) => l.name.toLowerCase() === name.toLowerCase())) name = `${data.name} (${n++})`
    const id = uid('l')
    setLib((l) => movies.reduceRight((acc, m) => addToList(acc, id, m), createList(l, name, id)))
    say(`Saved as ${name}`)
    navigate(`#/lists?list=${id}`)
  }

  return (
    <div className="page">
      <h1 id="page-title" tabIndex={-1}>
        {data.name}
      </h1>
      <p className="lead">
        A list shared with you · {data.ids.length} title{data.ids.length === 1 ? '' : 's'}
      </p>
      {missing > 0 && (
        <p className="note" role="note">
          {missing} title{missing === 1 ? ' is' : 's are'} from live OMDb search
          {apiKey ? ' and could not be loaded' : '. Add an OMDb key in Settings to show them'}.
        </p>
      )}
      <div className="dialog-actions">
        <button type="button" className="btn btn-primary" onClick={save} disabled={!movies.length}>
          Save to my lists
        </button>
      </div>
      <ul className="grid">
        {movies.map((m, i) => (
          <MovieCard key={m.id} movie={m} index={i} />
        ))}
      </ul>
    </div>
  )
}

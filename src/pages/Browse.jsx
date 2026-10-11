import { useEffect, useMemo, useRef, useState } from 'react'
import { CATALOG } from '../data/movies.js'
import { useApp, useLib } from '../context.jsx'
import { useRemoteSearch } from '../useRemoteSearch.js'
import { DEFAULT_FILTERS, PAGE_SIZE, filterMovies, paginate, sortMovies, suggestTitles } from '../lib/logic.js'
import SearchBox from '../components/SearchBox.jsx'
import Filters from '../components/Filters.jsx'
import MovieCard from '../components/MovieCard.jsx'
import { EmptyState, ErrorState, SkeletonGrid } from '../components/States.jsx'

const DEFAULT_LIVE_QUERY = 'Batman'
const PARAMS = ['decade', 'yearFrom', 'yearTo', 'minRuntime', 'maxRuntime', 'minRating', 'maxRating', 'language', 'status', 'type', 'year', 'sort', 'genreMode']

function fromQuery(q) {
  const f = { ...DEFAULT_FILTERS }
  for (const k of PARAMS) if (q[k] != null) f[k] = String(q[k])
  if (q.genres) f.genres = String(q.genres).split(',').filter(Boolean)
  return f
}

export default function Browse({ query: rq, apiKey, live, onSettings, onSampleOnly }) {
  const { recent, rememberSearch, setRecent } = useApp()
  const { lib } = useLib()
  const [query, setQuery] = useState(rq.q || '')
  const [term, setTerm] = useState(rq.q || '')
  const [filters, setFilters] = useState(() => fromQuery(rq))
  const [source, setSource] = useState('live')
  const [pageState, setPageState] = useState({ sig: '', page: 1 })
  const inputFocused = useRef(false)

  useEffect(() => {
    const t = setTimeout(() => setTerm(query), 300)
    return () => clearTimeout(t)
  }, [query])
  useEffect(() => {
    if (rq.focus && !inputFocused.current) {
      inputFocused.current = true
      document.querySelector('[data-search-input]')?.focus()
    }
  }, [rq.focus])

  const remoteMode = live && source === 'live'
  const validYear = /^\d{4}$/.test(filters.year) ? filters.year : ''
  const remote = useRemoteSearch({
    enabled: remoteMode,
    apiKey,
    term: term.trim() || DEFAULT_LIVE_QUERY,
    type: filters.type,
    year: validYear,
  })

  const watchedIds = useMemo(() => new Set(lib.lists.find((l) => l.id === 'watched').ids), [lib.lists])
  const pageSig = JSON.stringify([term, filters, remoteMode])
  const page = pageState.sig === pageSig ? pageState.page : 1

  const result = useMemo(() => {
    if (remoteMode) {
      return { items: sortMovies(remote.items, { sort: filters.sort }), total: remote.total, hasMore: remote.hasMore }
    }
    const filtered = filterMovies(CATALOG, { ...filters, query: term, watchedIds })
    return paginate(sortMovies(filtered, { sort: filters.sort, query: term }), page)
  }, [remoteMode, remote.items, remote.total, remote.hasMore, filters, term, page, watchedIds])

  const suggestions = useMemo(() => {
    if (!query.trim()) return []
    if (remoteMode) return remote.loading || term !== query ? [] : [...new Set(remote.items.map((m) => m.title))].slice(0, 6)
    return suggestTitles(CATALOG, query)
  }, [query, term, remoteMode, remote.loading, remote.items])

  const loading = remoteMode && remote.loading
  const error = remoteMode ? remote.error : null
  const count = remoteMode ? remote.total : result.total
  const heading = term.trim() ? `Results for “${term.trim()}”` : remoteMode ? `Results for “${DEFAULT_LIVE_QUERY}”` : 'All movies'
  const loadMore = () => (remoteMode ? remote.loadMore() : setPageState({ sig: pageSig, page: page + 1 }))
  const moreBusy = remoteMode && remote.more.busy
  const reset = () => {
    setQuery('')
    setTerm('')
    setFilters(DEFAULT_FILTERS)
  }

  // infinite scroll: load the next page when the sentinel comes into view (the button stays as a fallback)
  const sentinel = useRef(null)
  const canAuto = result.hasMore && !loading && !error && !moreBusy
  useEffect(() => {
    const el = sentinel.current
    if (!el || !canAuto || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && loadMore(), { rootMargin: '300px' })
    io.observe(el)
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAuto, result.items.length])

  return (
    <div className="page">
      <h1 id="page-title" tabIndex={-1}>
        Browse movies
      </h1>
      <div className="browse-search">
        <SearchBox
          value={query}
          onChange={setQuery}
          onSubmit={(v) => {
            setTerm(v)
            rememberSearch(v)
          }}
          suggestions={suggestions}
          placeholder={remoteMode ? 'Search the OMDb database (press / to focus)' : 'Try “Nolan”, “Godfather” or “animation”'}
        />
        {live && (
          <div className="seg seg-block" role="group" aria-label="Search source">
            <button type="button" aria-pressed={source === 'live'} onClick={() => setSource('live')}>
              Live OMDb
            </button>
            <button type="button" aria-pressed={source === 'sample'} onClick={() => setSource('sample')}>
              Sample catalogue
            </button>
          </div>
        )}
        {recent.length > 0 && (
          <div className="recent">
            <span className="recent-label" id="recent-label-b">
              Recent
            </span>
            <ul aria-labelledby="recent-label-b">
              {recent.map((r) => (
                <li key={r}>
                  <button
                    type="button"
                    className="chip"
                    onClick={() => {
                      setQuery(r)
                      setTerm(r)
                    }}
                  >
                    {r}
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="link-btn" onClick={() => setRecent([])}>
              Clear
            </button>
          </div>
        )}
      </div>

      <Filters filters={filters} onChange={setFilters} remote={remoteMode} onReset={() => setFilters(DEFAULT_FILTERS)} />

      <section className="results" aria-labelledby="results-heading" aria-busy={loading}>
        <div className="results-head">
          <h2 id="results-heading">{heading}</h2>
          <p className="count" role="status">
            {loading || error ? '' : `${count} ${count === 1 ? 'title' : 'titles'}`}
          </p>
        </div>
        {loading ? (
          <SkeletonGrid />
        ) : error ? (
          <ErrorState error={error} onRetry={remote.retry} onSettings={onSettings} onSample={onSampleOnly} />
        ) : result.items.length === 0 ? (
          <EmptyState
            title="No movies found"
            level={3}
            action={
              <button type="button" className="btn" onClick={reset}>
                Clear search and filters
              </button>
            }
          >
            Try a different title, director or actor, or loosen the filters.
          </EmptyState>
        ) : (
          <>
            <ul className="grid">
              {result.items.map((m, i) => (
                <MovieCard key={m.id} movie={m} index={i % PAGE_SIZE} />
              ))}
            </ul>
            {remoteMode && remote.more.error && (
              <p className="note center" role="alert">
                Could not load more: {remote.more.error.message}
              </p>
            )}
            {result.hasMore && (
              <div className="more" ref={sentinel}>
                <button type="button" className="btn btn-primary" onClick={loadMore} disabled={moreBusy}>
                  {moreBusy ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}

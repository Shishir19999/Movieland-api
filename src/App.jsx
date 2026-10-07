import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { CATALOG } from './data/movies.js'
import { useLocalStorage, useMotion, useParallax } from './hooks.js'
import { useRemoteSearch } from './useRemoteSearch.js'
import { ENV_KEY, getOmdbDetails } from './lib/omdb.js'
import {
  DEFAULT_FILTERS,
  PAGE_SIZE,
  addRecent,
  filterMovies,
  paginate,
  sortMovies,
  suggestTitles,
  toggleById,
} from './lib/logic.js'
import Icon from './components/Icon.jsx'
import SearchBox from './components/SearchBox.jsx'
import Filters from './components/Filters.jsx'
import MovieCard from './components/MovieCard.jsx'
import MovieModal from './components/MovieModal.jsx'
import SettingsDialog from './components/SettingsDialog.jsx'
import Reveal from './components/Reveal.jsx'
import { EmptyState, ErrorState, SkeletonGrid } from './components/States.jsx'

const DEFAULT_LIVE_QUERY = 'Batman'
const VIEWS = [
  ['discover', 'Discover'],
  ['favorites', 'Favorites'],
  ['watchlist', 'Watchlist'],
]

function useTheme() {
  const [pref, setPref] = useLocalStorage('ml:theme', null)
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const on = (e) => setSystemDark(e.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  const theme = pref ?? (systemDark ? 'dark' : 'light')
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0f1117' : '#f6f5f1')
  }, [theme])
  return [theme, () => setPref(theme === 'dark' ? 'light' : 'dark')]
}

export default function App() {
  const motion = useMotion()
  const [theme, toggleTheme] = useTheme()
  const [storedKey, setStoredKey] = useLocalStorage('ml:key', null)
  const [forceDemo, setForceDemo] = useState(false)
  const apiKey = forceDemo ? '' : storedKey || ENV_KEY
  const live = !!apiKey

  const [favorites, setFavorites] = useLocalStorage('ml:favorites', [])
  const [watchlist, setWatchlist] = useLocalStorage('ml:watchlist', [])
  const [recent, setRecent] = useLocalStorage('ml:recent', [])

  const [view, setView] = useState('discover')
  const [query, setQuery] = useState('')
  const [term, setTerm] = useState('')
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [pageState, setPageState] = useState({ sig: '', page: 1 })
  const [selected, setSelected] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [announce, setAnnounce] = useState('')

  const heroRef = useRef(null)
  useParallax(heroRef, motion.parallax)

  // debounce typing into the applied search term
  useEffect(() => {
    const t = setTimeout(() => setTerm(query), 300)
    return () => clearTimeout(t)
  }, [query])

  // "/" jumps to the search box
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target.tagName
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || e.target.isContentEditable) return
      if (document.querySelector('dialog[open]')) return
      e.preventDefault()
      document.querySelector('[data-search-input]')?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const remoteMode = live && view === 'discover'
  const validYear = /^\d{4}$/.test(filters.year) ? filters.year : ''
  const remote = useRemoteSearch({
    enabled: remoteMode,
    apiKey,
    term: term.trim() || DEFAULT_LIVE_QUERY,
    type: filters.type,
    year: validYear,
  })

  const base = view === 'favorites' ? favorites : view === 'watchlist' ? watchlist : CATALOG
  const activeFilters = remoteMode && filters.sort === 'rating' ? { ...filters, sort: 'relevance' } : filters

  const pageSig = JSON.stringify([view, term, filters, live])
  const page = pageState.sig === pageSig ? pageState.page : 1

  const result = useMemo(() => {
    if (remoteMode) {
      const items = sortMovies(remote.items, { sort: activeFilters.sort })
      return { items, total: remote.total, hasMore: remote.hasMore }
    }
    const filtered = filterMovies(base, { ...filters, query: term })
    const sorted = sortMovies(filtered, { sort: filters.sort, query: term })
    return paginate(sorted, page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteMode, remote.items, remote.total, remote.hasMore, base, filters, term, page])

  const suggestions = useMemo(() => {
    if (!query.trim()) return []
    if (remoteMode) {
      return remote.loading || term !== query ? [] : [...new Set(remote.items.map((m) => m.title))].slice(0, 6)
    }
    return suggestTitles(base, query)
  }, [query, term, remoteMode, remote.loading, remote.items, base])

  const favIds = useMemo(() => new Set(favorites.map((m) => m.id)), [favorites])
  const watchIds = useMemo(() => new Set(watchlist.map((m) => m.id)), [watchlist])

  const toggleFav = useCallback(
    (movie) => {
      setFavorites((l) => toggleById(l, movie))
      setAnnounce(`${movie.title} ${favIds.has(movie.id) ? 'removed from' : 'added to'} favorites`)
    },
    [favIds, setFavorites],
  )
  const toggleWatch = useCallback(
    (movie) => {
      setWatchlist((l) => toggleById(l, movie))
      setAnnounce(`${movie.title} ${watchIds.has(movie.id) ? 'removed from' : 'added to'} watchlist`)
    },
    [watchIds, setWatchlist],
  )
  const openMovie = useCallback((movie) => {
    setSelected(movie)
    history.replaceState(null, '', `#/m/${encodeURIComponent(movie.id)}`)
  }, [])
  const closeMovie = useCallback(() => {
    setSelected(null)
    history.replaceState(null, '', location.pathname + location.search)
  }, [])

  // open a shared link such as #/m/demo-the-godfather or #/m/tt0068646
  useEffect(() => {
    let ctrl
    const sync = () => {
      const m = /^#\/m\/(.+)$/.exec(location.hash)
      if (!m) return
      const id = decodeURIComponent(m[1])
      const demo = CATALOG.find((c) => c.id === id)
      if (demo) return setSelected(demo)
      if (!apiKey || !/^tt\d+$/.test(id)) return
      ctrl?.abort()
      ctrl = new AbortController()
      getOmdbDetails({ key: apiKey, id, signal: ctrl.signal })
        .then((d) => setSelected({ ...d, detailed: true }))
        .catch(() => {})
    }
    sync()
    window.addEventListener('hashchange', sync)
    return () => {
      ctrl?.abort()
      window.removeEventListener('hashchange', sync)
    }
  }, [apiKey])

  const surprise = () => {
    const pool = result.items.length ? result.items : CATALOG
    openMovie(pool[Math.floor(Math.random() * pool.length)])
  }

  const submit = (value) => {
    setTerm(value)
    setRecent((r) => addRecent(r, value))
  }

  const useDemo = () => {
    setStoredKey(null)
    setForceDemo(true)
  }

  const loading = remoteMode && remote.loading
  const error = remoteMode ? remote.error : null
  const count = view === 'discover' && remoteMode ? remote.total : result.total
  const heading =
    view === 'favorites'
      ? 'Your favorites'
      : view === 'watchlist'
        ? 'Your watchlist'
        : term.trim()
          ? `Results for “${term.trim()}”`
          : live
            ? `Results for “${DEFAULT_LIVE_QUERY}”`
            : 'All movies'
  const countText = loading || error ? '' : `${count} ${count === 1 ? 'title' : 'titles'}`

  const loadMore = () =>
    remoteMode ? remote.loadMore() : setPageState({ sig: pageSig, page: page + 1 })
  const moreBusy = remoteMode && remote.more.busy

  return (
    <div className="app">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="MovieLand home">
          <span className="brand-mark" aria-hidden="true">
            M
          </span>
          <span className="brand-text">MovieLand</span>
        </a>
        <div className="topbar-actions">
          <button
            type="button"
            className={`mode-pill ${live ? 'live' : ''}`}
            onClick={() => setShowSettings(true)}
            aria-label={`${live ? 'Live OMDb search' : 'Demo data'}. Open settings`}
          >
            <span className="dot" aria-hidden="true" /> {live ? 'Live' : 'Demo'}
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          </button>
          <button type="button" className="icon-btn" onClick={() => setShowSettings(true)} aria-label="Settings">
            <Icon name="gear" />
          </button>
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        <section className="hero" ref={heroRef} id="top" aria-label="Welcome">
          <div className="hero-layer hero-glow" data-depth="0.28" aria-hidden="true" />
          <div className="hero-layer hero-reels" data-depth="0.14" aria-hidden="true">
            <span>🎬</span>
            <span>🍿</span>
            <span>🎞️</span>
            <span>⭐</span>
            <span>🎥</span>
          </div>
          <div className="hero-copy" data-depth="0.06" data-fade>
            <h1>Find your next favorite movie</h1>
            <p>
              Search, filter and save films to your favorites and watchlist.
              {live
                ? ' Searching the full OMDb database.'
                : ' Browsing a built-in catalogue of 60 classics. No account or key needed.'}
            </p>
          </div>
        </section>

        <div className="search-wrap">
          <SearchBox
            value={query}
            onChange={setQuery}
            onSubmit={submit}
            suggestions={suggestions}
            placeholder={live ? 'Search the OMDb database (press / to focus)' : 'Try “Nolan”, “Godfather” or “animation”'}
          />
          <button type="button" className="btn surprise" onClick={surprise}>
            <Icon name="star" size={16} /> Surprise me
          </button>
          {recent.length > 0 && (
            <div className="recent">
              <span className="recent-label" id="recent-label">
                Recent
              </span>
              <ul aria-labelledby="recent-label">
                {recent.map((r) => (
                  <li key={r}>
                    <button
                      type="button"
                      className="chip"
                      onClick={() => {
                        setQuery(r)
                        setView('discover')
                        submit(r)
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

        <Reveal as="div" className="toolbar">
          <nav className="tabs" aria-label="Library">
            {VIEWS.map(([id, label]) => {
              const n = id === 'favorites' ? favorites.length : id === 'watchlist' ? watchlist.length : null
              return (
                <button
                  key={id}
                  type="button"
                  className="tab"
                  aria-pressed={view === id}
                  onClick={() => setView(id)}
                >
                  {label}
                  {n != null && <span className="tab-count">{n}</span>}
                </button>
              )
            })}
          </nav>
          <Filters
            filters={activeFilters}
            onChange={setFilters}
            remote={remoteMode}
            onReset={() => setFilters(DEFAULT_FILTERS)}
          />
        </Reveal>

        <section className="results" aria-labelledby="results-heading" aria-busy={loading}>
          <div className="results-head">
            <h2 id="results-heading">{heading}</h2>
            <p className="count" role="status">
              {countText}
            </p>
          </div>

          {loading ? (
            <SkeletonGrid />
          ) : error ? (
            <ErrorState
              error={error}
              onRetry={remote.retry}
              onSettings={() => setShowSettings(true)}
              onDemo={useDemo}
            />
          ) : result.items.length === 0 ? (
            <EmptyState
              title={
                view === 'favorites'
                  ? 'No favorites yet'
                  : view === 'watchlist'
                    ? 'Your watchlist is empty'
                    : 'No movies found'
              }
              action={
                view === 'discover' ? (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      setQuery('')
                      setTerm('')
                      setFilters(DEFAULT_FILTERS)
                    }}
                  >
                    Clear search and filters
                  </button>
                ) : (
                  <button type="button" className="btn" onClick={() => setView('discover')}>
                    Browse movies
                  </button>
                )
              }
            >
              {view === 'discover'
                ? 'Try a different title, director or actor, or loosen the filters.'
                : 'Use the heart or bookmark on any movie to save it here. Saved titles stay in this browser.'}
            </EmptyState>
          ) : (
            <>
              <ul className="grid">
                {result.items.map((m, i) => (
                  <MovieCard
                    key={m.id}
                    movie={m}
                    index={i}
                    tilt={motion.tilt}
                    isFav={favIds.has(m.id)}
                    isWatch={watchIds.has(m.id)}
                    onOpen={openMovie}
                    onFav={toggleFav}
                    onWatch={toggleWatch}
                  />
                ))}
              </ul>
              {remoteMode && remote.more.error && (
                <p className="note center" role="alert">
                  Could not load more: {remote.more.error.message}
                </p>
              )}
              {result.hasMore && (
                <div className="more">
                  <button type="button" className="btn btn-primary" onClick={loadMore} disabled={moreBusy}>
                    {moreBusy ? 'Loading...' : `Load more${remoteMode ? '' : ` (${PAGE_SIZE} at a time)`}`}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <footer className="footer">
        <p>
          {live ? 'Live data from ' : 'Demo catalogue with illustrated posters. Live search powered by '}
          <a href="https://www.omdbapi.com/" target="_blank" rel="noopener noreferrer">
            OMDb<span className="sr-only"> (opens in a new tab)</span>
          </a>
          .
        </p>
      </footer>

      <p className="sr-only" role="status">
        {announce}
      </p>

      {selected && (
        <MovieModal
          movie={selected}
          apiKey={apiKey}
          onClose={closeMovie}
          isFav={favIds.has(selected.id)}
          isWatch={watchIds.has(selected.id)}
          onFav={toggleFav}
          onWatch={toggleWatch}
        />
      )}
      {showSettings && (
        <SettingsDialog
          storedKey={storedKey}
          envActive={!!ENV_KEY && !forceDemo}
          onSave={(k) => {
            setForceDemo(false)
            setStoredKey(k)
          }}
          onClear={() => setStoredKey(null)}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import './pages.css'
import { CATALOG } from './data/movies.js'
import { useLocalStorage, useMotion } from './hooks.js'
import { ENV_KEY } from './lib/omdb.js'
import { NAV } from './lib/route.js'
import { addRecent } from './lib/logic.js'
import { remember } from './registry.js'
import { useRouter } from './router.js'
import { AppCtx, LibraryProvider } from './context.jsx'
import Icon from './components/Icon.jsx'
import MovieModal from './components/MovieModal.jsx'
import SettingsDialog from './components/SettingsDialog.jsx'
import ShortcutsDialog from './components/ShortcutsDialog.jsx'
import { EmptyState } from './components/States.jsx'
import Home from './pages/Home.jsx'
import Browse from './pages/Browse.jsx'
import Lists from './pages/Lists.jsx'
import Diary from './pages/Diary.jsx'
import Stats from './pages/Stats.jsx'
import Person from './pages/Person.jsx'
import Compare from './pages/Compare.jsx'
import Night from './pages/Night.jsx'
import Quiz from './pages/Quiz.jsx'
import Shared from './pages/Shared.jsx'

const TITLES = {
  home: 'Search, filter and save movies',
  browse: 'Browse movies',
  lists: 'My lists',
  diary: 'Diary',
  stats: 'Your stats',
  night: 'Movie night picker',
  quiz: 'Guess the movie',
  compare: 'Compare two movies',
  shared: 'Shared list',
  person: 'People',
  notfound: 'Page not found',
}

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

function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => {
      window.removeEventListener('online', up)
      window.removeEventListener('offline', down)
    }
  }, [])
  return online
}

function Shell() {
  const motion = useMotion()
  const online = useOnline()
  const [theme, toggleTheme] = useTheme()
  const [storedKey, setStoredKey] = useLocalStorage('ml:key', null)
  const [forceSample, setForceSample] = useState(false)
  const apiKey = forceSample ? '' : storedKey || ENV_KEY
  const live = !!apiKey
  const [recent, setRecent] = useLocalStorage('ml:recent', [])

  const { route, modalId, navigate, openMovie: openId, closeMovie } = useRouter()
  const [showSettings, setShowSettings] = useState(false)
  const [showKeys, setShowKeys] = useState(false)
  const [installEvent, setInstallEvent] = useState(null)
  const firstRoute = useRef(true)

  const openMovie = useCallback(
    (movie) => {
      remember(movie)
      openId(movie.id)
    },
    [openId],
  )
  const surprise = useCallback(() => openMovie(CATALOG[Math.floor(Math.random() * CATALOG.length)]), [openMovie])
  const rememberSearch = useCallback((v) => setRecent((r) => addRecent(r, v)), [setRecent])

  // per-page title, scroll to top and move focus to the page heading after navigation
  useEffect(() => {
    const name = route.name === 'person' ? route.arg : TITLES[route.name]
    document.title = route.name === 'home' ? `MovieLand | ${TITLES.home}` : `${name} | MovieLand`
    if (firstRoute.current) {
      firstRoute.current = false
      return
    }
    window.scrollTo(0, 0)
    if (!route.query.focus) requestAnimationFrame(() => document.getElementById('page-title')?.focus({ preventScroll: true }))
  }, [route])

  useEffect(() => {
    const on = (e) => {
      e.preventDefault()
      setInstallEvent(e)
    }
    window.addEventListener('beforeinstallprompt', on)
    window.addEventListener('appinstalled', () => setInstallEvent(null))
    return () => window.removeEventListener('beforeinstallprompt', on)
  }, [])

  // keyboard shortcuts
  const chord = useRef(0)
  useEffect(() => {
    const GO = { h: '#/', b: '#/browse', l: '#/lists', d: '#/diary', s: '#/stats', n: '#/night', q: '#/quiz', c: '#/compare' }
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const tag = e.target.tagName
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || e.target.isContentEditable) return
      if (document.querySelector('dialog[open]') && e.key !== '?') return
      if (e.key === '/') {
        e.preventDefault()
        const input = document.querySelector('[data-search-input]')
        if (input) input.focus()
        else navigate('#/browse?focus=1')
      } else if (e.key === '?') {
        e.preventDefault()
        setShowKeys((s) => !s)
      } else if (e.key === 't') toggleTheme()
      else if (e.key === 'r' && route.name !== 'quiz') surprise()
      else if (e.key === 'g') chord.current = Date.now()
      else if (GO[e.key] && Date.now() - chord.current < 1200) {
        chord.current = 0
        navigate(GO[e.key])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const ctx = useMemo(
    () => ({ motion, live, apiKey, navigate, openMovie, surprise, recent, setRecent, rememberSearch }),
    [motion, live, apiKey, navigate, openMovie, surprise, recent, setRecent, rememberSearch],
  )

  const useSample = () => {
    setStoredKey(null)
    setForceSample(true)
  }
  const query = route.query
  const queryKey = JSON.stringify(query)

  let page
  switch (route.name) {
    case 'home':
      page = <Home />
      break
    case 'browse':
      page = <Browse key={queryKey} query={query} apiKey={apiKey} live={live} onSettings={() => setShowSettings(true)} onSampleOnly={useSample} />
      break
    case 'lists':
      page = <Lists key={queryKey} query={query} />
      break
    case 'diary':
      page = <Diary />
      break
    case 'stats':
      page = <Stats />
      break
    case 'person':
      page = <Person key={route.arg} name={route.arg} />
      break
    case 'compare':
      page = <Compare key={queryKey} query={query} />
      break
    case 'night':
      page = <Night key={queryKey} query={query} />
      break
    case 'quiz':
      page = <Quiz />
      break
    case 'shared':
      page = <Shared key={queryKey} query={query} apiKey={apiKey} />
      break
    default:
      page = (
        <div className="page">
          <h1 id="page-title" tabIndex={-1}>
            Page not found
          </h1>
          <EmptyState
            title="This reel is missing"
            action={
              <a className="btn btn-primary" href="#/">
                Back to the home page
              </a>
            }
          >
            That page does not exist.
          </EmptyState>
        </div>
      )
  }

  const navActive = route.name === 'person' ? 'browse' : route.name

  return (
    <AppCtx.Provider value={ctx}>
      <div className="app">
        <a
          className="skip"
          href="#main"
          onClick={(e) => {
            e.preventDefault()
            document.getElementById('main')?.focus()
          }}
        >
          Skip to content
        </a>
        <div className="sticky-head">
        <header className="topbar">
          <a className="brand" href="#/" aria-label="MovieLand home">
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
              aria-label={`${live ? 'Live OMDb search' : 'Sample catalogue'}. Open settings`}
            >
              <span className="dot" aria-hidden="true" /> {live ? 'Live' : 'Sample'}
            </button>
            <button type="button" className="icon-btn kbd-btn" onClick={() => setShowKeys(true)} aria-label="Keyboard shortcuts">
              <Icon name="keyboard" />
            </button>
            <button type="button" className="icon-btn" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
            </button>
            <button type="button" className="icon-btn" onClick={() => setShowSettings(true)} aria-label="Settings">
              <Icon name="gear" />
            </button>
          </div>
        </header>
        <nav className="main-nav" aria-label="Main">
          <ul>
            {NAV.map(([id, label, href]) => (
              <li key={id}>
                <a href={href} aria-current={navActive === id ? 'page' : undefined}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        </div>
        {!online && (
          <p className="offline" role="status">
            You are offline. The sample catalogue and your lists still work; live search needs a connection.
          </p>
        )}

        <main id="main" tabIndex={-1}>
          {page}
        </main>

        <footer className="footer">
          <p>
            {live ? 'Live data from ' : 'Sample catalogue with illustrated posters. Live search powered by '}
            <a href="https://www.omdbapi.com/" target="_blank" rel="noopener noreferrer">
              OMDb<span className="sr-only"> (opens in a new tab)</span>
            </a>
            . Your lists, ratings and diary stay in this browser.
          </p>
          <p className="footer-actions">
            <button type="button" className="link-btn" onClick={() => setShowKeys(true)}>
              Keyboard shortcuts
            </button>
            {installEvent && (
              <button
                type="button"
                className="link-btn"
                onClick={async () => {
                  installEvent.prompt()
                  await installEvent.userChoice.catch(() => {})
                  setInstallEvent(null)
                }}
              >
                Install the app
              </button>
            )}
          </p>
        </footer>

        {modalId && <MovieModal id={modalId} apiKey={apiKey} onClose={closeMovie} />}
        {showSettings && (
          <SettingsDialog
            storedKey={storedKey}
            envActive={!!ENV_KEY && !forceSample}
            onSave={(k) => {
              setForceSample(false)
              setStoredKey(k)
            }}
            onClear={() => setStoredKey(null)}
            onClose={() => setShowSettings(false)}
          />
        )}
        {showKeys && <ShortcutsDialog onClose={() => setShowKeys(false)} />}
      </div>
    </AppCtx.Provider>
  )
}

export default function App() {
  return (
    <LibraryProvider>
      <Shell />
    </LibraryProvider>
  )
}

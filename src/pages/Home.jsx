import { useMemo, useRef, useState } from 'react'
import { CATALOG, DECADES } from '../data/movies.js'
import { useParallax } from '../hooks.js'
import { useApp, useLib } from '../context.jsx'
import { suggestTitles } from '../lib/logic.js'
import { becauseYouLiked, curatedRows, decadeRow, topPeople } from '../lib/recommend.js'
import { buildHash } from '../lib/route.js'
import Icon from '../components/Icon.jsx'
import SearchBox from '../components/SearchBox.jsx'
import Row from '../components/Row.jsx'

export default function Home() {
  const { motion, live, navigate, surprise, recent, setRecent, rememberSearch } = useApp()
  const { lib, get } = useLib()
  const heroRef = useRef(null)
  useParallax(heroRef, motion.parallax)
  const [query, setQuery] = useState('')
  const [decade, setDecade] = useState(1990)

  const go = (value) => {
    rememberSearch(value)
    navigate(buildHash('browse', { query: { q: value.trim() } }))
  }

  const rows = useMemo(() => curatedRows(CATALOG), [])
  const watchedIds = useMemo(() => new Set(lib.lists.find((l) => l.id === 'watched').ids), [lib.lists])
  const watchlist = useMemo(
    () => lib.lists.find((l) => l.id === 'watchlist').ids.map(get).filter(Boolean).slice(0, 12),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lib],
  )
  const seeds = useMemo(() => {
    const liked = new Map()
    const add = (id) => {
      const m = get(id)
      if (m && m.source !== 'omdb') liked.set(id, m)
    }
    Object.entries(lib.mine)
      .filter(([, v]) => v.rating >= 4)
      .sort((a, b) => b[1].rating - a[1].rating)
      .forEach(([id]) => add(id))
    lib.lists.find((l) => l.id === 'favorites').ids.forEach(add)
    return [...liked.values()].slice(0, 6)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lib])
  const because = useMemo(() => becauseYouLiked(seeds, CATALOG, { exclude: watchedIds }), [seeds, watchedIds])
  const directors = useMemo(() => topPeople(CATALOG, 'director', 2, 10), [])

  return (
    <>
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
          <h1 id="page-title" tabIndex={-1}>
            Find your next favorite movie
          </h1>
          <p>
            Search, filter, rate and keep track of what you watch.
            {live
              ? ' Searching the full OMDb database.'
              : ` Browsing a built-in sample catalogue of ${CATALOG.length} classics. No account or key needed.`}
          </p>
        </div>
      </section>

      <div className="search-wrap">
        <SearchBox
          value={query}
          onChange={setQuery}
          onSubmit={go}
          suggestions={live ? [] : suggestTitles(CATALOG, query)}
          placeholder={live ? 'Search the OMDb database (press / to focus)' : 'Try “Nolan”, “Godfather” or “animation”'}
        />
        <div className="search-extras">
          <button type="button" className="btn surprise" onClick={surprise}>
            <Icon name="dice" size={16} /> Surprise me
          </button>
          <a className="btn" href="#/night">
            Movie night picker
          </a>
          <a className="btn" href="#/quiz">
            Play the quiz
          </a>
        </div>
        {recent.length > 0 && (
          <div className="recent">
            <span className="recent-label" id="recent-label">
              Recent
            </span>
            <ul aria-labelledby="recent-label">
              {recent.map((r) => (
                <li key={r}>
                  <button type="button" className="chip" onClick={() => go(r)}>
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

      <div className="page home-rows">
        {watchlist.length > 0 && <Row id="watchlist" title="From your watchlist" items={watchlist} link="#/lists?list=watchlist" />}
        {because.map((b) => (
          <Row key={b.seed.id} id={`because-${b.seed.id}`} title={`Because you liked ${b.seed.title}`} items={b.items} />
        ))}
        {rows.slice(0, 2).map((r) => (
          <Row key={r.id} id={r.id} title={r.title} blurb={r.blurb} items={r.items} link={r.link} />
        ))}
        <Row id="decade" title="Browse by decade" items={decadeRow(CATALOG, decade)} link={buildHash('browse', { query: { decade, sort: 'rating' } })}>
          <div className="chip-row" role="group" aria-label="Choose a decade">
            {[...DECADES].reverse().map((d) => (
              <button key={d} type="button" className="chip" aria-pressed={decade === d} onClick={() => setDecade(d)}>
                {d}s
              </button>
            ))}
          </div>
        </Row>
        {rows.slice(2).map((r) => (
          <Row key={r.id} id={r.id} title={r.title} blurb={r.blurb} items={r.items} link={r.link} />
        ))}
        <section className="row" aria-labelledby="row-people">
          <div className="row-head">
            <div>
              <h2 id="row-people">Directors to explore</h2>
              <p className="muted">Open a filmography.</p>
            </div>
          </div>
          <ul className="chip-row">
            {directors.map((p) => (
              <li key={p.name}>
                <a className="chip chip-link" href={buildHash('person', { arg: p.name })}>
                  {p.name} <span className="tab-count">{p.count}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}

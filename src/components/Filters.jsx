import { useState } from 'react'
import { DECADES, GENRES, LANGUAGE_LIST } from '../data/movies.js'
import { DEFAULT_FILTERS } from '../lib/logic.js'

const SORTS = [
  ['relevance', 'Best match'],
  ['rating', 'Rating (highest)'],
  ['year-desc', 'Year (newest)'],
  ['year-asc', 'Year (oldest)'],
  ['runtime-asc', 'Runtime (shortest)'],
  ['runtime-desc', 'Runtime (longest)'],
  ['title', 'Title (A to Z)'],
]

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  )
}

function activeCount(filters, remote) {
  const keys = remote ? ['type', 'year'] : ['decade', 'yearFrom', 'yearTo', 'minRuntime', 'maxRuntime', 'minRating', 'maxRating', 'language', 'status']
  return keys.filter((k) => filters[k] !== DEFAULT_FILTERS[k]).length + (remote ? 0 : filters.genres.length)
}

// remote = live OMDb results (type/year are sent to the API); otherwise the full local filter set.
export default function Filters({ filters, onChange, remote, onReset }) {
  const set = (k) => (e) => onChange({ ...filters, [k]: e.target.value })
  const num = (k) => (e) => onChange({ ...filters, [k]: e.target.value.replace(/\D/g, '') })
  const dirty = Object.entries(DEFAULT_FILTERS).some(([k, v]) => JSON.stringify(filters[k]) !== JSON.stringify(v))
  const n = activeCount(filters, remote)
  const [open, setOpen] = useState(() => window.matchMedia('(min-width: 720px)').matches)
  const toggleGenre = (g) =>
    onChange({
      ...filters,
      genres: filters.genres.includes(g) ? filters.genres.filter((x) => x !== g) : [...filters.genres, g],
    })

  return (
    <details className="filter-panel" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary>
        Filters and sorting{n > 0 && <span className="tab-count">{n} active</span>}
      </summary>
      <div className="filters" role="group" aria-label="Filters and sorting">
        {remote ? (
          <>
            <Field label="Type">
              <select value={filters.type} onChange={set('type')}>
                <option value="">All types</option>
                <option value="movie">Movies</option>
                <option value="series">Series</option>
              </select>
            </Field>
            <Field label="Year">
              <input type="text" inputMode="numeric" maxLength={4} placeholder="e.g. 2010" value={filters.year} onChange={num('year')} />
            </Field>
          </>
        ) : (
          <>
            <fieldset className="genre-set">
              <legend>
                Genres
                <span className="seg" role="group" aria-label="Genre matching">
                  <button type="button" aria-pressed={filters.genreMode === 'all'} onClick={() => onChange({ ...filters, genreMode: 'all' })}>
                    Match all
                  </button>
                  <button type="button" aria-pressed={filters.genreMode === 'any'} onClick={() => onChange({ ...filters, genreMode: 'any' })}>
                    Match any
                  </button>
                </span>
              </legend>
              <div className="chip-row">
                {GENRES.map((g) => (
                  <button key={g} type="button" className="chip" aria-pressed={filters.genres.includes(g)} onClick={() => toggleGenre(g)}>
                    {g}
                  </button>
                ))}
              </div>
            </fieldset>
            <Field label="Decade">
              <select value={filters.decade} onChange={set('decade')}>
                <option value="">Any decade</option>
                {DECADES.map((d) => (
                  <option key={d} value={d}>
                    {d}s
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Year from">
              <input type="text" inputMode="numeric" maxLength={4} placeholder="1940" value={filters.yearFrom} onChange={num('yearFrom')} />
            </Field>
            <Field label="Year to">
              <input type="text" inputMode="numeric" maxLength={4} placeholder="2025" value={filters.yearTo} onChange={num('yearTo')} />
            </Field>
            <Field label="Runtime at least (min)">
              <input type="text" inputMode="numeric" maxLength={3} placeholder="e.g. 90" value={filters.minRuntime} onChange={num('minRuntime')} />
            </Field>
            <Field label="Runtime at most (min)">
              <input type="text" inputMode="numeric" maxLength={3} placeholder="e.g. 120" value={filters.maxRuntime} onChange={num('maxRuntime')} />
            </Field>
            <Field label="Min rating">
              <select value={filters.minRating} onChange={set('minRating')}>
                <option value="">Any rating</option>
                {[9, 8.5, 8, 7.5, 7].map((r) => (
                  <option key={r} value={r}>
                    {r}+
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Max rating">
              <select value={filters.maxRating} onChange={set('maxRating')}>
                <option value="">No limit</option>
                {[8.3, 8.5, 9].map((r) => (
                  <option key={r} value={r}>
                    up to {r}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Language">
              <select value={filters.language} onChange={set('language')}>
                <option value="">Any language</option>
                {LANGUAGE_LIST.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select value={filters.status} onChange={set('status')}>
                <option value="">All films</option>
                <option value="unwatched">Not seen yet</option>
                <option value="watched">Seen</option>
              </select>
            </Field>
          </>
        )}
        <Field label="Sort by">
          <select value={filters.sort} onChange={set('sort')}>
            {SORTS.filter(([v]) => !remote || ['relevance', 'year-desc', 'year-asc', 'title'].includes(v)).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Field>
        <button type="button" className="btn btn-ghost" onClick={onReset} disabled={!dirty}>
          Reset
        </button>
      </div>
    </details>
  )
}

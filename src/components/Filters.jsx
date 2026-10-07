import { DECADES, GENRES } from '../data/movies.js'
import { DEFAULT_FILTERS } from '../lib/logic.js'

const SORTS = [
  ['relevance', 'Best match'],
  ['title', 'Title (A to Z)'],
  ['year-desc', 'Year (newest)'],
  ['year-asc', 'Year (oldest)'],
]

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  )
}

// remote = live OMDb results (type/year are sent to the API); otherwise local lists (genre/decade/rating).
export default function Filters({ filters, onChange, remote, onReset }) {
  const set = (k) => (e) => onChange({ ...filters, [k]: e.target.value })
  const dirty = Object.entries(DEFAULT_FILTERS).some(([k, v]) => filters[k] !== v)
  return (
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
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder="e.g. 2010"
              value={filters.year}
              onChange={(e) => onChange({ ...filters, year: e.target.value.replace(/\D/g, '') })}
            />
          </Field>
        </>
      ) : (
        <>
          <Field label="Genre">
            <select value={filters.genre} onChange={set('genre')}>
              <option value="">All genres</option>
              {GENRES.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </Field>
          <Field label="Decade">
            <select value={filters.decade} onChange={set('decade')}>
              <option value="">Any year</option>
              {DECADES.map((d) => (
                <option key={d} value={d}>
                  {d}s
                </option>
              ))}
            </select>
          </Field>
          <Field label="Min rating">
            <select value={filters.minRating} onChange={set('minRating')}>
              <option value="">Any rating</option>
              {[9, 8.5, 8, 7].map((r) => (
                <option key={r} value={r}>
                  {r}+
                </option>
              ))}
            </select>
          </Field>
        </>
      )}
      <Field label="Sort by">
        <select value={filters.sort} onChange={set('sort')}>
          {SORTS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
          {!remote && <option value="rating">Rating (highest)</option>}
        </select>
      </Field>
      <button type="button" className="btn btn-ghost" onClick={onReset} disabled={!dirty}>
        Reset
      </button>
    </div>
  )
}

import { ERROR_COPY } from '../lib/omdb.js'

export function SkeletonGrid({ count = 12 }) {
  return (
    <ul className="grid" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="skeleton-card">
          <div className="skeleton sk-poster" />
          <div className="skeleton sk-line" />
          <div className="skeleton sk-line short" />
        </li>
      ))}
    </ul>
  )
}

const TITLES = {
  'invalid-key': 'Invalid API key',
  'rate-limit': 'Request limit reached',
  network: 'You seem to be offline',
  'too-many': 'Keep typing',
  api: 'Something went wrong',
}

export function ErrorState({ error, onRetry, onSettings, onDemo }) {
  const kind = error.kind || 'api'
  return (
    <div className="state" role="alert">
      <h3>{TITLES[kind] || TITLES.api}</h3>
      <p>{ERROR_COPY[kind] || error.message}</p>
      <div className="state-actions">
        {kind !== 'too-many' && (
          <button type="button" className="btn btn-primary" onClick={onRetry}>
            Try again
          </button>
        )}
        {(kind === 'invalid-key' || kind === 'rate-limit') && (
          <button type="button" className="btn" onClick={onSettings}>
            Open settings
          </button>
        )}
        {kind !== 'too-many' && (
          <button type="button" className="btn" onClick={onDemo}>
            Use demo data
          </button>
        )}
      </div>
    </div>
  )
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="state">
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  )
}

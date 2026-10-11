import { useId } from 'react'
import Icon from './Icon.jsx'

// Five-star input built from native radio buttons: arrow keys, screen readers and forms just work.
export function StarInput({ value = 0, onChange, legend = 'Your rating' }) {
  const name = useId()
  return (
    <fieldset className="stars">
      <legend>{legend}</legend>
      <div className="stars-row">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className={n <= value ? 'on' : ''}>
            <input type="radio" name={name} checked={value === n} onChange={() => onChange(n)} />
            <Icon name="star" size={26} fill={n <= value} />
            <span className="sr-only">
              {n} star{n > 1 ? 's' : ''}
            </span>
          </label>
        ))}
        {value > 0 && (
          <button type="button" className="link-btn" onClick={() => onChange(0)}>
            Clear
          </button>
        )}
      </div>
    </fieldset>
  )
}

export function StarsStatic({ value, size = 14 }) {
  if (!value) return null
  return (
    <span className="stars-static" role="img" aria-label={`Your rating: ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon key={n} name="star" size={size} fill={n <= value} />
      ))}
    </span>
  )
}

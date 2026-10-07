import { useId, useState } from 'react'
import Icon from './Icon.jsx'

// Accessible combobox: arrow keys move through suggestions, Enter picks / submits, Esc closes then clears.
export default function SearchBox({ value, onChange, onSubmit, suggestions, placeholder }) {
  const id = useId()
  const listId = `${id}-list`
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const showList = open && suggestions.length > 0
  const idx = active < suggestions.length ? active : -1

  const pick = (title) => {
    setOpen(false)
    setActive(-1)
    onChange(title)
    onSubmit(title)
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!suggestions.length) return
      e.preventDefault()
      setOpen(true)
      const n = suggestions.length
      setActive(e.key === 'ArrowDown' ? (idx + 1) % n : idx <= 0 ? n - 1 : idx - 1)
    } else if (e.key === 'Escape') {
      if (showList) {
        e.preventDefault()
        setOpen(false)
        setActive(-1)
      } else if (value) {
        e.preventDefault()
        onChange('')
      }
    }
  }

  return (
    <form
      className="searchbox"
      role="search"
      onSubmit={(e) => {
        e.preventDefault()
        if (showList && idx >= 0) pick(suggestions[idx])
        else {
          setOpen(false)
          onSubmit(value)
        }
      }}
    >
      <label htmlFor={`${id}-input`} className="sr-only">
        Search movies by title, director or actor
      </label>
      <span className="searchbox-icon">
        <Icon name="search" />
      </span>
      <input
        id={`${id}-input`}
        data-search-input
        type="text"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && idx >= 0 ? `${id}-opt-${idx}` : undefined}
        autoComplete="off"
        spellCheck="false"
        enterKeyHint="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
          setActive(-1)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
      />
      {value && (
        <button
          type="button"
          className="searchbox-clear"
          aria-label="Clear search"
          onClick={() => {
            onChange('')
            document.getElementById(`${id}-input`)?.focus()
          }}
        >
          <Icon name="close" size={18} />
        </button>
      )}
      <button type="submit" className="btn btn-primary searchbox-go">
        Search
      </button>
      <ul id={listId} role="listbox" aria-label="Suggestions" className="suggestions" hidden={!showList}>
        {suggestions.map((s, i) => (
          <li
            key={s}
            id={`${id}-opt-${i}`}
            role="option"
            aria-selected={i === idx}
            className={i === idx ? 'active' : ''}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => pick(s)}
          >
            {s}
          </li>
        ))}
      </ul>
      <span className="sr-only" role="status">
        {showList ? `${suggestions.length} suggestions available. Use up and down arrow keys.` : ''}
      </span>
    </form>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import { CATALOG } from '../data/movies.js'
import { useApp, useLib } from '../context.jsx'
import {
  createList,
  deleteList,
  diaryToCSV,
  emptyLibrary,
  encodeShare,
  exportJSON,
  importCSV,
  importJSON,
  listsToCSV,
  moveInList,
  renameList,
  uid,
} from '../lib/library.js'
import { download, readFile } from '../lib/file.js'
import Icon from '../components/Icon.jsx'
import Poster from '../components/Poster.jsx'
import { StarsStatic } from '../components/Stars.jsx'
import { EmptyState } from '../components/States.jsx'

const SORTS = [
  ['manual', 'My order (drag to reorder)'],
  ['title', 'Title (A to Z)'],
  ['year', 'Year (newest)'],
  ['rating', 'IMDb rating'],
  ['mine', 'My rating'],
]

export default function Lists({ query }) {
  const { lib, setLib, get, say } = useLib()
  const { openMovie, navigate } = useApp()
  const [activeId, setActiveId] = useState(query.list || 'watchlist')
  const [sort, setSort] = useState('manual')
  const [newName, setNewName] = useState('')
  const [renaming, setRenaming] = useState(null)
  const [drag, setDrag] = useState({ from: null, over: null })
  const [announce, setAnnounce] = useState('')
  const [backup, setBackup] = useState({ kind: '', msg: '' })
  const [mode, setMode] = useState('merge')
  const fileRef = useRef(null)

  const list = lib.lists.find((l) => l.id === activeId) || lib.lists[0]
  const items = useMemo(() => {
    const rows = list.ids.map((id) => ({ id, movie: get(id) })).filter((r) => r.movie)
    const key = {
      title: (a, b) => a.movie.title.localeCompare(b.movie.title),
      year: (a, b) => (b.movie.year ?? 0) - (a.movie.year ?? 0),
      rating: (a, b) => (b.movie.rating ?? -1) - (a.movie.rating ?? -1),
      mine: (a, b) => (lib.mine[b.id]?.rating ?? 0) - (lib.mine[a.id]?.rating ?? 0),
    }[sort]
    return key ? [...rows].sort(key) : rows
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, sort, lib])
  const manual = sort === 'manual'

  const pendingFocus = useRef(null)
  const move = (fi, ti, via) => {
    if (ti < 0 || ti >= items.length) return
    const from = list.ids.indexOf(items[fi].id)
    const to = list.ids.indexOf(items[ti].id)
    setLib((l) => moveInList(l, list.id, from, to))
    setAnnounce(`${items[fi].movie.title} moved to position ${ti + 1} of ${items.length}`)
    if (via) pendingFocus.current = [items[fi].id, via]
  }
  useEffect(() => {
    if (!pendingFocus.current) return
    const [id, dir] = pendingFocus.current
    pendingFocus.current = null
    const q = (d) => document.querySelector(`button[data-mv="${id}-${d}"]:not(:disabled)`)
    ;(q(dir) || q(dir === 'up' ? 'down' : 'up'))?.focus()
  }, [list.ids])
  const create = (e) => {
    e.preventDefault()
    const id = uid('l')
    const next = createList(lib, newName, id)
    if (next === lib) return say(newName.trim() ? 'A list with that name already exists' : 'Enter a list name')
    setLib(next)
    setActiveId(id)
    setNewName('')
    say(`Created list ${newName.trim()}`)
  }
  const shareLink = async () => {
    const url = `${location.origin}${location.pathname}#/shared?d=${encodeShare(list.name, list.ids)}`
    try {
      await navigator.clipboard.writeText(url)
      say('Share link copied to clipboard')
    } catch {
      window.prompt('Copy this link', url)
    }
  }

  const doImport = async (file) => {
    if (!file) return
    try {
      const text = await readFile(file)
      if (/\.csv$/i.test(file.name) || (!text.trim().startsWith('{') && text.includes(','))) {
        const r = importCSV(lib, text, CATALOG)
        setLib(r.lib)
        setBackup({ kind: 'ok', msg: `Imported ${r.added} row${r.added === 1 ? '' : 's'}${r.skipped ? `, ${r.skipped} could not be matched to a title` : ''}.` })
      } else {
        if (mode === 'replace' && !window.confirm('Replace all your lists, ratings and diary with this backup?')) return
        setLib(importJSON(lib, text, mode))
        setBackup({ kind: 'ok', msg: `Backup ${mode === 'replace' ? 'restored' : 'merged'}.` })
      }
    } catch (e) {
      setBackup({ kind: 'error', msg: e.message })
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="page">
      <h1 id="page-title" tabIndex={-1}>
        My lists
      </h1>
      <div className="lists-layout">
        <nav className="lists-nav" aria-label="Your lists">
          <ul>
            {lib.lists.map((l) => (
              <li key={l.id}>
                <button type="button" className="list-tab" aria-current={l.id === list.id ? 'true' : undefined} onClick={() => { setActiveId(l.id); setRenaming(null) }}>
                  <span>{l.name}</span>
                  <span className="tab-count">{l.ids.length}</span>
                </button>
              </li>
            ))}
          </ul>
          <form className="inline-form" onSubmit={create}>
            <label htmlFor="new-list" className="sr-only">
              New list name
            </label>
            <input id="new-list" value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={60} placeholder="New list name" />
            <button type="submit" className="btn">
              <Icon name="plus" size={16} /> Add
            </button>
          </form>
        </nav>

        <section className="list-panel" aria-labelledby="list-title">
          <div className="list-head">
            {renaming !== null ? (
              <form
                className="inline-form grow"
                onSubmit={(e) => {
                  e.preventDefault()
                  const next = renameList(lib, list.id, renaming)
                  if (next === lib) say('Pick a different, non-empty name')
                  else {
                    setLib(next)
                    setRenaming(null)
                  }
                }}
              >
                <label htmlFor="rename" className="sr-only">
                  List name
                </label>
                <input id="rename" value={renaming} onChange={(e) => setRenaming(e.target.value)} maxLength={60} autoFocus />
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
                <button type="button" className="btn" onClick={() => setRenaming(null)}>
                  Cancel
                </button>
              </form>
            ) : (
              <h2 id="list-title">{list.name}</h2>
            )}
            <div className="list-actions">
              {!list.system && renaming === null && (
                <>
                  <button type="button" className="btn" onClick={() => setRenaming(list.name)}>
                    <Icon name="edit" size={16} /> Rename
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => {
                      if (window.confirm(`Delete the list "${list.name}"? The films themselves are not deleted.`)) {
                        setLib(deleteList(lib, list.id))
                        setActiveId('watchlist')
                        say('List deleted')
                      }
                    }}
                  >
                    <Icon name="trash" size={16} /> Delete
                  </button>
                </>
              )}
              <button type="button" className="btn" onClick={shareLink} disabled={!list.ids.length}>
                <Icon name="share" size={16} /> Share list
              </button>
            </div>
          </div>

          <label className="field sort-field">
            <span>Order</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              {SORTS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>

          {items.length === 0 ? (
            <EmptyState
              title={`${list.name} is empty`}
              action={
                <button type="button" className="btn" onClick={() => navigate('#/browse')}>
                  Browse movies
                </button>
              }
            >
              Use the heart, bookmark or eye on any movie, or the Add to list button in its details.
            </EmptyState>
          ) : (
            <ol className="list-rows">
              {items.map(({ id, movie }, i) => (
                <li
                  key={id}
                  className={`list-row ${drag.over === i && drag.from !== null && drag.from !== i ? 'drop-target' : ''} ${drag.from === i ? 'dragging' : ''}`}
                  draggable={manual}
                  onDragStart={(e) => {
                    setDrag({ from: i, over: i })
                    e.dataTransfer.effectAllowed = 'move'
                    e.dataTransfer.setData('text/plain', id)
                  }}
                  onDragOver={(e) => {
                    if (drag.from === null) return
                    e.preventDefault()
                    if (drag.over !== i) setDrag((d) => ({ ...d, over: i }))
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (drag.from !== null && drag.from !== i) move(drag.from, i)
                    setDrag({ from: null, over: null })
                  }}
                  onDragEnd={() => setDrag({ from: null, over: null })}
                >
                  {manual && (
                    <span className="grip" aria-hidden="true" title="Drag to reorder">
                      <Icon name="grip" size={18} />
                    </span>
                  )}
                  <span className="row-index" aria-hidden="true">
                    {i + 1}
                  </span>
                  <Poster movie={movie} className="thumb" />
                  <div className="row-main">
                    <button type="button" className="row-title" onClick={() => openMovie(movie)}>
                      {movie.title}
                    </button>
                    <p className="muted">
                      {[movie.yearLabel || movie.year, movie.genres.slice(0, 2).join(', '), movie.runtime ? `${movie.runtime} min` : null, movie.rating != null ? `IMDb ${movie.rating.toFixed(1)}` : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    <StarsStatic value={lib.mine[id]?.rating} />
                  </div>
                  <div className="row-btns">
                    {manual && (
                      <>
                        <button type="button" className="icon-btn" aria-label={`Move ${movie.title} up`} data-mv={`${id}-up`} disabled={i === 0} onClick={() => move(i, i - 1, 'up')}>
                          <Icon name="up" size={18} />
                        </button>
                        <button type="button" className="icon-btn" aria-label={`Move ${movie.title} down`} data-mv={`${id}-down`} disabled={i === items.length - 1} onClick={() => move(i, i + 1, 'down')}>
                          <Icon name="down" size={18} />
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={`Remove ${movie.title} from ${list.name}`}
                      onClick={() => {
                        setLib((l) => ({ ...l, lists: l.lists.map((x) => (x.id === list.id ? { ...x, ids: x.ids.filter((y) => y !== id) } : x)) }))
                        say(`${movie.title} removed from ${list.name}`)
                      }}
                    >
                      <Icon name="trash" size={18} />
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          )}
          <p className="sr-only" role="status">
            {announce}
          </p>
        </section>
      </div>

      <section className="backup" aria-labelledby="backup-h">
        <h2 id="backup-h">Backup and restore</h2>
        <p className="muted">Everything lives in this browser. Export a copy to keep it safe or move it to another device.</p>
        <div className="list-actions">
          <button type="button" className="btn" onClick={() => download('movieland-backup.json', exportJSON(lib))}>
            <Icon name="download" size={16} /> Backup (JSON)
          </button>
          <button type="button" className="btn" onClick={() => download('movieland-lists.csv', listsToCSV(lib), 'text/csv')}>
            <Icon name="download" size={16} /> Lists (CSV)
          </button>
          <button type="button" className="btn" onClick={() => download('movieland-diary.csv', diaryToCSV(lib), 'text/csv')}>
            <Icon name="download" size={16} /> Diary (CSV)
          </button>
        </div>
        <div className="import-row">
          <label className="field">
            <span>Import a backup (JSON) or CSV</span>
            <input ref={fileRef} type="file" accept=".json,.csv,application/json,text/csv" onChange={(e) => doImport(e.target.files[0])} />
          </label>
          <label className="field">
            <span>JSON import mode</span>
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="merge">Merge with what I have</option>
              <option value="replace">Replace everything</option>
            </select>
          </label>
        </div>
        <p className={`status ${backup.kind === 'error' ? 'status-error' : 'status-ok'}`} role="status">
          {backup.msg}
        </p>
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => {
            if (window.confirm('Erase all lists, ratings, notes and diary entries from this browser?')) {
              setLib(emptyLibrary())
              setActiveId('watchlist')
              say('All data erased')
            }
          }}
        >
          <Icon name="trash" size={16} /> Erase all my data
        </button>
      </section>
    </div>
  )
}

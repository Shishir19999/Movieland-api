/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  addDiary,
  addToList,
  emptyLibrary,
  getList,
  migrateLegacy,
  pruneCache,
  removeFromList,
  resolveMovie,
  sanitizeLibrary,
  setNote,
  setRating,
  snapshot,
  toggleInList,
} from './lib/library.js'
import { remember } from './registry.js'

const LibCtx = createContext(null)
export const AppCtx = createContext(null)
export const useLib = () => useContext(LibCtx)
export const useApp = () => useContext(AppCtx)
const ToastCtx = createContext('')
export const useToastMessage = () => useContext(ToastCtx)

const KEY = 'ml:lib'

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return sanitizeLibrary(JSON.parse(raw))
    const fav = JSON.parse(localStorage.getItem('ml:favorites') || 'null')
    const watch = JSON.parse(localStorage.getItem('ml:watchlist') || 'null')
    if (fav || watch) return migrateLegacy(fav, watch)
  } catch {
    /* unreadable storage: start fresh */
  }
  return emptyLibrary()
}

export function LibraryProvider({ children }) {
  const [lib, setLib] = useState(load)
  const ref = useRef(lib)
  const [toast, setToast] = useState({ id: 0, msg: '' })

  useEffect(() => {
    ref.current = lib
    try {
      localStorage.setItem(KEY, JSON.stringify(pruneCache(lib)))
    } catch {
      /* storage unavailable: keep working in memory */
    }
  }, [lib])

  // keep several open tabs in sync
  useEffect(() => {
    const on = (e) => {
      if (e.key === KEY && e.newValue) {
        try {
          setLib(sanitizeLibrary(JSON.parse(e.newValue)))
        } catch {
          /* ignore */
        }
      }
    }
    window.addEventListener('storage', on)
    return () => window.removeEventListener('storage', on)
  }, [])

  useEffect(() => {
    if (!toast.msg) return
    const t = setTimeout(() => setToast((x) => (x.id === toast.id ? { id: x.id, msg: '' } : x)), 4000)
    return () => clearTimeout(t)
  }, [toast])
  const say = useCallback((msg) => setToast((x) => ({ id: x.id + 1, msg })), [])

  const api = useMemo(() => {
    const listName = (id) => getList(ref.current, id)?.name ?? 'list'
    return {
      lib,
      setLib,
      say,
      get: (id) => resolveMovie(lib, id),
      isIn: (listId, id) => !!getList(lib, listId)?.ids.includes(id),
      toggle(listId, movie) {
        remember(movie)
        const has = getList(ref.current, listId)?.ids.includes(movie.id)
        setLib((l) => toggleInList(l, listId, movie))
        say(`${movie.title} ${has ? 'removed from' : 'added to'} ${listName(listId)}`)
      },
      add(listId, movie) {
        remember(movie)
        setLib((l) => addToList(l, listId, movie))
      },
      remove(listId, movie) {
        setLib((l) => removeFromList(l, listId, movie.id))
      },
      rate(movie, r) {
        setLib((l) => setRating(l, movie.id, r))
      },
      note(movie, text) {
        setLib((l) => setNote(l, movie.id, text))
      },
      refresh(movie) {
        setLib((l) => (l.cache[movie.id] ? { ...l, cache: { ...l.cache, [movie.id]: snapshot(movie) } } : l))
      },
      toggleSeen(movie) {
        remember(movie)
        if (getList(ref.current, 'watched')?.ids.includes(movie.id)) {
          setLib((l) => removeFromList(l, 'watched', movie.id))
          say(`${movie.title} removed from Watched`)
        } else {
          setLib((l) => addDiary(l, movie))
          say(`${movie.title} marked as watched and added to your diary`)
        }
      },
      logView(movie, date, note = '') {
        remember(movie)
        setLib((l) => addDiary(l, movie, date, note))
        say(`Logged ${movie.title} in your diary`)
      },
    }
  }, [lib, say])

  const popRef = useRef(null)
  useEffect(() => {
    const el = popRef.current
    if (!el?.showPopover) return
    try {
      if (toast.msg && !el.matches(':popover-open')) el.showPopover()
      else if (!toast.msg && el.matches(':popover-open')) el.hidePopover()
    } catch {
      /* popover unsupported: the message is still announced to screen readers */
    }
  }, [toast])

  return (
    <LibCtx.Provider value={api}>
      <ToastCtx.Provider value={toast.msg}>
        {children}
        <p className="sr-only" role="status">
          {toast.msg}
        </p>
        <div ref={popRef} popover="manual" className="toast" aria-hidden="true">
          {toast.msg}
        </div>
      </ToastCtx.Provider>
    </LibCtx.Provider>
  )
}

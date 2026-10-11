import { useCallback, useEffect, useRef, useState } from 'react'
import { parseHash } from './lib/route.js'

// Hash router. "#/m/<id>" opens the details dialog on top of whichever page is current.
export function useRouter() {
  const initial = parseHash(location.hash)
  const [state, setState] = useState(() =>
    initial.name === 'movie' ? { route: parseHash(''), modalId: initial.arg } : { route: initial, modalId: null },
  )
  const base = useRef(initial.name === 'movie' ? '#/' : location.hash || '#/')
  const pushed = useRef(false)

  useEffect(() => {
    const sync = () => {
      const p = parseHash(location.hash)
      if (p.name === 'movie') setState((s) => ({ route: s.route, modalId: p.arg }))
      else {
        base.current = location.hash || '#/'
        pushed.current = false
        setState({ route: p, modalId: null })
      }
    }
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  const navigate = useCallback((hash) => {
    if (location.hash === hash || (hash === '#/' && !location.hash)) {
      // same page: re-sync so query changes on the same route still apply
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    } else location.hash = hash
  }, [])

  const modalRef = useRef(state.modalId)
  useEffect(() => {
    modalRef.current = state.modalId
  }, [state.modalId])

  const openMovie = useCallback((id) => {
    const hash = `#/m/${encodeURIComponent(id)}`
    if (modalRef.current) {
      history.replaceState(null, '', hash)
      modalRef.current = id
      setState((s) => ({ route: s.route, modalId: id }))
    } else {
      pushed.current = true
      modalRef.current = id
      location.hash = hash
    }
  }, [])

  const closeMovie = useCallback(() => {
    if (pushed.current) {
      pushed.current = false
      history.back()
    } else {
      history.replaceState(null, '', base.current)
      setState((s) => ({ route: s.route, modalId: null }))
    }
  }, [])

  return { route: state.route, modalId: state.modalId, navigate, openMovie, closeMovie }
}

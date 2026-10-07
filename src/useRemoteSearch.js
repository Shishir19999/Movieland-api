import { useCallback, useEffect, useState } from 'react'
import { searchOmdb } from './lib/omdb.js'

const toError = (e) => ({ kind: e.kind || 'network', message: e.message })

// Live OMDb search. "loading" is derived (the stored result belongs to a different request),
// so no state is set synchronously inside the effect.
export function useRemoteSearch({ enabled, apiKey, term, type, year }) {
  const [retry, setRetry] = useState(0)
  const sig = enabled ? JSON.stringify([apiKey, term, type, year, retry]) : ''
  const [state, setState] = useState({ sig: '', items: [], total: 0, page: 1, error: null })
  const [more, setMore] = useState({ busy: false, error: null })

  useEffect(() => {
    if (!enabled) return
    const ctrl = new AbortController()
    searchOmdb({ key: apiKey, query: term, page: 1, type, year, signal: ctrl.signal })
      .then((r) => setState({ sig, items: r.items, total: r.total, page: 1, error: null }))
      .catch((e) => {
        if (e.name !== 'AbortError') setState({ sig, items: [], total: 0, page: 1, error: toError(e) })
      })
    return () => ctrl.abort()
  }, [enabled, apiKey, term, type, year, sig])

  const current = state.sig === sig
  const loadMore = useCallback(async () => {
    setMore({ busy: true, error: null })
    try {
      const r = await searchOmdb({ key: apiKey, query: term, page: state.page + 1, type, year })
      setState((s) => ({
        ...s,
        page: s.page + 1,
        items: [...s.items, ...r.items.filter((x) => !s.items.some((y) => y.id === x.id))],
      }))
      setMore({ busy: false, error: null })
    } catch (e) {
      setMore({ busy: false, error: toError(e) })
    }
  }, [apiKey, term, type, year, state.page])

  return {
    loading: enabled && !current,
    items: current ? state.items : [],
    total: current ? state.total : 0,
    error: current ? state.error : null,
    hasMore: current && !state.error && state.items.length < state.total,
    more,
    loadMore,
    retry: () => setRetry((n) => n + 1),
  }
}

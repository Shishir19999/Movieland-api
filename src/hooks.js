import { useCallback, useEffect, useRef, useState } from 'react'

export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw == null ? initial : JSON.parse(raw)
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try {
      if (value === null || value === undefined) localStorage.removeItem(key)
      else localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* storage unavailable (private mode / quota): keep working in memory */
    }
  }, [key, value])
  return [value, setValue]
}

const media = (q) => typeof window !== 'undefined' && window.matchMedia(q).matches

// What kinds of motion are allowed right now.
export function getMotion() {
  const reduced = media('(prefers-reduced-motion: reduce)')
  const small = media('(max-width: 640px)')
  const coarse = media('(hover: none), (pointer: coarse)')
  const lowPower =
    (navigator.hardwareConcurrency || 8) <= 2 || (navigator.deviceMemory || 8) <= 2
  return {
    reveal: !reduced && 'IntersectionObserver' in window,
    parallax: !reduced && !small && !lowPower,
    tilt: !reduced && !small && !coarse && !lowPower,
  }
}

const QUERIES = [
  '(prefers-reduced-motion: reduce)',
  '(max-width: 640px)',
  '(hover: none), (pointer: coarse)',
]

export function useMotion() {
  const [motion, setMotion] = useState(getMotion)
  useEffect(() => {
    const lists = QUERIES.map((q) => window.matchMedia(q))
    const update = () => setMotion(getMotion())
    lists.forEach((l) => l.addEventListener('change', update))
    return () => lists.forEach((l) => l.removeEventListener('change', update))
  }, [])
  useEffect(() => {
    document.documentElement.dataset.motion = motion.reveal ? 'on' : 'off'
  }, [motion.reveal])
  return motion
}

// Adds data-in to the element the first time it scrolls into view (CSS does the fade/slide).
export function useReveal(ref) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window)) {
      el.setAttribute('data-in', '')
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.setAttribute('data-in', '')
          io.disconnect()
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -6% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref])
}

// Scroll parallax for the hero: layers carry data-depth (translateY factor) and
// data-fade (opacity falloff). Only transform/opacity are written, once per frame.
export function useParallax(ref, enabled) {
  useEffect(() => {
    const root = ref.current
    if (!root || !enabled) return
    const layers = [...root.querySelectorAll('[data-depth]')]
    const fades = [...root.querySelectorAll('[data-fade]')]
    let visible = true
    let ticking = false
    const apply = () => {
      ticking = false
      const y = Math.min(window.scrollY, root.offsetHeight * 1.5)
      layers.forEach((el) => {
        el.style.transform = `translate3d(0, ${(y * Number(el.dataset.depth)).toFixed(1)}px, 0)`
      })
      const p = Math.min(1, y / (root.offsetHeight * 0.9))
      fades.forEach((el) => {
        el.style.opacity = String((1 - p * 0.75).toFixed(3))
      })
    }
    const onScroll = () => {
      if (visible && !ticking) {
        ticking = true
        requestAnimationFrame(apply)
      }
    }
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
    })
    io.observe(root)
    window.addEventListener('scroll', onScroll, { passive: true })
    apply()
    return () => {
      window.removeEventListener('scroll', onScroll)
      io.disconnect()
      layers.forEach((el) => (el.style.transform = ''))
      fades.forEach((el) => (el.style.opacity = ''))
    }
  }, [ref, enabled])
}

// Pointer tilt for a card poster (mouse only, one write per frame).
export function useTilt(enabled) {
  const ref = useRef(null)
  const frame = useRef(0)
  useEffect(() => () => cancelAnimationFrame(frame.current), [])
  const onPointerMove = useCallback(
    (e) => {
      const el = ref.current
      if (!enabled || !el || e.pointerType !== 'mouse') return
      const { clientX, clientY } = e
      cancelAnimationFrame(frame.current)
      frame.current = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        const x = (clientX - r.left) / r.width - 0.5
        const y = (clientY - r.top) / r.height - 0.5
        el.style.transform = `perspective(700px) rotateX(${(-y * 10).toFixed(2)}deg) rotateY(${(x * 10).toFixed(2)}deg) scale(1.03)`
      })
    },
    [enabled],
  )
  const reset = useCallback(() => {
    cancelAnimationFrame(frame.current)
    if (ref.current) ref.current.style.transform = ''
  }, [])
  return [ref, onPointerMove, reset]
}

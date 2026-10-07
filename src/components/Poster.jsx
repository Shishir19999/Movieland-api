import { useState } from 'react'
import { posterFor } from '../lib/poster.js'

export default function Poster({ movie, className = '', eager = false }) {
  const [failed, setFailed] = useState(null)
  const art = posterFor(movie)
  const src = movie.poster && failed !== movie.poster ? movie.poster : art
  return (
    <img
      className={className}
      src={src}
      alt={`Poster for ${movie.title}`}
      width="300"
      height="450"
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(movie.poster)}
    />
  )
}

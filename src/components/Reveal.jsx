import { useRef } from 'react'
import { useReveal } from '../hooks.js'

// Fade/slide-in on first scroll into view. Opacity and transform only (see App.css).
export default function Reveal({ as: Tag = 'div', index = 0, className = '', children, ...rest }) {
  const ref = useRef(null)
  useReveal(ref)
  return (
    <Tag
      ref={ref}
      className={`reveal ${className}`}
      style={{ '--d': `${(index % 6) * 45}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  )
}

import { useEffect, useRef } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Modal built on the native <dialog>: top-layer, Esc to close, rest of the page inert.
// Adds an explicit Tab focus trap, backdrop click to close and focus restoration.
export default function Dialog({ labelledBy, onClose, className = '', children }) {
  const ref = useRef(null)

  useEffect(() => {
    const dialog = ref.current
    const opener = document.activeElement
    dialog.showModal()
    document.documentElement.classList.add('modal-open')
    return () => {
      document.documentElement.classList.remove('modal-open')
      if (dialog.open) dialog.close()
      if (opener && opener.isConnected) opener.focus()
    }
  }, [])

  const onKeyDown = (e) => {
    if (e.key !== 'Tab') return
    const nodes = [...ref.current.querySelectorAll(FOCUSABLE)].filter((n) => n.offsetParent !== null)
    if (!nodes.length) return
    const first = nodes[0]
    const last = nodes[nodes.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  return (
    <dialog
      ref={ref}
      className={`dialog ${className}`}
      aria-labelledby={labelledBy}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onMouseDown={(e) => {
        if (e.target === ref.current) onClose()
      }}
      onKeyDown={onKeyDown}
    >
      <div className="dialog-body">{children}</div>
    </dialog>
  )
}

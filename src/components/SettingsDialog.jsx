import { useRef, useState } from 'react'
import Dialog from './Dialog.jsx'
import Icon from './Icon.jsx'
import { ERROR_COPY, validateKey } from '../lib/omdb.js'

export default function SettingsDialog({ storedKey, envActive, onSave, onClear, onClose }) {
  const [value, setValue] = useState('')
  const [show, setShow] = useState(false)
  const [status, setStatus] = useState({ kind: 'idle', message: '' })
  const abortRef = useRef(null)

  const close = () => {
    abortRef.current?.abort()
    onClose()
  }

  const submit = async (e) => {
    e.preventDefault()
    const key = value.trim()
    if (!/^[A-Za-z0-9]{6,20}$/.test(key)) {
      setStatus({ kind: 'error', message: 'Enter the key exactly as emailed by OMDb (letters and digits only).' })
      return
    }
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setStatus({ kind: 'testing', message: 'Testing key...' })
    try {
      await validateKey(key, ctrl.signal)
      onSave(key)
      setValue('')
      setStatus({ kind: 'ok', message: 'Key verified and saved in this browser. Live search is on.' })
    } catch (err) {
      if (err.name === 'AbortError') return
      setStatus({ kind: 'error', message: ERROR_COPY[err.kind] || err.message })
    }
  }

  return (
    <Dialog labelledBy="settings-title" onClose={close} className="dialog-settings">
      <button type="button" className="icon-btn dialog-close" onClick={close} aria-label="Close settings">
        <Icon name="close" />
      </button>
      <h2 id="settings-title">Settings</h2>
      <p className="muted">
        {storedKey
          ? 'Live search is on, using the OMDb key saved in this browser.'
          : envActive
            ? 'Live search is on, using the key from your local environment.'
            : 'You are browsing the built-in sample catalogue. Add your own OMDb key to search the full database.'}
      </p>
      <form onSubmit={submit} noValidate>
        <label htmlFor="omdb-key" className="label">
          OMDb API key
        </label>
        <div className="key-row">
          <input
            id="omdb-key"
            type={show ? 'text' : 'password'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck="false"
            placeholder={storedKey ? 'Paste a new key to replace the saved one' : 'Paste your key'}
            aria-describedby="key-help key-status"
          />
          <button
            type="button"
            className="icon-btn"
            onClick={() => setShow((s) => !s)}
            aria-pressed={show}
            aria-label={show ? 'Hide key' : 'Show key'}
          >
            <Icon name={show ? 'eye-off' : 'eye'} />
          </button>
        </div>
        <p id="key-help" className="help">
          Free keys are available from{' '}
          <a href="https://www.omdbapi.com/apikey.aspx" target="_blank" rel="noopener noreferrer">
            omdbapi.com<span className="sr-only"> (opens in a new tab)</span>
          </a>
          . The key stays in this browser&apos;s local storage and is only sent to omdbapi.com.
        </p>
        <p id="key-status" className={`status status-${status.kind}`} role="status" aria-live="polite">
          {status.message}
        </p>
        <div className="dialog-actions">
          <button type="submit" className="btn btn-primary" disabled={status.kind === 'testing' || !value.trim()}>
            {status.kind === 'testing' ? 'Testing...' : 'Test and save'}
          </button>
          {storedKey && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                onClear()
                setStatus({ kind: 'ok', message: 'Key removed. Back to the sample catalogue.' })
              }}
            >
              Remove key
            </button>
          )}
          <button type="button" className="btn" onClick={close}>
            Done
          </button>
        </div>
      </form>
    </Dialog>
  )
}

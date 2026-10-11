import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { getMotion } from './hooks.js'

// set before first paint so scroll-reveal items never flash visible then hide
document.documentElement.dataset.motion = getMotion().reveal ? 'on' : 'off'

ReactDOM.createRoot(document.getElementById('root')).render(<App />)

// offline support: the worker is generated at build time and scoped to the app's base path
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
      .catch(() => {})
  })
}

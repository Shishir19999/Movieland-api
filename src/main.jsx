import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { getMotion } from './hooks.js'

// set before first paint so scroll-reveal items never flash visible then hide
document.documentElement.dataset.motion = getMotion().reveal ? 'on' : 'off'

ReactDOM.createRoot(document.getElementById('root')).render(<App />)

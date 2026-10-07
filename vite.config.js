import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `vite build --mode pages` produces the GitHub Pages bundle:
//  - served from /Movieland-api/
//  - never reads .env files and force-blanks VITE_OMDB_KEY, so no key can be baked in
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const pages = mode === 'pages'
  return {
    base: pages ? '/Movieland-api/' : '/',
    plugins: [react()],
    envDir: pages ? false : undefined,
    define: pages ? { 'import.meta.env.VITE_OMDB_KEY': '""' } : {},
  }
})

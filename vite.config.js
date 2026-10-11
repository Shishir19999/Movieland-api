import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

// Static files from /public that make up the offline app shell.
const SHELL = ['./', 'index.html', 'manifest.json', 'favicon.svg', 'favicon.ico', 'logo192.png', 'logo512.png']

// Emits sw.js with the list of built assets, so the whole app (including the sample catalogue,
// which is bundled in the JavaScript) works offline after the first visit.
function serviceWorker() {
  return {
    name: 'movieland-service-worker',
    apply: 'build',
    generateBundle(_, bundle) {
      const built = Object.keys(bundle).filter((f) => f !== 'index.html')
      const files = [...SHELL, ...built]
      const version = createHash('sha1').update(files.join('|')).digest('hex').slice(0, 10)
      const template = readFileSync(new URL('./sw/sw.template.js', import.meta.url), 'utf8')
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: template.replace('__VERSION__', version).replace('__PRECACHE__', JSON.stringify(files)),
      })
    },
  }
}

// `vite build --mode pages` produces the GitHub Pages bundle:
//  - served from /Movieland-api/
//  - never reads .env files and force-blanks VITE_OMDB_KEY, so no key can be baked in
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const pages = mode === 'pages'
  return {
    base: pages ? '/Movieland-api/' : '/',
    plugins: [react(), serviceWorker()],
    envDir: pages ? false : undefined,
    define: pages ? { 'import.meta.env.VITE_OMDB_KEY': '""' } : {},
  }
})

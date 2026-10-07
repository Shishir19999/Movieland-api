// Illustrated poster art, drawn at runtime as an SVG data URI from the title and genre.
// No image files or external hosts are involved.

const GENRE_ART = {
  Animation: ['🎈', 285],
  Family: ['🧸', 330],
  Fantasy: ['🐉', 265],
  'Sci-Fi': ['🚀', 215],
  Horror: ['🕯️', 350],
  Thriller: ['🔦', 200],
  Mystery: ['🔍', 245],
  Crime: ['🕶️', 20],
  War: ['🎖️', 95],
  Western: ['🤠', 30],
  Musical: ['🎭', 315],
  Music: ['🎵', 300],
  Romance: ['💌', 345],
  Comedy: ['😄', 45],
  Adventure: ['🧭', 160],
  Action: ['💥', 10],
  Biography: ['📜', 40],
  History: ['🏛️', 35],
  Sport: ['🥊', 130],
  Drama: ['🎬', 230],
}

const cache = new Map()

function hash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

function wrap(title, max = 13, maxLines = 4) {
  const lines = []
  let line = ''
  for (const word of String(title).split(/\s+/)) {
    if (line && (line + ' ' + word).length > max) {
      lines.push(line)
      line = word
    } else {
      line = line ? line + ' ' + word : word
    }
  }
  if (line) lines.push(line)
  if (lines.length > maxLines) {
    lines.length = maxLines
    lines[maxLines - 1] = lines[maxLines - 1].replace(/.{0,2}$/, '') + '…'
  }
  return lines
}

export function posterFor({ title = 'Untitled', year, genres = [] }) {
  const key = `${title}|${year}|${genres.join(',')}`
  const hit = cache.get(key)
  if (hit) return hit
  const genre = genres.find((g) => GENRE_ART[g]) || 'Drama'
  const [emoji, baseHue] = GENRE_ART[genre]
  const h = hash(key)
  const hue = (baseHue + (h % 40) - 20 + 360) % 360
  const hue2 = (hue + 40 + (h % 30)) % 360
  const lines = wrap(title)
  const size = lines.some((l) => l.length > 11) ? 26 : 30
  const startY = 330 - ((lines.length - 1) * (size + 6)) / 2
  const text = lines
    .map((l, i) => `<tspan x="150" y="${startY + i * (size + 6)}">${esc(l)}</tspan>`)
    .join('')
  const cx = 40 + (h % 220)
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450" width="300" height="450">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="hsl(${hue} 62% 30%)"/><stop offset="1" stop-color="hsl(${hue2} 60% 12%)"/></linearGradient>` +
    `<radialGradient id="r" cx="50%" cy="30%" r="60%"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>` +
    `<rect width="300" height="450" fill="url(#g)"/><rect width="300" height="450" fill="url(#r)"/>` +
    `<circle cx="${cx}" cy="${60 + (h % 80)}" r="${90 + (h % 40)}" fill="#fff" fill-opacity=".06"/>` +
    `<circle cx="${300 - cx}" cy="400" r="120" fill="#000" fill-opacity=".18"/>` +
    `<rect x="12" y="12" width="276" height="426" rx="10" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="2"/>` +
    `<text x="150" y="190" font-size="92" text-anchor="middle">${emoji}</text>` +
    `<text font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="${size}" fill="#fff" text-anchor="middle">${text}</text>` +
    `<text x="150" y="418" font-family="Arial, sans-serif" font-size="16" letter-spacing="3" fill="#fff" fill-opacity=".85" text-anchor="middle">${esc(year ?? '')}</text>` +
    `</svg>`
  const uri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
  cache.set(key, uri)
  return uri
}

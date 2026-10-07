# MovieLand

A React + Vite movie browser. Out of the box it runs in **demo mode** with a built-in catalogue of 60 films and illustrated posters, so it works offline with no account. Paste your own [OMDb](https://www.omdbapi.com/) key to switch to live search of the full database.

**Live demo:** https://shishir19999.github.io/Movieland-api/

## Features

- Debounced search with title suggestions and a recently-searched list (`/` focuses the search box)
- Filters for genre, decade and minimum rating, plus sorting (relevance, rating, year, title)
- Details dialog with plot, cast, director, ratings, trailer search link and a shareable link (`#/m/<id>`)
- Favorites and watchlist, saved in your browser
- "Surprise me" random pick
- Load-more pagination, skeleton loading states, empty and error states (invalid key, rate limit)
- Light and dark theme (follows the system, remembered), responsive from 320px, keyboard accessible

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (vitest) for the data and filter logic
npm run lint
npm run build      # production build into dist/
npm run build:pages  # GitHub Pages build (base /Movieland-api/) into dist/
```

## Using your own OMDb key

1. Get a free key at https://www.omdbapi.com/apikey.aspx
2. Either open **Settings** (gear icon, or the Demo/Live pill) in the app and paste it. It is stored only in your browser's localStorage and sent only to omdbapi.com.
3. Or, for local builds, copy `.env.example` to `.env` and set `VITE_OMDB_KEY`. `.env` is git-ignored. The `build:pages` script ignores `.env` and never embeds a key, so the published site can only use a key a visitor enters.

## Parallax and motion

The hero banner parallax, scroll-reveal rows and poster tilt use only `transform` and `opacity`, driven by IntersectionObserver and requestAnimationFrame with no libraries. They are disabled under `prefers-reduced-motion` and on small or low-power screens.

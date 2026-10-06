# MovieLand

A React (Vite) movie search app backed by the [OMDb API](https://www.omdbapi.com/).

## Setup

1. Get a free API key at https://www.omdbapi.com/apikey.aspx
2. Copy `.env.example` to `.env` and set your key:

   ```
   VITE_OMDB_KEY=your_omdb_api_key_here
   ```

   `.env` is git-ignored. Restart the dev server after changing it. (Vite only exposes variables prefixed with `VITE_`; this replaces the old CRA `REACT_APP_OMDB_KEY`.)
3. Install and run:

   ```bash
   npm install
   npm run dev      # Vite dev server (default http://localhost:5173)
   npm run build    # production build into dist/
   npm run preview  # serve the production build
   npm run lint
   ```

Search by typing a title and pressing Enter or clicking the search icon. Results with no poster show a generated placeholder.

Note: the key is embedded in the client bundle at build time, so it is visible to anyone using the site.


Migrated from Create React App (react-scripts, deprecated) to Vite 8 + React 19. Requires Node ^20.19 or >=22.12.

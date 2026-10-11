// In-memory lookup of movies seen this session (live search results), so the details dialog can open them by id.
const seen = new Map()
export const remember = (movie) => {
  if (movie?.id) seen.set(movie.id, { ...seen.get(movie.id), ...movie })
}
export const lookup = (id) => seen.get(id) || null

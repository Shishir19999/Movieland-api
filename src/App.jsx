import { useEffect, useState } from 'react';
import './App.css';
import SearchIcon from './Search.svg';
import MovieCard from './MovieCard.jsx';

const API_KEY = import.meta.env.VITE_OMDB_KEY;
const API_URL = `https://www.omdbapi.com/?apikey=${API_KEY}`;

const App = () => {
  const [movies, setMovies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchMovies = async (title) => {
    if (!API_KEY) {
      setError('Missing API key. Set VITE_OMDB_KEY in a .env file (see .env.example).');
      setMovies([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}&s=${encodeURIComponent(title)}`);
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const data = await response.json();
      if (data.Response === 'False') {
        setMovies([]);
        // "Movie not found!" is a normal empty result, anything else is an API error
        if (data.Error && data.Error !== 'Movie not found!') {
          setError(data.Error);
        }
      } else {
        setMovies(data.Search);
      }
    } catch {
      setMovies([]);
      setError('Could not load movies. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // initial fetch on mount (the loading flag is set synchronously by design)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    searchMovies('Batman');
  }, []);

  return (
    <div className="app">
      <h1>MovieLand</h1>
      <div className="search">
        <input
          placeholder="Search for Movies"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') searchMovies(searchTerm);
          }}
        />

        <img
          src={SearchIcon}
          alt="Search"
          onClick={() => searchMovies(searchTerm)}
        />
      </div>
      {isLoading ? (
        <div className="empty">
          <h2>Loading...</h2>
        </div>
      ) : error ? (
        <div className="empty">
          <h2>{error}</h2>
        </div>
      ) : movies?.length > 0 ? (
        <div className="container">
          {movies.map((movie) => (
            <MovieCard key={movie.imdbID} movie={movie} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <h2> No movies</h2>
        </div>
      )}
    </div>
  );
};

export default App;

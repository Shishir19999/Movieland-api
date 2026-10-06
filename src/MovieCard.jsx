
const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="100%" height="100%" fill="#33384a"/><text x="50%" y="50%" fill="#a0a4b8" font-family="sans-serif" font-size="28" text-anchor="middle" dominant-baseline="middle">No poster</text></svg>'
  );

const MovieCard = ({ movie }) => {
  return (
    <div className="movie">
      <div>
        <p>{movie.Year}</p>
      </div>
      <div>
        <img
          src={
            movie.Poster !== 'N/A' ? movie.Poster : PLACEHOLDER_IMAGE
          }
          alt={movie.Title}
        ></img>
      </div>
      <div>
        <span>{movie.Type}</span>
        <h3>{movie.Title}</h3>
      </div>
    </div>
  );
};
export default MovieCard;

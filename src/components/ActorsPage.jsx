import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const BASE_URL = "http://localhost:3001";

export default function ActorsPage() {
  const [actors, setActors] = useState([]);
  const [selectedActor, setSelectedActor] = useState(null);
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    fetch(`${BASE_URL}/actors`).then(res => res.json()).then(setActors);
  }, []);

  const handleSelectActor = async (actor) => {
    setSelectedActor(actor);
    const relations = await fetch(`${BASE_URL}/movie_actors?actorId=${actor.id}`).then(res => res.json());
    const movieList = await Promise.all(
      relations.map(async (r) => {
        const movieRes = await fetch(`${BASE_URL}/movies/${r.movieId}`);
        return movieRes.json();
      })
    );
    setMovies(movieList);
  };

  return (
    <div>
      <h1>Actors Directory</h1>
      <div className="actors-page">
        <div className="actors-sidebar">
          <h3>All Actors</h3>
          <div className="actors-list-sidebar">
            {actors.map(actor => (
              <button
                key={actor.id}
                onClick={() => handleSelectActor(actor)}
                className={`btn btn-secondary actor-item ${selectedActor?.id === actor.id ? 'active' : ''}`}
              >
                {actor.name} <span style={{ color: "#888", fontSize: "0.75rem" }}>({actor.birthYear || "?"})</span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="actors-content">
          {selectedActor ? (
            <>
              <h2>{selectedActor.name}'s Movies</h2>
              {movies.length === 0 ? (
                <p>No movies found for this actor.</p>
              ) : (
                <div className="movie-grid">
                  {movies.map(movie => (
                    <div key={movie.id} className="movie-card">
                      <img src={movie.posterUrl || "https://via.placeholder.com/300x450?text=No+Poster"} alt={movie.title} className="movie-poster" />
                      <div className="movie-info">
                        <h3 className="movie-title">{movie.title}</h3>
                        <p className="movie-year">{movie.year}</p>
                        <Link to={`/movies/${movie.id}`} className="btn btn-primary btn-sm">View Details</Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="login-prompt" style={{ textAlign: "center", padding: "2rem" }}>
              Select an actor to see their movies
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
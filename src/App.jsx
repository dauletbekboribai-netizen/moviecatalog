import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { setMovies } from './redux/store';
import MovieDetail from './components/MovieDetail';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import MovieForm from './components/MovieForm';
import './App.css';

const showToast = (message, type = "success") => {
  const toast = document.createElement("div");

  toast.innerText = message;
  toast.style.position = "fixed";
  toast.style.bottom = "20px";
  toast.style.left = "20px";
  toast.style.padding = "12px 16px";
  toast.style.borderRadius = "8px";
  toast.style.color = "#fff";
  toast.style.zIndex = "9999";
  toast.style.fontWeight = "500";
  toast.style.boxShadow = "0 5px 15px rgba(0,0,0,0.2)";
  toast.style.background = type === "error" ? "#dc2626" : "#16a34a";

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
};

export default function App() {
  const movies = useSelector(state => state.movies);
  const user = useSelector(state => state.auth.user);
  const dispatch = useDispatch();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [deleteMovieId, setDeleteMovieId] = useState(null);

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    fetch('http://localhost:3001/movies')
      .then(res => res.json())
      .then(data => {
        dispatch(setMovies(data));
        setFilteredMovies(data);
      });
    fetch('http://localhost:3001/genres').then(res => res.json()).then(setGenres);
  }, []);

  useEffect(() => {
    if (selectedGenre) {
      setFilteredMovies(movies.filter(m => m.genreId === selectedGenre.id));
    } else {
      setFilteredMovies(movies);
    }
  }, [selectedGenre, movies]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  };

  const canEditDelete = (movie) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return movie.createdBy === user.id;
  };

  const handleDeleteMovie = async (movieId) => {
    const token = localStorage.getItem('token');
    
    const reviewsRes = await fetch(`http://localhost:3001/reviews?movieId=${movieId}`);
    const reviews = await reviewsRes.json();
    
    for (const review of reviews) {
      await fetch(`http://localhost:3001/reviews/${review.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }
    
    await fetch(`http://localhost:3001/movies/${movieId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const updated = movies.filter(m => m.id !== movieId);
    dispatch(setMovies(updated));
    showToast("Movie deleted successfully");
    setDeleteMovieId(null);
    setFilteredMovies(updated);
  };

return (
  <BrowserRouter>
    <div className={`app ${theme}`}>
      <nav className="navbar">
        <Link to="/" className="navbar-brand">🎬 MovieCatalog</Link>
        <div className="nav-links">
          <Link to="/" className="nav-link">Movies</Link>
          {user && <Link to="/movies/create" className="nav-link">➕ Add</Link>}
          {user ? (
            <>
              <span className="user-welcome">👋 {user.name}</span>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="nav-link">Register</Link>
            </>
          )}
          <button onClick={toggleTheme} className="theme-btn">
            {theme === "light" ? "🌙" : "☀️"}
          </button>
        </div>
      </nav>

      <div className="container">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <h1>Movie Catalog</h1>

                <div className="genre-filter">
                  <button
                    className={`genre-btn ${!selectedGenre ? "active" : ""}`}
                    onClick={() => setSelectedGenre(null)}
                  >
                    All
                  </button>

                  {genres.map(g => (
                    <button
                      key={g.id}
                      className={`genre-btn ${selectedGenre?.id === g.id ? "active" : ""}`}
                      onClick={() => setSelectedGenre(g)}
                    >
                      {g.name}
                    </button>
                  ))}
                </div>

                <div className="movie-grid">
                  {filteredMovies.map(movie => (
                    <div key={movie.id} className="movie-card">
                      <img
                        src={movie.posterUrl || "https://via.placeholder.com/300x450?text=No+Poster"}
                        alt={movie.title}
                        className="movie-poster"
                      />

                      <div className="movie-info">
                        <h3 className="movie-title">{movie.title}</h3>
                        <p className="movie-year">{movie.year}</p>

                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <Link to={`/movies/${movie.id}`} className="btn btn-primary">
                            View
                          </Link>

                          {canEditDelete(movie) && (
                            <>
                              <Link to={`/movies/edit/${movie.id}`} className="btn btn-warning">
                                Edit
                              </Link>
                              <button
                                onClick={() => setDeleteMovieId(movie.id)}
                                className="btn btn-danger"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            }
          />

          <Route path="/movies/:id" element={<MovieDetail />} />
          <Route path="/movies/create" element={user ? <MovieForm /> : <LoginPage />} />
          <Route path="/movies/edit/:id" element={user ? <MovieForm /> : <LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </div>

      {deleteMovieId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px"
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "420px",
              background: "#1f1f1f",
              color: "#fff",
              borderRadius: "18px",
              padding: "24px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.35)"
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "12px" }}>Delete movie</h3>

            <p style={{ color: "#d1d5db", marginBottom: "20px", lineHeight: "1.5" }}>
              Are you sure you want to delete this movie?
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={() => setDeleteMovieId(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>

              <button
                onClick={() => handleDeleteMovie(deleteMovieId)}
                className="btn btn-danger"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </BrowserRouter>
);
}
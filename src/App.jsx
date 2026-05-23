import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { setMovies, addMovie, removeMovie } from './redux/store';
import MovieDetail from './components/MovieDetail';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import MovieForm from './components/MovieForm';
import ActorsPage from './components/ActorsPage';
import './App.css';

export default function App() {
  const movies = useSelector(state => state.movies);
  const user = useSelector(state => state.auth.user);
  const dispatch = useDispatch();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [filteredMovies, setFilteredMovies] = useState([]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    loadMovies();
    fetch('http://localhost:3001/genres').then(res => res.json()).then(setGenres);
  }, []);

  const loadMovies = async () => {
    const res = await fetch('http://localhost:3001/movies');
    const data = await res.json();
    dispatch(setMovies(data));
    setFilteredMovies(data);
  };

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
    if (!window.confirm("Delete this movie?")) return;
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
    
    dispatch(removeMovie(movieId));
  };

  return (
    <BrowserRouter>
      <div className={`app ${theme}`}>
        <nav className="navbar">
          <Link to="/" className="navbar-brand">🎬 MovieCatalog</Link>
          <div className="nav-links">
            <Link to="/" className="nav-link">Movies</Link>
            <Link to="/actors" className="nav-link">Actors</Link>
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
            <button onClick={toggleTheme} className="theme-btn">{theme === 'light' ? '🌙' : '☀️'}</button>
          </div>
        </nav>
        <div className="container">
          <Routes>
            <Route path="/" element={
              <>
                <h1>Movie Catalog</h1>
                <div className="genre-filter">
                  <button className={`genre-btn ${!selectedGenre ? "active" : ""}`} onClick={() => setSelectedGenre(null)}>All</button>
                  {genres.map(g => (
                    <button key={g.id} className={`genre-btn ${selectedGenre?.id === g.id ? "active" : ""}`} onClick={() => setSelectedGenre(g)}>{g.name}</button>
                  ))}
                </div>
                <div className="movie-grid">
                  {filteredMovies.map(movie => (
                    <div key={movie.id} className="movie-card">
                      <img src={movie.posterUrl || "https://via.placeholder.com/300x450?text=No+Poster"} alt={movie.title} className="movie-poster" />
                      <div className="movie-info">
                        <h3 className="movie-title">{movie.title}</h3>
                        <p className="movie-year">{movie.year}</p>
                        <div className="movie-actions">
                          <Link to={`/movies/${movie.id}`} className="btn btn-primary">View</Link>
                          {canEditDelete(movie) && (
                            <>
                              <Link to={`/movies/edit/${movie.id}`} className="btn btn-warning">Edit</Link>
                              <button onClick={() => handleDeleteMovie(movie.id)} className="btn btn-danger">Delete</button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            } />
            <Route path="/movies/:id" element={<MovieDetail />} />
            <Route path="/movies/create" element={user ? <MovieForm onMovieCreated={loadMovies} /> : <LoginPage />} />
            <Route path="/movies/edit/:id" element={user ? <MovieForm onMovieUpdated={loadMovies} /> : <LoginPage />} />
            <Route path="/actors" element={<ActorsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
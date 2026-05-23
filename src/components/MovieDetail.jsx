import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import Toast from "./Toast";
import ConfirmModal from "./ConfirmModal";

const BASE_URL = "http://localhost:3001";
const getToken = () => localStorage.getItem("token");

export default function MovieDetail() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);
  const [averageRating, setAverageRating] = useState(0);
  const [genre, setGenre] = useState(null);
  const [actors, setActors] = useState([]);
  const [showActorModal, setShowActorModal] = useState(false);
  const [newActorName, setNewActorName] = useState("");
  const [newActorBirthYear, setNewActorBirthYear] = useState("");
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: "", message: "", onConfirm: null });
  const user = useSelector(state => state.auth.user);
  const navigate = useNavigate();

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const showConfirm = (title, message, onConfirm) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm: () => {
      onConfirm();
      setConfirmModal({ isOpen: false, title: "", message: "", onConfirm: null });
    }});
  };

  const loadMovie = async () => {
    const res = await fetch(`${BASE_URL}/movies/${id}`);
    const data = await res.json();
    setMovie(data);
    
    if (data.genreId) {
      const genreRes = await fetch(`${BASE_URL}/genres/${data.genreId}`);
      setGenre(await genreRes.json());
    }
    
    await loadActors();
  };

  const loadActors = async () => {
    const actorsRes = await fetch(`${BASE_URL}/movie_actors?movieId=${id}`);
    const movieActors = await actorsRes.json();
    const actorList = await Promise.all(
      movieActors.map(async (ma) => {
        const actorRes = await fetch(`${BASE_URL}/actors/${ma.actorId}`);
        return actorRes.json();
      })
    );
    setActors(actorList);
  };

  const loadReviews = async () => {
    const res = await fetch(`${BASE_URL}/reviews?movieId=${id}`);
    const data = await res.json();
    setReviews(data);
    if (data.length > 0) {
      const sum = data.reduce((acc, r) => acc + r.rating, 0);
      setAverageRating((sum / data.length).toFixed(1));
    } else {
      setAverageRating(0);
    }
  };

  useEffect(() => {
    loadMovie();
    loadReviews();
  }, [id]);

  const handleAddReview = async () => {
    if (!comment.trim()) {
      showToast("Write a comment", "warning");
      return;
    }
    if (!user) {
      showToast("Please login first", "warning");
      return;
    }

    const res = await fetch(`${BASE_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({
        movieId: parseInt(id),
        userId: user.id,
        userName: user.name,
        comment,
        rating,
        createdAt: new Date().toISOString()
      })
    });

    if (res.ok) {
      await loadReviews();
      setComment("");
      setRating(5);
      showToast("Review added!", "success");
    } else {
      showToast("Failed to add review", "error");
    }
  };

  const handleDeleteReview = async (reviewId, reviewUserId) => {
    if (user.role !== "admin" && user.id !== reviewUserId) {
      showToast("You can only delete your own reviews", "warning");
      return;
    }
    
    showConfirm("Delete Review", "Are you sure you want to delete this review?", async () => {
      await fetch(`${BASE_URL}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      await loadReviews();
      showToast("Review deleted", "success");
    });
  };

  const handleCreateAndAddActor = async () => {
    if (!newActorName.trim()) {
      showToast("Enter actor name", "warning");
      return;
    }

    const token = getToken();
    
    const actorRes = await fetch(`${BASE_URL}/actors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: newActorName,
        birthYear: newActorBirthYear ? parseInt(newActorBirthYear) : null
      })
    });

    if (actorRes.ok) {
      const newActor = await actorRes.json();
      
      const relationRes = await fetch(`${BASE_URL}/movie_actors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          movieId: parseInt(id),
          actorId: newActor.id
        })
      });

      if (relationRes.ok) {
        await loadActors();
        setShowActorModal(false);
        setNewActorName("");
        setNewActorBirthYear("");
        showToast("Actor created and added!", "success");
      } else {
        showToast("Failed to add actor to movie", "error");
      }
    } else {
      showToast("Failed to create actor", "error");
    }
  };

  const handleRemoveActor = async (actorId) => {
    showConfirm("Remove Actor", "Are you sure you want to remove this actor?", async () => {
      const res = await fetch(`${BASE_URL}/movie_actors?movieId=${parseInt(id)}&actorId=${actorId}`);
      const relations = await res.json();
      if (relations.length > 0) {
        await fetch(`${BASE_URL}/movie_actors/${relations[0].id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        await loadActors();
        showToast("Actor removed", "success");
      }
    });
  };

  const handleDeleteMovie = async () => {
    showConfirm("Delete Movie", "Are you sure you want to delete this movie? All reviews will be deleted too.", async () => {
      for (const review of reviews) {
        await fetch(`${BASE_URL}/reviews/${review.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
      }
      
      await fetch(`${BASE_URL}/movies/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      navigate('/');
      showToast("Movie deleted", "success");
    });
  };

  const canEdit = () => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return movie?.createdBy === user.id;
  };

  if (!movie) return <div className="loading">Loading...</div>;

  return (
    <div className="movie-detail">
      <button onClick={() => navigate(-1)} className="btn btn-secondary">← Back</button>
      
      <div className="movie-detail-container">
        <img src={movie.posterUrl || "https://via.placeholder.com/400x600?text=No+Poster"} alt={movie.title} className="movie-detail-poster" />
        <div className="movie-detail-info">
          <h1>{movie.title}</h1>
          <p>📅 Year: {movie.year}</p>
          <p>🎭 Genre: {genre?.name || "Unknown"}</p>
          
          <div className="actors-section">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
              <strong>🎭 Cast ({actors.length}):</strong>
              {canEdit() && (
                <button onClick={() => setShowActorModal(true)} className="btn btn-primary btn-sm">+ Add Actor</button>
              )}
            </div>
            <div className="actors-list">
              {actors.map(actor => (
                <span key={actor.id} className="actor-tag">
                  {actor.name} ({actor.birthYear || "?"})
                  {canEdit() && (
                    <button onClick={() => handleRemoveActor(actor.id)}>×</button>
                  )}
                </span>
              ))}
              {actors.length === 0 && <span>No actors yet</span>}
            </div>
          </div>

          <div className="average-rating">
            ⭐ Average Rating: <strong>{averageRating}</strong>/10 ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
          </div>
          <p>{movie.description || "No description"}</p>
          
          {canEdit() && (
            <div className="movie-actions">
              <button onClick={() => navigate(`/movies/edit/${movie.id}`)} className="btn btn-warning">Edit</button>
              <button onClick={handleDeleteMovie} className="btn btn-danger">Delete</button>
            </div>
          )}
        </div>
      </div>

      <div className="reviews-section">
        <h3>💬 Reviews ({reviews.length})</h3>
        {user ? (
          <div className="review-form">
            <input type="number" min="1" max="10" value={rating} onChange={e => setRating(parseInt(e.target.value))} className="form-control" style={{ width: "100px" }} />
            <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Your review..." className="form-control" rows="2" />
            <button onClick={handleAddReview} className="btn btn-primary">Submit</button>
          </div>
        ) : (
          <div className="login-prompt">Please <Link to="/login">login</Link> to review</div>
        )}
        {reviews.map(r => (
          <div key={r.id} className="review-card">
            <div className="review-header">
              <strong>{r.userName}</strong> <span>⭐ {r.rating}/10</span>
              <small>{new Date(r.createdAt).toLocaleDateString()}</small>
            </div>
            <p>{r.comment}</p>
            {(user?.role === "admin" || user?.id === r.userId) && (
              <button onClick={() => handleDeleteReview(r.id, r.userId)} className="btn btn-danger btn-sm">Delete</button>
            )}
          </div>
        ))}
      </div>

      {showActorModal && (
        <div className="modal-overlay" onClick={() => setShowActorModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: "15px" }}>Add Actor to "{movie.title}"</h3>
            
            <div className="form-group">
              <label>Actor Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g., Brad Pitt"
                value={newActorName}
                onChange={e => setNewActorName(e.target.value)}
                style={{ marginBottom: "10px" }}
              />
            </div>
            
            <div className="form-group">
              <label>Birth Year (optional)</label>
              <input
                type="number"
                className="form-control"
                placeholder="e.g., 1963"
                value={newActorBirthYear}
                onChange={e => setNewActorBirthYear(e.target.value)}
                style={{ marginBottom: "15px" }}
              />
            </div>
            
            <button 
              onClick={handleCreateAndAddActor} 
              className="btn btn-primary" 
              style={{ width: "100%", marginBottom: "10px" }}
            >
              Create & Add Actor
            </button>
            
            <button 
              onClick={() => setShowActorModal(false)} 
              className="btn btn-secondary" 
              style={{ width: "100%" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, title: "", message: "", onConfirm: null })}
      />
    </div>
  );
}
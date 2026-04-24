import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";

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
  toast.style.background =
    type === "error" ? "#dc2626" : "#16a34a";

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
};

export default function MovieDetail() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);
  const [averageRating, setAverageRating] = useState(0);
  const [genre, setGenre] = useState(null);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editComment, setEditComment] = useState("");
  const [editRating, setEditRating] = useState(5);
  const user = useSelector(state => state.auth.user);
  const navigate = useNavigate();
  const [deleteReviewData, setDeleteReviewData] = useState(null);
  const [isDeleteMovieModalOpen, setIsDeleteMovieModalOpen] = useState(false);


  const getToken = () => localStorage.getItem("token");

  const updateAverage = (list) => {
    if (list.length > 0) {
      const sum = list.reduce((acc, r) => acc + r.rating, 0);
      setAverageRating((sum / list.length).toFixed(1));
    } else setAverageRating(0);
  };

  useEffect(() => {
    loadMovie();
    loadReviews();
  }, [id]);

  const loadMovie = async () => {
    const res = await fetch(`http://localhost:3001/movies/${id}`);
    const data = await res.json();
    setMovie(data);
    if (data.genreId) {
      const genreRes = await fetch(`http://localhost:3001/genres/${data.genreId}`);
      setGenre(await genreRes.json());
    }
  };

  const loadReviews = async () => {
    const res = await fetch(`http://localhost:3001/reviews?movieId=${id}`);
    const data = await res.json();
    setReviews(data);
    updateAverage(data);
  };

  const handleAddReview = async () => {
    if (!comment.trim()) {
        showToast("Write a comment", "error");
        return;
    }
    if (!user) {
        showToast("Login first", "error");
        return;
    }

    const token = getToken();
    const newReview = {
      movieId: parseInt(id),
      userId: user.id,
      userName: user.name,
      comment,
      rating,
      createdAt: new Date().toISOString()
    };

    const res = await fetch("http://localhost:3001/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify(newReview)
    });

    if (res.ok) {
      const saved = await res.json();
      const updated = [...reviews, saved];
      setReviews(updated);
      setComment("");
      setRating(5);
      updateAverage(updated);
      showToast("Review added successfully");
    } else {
      showToast("Error adding review", "error");
    }
  };

  const startEditReview = (r) => {
    setEditingReviewId(r.id);
    setEditComment(r.comment);
    setEditRating(r.rating);
  };

  const cancelEditReview = () => {
    setEditingReviewId(null);
    setEditComment("");
    setEditRating(5);
  };

  const handleUpdateReview = async (reviewId, reviewUserId) => {
    if (!user) return;
    if (user.role !== "admin" && user.id !== reviewUserId) {
      showToast("You can only edit your own reviews", "error");
      return;
    }
    if (!editComment.trim()) {
      showToast("Write a comment", "error");
      return;
    }

    const reviewToUpdate = reviews.find(r => r.id === reviewId);
    if (!reviewToUpdate) return;

    const res = await fetch(`http://localhost:3001/reviews/${reviewId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getToken()}`
      },
      body: JSON.stringify({
        ...reviewToUpdate,
        comment: editComment,
        rating: parseInt(editRating)
      })
    });

    if (res.ok) {
      const saved = await res.json();
      const updated = reviews.map(r => r.id === reviewId ? saved : r);
      setReviews(updated);
      updateAverage(updated);
      cancelEditReview();
      showToast("Review updated successfully");
    } else {
      showToast("Error updating review", "error");
    }
  };

  const handleDeleteReview = async (reviewId, reviewUserId) => {
    if (!user) return;
    if (user.role !== "admin" && user.id !== reviewUserId) {
      alert("You can only delete your own reviews");
      return;
    }

    const token = getToken();
    await fetch(`http://localhost:3001/reviews/${reviewId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });

    const updated = reviews.filter(r => r.id !== reviewId);
    setReviews(updated);
    updateAverage(updated);
    showToast("Review deleted successfully");
    setDeleteReviewData(null);
    if (editingReviewId === reviewId) cancelEditReview();
  };

  const canDeleteMovie = () => {
    if (!user) return false;
    if (user.role === "admin") return true;
    return movie?.createdBy === user.id;
  };

  const handleDeleteMovie = async () => {
    const token = getToken();
    for (const review of reviews) {
      await fetch(`http://localhost:3001/reviews/${review.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
    }
    await fetch(`http://localhost:3001/movies/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    showToast("Movie deleted successfully");
    setIsDeleteMovieModalOpen(false);
    navigate("/");
  };

  if (!movie) return <div className="loading">Loading...</div>;

return (
  <div className="movie-detail">
    <button onClick={() => navigate(-1)} className="btn btn-secondary">← Back</button>

    <div className="movie-detail-container">
      <img
        src={movie.posterUrl || "https://via.placeholder.com/400x600?text=No+Poster"}
        alt={movie.title}
        className="movie-detail-poster"
      />
      <div className="movie-detail-info">
        <h1>{movie.title}</h1>
        <p>📅 Year: {movie.year}</p>
        <p>🎭 Genre: {genre?.name || "Unknown"}</p>
        <div className="average-rating">
          ⭐ Average Rating: <strong>{averageRating}</strong>/10 ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
        </div>
        <p>{movie.description || "No description"}</p>

        {canDeleteMovie() && (
          <div className="movie-actions">
            <button onClick={() => navigate(`/movies/edit/${movie.id}`)} className="btn btn-warning">
              Edit
            </button>
            <button onClick={() => setIsDeleteMovieModalOpen(true)} className="btn btn-danger">
              Delete
            </button>
          </div>
        )}
      </div>
    </div>

    <div className="reviews-section">
      <h3>💬 Reviews ({reviews.length})</h3>

      {user ? (
        <div className="review-form">
          <input
            type="number"
            min="1"
            max="10"
            value={rating}
            onChange={e => setRating(parseInt(e.target.value))}
            className="form-control"
            style={{ width: "100px", marginBottom: "10px" }}
          />
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Your review..."
            className="form-control"
            rows="2"
          />
          <button onClick={handleAddReview} className="btn btn-primary" style={{ marginTop: "10px" }}>
            Submit
          </button>
        </div>
      ) : (
        <div className="login-prompt">
          Please <Link to="/login">login</Link> to review
        </div>
      )}

      {reviews.length === 0 ? (
        <p className="no-reviews">No reviews yet</p>
      ) : (
        reviews.map(r => (
          <div key={r.id} className="review-card">
            <div className="review-header">
              <strong>{r.userName}</strong> <span className="review-rating">⭐ {r.rating}/10</span>
              <small>{new Date(r.createdAt).toLocaleDateString()}</small>
            </div>

            {editingReviewId === r.id ? (
              <>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={editRating}
                  onChange={e => setEditRating(parseInt(e.target.value))}
                  className="form-control"
                  style={{ width: "100px", marginBottom: "10px" }}
                />
                <textarea
                  value={editComment}
                  onChange={e => setEditComment(e.target.value)}
                  className="form-control"
                  rows="2"
                />
                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                  <button onClick={() => handleUpdateReview(r.id, r.userId)} className="btn btn-warning btn-sm">
                    Save
                  </button>
                  <button onClick={cancelEditReview} className="btn btn-secondary btn-sm">
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <p>{r.comment}</p>
                {(user?.role === "admin" || user?.id === r.userId) && (
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={() => startEditReview(r)} className="btn btn-warning btn-sm">
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteReviewData({ id: r.id, userId: r.userId })}
                      className="btn btn-danger btn-sm"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))
      )}
    </div>

    {isDeleteMovieModalOpen && (
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
          <p style={{ marginBottom: "20px", color: "#d1d5db", lineHeight: "1.5" }}>
            Are you sure you want to delete this movie?
            <br />
            All reviews will be deleted too.
          </p>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button
              onClick={() => setIsDeleteMovieModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteMovie}
              className="btn btn-danger"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    )}

    {deleteReviewData !== null && (
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
          <h3 style={{ marginTop: 0, marginBottom: "12px" }}>Delete review</h3>
          <p style={{ color: "#d1d5db", marginBottom: "20px", lineHeight: "1.5" }}>
            Are you sure you want to delete this review?
          </p>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button
              onClick={() => setDeleteReviewData(null)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDeleteReview(deleteReviewData.id, deleteReviewData.userId)}
              className="btn btn-danger"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
}
import { useEffect, useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useSelector } from "react-redux"
import Toast from "./Toast"
import ConfirmModal from "./ConfirmModal"
const BASE_URL = "http://localhost:3001"
const getToken = () => localStorage.getItem("token")
const emptyModal = { isOpen: false, title: "", message: "", onConfirm: null }
export default function MovieDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useSelector(state => state.auth.user)
  const [movie, setMovie] = useState(null)
  const [reviews, setReviews] = useState([])
  const [comment, setComment] = useState("")
  const [rating, setRating] = useState(5)
  const [averageRating, setAverageRating] = useState(0)
  const [genre, setGenre] = useState(null)
  const [actors, setActors] = useState([])
  const [showActorModal, setShowActorModal] = useState(false)
  const [newActorName, setNewActorName] = useState("")
  const [newActorGender, setNewActorGender] = useState("")
  const [newActorBiography, setNewActorBiography] = useState("")
  const [newActorBirthYear, setNewActorBirthYear] = useState("")
  const [toast, setToast] = useState(null)
  const [confirmModal, setConfirmModal] = useState(emptyModal)
  const [editReviewModal, setEditReviewModal] = useState(false)
  const [editingReview, setEditingReview] = useState(null)
  const [editComment, setEditComment] = useState("")
  const [editRating, setEditRating] = useState(5)
  const showToast = (message, type = "success") => setToast({ message, type })
  const resetModal = () => setConfirmModal(emptyModal)
  const showConfirm = (title, message, onConfirm) => {
    setConfirmModal({
      isOpen: true, title, message,
      onConfirm: () => { onConfirm(); resetModal() }
    })
  }
  const loadActors = async () => {
    const movieActors = await fetch(
      `${BASE_URL}/movie_actors?movieId=${id}`
    ).then(r => r.json())
    setActors(await Promise.all(
      movieActors.map(async ma =>
        fetch(`${BASE_URL}/actors/${ma.actorId}`)
          .then(r => r.json()))
    ))

  }
  const loadMovie = async () => {
    const data = await fetch(
      `${BASE_URL}/movies/${id}`
    ).then(r => r.json())
    setMovie(data)
    if (data.genreId)
      setGenre(
        await fetch(
          `${BASE_URL}/genres/${data.genreId}`
        ).then(r => r.json())
      )
    loadActors()
  }
  const loadReviews = async () => {
    const data = await fetch(
      `${BASE_URL}/reviews?movieId=${id}`
    ).then(r => r.json())
    setReviews(data)
    setAverageRating(
      data.length
        ? (data.reduce((a, r) => a + r.rating, 0) / data.length).toFixed(1)
        : 0
    )
  }
  useEffect(() => {
    loadMovie()
    loadReviews()
  }, [id])
  const handleAddReview = async () => {
    if (!comment.trim())
      return showToast("Write a comment", "warning")
    if (!user)
      return showToast("Please login first", "warning")
    const res = await fetch(`${BASE_URL}/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify({
        movieId: +id,
        userId: user.id,
        userName: user.name,
        comment, rating,
        createdAt: new Date().toISOString()
      })
    })
    if (res.ok) {
      loadReviews()
      setComment("")
      setRating(5)
      showToast(
        "Review added!",
        "success"
      )
    } else {
      showToast(
        "Failed to add review",
        "error"
      )
    }
  }
  const handleDeleteReview = (reviewId, reviewUserId) => {
    if (user.role !== "admin" && user.id !== reviewUserId)
      return showToast(
        "You can only delete your own reviews",
        "warning"
      )
    showConfirm(
      "Delete Review",
      "Are you sure you want to delete this review?",
      async () => {
        await fetch(`${BASE_URL}/reviews/${reviewId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getToken()}`
          }
        })
        loadReviews()
        showToast("Review deleted")
      })
  }
  const handleOpenEditReview = review => {
    setEditingReview(review)
    setEditComment(review.comment)
    setEditRating(review.rating)
    setEditReviewModal(true)
  }

  const handleEditReview = async () => {

    if (!editComment.trim())
      return showToast(
        "Comment required",
        "warning"
      )

    const res = await fetch(
      `${BASE_URL}/reviews/${editingReview.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          ...editingReview,
          comment: editComment,
          rating: editRating
        })
      }
    )

    if (res.ok) {

      loadReviews()

      setEditReviewModal(false)

      showToast(
        "Review updated"
      )

    } else {

      showToast(
        "Failed to update review",
        "error"
      )

    }

  }
  const handleCreateAndAddActor = async () => {
    if (!newActorName.trim()) return
    const token = getToken()
    const actors = await fetch(
      `${BASE_URL}/actors`
    ).then(r => r.json())
    let existingActor = actors.find(
      a =>
        a.name.trim().toLowerCase() ===
        newActorName.trim().toLowerCase()
    )
    if (!existingActor) {
      existingActor = await fetch(
        `${BASE_URL}/actors`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: newActorName.trim(),
            birthYear: newActorBirthYear ? +newActorBirthYear : null,
            gender: newActorGender,
            biography: newActorBiography.trim()
          })
        }).then(r => r.json())
    }
    const relations = await fetch(
      `${BASE_URL}/movie_actors?movieId=${id}&actorId=${existingActor.id}`
    ).then(r => r.json())
    if (!relations.length) {
      await fetch(`${BASE_URL}/movie_actors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          movieId: +id,
          actorId: existingActor.id
        })
      })
    }
    loadActors()
    setShowActorModal(false)
    setNewActorName("")
    setNewActorBirthYear("")
    setNewActorGender("")
    setNewActorBiography("")
  }
  const handleRemoveActor = (actorId) => {
    showConfirm(
      "Remove Actor",
      "Are you sure you want to remove this actor?",
      async () => {
        const relations = await fetch(
          `${BASE_URL}/movie_actors?movieId=${+id}&actorId=${actorId}`
        ).then(r => r.json())
        if (!relations.length) return
        await fetch(
          `${BASE_URL}/movie_actors/${relations[0].id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${getToken()}`
            }
          })
        const actorRelations = await fetch(
          `${BASE_URL}/movie_actors?actorId=${actorId}`
        ).then(r => r.json())
        if (!actorRelations.length)
          await fetch(
            `${BASE_URL}/actors/${actorId}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${getToken()}`
              }
            })
        loadActors()
        showToast("Actor removed")
      })
  }
  const handleDeleteMovie = () => {
    showConfirm(
      "Delete Movie",
      "Are you sure you want to delete this movie? All reviews will be deleted too.",
      async () => {
        for (const review of reviews) {
          await fetch(
            `${BASE_URL}/reviews/${review.id}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${getToken()}`
              }
            })
        }
        await fetch(
          `${BASE_URL}/movies/${id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${getToken()}`
            }
          })
        navigate("/")
        showToast("Movie deleted")
      })
  }
  const canEdit = () =>
    user && (user.role === "admin" || movie?.createdBy === user.id)
  if (!movie)
    return <div className="loading">Loading...</div>
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
            <div style={{ display: "inline-flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
              <strong>🎭 Cast ({actors.length}):</strong>
              {canEdit() && <button onClick={() => setShowActorModal(true)} className="btn btn-primary btn-sm">+ Add Actor</button>}
            </div>
            <div className="actors-list">
              {actors.map(actor =>
                <span key={actor.id} className="actor-tag">
                  {actor.name} ({actor.birthYear || "?"})
                  {canEdit() &&
                    <button onClick={() => handleRemoveActor(actor.id)}>×</button>
                  }
                </span>
              )}
              {!actors.length && <span>No actors yet</span>}
            </div>
          </div>
          <div className="average-rating">
            ⭐ Average Rating: <strong>{averageRating}</strong>/10 ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
          </div>
          <p>{movie.description || "No description"}</p>
          {canEdit() &&
            <div className="movie-actions">
              <button onClick={() => navigate(`/movies/edit/${movie.id}`)} className="btn btn-warning">Edit</button>
              <button onClick={handleDeleteMovie} className="btn btn-danger">Delete</button>
            </div>
          }
        </div>
      </div>
      <div className="reviews-section">
        <h3>💬 Reviews ({reviews.length})</h3>
        {user ?
          <div className="review-form">
            <input
              type="number"
              min="1"
              max="10"
              value={rating}
              onChange={e => setRating(+e.target.value)}
              className="form-control"
              style={{ width: "100px" }}
            />
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Your review..."
              className="form-control"
              rows="2"
            />
            <button onClick={handleAddReview} className="btn btn-primary">Submit</button>
          </div>
          :
          <div className="login-prompt">
            Please <Link to="/login">login</Link> to review
          </div>
        }
        {reviews.map(r =>
          <div
            key={r.id}
            className="review-card"
          >
            <div className="review-header">
              <strong>{r.userName}</strong>
              <span>⭐ {r.rating}/10</span>
              <small>{new Date(r.createdAt).toLocaleDateString()}</small>
            </div>
            <p>{r.comment}</p>
            <div style={{ display: "flex", gap: "8px" }}>
              {(user?.id === r.userId || user?.role === "admin") &&
                <>
                  <button className="btn btn-warning btn-sm" onClick={() => handleOpenEditReview(r)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteReview(r.id, r.userId)}>Delete</button>
                </>
              }
            </div>
          </div>
        )}
      </div>
      {editReviewModal &&
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Edit Review</h3>
            <input
              type="number"
              min="1"
              max="10"
              value={editRating}
              onChange={e => setEditRating(+e.target.value)}
              className="form-control"
            />
            <textarea
              rows={4}
              value={editComment}
              onChange={e => setEditComment(e.target.value)}
              className="form-control"
            />
            <div style={{ display: "flex", gap: "10px" }}>
              <button className="btn btn-primary" onClick={handleEditReview}>Save</button>
              <button className="btn btn-secondary" onClick={() => setEditReviewModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      }
      {toast &&
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      }
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={resetModal}
      />
    </div>
  )
}
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useSelector } from "react-redux"
import ConfirmModal from "./ConfirmModal"
import Toast from "./Toast"
const BASE_URL = "http://localhost:3001"
export default function ActorsPage() {
  const [actors, setActors] = useState([])
  const [selectedActor, setSelectedActor] = useState(null)
  const [movies, setMovies] = useState([])
  const [editMode, setEditMode] = useState(false)
  const [toast, setToast] = useState(null)
  const [editActor, setEditActor] = useState({
    name: "",
    birthYear: "",
    gender: "",
    biography: ""
  })
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null
  })
  const user = useSelector(state => state.auth.user)
  const getToken = () => localStorage.getItem("token")
  useEffect(() => {
    fetch(`${BASE_URL}/actors`)
      .then(r => r.json())
      .then(setActors)
  }, [])
  const handleSelectActor = async actor => {
    setSelectedActor(actor)
    const relations = await fetch(
      `${BASE_URL}/movie_actors?actorId=${actor.id}`
    ).then(r => r.json())
    const movieList = await Promise.all(
      relations.map(async r =>
        fetch(`${BASE_URL}/movies/${r.movieId}`)
          .then(x => x.json())
      )
    )
    setMovies(movieList)
  }
  const canEditActor = () => {
    if (!user || !selectedActor) return false
    if (user.role === "admin") return true
    return movies.some(m => m.createdBy === user.id)
  }
  const canDeleteGlobal = () => user?.role === "admin"
  const canRemoveMine = () => {
    if (!user || user.role === "admin") return false
    return movies.some(m => m.createdBy === user.id)
  }
  const showToast = (message, type = "success") =>
    setToast({ message, type })
  const showConfirm = (title, message, onConfirm) =>
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm()
        setConfirmModal({
          isOpen: false,
          title: "",
          message: "",
          onConfirm: null
        })
      }
    })
  const handleEditActor = async () => {

    const res = await fetch(
      `${BASE_URL}/actors/${selectedActor.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          ...selectedActor,
          ...editActor,
          birthYear: editActor.birthYear ?
            parseInt(editActor.birthYear) : null
        })
      })
    if (!res.ok) return
    const updated = await res.json()
    setSelectedActor(updated)
    setActors(prev =>
      prev.map(a =>
        a.id === updated.id ? updated : a
      )
    )
    setEditMode(false)
    showToast("Actor updated")
  }
  const handleDeleteActor = async () => {
    showConfirm(
      "Delete Actor",
      "Delete actor globally?",
      async () => {
        const token = getToken()
        const relations = await fetch(
          `${BASE_URL}/movie_actors?actorId=${selectedActor.id}`
        ).then(r => r.json())
        for (const relation of relations) {
          await fetch(
            `${BASE_URL}/movie_actors/${relation.id}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`
              }
            })
        }
        await fetch(
          `${BASE_URL}/actors/${selectedActor.id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
        setActors(prev =>
          prev.filter(a =>
            a.id !== selectedActor.id
          ))
        setSelectedActor(null)
        showToast("Actor deleted")

      })
  }
  const handleRemoveMine = async () => {
    const token = getToken()
    for (const movie of movies) {
      if (movie.createdBy !== user.id)
        continue
      const relations = await fetch(
        `${BASE_URL}/movie_actors?movieId=${movie.id}&actorId=${selectedActor.id}`
      ).then(r => r.json())
      for (const relation of relations) {
        await fetch(
          `${BASE_URL}/movie_actors/${relation.id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
      }
    }
    await handleSelectActor(selectedActor)
    showToast("Removed from your movies")
  }
  return (
    <div>
      <h1>Actors Directory</h1>
      <div className="actors-page">
        <div className="actors-sidebar">
          <h3>All Actors</h3>
          <div className="actors-list-sidebar">
            {actors.map(actor =>
              <button
                key={actor.id}
                onClick={() => handleSelectActor(actor)}
                className={`btn btn-secondary actor-item ${selectedActor?.id === actor.id ? 'active' : ''}`}
              >
                {actor.name}
                <span style={{ color: "#888", fontSize: "0.75rem" }}>
                  ({actor.birthYear || "?"})
                </span>
              </button>
            )}
          </div>
        </div>
        <div className="actors-content">
          {selectedActor ? <>
            <h2>{selectedActor.name}</h2>
            <p><strong>Birth Year:</strong> {selectedActor.birthYear || "Unknown"}</p>
            <p><strong>Gender:</strong> {selectedActor.gender || "Unknown"}</p>
            <p><strong>Biography:</strong> {selectedActor.biography || "No biography"}</p>
            <div style={{
              display: "flex",
              gap: "10px",
              marginBottom: "20px",
              flexWrap: "wrap"
            }}>

              {canEditActor() &&
                <button
                  className="btn btn-warning"
                  onClick={() => {
                    setEditActor({
                      name: selectedActor.name,
                      birthYear: selectedActor.birthYear || "",
                      gender: selectedActor.gender || "",
                      biography: selectedActor.biography || ""
                    })
                    setEditMode(true)
                  }}
                >
                  Edit
                </button>
              }
              {canDeleteGlobal() &&
                <button className="btn btn-danger" onClick={handleDeleteActor}>
                  Delete Actor
                </button>
              }
              {canRemoveMine() &&
                <button className="btn btn-secondary" onClick={handleRemoveMine}>
                  Remove From My Movies
                </button>
              }
            </div>
            {editMode &&
              <div className="modal-overlay">
                <div className="modal-content">
                  <h3>Edit Actor</h3>
                  <input
                    className="form-control"
                    placeholder="Name"
                    value={editActor.name}
                    onChange={e => setEditActor({ ...editActor, name: e.target.value })}
                  />
                  <input
                    className="form-control"
                    placeholder="Birth Year"
                    value={editActor.birthYear}
                    onChange={e => setEditActor({ ...editActor, birthYear: e.target.value })}
                  />
                  <select
                    className="form-control"
                    value={editActor.gender}
                    onChange={e => setEditActor({ ...editActor, gender: e.target.value })}
                  >
                    <option>Select Gender</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                  <textarea
                    rows={4}
                    className="form-control"
                    placeholder="Biography"
                    value={editActor.biography}
                    onChange={e => setEditActor({ ...editActor, biography: e.target.value })}
                  />
                  <button className="btn btn-primary" onClick={handleEditActor}>Save</button>
                  <button className="btn btn-secondary" onClick={() => setEditMode(false)}>Cancel</button>
                </div>
              </div>
            }
            <h3>Movies</h3>
            {movies.length === 0 ?
              <p>No movies found for this actor.</p>
              :
              <div className="movie-grid">
                {movies.map(movie =>
                  <div key={movie.id} className="movie-card">
                    <img
                      src={movie.posterUrl || "https://via.placeholder.com/300x450?text=No+Poster"}
                      alt={movie.title}
                      className="movie-poster"
                    />
                    <div className="movie-info">
                      <h3 className="movie-title">{movie.title}</h3>
                      <p className="movie-year">{movie.year}</p>
                      <Link to={`/movies/${movie.id}`} className="btn btn-primary btn-sm">View Details</Link>
                    </div>
                  </div>
                )}
              </div>
            }
          </>
            :
            <div className="login-prompt" style={{ textAlign: "center", padding: "2rem" }}>
              Select an actor to see their movies
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
            onCancel={() => setConfirmModal({
              isOpen: false,
              title: "",
              message: "",
              onConfirm: null
            })}
          />
        </div>
      </div>
    </div>
  )
}
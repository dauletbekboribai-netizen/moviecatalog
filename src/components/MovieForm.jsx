import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector, useDispatch } from 'react-redux';
import { addMovie, updateMovie } from '../redux/store';
import Toast from "./Toast";

export default function MovieForm({ onMovieCreated, onMovieUpdated }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector(state => state.auth.user);
  const dispatch = useDispatch();
  const [genres, setGenres] = useState([]);
  const [form, setForm] = useState({ title: "", year: new Date().getFullYear(), posterUrl: "", description: "", genreId: "" });
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const getToken = () => localStorage.getItem("token");

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  useEffect(() => {
    fetch('http://localhost:3001/genres').then(res => res.json()).then(setGenres);
    if (id) {
      fetch(`http://localhost:3001/movies/${id}`).then(res => res.json()).then(setForm);
    }
  }, [id]);

  const handleSubmit = async () => {
    if (!form.title || !form.year || !form.genreId) {
      setError("Fill all fields");
      showToast("Fill all fields", "warning");
      return;
    }
    
    const token = getToken();
    if (!token) {
      setError("Please login first");
      showToast("Please login first", "warning");
      return;
    }

    const url = id ? `http://localhost:3001/movies/${id}` : 'http://localhost:3001/movies';
    const method = id ? 'PUT' : 'POST';
    
    const dataToSend = id ? form : { ...form, createdBy: user.id };
    
    const res = await fetch(url, { 
      method, 
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }, 
      body: JSON.stringify(dataToSend) 
    });
    
    if (res.ok) {
      const savedMovie = await res.json();
      
      if (id) {
        dispatch(updateMovie(savedMovie));
        if (onMovieUpdated) onMovieUpdated();
        showToast("Movie updated!", "success");
      } else {
        dispatch(addMovie(savedMovie));
        if (onMovieCreated) onMovieCreated();
        showToast("Movie created!", "success");
      }
      
      setTimeout(() => navigate('/'), 1000);
    } else {
      const data = await res.json();
      setError(data.error || "Error saving movie");
      showToast(data.error || "Error saving movie", "error");
    }
  };

  return (
    <div className="form-container">
      <h2>{id ? "Edit" : "Add"} Movie</h2>
      {error && <div className="error-message">{error}</div>}
      <input type="text" placeholder="Title" className="form-control" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
      <input type="number" placeholder="Year" className="form-control" value={form.year} onChange={e => setForm({ ...form, year: parseInt(e.target.value) })} />
      <input type="text" placeholder="Poster URL" className="form-control" value={form.posterUrl} onChange={e => setForm({ ...form, posterUrl: e.target.value })} />
      <select className="form-control" value={form.genreId} onChange={e => setForm({ ...form, genreId: parseInt(e.target.value) })}>
        <option value="">Select Genre</option>
        {genres.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
      </select>
      <textarea placeholder="Description" className="form-control" rows="3" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
      <button onClick={handleSubmit} className="btn btn-primary">{id ? "Update" : "Create"}</button>
      <button onClick={() => navigate('/')} className="btn btn-secondary">Cancel</button>
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
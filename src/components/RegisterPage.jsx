import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from 'react-redux';
import { setUser } from '../redux/store';

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

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleRegister = async () => {
    if (password.length < 6) return setError("Password min 6 chars");
    try {
      const res = await fetch("http://localhost:3001/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        dispatch(setUser(data.user));
        navigate("/");
        showToast("Registration successful");
      } else {
        setError(data.error || "Registration failed");
        showToast(message, "error");
      }
    } catch {
      setError("Connection error");
      showToast(message, "error");
    }
  };

  return (
    <div className="form-container">
      <h2>Register</h2>
      {error && <div className="error-message">{error}</div>}
      <input type="text" placeholder="Name" className="form-control" value={name} onChange={e => setName(e.target.value)} />
      <input type="email" placeholder="Email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Password (min 6)" className="form-control" value={password} onChange={e => setPassword(e.target.value)} />
      <button onClick={handleRegister} className="btn btn-primary">Register</button>
      <p className="form-footer">Have account? <Link to="/login">Login</Link></p>
    </div>
  );
}
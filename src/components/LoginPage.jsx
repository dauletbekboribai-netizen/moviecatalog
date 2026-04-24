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

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = async () => {
    try {
      const res = await fetch("http://localhost:3001/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        dispatch(setUser(data.user));
        navigate("/");
        showToast("Login successful");
      } else {
        const message = "Invalid credentials";
          setError(message);
          showToast(message, "error");
      }
    } catch {
      const message = "Connection error";
         setError(message);
         showToast(message, "error");
    }
  };

  return (
    <div className="form-container">
      <h2>Login</h2>
      {error && <div className="error-message">{error}</div>}
      <input type="email" placeholder="Email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} />
      <button onClick={handleLogin} className="btn btn-primary">Login</button>
      <p className="form-footer">No account? <Link to="/register">Register</Link></p>
    </div>
  );
}
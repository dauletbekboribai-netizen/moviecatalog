import { useEffect } from "react";

export default function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: { bg: "#4caf50", icon: "✓" },
    error: { bg: "#f44336", icon: "✗" },
    warning: { bg: "#ff9800", icon: "!" },
    info: { bg: "#2196f3", icon: "ℹ" }
  };

  const color = colors[type] || colors.info;

  return (
    <div style={{
      position: "fixed",
      bottom: "20px",
      right: "20px",
      background: color.bg,
      color: "white",
      padding: "12px 20px",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      zIndex: 2000,
      animation: "slideIn 0.3s ease"
    }}>
      <span style={{ fontWeight: "bold", fontSize: "18px" }}>{color.icon}</span>
      <span>{message}</span>
      <button onClick={onClose} style={{
        background: "none",
        border: "none",
        color: "white",
        cursor: "pointer",
        fontSize: "16px",
        marginLeft: "10px"
      }}>×</button>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
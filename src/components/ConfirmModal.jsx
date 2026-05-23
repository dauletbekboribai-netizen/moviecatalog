export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }) {
    if (!isOpen) return null;
  
    return (
      <div className="modal-overlay" onClick={onCancel}>
        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: "350px" }}>
          <h3 style={{ marginBottom: "10px" }}>{title}</h3>
          <p style={{ marginBottom: "20px", color: "#666" }}>{message}</p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button onClick={onCancel} className="btn btn-secondary">Cancel</button>
            <button onClick={onConfirm} className="btn btn-danger">Confirm</button>
          </div>
        </div>
      </div>
    );
  }
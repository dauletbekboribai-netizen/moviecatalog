import { useState } from "react";

export default function AddActorModal({ isOpen, onClose, onAddActor, allActors, movieActors }) {
  const [selectedActorId, setSelectedActorId] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedActorId) {
      alert("Select an actor");
      return;
    }
    setLoading(true);
    await onAddActor(parseInt(selectedActorId));
    setLoading(false);
    setSelectedActorId("");
    onClose();
  };

  const availableActors = allActors.filter(a => !movieActors?.some(ma => ma.id === a.id));

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.7)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000
    }} onClick={onClose}>
      <div style={{
        background: "white",
        borderRadius: "16px",
        padding: "24px",
        width: "90%",
        maxWidth: "400px"
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ marginBottom: "20px" }}>Add Actor to Movie</h2>
        
        <select 
          style={{
            width: "100%",
            padding: "12px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            marginBottom: "20px",
            fontSize: "14px"
          }}
          value={selectedActorId} 
          onChange={e => setSelectedActorId(e.target.value)}
        >
          <option value="">Select an actor...</option>
          {availableActors.map(actor => (
            <option key={actor.id} value={actor.id}>
              {actor.name} ({actor.birthYear || "?"})
            </option>
          ))}
        </select>
        
        {availableActors.length === 0 && (
          <p style={{ color: "#e53e3e", marginBottom: "15px", textAlign: "center" }}>
            No more actors to add!
          </p>
        )}
        
        <button 
          onClick={handleSubmit} 
          style={{
            width: "100%",
            padding: "12px",
            background: "#1a1a1a",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            marginBottom: "10px"
          }}
          disabled={loading || !selectedActorId}
        >
          {loading ? "Adding..." : "Add Actor"}
        </button>
        
        <button 
          onClick={onClose} 
          style={{
            width: "100%",
            padding: "12px",
            background: "#f0f0f0",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px"
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
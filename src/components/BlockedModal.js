import React from "react";
import "./BlockedModal.css";

export default function BlockedModal({ open, onClose, message, title }) {
  if (!open) return null;
  return (
    <div className="blocked-backdrop">
      <div className="blocked-modal">
        <h2>{title || "Blocked"}</h2>
        <p>{message || "Your account is blocked. Please contact support."}</p>
        <button className="blocked-btn" onClick={onClose}>OK</button>
      </div>
    </div>
  );
}

import React from "react";
export default function PopupToast({ show, error, message, onClose }){
  if(!show) return null;
  return (
    <div className={`admin-toast ${error ? "error" : ""}`}>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onClose}>×</button>
    </div>
  );
}

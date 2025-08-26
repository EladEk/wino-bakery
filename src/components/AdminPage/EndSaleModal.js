import React from "react";

export default function EndSaleModal({
  open,
  loading,
  onConfirm,
  onCancel,
  t
}) {
  if (!open) return null;

  return (
    <div
      className="end-sale-modal-overlay"
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.23)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <div
        className="end-sale-modal"
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 16,
          maxWidth: 350,
          minWidth: 280,
          padding: "32px 22px 20px 22px",
          boxShadow: "0 6px 24px rgba(0,0,0,0.18)",
          textAlign: "center",
          position: "relative"
        }}
      >
        <h3 style={{ fontWeight: 700, marginBottom: 18 }}>
          {t("ConfirmEndSale")}
        </h3>
        <p style={{ color: "#523f22", marginBottom: 22 }}>
          {t("EndsSaleWarning")}
        </p>
        <button
          onClick={onConfirm}
          disabled={loading}
          style={{
            background: "#c00",
            color: "#fff",
            fontWeight: 700,
            fontSize: "1.05rem",
            border: "none",
            padding: "9px 28px",
            borderRadius: 8,
            marginRight: 9,
            cursor: "pointer"
          }}
        >
          {loading ? t("Ending") : t("YesEndSale")}
        </button>
        <button
          onClick={onCancel}
          disabled={loading}
          style={{
            background: "#ede8e8",
            color: "#222",
            fontWeight: 600,
            border: "none",
            fontSize: "1.05rem",
            padding: "9px 23px",
            borderRadius: 8,
            marginLeft: 9,
            cursor: "pointer"
          }}
        >
          {t("Cancel")}
        </button>
        <button
          onClick={onCancel}
          disabled={loading}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 10,
            right: 15,
            background: "transparent",
            border: "none",
            fontSize: 23,
            color: "#444",
            cursor: "pointer"
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}

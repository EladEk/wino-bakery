import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useKibbutz } from "../../hooks/useKibbutz";

function ModalBase({ open, onClose, children }) {
  const { t } = useTranslation();
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", zIndex: 1200, top: 0, left: 0, width: "100vw", height: "100vh",
      background: "rgba(0,0,0,0.38)", display: "flex", alignItems: "center", justifyContent: "center"
    }} onClick={onClose}>
      <div style={{
        minWidth: 310,
        maxWidth: 400,
        background: "#fff",
        borderRadius: 15,
        boxShadow: "0 6px 32px rgba(0,0,0,.22)",
        padding: "28px 22px 22px 22px",
        position: "relative",
        direction: "rtl"
      }} onClick={e => e.stopPropagation()}>
        {children}
        <button onClick={onClose}
          style={{
            position: "absolute", top: 9, left: 12, fontSize: 24, background: "none", border: "none", color: "#444", cursor: "pointer"
          }}
          aria-label={t("close")}
        >&times;</button>
      </div>
    </div>
  );
}

export default function BreadEditModal({ open, bread, t, onSave, onDelete, onCancel }) {
  const { kibbutzim } = useKibbutz();
  const [form, setForm] = useState({
    name: "",
    description: "",
    availablePieces: "",
    price: "",
    show: true,
    isFocaccia: false,
    kibbutzQuantities: {},
  });

  useEffect(() => {
    if (bread) {
      setForm({
        name: bread.name ?? "",
        description: bread.description ?? "",
        availablePieces: bread.availablePieces ?? "",
        price: bread.price ?? "",
        show: bread.show !== false,
        isFocaccia: bread.isFocaccia ?? false,
        kibbutzQuantities: bread.kibbutzQuantities ?? {}
      });
    }
  }, [bread]);

  const handleChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.name || form.availablePieces === "" || form.price === "") return;
    onSave({ ...bread, ...form });
  };

  return (
    <ModalBase open={open} onClose={onCancel}>
      <form onSubmit={handleSubmit}>
        <h3 style={{ margin: "0 0 10px 0", textAlign: "center" }}>{t("EditBread")}</h3>
        <label style={{ display: "block", marginBottom: 8 }}>
          {t("Name")}:<br />
          <input
            type="text"
            value={form.name}
            onChange={e => handleChange("name", e.target.value)}
            required
            className="bread-input"
          />
        </label>
        <label style={{ display: "block", marginBottom: 8 }}>
          {t("description")}:<br />
          <textarea
            value={form.description}
            onChange={e => handleChange("description", e.target.value)}
            className="bread-input"
            rows={3}
            style={{ resize: "vertical", width: "100%" }}
          />
        </label>
        <label style={{ display: "block", marginBottom: 8 }}>
          {t("Pieces")}:<br />
          <input
            type="number"
            value={form.availablePieces}
            min={0}
            onChange={e => handleChange("availablePieces", e.target.value)}
            required
            className="bread-input"
          />
        </label>
        <label style={{ display: "block", marginBottom: 8 }}>
          {t("price")}:<br />
          <input
            type="number"
            value={form.price}
            min={0}
            step="0.01"
            onChange={e => handleChange("price", e.target.value)}
            required
            className="bread-input"
          />
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 12 }}>
          <input
            type="checkbox"
            checked={form.show}
            onChange={e => handleChange("show", e.target.checked)}
            style={{ accentColor: '#222' }}
          />
          {t("show")}
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 12 }}>
          <input
            type="checkbox"
            checked={form.isFocaccia}
            onChange={e => handleChange("isFocaccia", e.target.checked)}
            style={{ accentColor: '#222' }}
          />
          {t("foccia")}
        </label>

        {kibbutzim && kibbutzim.filter(kibbutz => !kibbutz.isClub).length > 0 ? (
          <div className="kibbutz-quantities-section">
            <h4>{t("kibbutzQuantityAllocation")}</h4>
            <p className="allocation-help">{t("kibbutzAllocationHelp")}</p>
            {kibbutzim.filter(kibbutz => !kibbutz.isClub).map(kibbutz => (
              <div key={kibbutz.id} className="kibbutz-quantity-row">
                <label>
                  {kibbutz.name}:
                  <input
                    type="number"
                    min="0"
                    max={form.availablePieces}
                    value={form.kibbutzQuantities[kibbutz.id] || 0}
                    onChange={(e) => {
                      const newQuantities = {
                        ...form.kibbutzQuantities,
                        [kibbutz.id]: Number(e.target.value) || 0
                      };
                      handleChange("kibbutzQuantities", newQuantities);
                    }}
                    className="bread-input"
                    placeholder="0"
                  />
                </label>
              </div>
            ))}
            <div className="allocation-summary">
              {t("totalAllocated")}: {Object.values(form.kibbutzQuantities).reduce((sum, qty) => sum + (qty || 0), 0)} / {form.availablePieces}
            </div>
          </div>
        ) : (
          <div style={{padding: '10px', background: '#f0f0f0', margin: '10px 0', borderRadius: '5px'}}>
            <small>No kibbutzim found. Create kibbutzim first to allocate quantities.</small>
          </div>
        )}

        <div style={{ display: "flex", gap: 14, marginTop: 10, justifyContent: "center" }}>
          <button type="submit" className="edit-bread-btn" style={{ fontWeight: "bold" }}>{t("Save")}</button>
          <button type="button" className="edit-bread-btn" onClick={onCancel}>{t("Cancel")}</button>
          <button type="button" className="edit-bread-btn" style={{ color: "red", fontWeight: "bold" }} onClick={() => onDelete(bread)}>
            {t("Delete")}
          </button>
        </div>
      </form>
    </ModalBase>
  );
}

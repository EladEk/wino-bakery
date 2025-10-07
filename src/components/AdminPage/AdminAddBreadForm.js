import React, { useState } from "react";
import { useKibbutz } from "../../hooks/useKibbutz";
import { breadsService } from "../../services/breads";

export default function AdminAddBreadForm({ t }) {
  const { kibbutzim } = useKibbutz();
  const [breadName, setBreadName] = useState("");
  const [breadPieces, setBreadPieces] = useState(1);
  const [breadDescription, setBreadDescription] = useState("");
  const [breadPrice, setBreadPrice] = useState("");
  const [breadShow, setBreadShow] = useState(true);
  const [breadIsFocaccia, setBreadIsFocaccia] = useState(false);
  const [kibbutzQuantities, setKibbutzQuantities] = useState({});

  const handleAddBread = async (e) => {
    e.preventDefault();
    if (!breadName || breadPieces < 1 || breadPrice === "") return;

    await breadsService.create({
      name: breadName,
      availablePieces: Number(breadPieces),
      description: breadDescription,
      price: Number(breadPrice),
      show: !!breadShow,
      isFocaccia: !!breadIsFocaccia,
      kibbutzQuantities: kibbutzQuantities,
    });

    setBreadName("");
    setBreadPieces(1);
    setBreadDescription("");
    setBreadPrice("");
    setBreadShow(true);
    setBreadIsFocaccia(false);
    setKibbutzQuantities({});
  };

  const dir = document.dir || "rtl";
  const labelMargin = dir === "rtl" ? { marginLeft: 8 } : { marginRight: 8 };

  return (
    <>
      <form onSubmit={handleAddBread} className="bread-form">
        <label>
          {t("Name")}:{" "}
          <input
            type="text"
            value={breadName}
            onChange={(e) => setBreadName(e.target.value)}
            required
            className="bread-input"
          />
        </label>

        <label>
          {t("Pieces")}:{" "}
          <input
            type="number"
            value={breadPieces}
            min={1}
            onChange={(e) => setBreadPieces(e.target.value)}
            required
            className="bread-input"
          />
        </label>

        <label>
          {t("description")}:{" "}
          <textarea
            value={breadDescription}
            onChange={(e) => setBreadDescription(e.target.value)}
            className="bread-input"
            rows={3}
            style={{ resize: "vertical" }}
          />
        </label>

        <label>
          {t("price")}:{" "}
          <input
            type="number"
            value={breadPrice}
            min={0}
            step="0.01"
            onChange={(e) => setBreadPrice(e.target.value)}
            required
            className="bread-input"
          />
        </label>

        <label style={{ display: "flex", alignItems: "center", ...labelMargin }}>
          <input
            type="checkbox"
            checked={breadShow}
            onChange={(e) => setBreadShow(e.target.checked)}
            style={{ accentColor: "#222", ...labelMargin }}
          />
          {t("show")}
        </label>

        <label style={{ display: "flex", alignItems: "center", ...labelMargin }}>
          <input
            type="checkbox"
            checked={breadIsFocaccia}
            onChange={(e) => setBreadIsFocaccia(e.target.checked)}
            style={{ accentColor: "#222", ...labelMargin }}
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
                    max={breadPieces}
                    value={kibbutzQuantities[kibbutz.id] || 0}
                    onChange={(e) => setKibbutzQuantities(prev => ({
                      ...prev,
                      [kibbutz.id]: Number(e.target.value) || 0
                    }))}
                    className="bread-input"
                    placeholder="0"
                  />
                </label>
              </div>
            ))}
            <div className="allocation-summary">
              {t("totalAllocated")}: {Object.values(kibbutzQuantities).reduce((sum, qty) => sum + (qty || 0), 0)} / {breadPieces}
            </div>
          </div>
        ) : (
          <div style={{padding: '10px', background: '#f0f0f0', margin: '10px 0', borderRadius: '5px'}}>
            <small>No kibbutzim found. Create kibbutzim first to allocate quantities.</small>
          </div>
        )}

        <button type="submit" className="add-bread-btn" data-testid="submit-add-bread-button">
          {t("Add Bread")}
        </button>
      </form>
    </>
  );
}

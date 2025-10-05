import React, { useState } from "react";
import { db } from "../../firebase";
import { addDoc, collection } from "firebase/firestore";

export default function AdminAddBreadForm({ t }) {
  const [breadName, setBreadName] = useState("");
  const [breadPieces, setBreadPieces] = useState(1);
  const [breadDescription, setBreadDescription] = useState("");
  const [breadPrice, setBreadPrice] = useState("");
  const [breadShow, setBreadShow] = useState(true);
  const [breadIsFocaccia, setBreadIsFocaccia] = useState(false);

  const handleAddBread = async (e) => {
    e.preventDefault();
    if (!breadName || breadPieces < 1 || breadPrice === "") return;

    await addDoc(collection(db, "breads"), {
      name: breadName,
      availablePieces: Number(breadPieces),
      description: breadDescription,
      price: Number(breadPrice),
      claimedBy: [],
      show: !!breadShow,
      isFocaccia: !!breadIsFocaccia,
    });

    setBreadName("");
    setBreadPieces(1);
    setBreadDescription("");
    setBreadPrice("");
    setBreadShow(true);
    setBreadIsFocaccia(false);
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

        <button type="submit" className="add-bread-btn">
          {t("Add Bread")}
        </button>
      </form>
    </>
  );
}

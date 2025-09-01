import React, { useState } from "react";
import { db } from "../../../firebase";
import { collection, addDoc } from "firebase/firestore";
import "./styles.css";

export default function AdminAddBreadForm({ t }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [availablePieces, setAvailablePieces] = useState(0);
  const [price, setPrice] = useState(0);
  const [isFocaccia, setIsFocaccia] = useState(false);

  const canAdd = name && price >= 0;

  const addBread = async () => {
    if (!canAdd) return;
    await addDoc(collection(db, "breads"), {
      name, description,
      availablePieces: Number(availablePieces || 0),
      price: Number(price || 0),
      isFocaccia: !!isFocaccia,
      show: true,
      claimedBy: []
    });
    setName(""); setDescription(""); setAvailablePieces(0); setPrice(0); setIsFocaccia(false);
    alert(t("added") || "Added");
  };

  return (
    <section className="bread-form">
      <h3>{t("addBread") || "Add Bread"}</h3>
      <input value={name} onChange={e=>setName(e.target.value)} placeholder={t("Name")} />
      <input value={description} onChange={e=>setDescription(e.target.value)} placeholder={t("description")} />
      <input type="number" value={availablePieces} onChange={e=>setAvailablePieces(e.target.value)} placeholder={t("available")} />
      <input type="number" step="0.01" value={price} onChange={e=>setPrice(e.target.value)} placeholder={t("price")} />
      <label style={{display:"flex",alignItems:"center",gap:8}}>
        <input type="checkbox" checked={isFocaccia} onChange={e=>setIsFocaccia(e.target.checked)} />
        {t("foccia") || "Focaccia (0.5 step)"}
      </label>
      <button className="add-bread" disabled={!canAdd} onClick={addBread}>
        {t("add") || "Add"}
      </button>
    </section>
  );
}

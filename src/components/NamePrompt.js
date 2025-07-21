import React, { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import "./NamePrompt.css";

export default function NamePrompt() {
  const { currentUser, setNeedsProfile } = useAuth();
  const { t, i18n } = useTranslation();

  const [name, setName]   = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await setDoc(
      doc(db, "users", currentUser.uid),
      { name: name.trim() },
      { merge: true }
    );
    setNeedsProfile(false);       // close modal
  };

  return (
    <div className="np-backdrop">
      <div className="np-card" dir={i18n.language === "he" ? "rtl" : "ltr"}>
        <h2 className="np-title">{t("pleaseEnterName", "Welcome! Please enter your name")}</h2>

        <input
          className="np-input"
          placeholder={t("yourName", "Your name")}
          value={name}
          onChange={e => setName(e.target.value)}
          disabled={saving}
        />

        <button
          className="np-btn"
          onClick={save}
          disabled={!name.trim() || saving}
        >
          {saving ? t("saving", "Saving…") : t("save", "Save")}
        </button>
      </div>
    </div>
  );
}

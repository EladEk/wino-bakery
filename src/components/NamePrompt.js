import React, { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import "./NamePrompt.css";

export default function NamePrompt() {
  const { currentUser, setNeedsProfile, setUserData } = useAuth();
  const { t, i18n } = useTranslation();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim() || !phone.trim()) return;
    setSaving(true);
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    await setDoc(
      doc(db, "users", currentUser.uid),
      { name: trimmedName, phone: trimmedPhone },
      { merge: true }
    );

    setUserData(prev => ({ ...prev, name: trimmedName, phone: trimmedPhone }));
    setNeedsProfile(false); // close modal
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
        <input
          className="np-input"
          placeholder={t("phone", "Your phone")}
          value={phone}
          onChange={e => setPhone(e.target.value)}
          disabled={saving}
        />
        <button
          className="np-btn"
          onClick={save}
          disabled={!name.trim() || !phone.trim() || saving}
        >
          {saving ? t("saving", "Saving…") : t("save", "Save")}
        </button>
      </div>
    </div>
  );
}

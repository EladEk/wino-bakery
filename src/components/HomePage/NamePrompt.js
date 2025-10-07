import React, { useState } from "react";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import "./NamePrompt.css";

export default function NamePrompt() {
  const { currentUser, setNeedsProfile, setUserData } = useAuth();
  const { t, i18n } = useTranslation();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!name.trim() || !phone.trim()) return;
    setSaving(true);
    setError("");
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    const isValidPhone = /^05\d{8}$/.test(trimmedPhone);
    if (!isValidPhone) {
      setError(t("invalidPhone", "Please enter a valid Israeli phone number (e.g. 0501234567)"));
      setSaving(false);
      return;
    }

    const usersRef = collection(db, "users");
    const q = query(usersRef, where("name", "==", trimmedName));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      setError(t("nameAlreadyExists", "A user with this name already exists"));
      setSaving(false);
      return;
    }

    await setDoc(
      doc(db, "users", currentUser.uid),
      { name: trimmedName, phone: trimmedPhone },
      { merge: true }
    );

    setUserData(prev => ({ ...prev, name: trimmedName, phone: trimmedPhone }));
    setNeedsProfile(false);
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
        {error && <div className="np-error">{error}</div>}
        <button
          className="np-btn"
          onClick={save}
          disabled={!name.trim() || !phone.trim() || saving}
          data-testid="save-profile-button"
        >
          {saving ? t("saving", "Saving…") : t("save", "Save")}
        </button>
      </div>
    </div>
  );
}

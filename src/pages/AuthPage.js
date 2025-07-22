import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import BreadLoader from "../components/BreadLoader";
import "./AuthPage.css";

export default function AuthPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setNeedsProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: user.email,
          createdAt: new Date(),
          isAdmin: false,
          isBlocked: false,
        });
        setNeedsProfile(true); // Trigger NamePrompt
      }

      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
        <h2>{t("login")}</h2>
        <button onClick={handleGoogleLogin} disabled={loading}>
          {loading ? <BreadLoader /> : t("loginWithGoogle")}
        </button>
        {error && <div className="auth-error">{error}</div>}
      </form>
    </div>
  );
}
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import BreadLoader from "../components/BreadLoader";
import BlockedModal from "../components/BlockedModal";
import "./AuthPage.css";

export default function AuthPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { setNeedsProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(location.search).get("blocked") === "1") {
      setBlocked(true);
    }
  }, [location]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
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
        setNeedsProfile(true);
        navigate("/");
        return;
      }

      // Existing user: check if blocked
      const data = userSnap.data();
      if (data.isBlocked) {
        await signOut(auth);
        navigate("/login?blocked=1", { replace: true });
        return;
      }

      navigate("/");

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="auth-container">
        <form className="auth-form" onSubmit={e => e.preventDefault()}>
          <br/>
          <br/>
          <br/>
          <br/>
          <h2>{t("login")}</h2>
          <button onClick={handleGoogleLogin} disabled={loading}>
            {loading ? <BreadLoader /> : t("loginWithGoogle")}
          </button>
          {error && <div className="auth-error">{error}</div>}
        </form>
      </div>
      <BlockedModal
        open={blocked}
        onClose={() => setBlocked(false)}
        title={t("Blocked")}
        message={t("accountBlocked")}
      />
    </>
  );
}

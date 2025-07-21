// src/pages/AuthPage.js
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
} from "firebase/auth";

import { auth } from "../firebase";
import { getRecaptcha, clearRecaptcha } from "../utils/recaptchaSingleton";
import BreadLoader from "../components/BreadLoader";
import "./AuthPage.css";

export default function AuthPage() {
  const phoneRef                = useRef();
  const recaptchaDiv            = useRef(null);
  const verifier                = useRef(null);

  const [code, setCode]         = useState("");
  const [verificationId, setVerificationId] = useState(null);
  const [recReady, setRecReady] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [captchaSolved, setCaptchaSolved] = useState(false);

  const navigate = useNavigate();
  const { t }   = useTranslation();

  // Dev bypass
  useEffect(() => {
    if (["localhost", "127.0.0.1"].includes(window.location.hostname)) {
      auth.settings.appVerificationDisabledForTesting = true;
    }
  }, []);

  // reCAPTCHA setup
  const buildRecaptcha = async () => {
    clearRecaptcha();
    setRecReady(false);
    setCaptchaSolved(false);
    try {
      verifier.current = await getRecaptcha(recaptchaDiv.current, setCaptchaSolved);
      setRecReady(true);
    } catch (e) {
      setError("reCAPTCHA failed – refresh and try again.");
      console.error("reCAPTCHA init failed:", e);
    }
  };
  useEffect(() => { buildRecaptcha(); }, []);

  // cooldown timer
  useEffect(() => {
    if (cooldown === 0) return;
    const id = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  // helpers
  const normalizePhone = (raw) => {
    let p = raw.replace(/\D/g, "");
    if (p.startsWith("0")) p = p.slice(1);
    return "+972" + p;
  };
  const withError = (msg) => { setError(msg); setLoading(false); };

  // Step 1: send SMS
  const sendVerificationCode = async () => {
    setError("");
    const raw   = phoneRef.current.value.trim();
    const phone = normalizePhone(raw);
    if (!raw) return withError("Enter phone number");
    if (!verifier.current) return withError("reCAPTCHA not ready");
    if (!captchaSolved) return withError("Please complete the security check.");

    setLoading(true);
    try {
      const result = await signInWithPhoneNumber(auth, phone, verifier.current);
      setVerificationId(result.verificationId);
      setCooldown(60);
    } catch (e) { withError(e.message); }
    finally    { setLoading(false); }
  };

  // Step 2: verify code
  const verifyCodeAndSignIn = async () => {
    setError("");
    if (!code.trim()) return withError("Enter verification code");

    setLoading(true);
    try {
      const cred = PhoneAuthProvider.credential(verificationId, code.trim());
      await signInWithCredential(auth, cred);
      navigate("/");
    } catch (e) { withError(e.message); }
    finally    { setLoading(false); }
  };

  return (
    <div className="auth-container">
      {/* reCAPTCHA widget always present in the DOM */}
      <div
        id="recaptcha-container"
        ref={recaptchaDiv}
        className="recaptcha-container"
      />

      {!recReady ? (
        <BreadLoader />
      ) : (
        <div>
          <h2 className="auth-title">{t("login")}</h2>

          {/* --- Phone form --- */}
          {!verificationId ? (
            <form
              className="auth-form"
              onSubmit={(e) => { e.preventDefault(); sendVerificationCode(); }}
            >
              <label htmlFor="ph" className="auth-label">טלפון</label>
              <input
                id="ph"
                ref={phoneRef}
                className="auth-input"
                placeholder="50 123 4567"
                pattern="[0-9]{9,10}"
                required
              />
              <button
                className="auth-btn"
                disabled={loading || cooldown || !captchaSolved}
              >
                {loading ? <BreadLoader /> :
                 cooldown ? `שלח קוד (${cooldown})` : "שלח קוד"}
              </button>
              <div style={{marginTop: 12, marginBottom: 6, color: "#888", fontSize: "0.95em"}}>
                יש להשלים את בדיקת האבטחה (reCAPTCHA) לפני שליחת קוד
              </div>
            </form>
          ) : (
            // --- Code form ---
            <form
              className="auth-form"
              onSubmit={(e) => { e.preventDefault(); verifyCodeAndSignIn(); }}
            >
              <label htmlFor="code" className="auth-label">קוד אימות</label>
              <input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="auth-input"
                placeholder="SMS code"
                required
              />
              <button className="auth-btn" disabled={loading}>
                {loading ? <BreadLoader /> : "אמת והיכנס"}
              </button>
              <button
                type="button"
                className="auth-btn-secondary"
                onClick={async () => {
                  setVerificationId(null);
                  setCode("");
                  setError("");
                  await buildRecaptcha();
                }}
              >
                שינוי מספר
              </button>
            </form>
          )}

          {error && <div className="auth-error">{error}</div>}
        </div>
      )}
    </div>
  );
}

import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
} from "firebase/auth";

import { auth, authReady } from "../firebase";
import { getRecaptcha, clearRecaptcha } from "../utils/recaptchaSingleton";
import BreadLoader from "../components/BreadLoader";
import "./AuthPage.css";

export default function AuthPage() {
  const phoneRef = useRef(null);
  const recaptchaDiv = useRef(null);
  const verifier = useRef(null);

  const [code, setCode] = useState("");
  const [verificationId, setVerificationId] = useState(null);
  const [recReady, setRecReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [captchaSolved, setCaptchaSolved] = useState(false);

  const navigate = useNavigate();
  const { t } = useTranslation();

  // Disable Firebase app-check on localhost
  useEffect(() => {
    (async () => {
      if (["localhost", "127.0.0.1"].includes(window.location.hostname)) {
        await authReady;
        // eslint-disable-next-line no-param-reassign
        auth.settings.appVerificationDisabledForTesting = true;
      }
    })();
  }, []);

  // Build or rebuild recaptcha widget
  const buildRecaptcha = async () => {
    clearRecaptcha();
    setRecReady(false);
    setCaptchaSolved(false);
    setError("");

    try {
      verifier.current = await getRecaptcha(
        auth,
        recaptchaDiv.current,
        setCaptchaSolved
      );
      if (!verifier.current) {
        throw new Error(
          "reCAPTCHA widget could not load – is this domain authorised in Firebase?"
        );
      }
      setRecReady(true);
    } catch (e) {
      setError(e.message || "Failed to initialise reCAPTCHA");
    }
  };

  // Build on mount / when we go back to phone entry step
  useEffect(() => {
    if (!verificationId) {
      buildRecaptcha();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verificationId]);

  // Cooldown timer
  useEffect(() => {
    if (!cooldown) return undefined;
    const id = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const normalizePhone = (raw) => {
    let p = raw.replace(/\D/g, "");
    if (p.startsWith("0")) p = p.slice(1);
    return "+972" + p;
  };

  const withError = (msg) => {
    setError(msg);
    setLoading(false);
  };

  // Send verification SMS
  const sendVerificationCode = async () => {
    setError("");
    const raw = phoneRef.current?.value.trim() || "";
    const phone = normalizePhone(raw);

    if (!raw) return withError("Enter phone number");
    if (!recReady) return withError("reCAPTCHA not ready");
    if (!captchaSolved) return withError("Please complete the security check.");

    setLoading(true);
    try {
      const result = await signInWithPhoneNumber(
        auth,
        phone,
        verifier.current
      );
      setVerificationId(result.verificationId);
      setCooldown(60);
    } catch (e) {
      withError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Verify code and sign in
  const verifyCodeAndSignIn = async () => {
    setError("");
    if (!code.trim()) return withError("Enter verification code");

    setLoading(true);
    try {
      const cred = PhoneAuthProvider.credential(
        verificationId,
        code.trim()
      );
      await signInWithCredential(auth, cred);
      navigate("/");
    } catch (e) {
      withError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Go back to enter phone
  const handleChangeNumber = () => {
    setVerificationId(null);
    setCode("");
    setError("");
  };

  // UI
  return (
    <div className="auth-container">
      <h2 className="auth-title">{t("login")}</h2>

      {!verificationId ? (
        <form
          className="auth-form"
          onSubmit={(e) => {
            e.preventDefault();
            sendVerificationCode();
          }}
        >
          <label htmlFor="ph" className="auth-label">
            טלפון
          </label>
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
            disabled={loading || cooldown || !captchaSolved || !recReady}
          >
            {loading ? (
              <BreadLoader />
            ) : cooldown ? (
              `שלח קוד (${cooldown})`
            ) : (
              "שלח קוד"
            )}
          </button>

          <div
            style={{
              marginTop: 12,
              marginBottom: 6,
              color: "#888",
              fontSize: "0.95em",
            }}
          >
            יש להשלים את בדיקת האבטחה (reCAPTCHA) לפני שליחת קוד
          </div>

          <div
            id="recaptcha-container"
            ref={recaptchaDiv}
            className="recaptcha-container"
          />
        </form>
      ) : (
        <form
          className="auth-form"
          onSubmit={(e) => {
            e.preventDefault();
            verifyCodeAndSignIn();
          }}
        >
          <label htmlFor="code" className="auth-label">
            קוד אימות
          </label>
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
            onClick={handleChangeNumber}
          >
            שינוי מספר
          </button>
        </form>
      )}

      {error && <div className="auth-error">{error}</div>}
    </div>
  );
}

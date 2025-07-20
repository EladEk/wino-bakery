import React, { useState, useRef, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import "./AuthPage.css";

export default function AuthPage() {
  /* ----------------------------- state & refs ----------------------------- */
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const phoneRef = useRef();
  const [isLogin, setIsLogin] = useState(true);
  const [verificationId, setVerificationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingPhone, setPendingPhone] = useState("");
  const [pendingLogin, setPendingLogin] = useState(false);
  const [recaptchaReady, setRecaptchaReady] = useState(false);

  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const recaptchaVerifierRef = useRef(null);

  /* ---------------------- dev‑only: disable app verification --------------------- */
  useEffect(() => {
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {

      auth.settings.appVerificationDisabledForTesting = true;
    }
  }, []);

  /* ----------------------- initialise the reCAPTCHA once ----------------------- */
  useEffect(() => {
    let mounted = true;
    if (!recaptchaVerifierRef.current) {
      try {
        // ⚠️ Parameter order for RecaptchaVerifier (modular SDK v10):
        // new RecaptchaVerifier(auth, containerOrId, parameters?)
        recaptchaVerifierRef.current = new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          { size: "invisible" }
        );

        recaptchaVerifierRef.current.render().then(() => {
          if (mounted) setRecaptchaReady(true);
        });
      } catch (e) {
        setError("Failed to initialise reCAPTCHA: " + e.message);
        console.error(e);
      }
    }

    return () => {
      mounted = false;
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
    // We only want to run this once!
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------------------------- utilities ------------------------------- */
  const normalizePhone = (raw) => {
    let p = raw.replace(/\D/g, "");
    if (p.startsWith("0")) p = p.slice(1);
    return "+972" + p;
  };

  /* ------------------------ 1️⃣  send verification code ----------------------- */
  const sendVerificationCode = async () => {
    setError("");
    const raw = phoneRef.current.value.trim();
    const phone = normalizePhone(raw);
    if (!raw) return setError(t("phoneRequired") ?? "Enter phone number");
    if (!isLogin && !name.trim())
      return setError(t("nameRequired") ?? "Enter your name");

    setLoading(true);
    try {
      const appVerifier = recaptchaVerifierRef.current;
      if (!appVerifier) throw new Error("reCAPTCHA not ready");
      const result = await signInWithPhoneNumber(auth, phone, appVerifier);
      setVerificationId(result.verificationId);
      setPendingPhone(phone);
    } catch (err) {
      setError(err.message);
      console.error("sendVerificationCode error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------- 2️⃣  verify code & sign in ----------------------- */
  const verifyCodeAndSignIn = async () => {
    setError("");
    if (!code.trim())
      return setError(t("codeRequired") ?? "Enter verification code");

    setLoading(true);
    try {
      const credential = PhoneAuthProvider.credential(verificationId, code);
      const userCred = await signInWithCredential(auth, credential);

      // On first registration create the user doc
      if (!isLogin) {
        await setDoc(doc(db, "users", userCred.user.uid), {
          phone: pendingPhone,
          name,
          isAdmin: false,
          isBlocked: false,
          createdAt: serverTimestamp(),
        });
      }
      setPendingLogin(true);
    } catch (err) {
      setError(err.message);
      console.error("verifyCodeAndSignIn error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------- redirect once Firebase logs in ------------------------- */
  useEffect(() => {
    if (pendingLogin && currentUser) {
      setPendingLogin(false);
      navigate("/");
    }
  }, [pendingLogin, currentUser, navigate]);

  /* --------------------------------‑ UI starts here ------------------------------- */
  return (
    <div className="auth-container">
      {/* Always render the reCAPTCHA container (Firebase injects the iframe) */}
      <div
        id="recaptcha-container"
        style={{
          position: "absolute",
          top: "-10000px",
          left: "-10000px",
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
      />

      {pendingLogin || !recaptchaReady ? (
        <div className="auth-loader">{t("loading") ?? "Loading..."}</div>
      ) : (
        <div>
          <h2 className="auth-title">{isLogin ? t("login") : t("register")}</h2>

          {/* ---------- step 1: ask for phone ---------- */}
          {!verificationId ? (
            <form
              className="auth-form"
              onSubmit={(e) => {
                e.preventDefault();
                sendVerificationCode();
              }}
            >
              {!isLogin && (
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  type="text"
                  placeholder={t("name")}
                  required
                  className="auth-input"
                />
              )}
              <label htmlFor="phone-input" className="auth-label">
                {t("phone") ?? "Phone:"}
              </label>
              <input
                id="phone-input"
                ref={phoneRef}
                type="tel"
                placeholder="50 123 4567"
                required
                className="auth-input"
                pattern="[0-9]{9,10}"
                maxLength={10}
                inputMode="numeric"
                autoComplete="tel"
              />
              <button type="submit" disabled={loading} className="auth-btn">
                {loading ? t("loading") : t("sendCode")}
              </button>
              <button
                type="button"
                className="auth-btn-secondary"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                  setName("");
                  setCode("");
                }}
              >
                {isLogin ? t("needAccount") : t("alreadyAccount")}
              </button>
            </form>
          ) : (
            /* ---------- step 2: ask for verification code ---------- */
            <form
              className="auth-form"
              onSubmit={(e) => {
                e.preventDefault();
                verifyCodeAndSignIn();
              }}
            >
              <label htmlFor="code-input" className="auth-label">
                {t("verificationCode") ?? "Verification Code:"}
              </label>
              <input
                id="code-input"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                type="text"
                placeholder={t("verificationCode")}
                required
                className="auth-input"
              />
              <button type="submit" disabled={loading} className="auth-btn">
                {loading ? t("loading") : t("verifyCode")}
              </button>
              <button
                type="button"
                className="auth-btn-secondary"
                onClick={() => {
                  setVerificationId(null); // Back to phone input
                  setCode("");
                  setError("");
                }}
              >
                {t("changePhone") || "Back / Change phone"}
              </button>
            </form>
          )}

          {error && <div className="auth-error">{error}</div>}
        </div>
      )}
    </div>
  );
}

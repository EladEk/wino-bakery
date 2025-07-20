// src/pages/AuthPage.js – full file

import React, { useState, useRef, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import {
  setDoc,
  doc,
  serverTimestamp,
  query,
  collection,
  where,
  getDocs,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import "./AuthPage.css";

/* -----------------------------------------------------------
   Singleton: invisible reCAPTCHA Enterprise verifier
   (avoids double‑mount in React‑18 StrictMode)
----------------------------------------------------------- */
let recaptchaVerifierSingleton = null;

export default function AuthPage() {
  /* ----------------- state ----------------- */
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
  const [cooldown, setCooldown] = useState(0);

  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const recaptchaVerifierRef = useRef(null);

  /* Disable verification in local dev (Firebase test numbers only!) */
  useEffect(() => {
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore – dev‑only flag
      auth.settings.appVerificationDisabledForTesting = true;
    }
  }, []);

  /* Initialise Enterprise reCAPTCHA once */
  useEffect(() => {
    let mounted = true;
    if (!recaptchaVerifierSingleton) {
      try {
        recaptchaVerifierSingleton = new RecaptchaVerifier(
          auth, // <-- first arg
          "recaptcha-container",
          {
            size: "invisible",
            type: "enterprise", // reuse App Check token
          }
        );
        recaptchaVerifierSingleton.render().then(() => {
          if (mounted) setRecaptchaReady(true);
        });
      } catch (e) {
        console.error(e);
        setError("reCAPTCHA init failed: " + e.message);
      }
    } else {
      setRecaptchaReady(true);
    }
    recaptchaVerifierRef.current = recaptchaVerifierSingleton;
    return () => {
      mounted = false;
    };
  }, []);

  /* Cool‑down timer for Send‑Code button */
  useEffect(() => {
    if (cooldown === 0) return;
    const id = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  /* ----------------- helpers ----------------- */
  const normalizePhone = (raw) => {
    let p = raw.replace(/\D/g, "");
    if (p.startsWith("0")) p = p.slice(1);
    return "+972" + p;
  };

  const withError = (msg) => {
    setError(msg);
    setLoading(false);
  };

  /* ----------------- Step 1: send SMS ----------------- */
  const sendVerificationCode = async () => {
    setError("");
    const raw = phoneRef.current.value.trim();
    const phone = normalizePhone(raw);
    if (!raw) return withError(t("phoneRequired") ?? "Enter phone number");
    if (!isLogin && !name.trim())
      return withError(t("nameRequired") ?? "Enter your name");

    /* prevent hammering */
    if (cooldown > 0) return;

    setLoading(true);
    try {
      /* Login mode → ensure number exists in Firestore */
      if (isLogin) {
        const snap = await getDocs(
          query(collection(db, "users"), where("phone", "==", phone))
        );
        if (snap.empty) {
          return withError(
            t("notRegistered") ??
              "Number isn’t registered – choose Register instead."
          );
        }
      }

      const appVerifier = recaptchaVerifierRef.current;
      if (!appVerifier) throw new Error("reCAPTCHA not ready");
      const result = await signInWithPhoneNumber(auth, phone, appVerifier);
      setVerificationId(result.verificationId);
      setPendingPhone(phone);
      setCooldown(60); // 60 s throttle
    } catch (err) {
      if (err.code === "auth/too-many-requests") {
        return withError(
          t("tooManyRequests") ??
            "Too many attempts – wait a minute and try again."
        );
      }
      return withError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ----------------- Step 2: verify code ----------------- */
  const verifyCodeAndSignIn = async () => {
    setError("");
    if (!code.trim())
      return withError(t("codeRequired") ?? "Enter verification code");

    setLoading(true);
    try {
      const cred = PhoneAuthProvider.credential(verificationId, code);
      const userCred = await signInWithCredential(auth, cred);

      /* Register flow → create Firestore user document */
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
      return withError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* Redirect home once AuthContext updates */
  useEffect(() => {
    if (pendingLogin && currentUser) {
      setPendingLogin(false);
      navigate("/");
    }
  }, [pendingLogin, currentUser, navigate]);

  /* ----------------- UI ----------------- */
  return (
    <div className="auth-container">
      {/* reCAPTCHA div kept off‑screen */}
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
        <div className="auth-loader">{t("loading") ?? "Loading…"}</div>
      ) : (
        <div>
          <h2 className="auth-title">
            {isLogin ? t("login") : t("register")}
          </h2>

          {/* --------------- Phone form --------------- */}
          {!verificationId ? (
            <form
              className="auth-form"
              onSubmit={(e) => {
                e.preventDefault();
                sendVerificationCode();
              }}
            >
              {/* Name only when registering */}
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

              <button
                type="submit"
                disabled={loading || cooldown > 0}
                className="auth-btn"
              >
                {loading
                  ? t("loading")
                  : cooldown > 0
                  ? `${t("sendCode") ?? "Send code"} (${cooldown})`
                  : t("sendCode")}
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
            /* --------------- Code form --------------- */
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

              <button
                type="submit"
                disabled={loading}
                className="auth-btn"
              >
                {loading ? t("loading") : t("verifyCode")}
              </button>

              <button
                type="button"
                className="auth-btn-secondary"
                onClick={() => {
                  setVerificationId(null);
                  setCode("");
                  setError("");
                }}
              >
                {t("changePhone") || "Back / Change phone"}
              </button>
            </form>
          )}

          {/* Error box – white background only for notRegistered */}
          {error && (
            <div
              className="auth-error"
              style={
                error.includes("not registered")
                  ? { background: "#fff" }
                  : undefined
              }
            >
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

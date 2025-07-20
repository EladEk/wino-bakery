// src/pages/AuthPage.js
import React, { useRef, useState, useEffect } from "react";
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

export default function AuthPage() {
  const phoneRef = useRef();
  const nameRef = useRef();
  const codeRef = useRef();

  const [isLogin, setIsLogin] = useState(true);
  const [verificationId, setVerificationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [pendingPhone, setPendingPhone] = useState(""); // save for registration

  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
          callback: () => {},
        }
      );
    }
  }, []);

  const normalizePhone = (raw) => {
    // Remove non-digits, trim, remove leading 0
    let p = raw.replace(/\D/g, "");
    if (p.startsWith("0")) p = p.slice(1);
    return "+972" + p;
  };

  const sendVerificationCode = async () => {
    setError("");
    const phoneRaw = phoneRef.current.value.trim();
    const phoneNumber = normalizePhone(phoneRaw);

    if (!phoneRaw) {
      setError(t("phoneRequired") || "Please enter a phone number");
      return;
    }
    if (!isLogin && !nameRef.current.value.trim()) {
      setError(t("nameRequired") || "Please enter your name");
      return;
    }
    setLoading(true);

    try {
      const appVerifier = window.recaptchaVerifier;
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        appVerifier
      );
      setVerificationId(confirmationResult.verificationId);
      setPendingPhone(phoneNumber); // Save for use in registration
    } catch (err) {
      setError(err.message);
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyCodeAndSignIn = async () => {
    setError("");
    const code = codeRef.current.value.trim();
    if (!code) {
      setError(t("codeRequired") || "Please enter the verification code");
      return;
    }
    setLoading(true);

    try {
      const credential = PhoneAuthProvider.credential(verificationId, code);
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;

      // Only create Firestore user doc on registration
      if (!isLogin) {
        await setDoc(doc(db, "users", user.uid), {
          phone: pendingPhone || user.phoneNumber,
          name: nameRef.current.value,
          isAdmin: false,
          isBlocked: false,
          createdAt: serverTimestamp(),
        });
      }
      // After registration or login, go directly to homepage
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "50px auto" }}>
      <h2>{isLogin ? t("login") : t("register")}</h2>

      {!verificationId ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendVerificationCode();
          }}
        >
          {!isLogin && (
            <input
              ref={nameRef}
              type="text"
              placeholder={t("name")}
              required
              style={{ marginBottom: 8 }}
            />
          )}
          <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
            <span style={{
              padding: "8px 10px",
              background: "#eee",
              borderRadius: "4px 0 0 4px",
              border: "1px solid #ccc",
              borderRight: "none"
            }}>+972</span>
            <input
              ref={phoneRef}
              type="tel"
              placeholder="50 123 1111"
              required
              style={{
                flex: 1,
                borderRadius: "0 4px 4px 0",
                border: "1px solid #ccc",
                borderLeft: "none",
                padding: "8px"
              }}
              pattern="[0-9]{9,10}"
              maxLength={10}
              minLength={8}
              inputMode="numeric"
              autoComplete="tel"
            />
          </div>
          <div id="recaptcha-container"></div>
          <button type="submit" disabled={loading}>
            {loading ? t("loading") : t("sendCode")}
          </button>
        </form>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            verifyCodeAndSignIn();
          }}
        >
          <input
            ref={codeRef}
            type="text"
            placeholder={t("verificationCode")}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? t("loading") : t("verifyCode")}
          </button>
        </form>
      )}

      {error && <div style={{ color: "red", marginTop: 10 }}>{error}</div>}

      <button
        style={{ marginTop: 20 }}
        onClick={() => {
          setIsLogin(!isLogin);
          setVerificationId(null);
          setError("");
        }}
      >
        {isLogin ? t("needAccount") : t("alreadyAccount")}
      </button>
    </div>
  );
}

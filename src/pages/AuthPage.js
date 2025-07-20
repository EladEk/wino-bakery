// src/pages/AuthPage.js
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

export default function AuthPage() {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const phoneRef = useRef();

  const [isLogin, setIsLogin] = useState(true);
  const [verificationId, setVerificationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingPhone, setPendingPhone] = useState("");

  const navigate = useNavigate();
  const { t } = useTranslation();

  // Always clean up recaptcha between flows!
  const cleanupRecaptcha = () => {
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch {}
      window.recaptchaVerifier = null;
    }
  };

  // Always create fresh recaptcha when sending code
  const setupRecaptcha = () => {
    cleanupRecaptcha();
    window.recaptchaVerifier = new RecaptchaVerifier(
      auth,
      "recaptcha-container",
      {
        size: "invisible",
        callback: () => {},
      }
    );
  };

  const normalizePhone = (raw) => {
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
    if (!isLogin && !name.trim()) {
      setError(t("nameRequired") || "Please enter your name");
      return;
    }
    setLoading(true);

    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        appVerifier
      );
      setVerificationId(confirmationResult.verificationId);
      setPendingPhone(phoneNumber);
    } catch (err) {
      setError(err.message);
      cleanupRecaptcha();
    } finally {
      setLoading(false);
    }
  };

  const verifyCodeAndSignIn = async () => {
    setError("");
    if (!code.trim()) {
      setError(t("codeRequired") || "Please enter the verification code");
      return;
    }
    setLoading(true);

    try {
      const credential = PhoneAuthProvider.credential(verificationId, code.trim());
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;

      if (!isLogin) {
        await setDoc(doc(db, "users", user.uid), {
          phone: pendingPhone || user.phoneNumber,
          name: name,
          isAdmin: false,
          isBlocked: false,
          createdAt: serverTimestamp(),
        });
      }
      cleanupRecaptcha();
      setTimeout(() => navigate("/"), 50); // Short delay for auth context to catch up
    } catch (err) {
      setError(err.message);
      cleanupRecaptcha();
    } finally {
      setLoading(false);
    }
  };

  // Reset recaptcha on unmount
  useEffect(() => () => cleanupRecaptcha(), []);

  return (
    <div style={{ maxWidth: 400, margin: "50px auto" }}>
      <h2>{isLogin ? t("login") : t("register")}</h2>

      {!verificationId ? (
        <form
          onSubmit={e => {
            e.preventDefault();
            sendVerificationCode();
          }}
        >
          {!isLogin && (
            <input
              value={name}
              onChange={e => setName(e.target.value)}
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
          onSubmit={e => {
            e.preventDefault();
            verifyCodeAndSignIn();
          }}
        >
          <input
            value={code}
            onChange={e => setCode(e.target.value)}
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
          setName("");
          setCode("");
          cleanupRecaptcha();
        }}
      >
        {isLogin ? t("needAccount") : t("alreadyAccount")}
      </button>
    </div>
  );
}

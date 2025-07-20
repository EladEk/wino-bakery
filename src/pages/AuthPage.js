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
import { useAuth } from "../contexts/AuthContext";

export default function AuthPage() {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const phoneRef = useRef();

  const [isLogin, setIsLogin] = useState(true);
  const [verificationId, setVerificationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingPhone, setPendingPhone] = useState("");
  const [pendingLogin, setPendingLogin] = useState(false);

  const { currentUser } = useAuth();
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
      setPendingLogin(true);
    } catch (err) {
      setError(err.message);
      cleanupRecaptcha();
    } finally {
      setLoading(false);
    }
  };

  // Watch for login and redirect home only after Firebase Auth is ready!
  useEffect(() => {
    if (pendingLogin && currentUser) {
      setPendingLogin(false);
      navigate("/");
    }
  }, [pendingLogin, currentUser, navigate]);

  // Reset recaptcha on unmount
  useEffect(() => () => cleanupRecaptcha(), []);

  if (pendingLogin) {
    return (
      <div style={{ textAlign: "center", marginTop: 80, fontSize: 22 }}>
        {t("loading") || "Loading..."}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: "50px auto" }}>
      <h2 style={{ textAlign: "center" }}>
        {isLogin ? t("login") : t("register")}
      </h2>

      {!verificationId ? (
        <form
          onSubmit={e => {
            e.preventDefault();
            sendVerificationCode();
          }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
        >
          {!isLogin && (
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              type="text"
              placeholder={t("name")}
              required
              style={{ marginBottom: 12, width: 240, textAlign: "center" }}
            />
          )}
          <label
            htmlFor="phone-input"
            style={{
              marginBottom: 4,
              fontWeight: "bold",
              fontSize: 16,
              alignSelf: "center"
            }}
          >
            {t("phone") || "Phone:"}
          </label>
          <input
            id="phone-input"
            ref={phoneRef}
            type="tel"
            placeholder="50 123 1111"
            required
            style={{
              width: 240,
              padding: "8px",
              borderRadius: 6,
              border: "1px solid #ccc",
              marginBottom: 16,
              textAlign: "center",
              fontSize: 16
            }}
            pattern="[0-9]{9,10}"
            maxLength={10}
            minLength={8}
            inputMode="numeric"
            autoComplete="tel"
          />
          <div id="recaptcha-container"></div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: 180,
              margin: "10px auto",
              padding: "10px",
              borderRadius: 6,
              background: "#fffbe6",
              fontWeight: "bold",
              fontSize: 16,
              border: "1px solid #dac078",
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? t("loading") : t("sendCode")}
          </button>
          <button
            type="button"
            style={{
              width: 180,
              margin: "8px auto 0 auto",
              padding: "10px",
              borderRadius: 6,
              background: "#f3f3f3",
              fontWeight: "bold",
              fontSize: 15,
              border: "1px solid #ccc",
              cursor: "pointer"
            }}
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
        </form>
      ) : (
        <form
          onSubmit={e => {
            e.preventDefault();
            verifyCodeAndSignIn();
          }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
        >
          <label
            htmlFor="code-input"
            style={{
              marginBottom: 4,
              fontWeight: "bold",
              fontSize: 16,
              alignSelf: "center"
            }}
          >
            {t("verificationCode") || "Verification Code:"}
          </label>
          <input
            id="code-input"
            value={code}
            onChange={e => setCode(e.target.value)}
            type="text"
            placeholder={t("verificationCode")}
            required
            style={{
              width: 180,
              padding: "8px",
              borderRadius: 6,
              border: "1px solid #ccc",
              marginBottom: 16,
              textAlign: "center",
              fontSize: 16
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              width: 180,
              margin: "10px auto",
              padding: "10px",
              borderRadius: 6,
              background: "#fffbe6",
              fontWeight: "bold",
              fontSize: 16,
              border: "1px solid #dac078",
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? t("loading") : t("verifyCode")}
          </button>
          <button
            type="button"
            style={{
              width: 180,
              margin: "8px auto 0 auto",
              padding: "10px",
              borderRadius: 6,
              background: "#f3f3f3",
              fontWeight: "bold",
              fontSize: 15,
              border: "1px solid #ccc",
              cursor: "pointer"
            }}
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
        </form>
      )}

      {error && <div style={{ color: "red", marginTop: 10, textAlign: "center" }}>{error}</div>}
    </div>
  );
}

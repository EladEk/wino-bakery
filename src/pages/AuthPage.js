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

  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
          callback: () => {
            console.log("reCAPTCHA resolved");
          },
        }
      );
    }
  }, []);

  const sendVerificationCode = async () => {
    setError("");
    const phoneNumber = phoneRef.current.value.trim();
    if (!phoneNumber) {
      setError(t("phoneRequired") || "Please enter a phone number");
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

      if (!isLogin) {
        await setDoc(doc(db, "users", user.uid), {
          phone: user.phoneNumber,
          name: nameRef.current.value,
          isAdmin: false,
          isBlocked: false,
          createdAt: serverTimestamp(),
        });
      }
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
          <input
            ref={phoneRef}
            type="tel"
            placeholder="+972 50 123 1111"
            required
          />
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
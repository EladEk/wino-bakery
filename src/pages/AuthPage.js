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
  // ... all your state, logic, hooks, etc.

  if (pendingLogin) {
    return (
      <div className="auth-loader">
        {t("loading") || "Loading..."}
      </div>
    );
  }

  return (
    <div className="auth-container">
      <h2 className="auth-title">
        {isLogin ? t("login") : t("register")}
      </h2>

      {!verificationId ? (
        <form
          onSubmit={e => {
            e.preventDefault();
            sendVerificationCode();
          }}
          className="auth-form"
        >
          {!isLogin && (
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              type="text"
              placeholder={t("name")}
              required
              className="auth-input"
            />
          )}
          <label htmlFor="phone-input" className="auth-label">
            {t("phone") || "Phone:"}
          </label>
          <input
            id="phone-input"
            ref={phoneRef}
            type="tel"
            placeholder="50 123 1111"
            required
            className="auth-input"
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
            className="auth-btn"
          >
            {loading ? t("loading") : t("sendCode")}
          </button>
          <button
            type="button"
            className="auth-btn-secondary"
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
          className="auth-form"
        >
          <label htmlFor="code-input" className="auth-label">
            {t("verificationCode") || "Verification Code:"}
          </label>
          <input
            id="code-input"
            value={code}
            onChange={e => setCode(e.target.value)}
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

      {error && <div className="auth-error">{error}</div>}
    </div>
  );
}

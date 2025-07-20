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

  const recaptchaVerifierRef = useRef(null);

  useEffect(() => {
    if (!recaptchaVerifierRef.current) {
      if (!auth) {
        console.error("Firebase auth instance is undefined");
        return;
      }
      recaptchaVerifierRef.current = new RecaptchaVerifier(
        "recaptcha-container",
        {
          size: "invisible",
          callback: () => {},
        },
        auth
      );
    }
    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

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
      const appVerifier = recaptchaVerifierRef.current;
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setVerificationId(confirmationResult.verificationId);
      setPendingPhone(phoneNumber);
    } catch (err) {
      setError(err.message);
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
      setPendingLogin(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pendingLogin && currentUser) {
      setPendingLogin(false);
      navigate("/");
    }
  }, [pendingLogin, currentUser, navigate]);

  if (pendingLogin) {
    return <div className="auth-loader">{t("loading") || "Loading..."}</div>;
  }

  return (
    <div className="auth-container">
      <h2 className="auth-title">{isLogin ? t("login") : t("register")}</h2>

      {!verificationId ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendVerificationCode();
          }}
          className="auth-form"
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
            {t("phone") || "Phone:"}
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
            minLength={8}
            inputMode="numeric"
            autoComplete="tel"
          />
          <div id="recaptcha-container"></div>
          <button type="submit" disabled={loading} className="auth-btn">
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
            }}
          >
            {isLogin ? t("needAccount") : t("alreadyAccount")}
          </button>
        </form>
      ) : (
        <form
          onSubmit={(e) => {
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
            onChange={(e) => setCode(e.target.value)}
            type="text"
            placeholder={t("verificationCode")}
            required
            className="auth-input"
          />
          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? t("loading") : t("verifyCode")}
          </button>
        </form>
      )}

      {error && <div className="auth-error">{error}</div>}
    </div>
  );
}

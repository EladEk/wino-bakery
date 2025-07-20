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

// --- Recaptcha singleton to avoid double‑mount duplicates in React.StrictMode ---
let recaptchaVerifierSingleton = null;

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
  const [recaptchaReady, setRecaptchaReady] = useState(false);

  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const recaptchaVerifierRef = useRef(null);

  // Disable app verification for testing if on localhost (test numbers only!)
  useEffect(() => {
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      // @ts-ignore – firebase exposes this only in dev
      auth.settings.appVerificationDisabledForTesting = true;
    }
  }, []);

  // Initialise (only once!) the invisible reCAPTCHA verifier
  useEffect(() => {
    let mounted = true;

    if (!recaptchaVerifierSingleton) {
      try {
        recaptchaVerifierSingleton = new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          { size: "invisible" }
        );
        recaptchaVerifierSingleton.render().then(() => {
          if (mounted) setRecaptchaReady(true);
        });
      } catch (e) {
        setError("Failed to initialise reCAPTCHA: " + e.message);
        console.error(e);
      }
    } else {
      // already ready – ensure state reflects that
      setRecaptchaReady(true);
    }

    recaptchaVerifierRef.current = recaptchaVerifierSingleton;

    return () => {
      mounted = false;
      /* we intentionally **do not** clear the singleton so that
         React.StrictMode double‑mount in dev doesn’t recreate it */
    };
  }, []);

  const normalizePhone = (raw) => {
    let p = raw.replace(/\D/g, "");
    if (p.startsWith("0")) p = p.slice(1); // strip leading zero
    return "+972" + p;
  };

  const sendVerificationCode = async () => {
    setError("");
    const raw = phoneRef.current.value.trim();
    const phone = normalizePhone(raw);
    if (!raw) return setError(t("phoneRequired") ?? "Enter phone number");
    if (!isLogin && !name.trim())
      return setError(t("nameRequired") ?? "Enter your name");

    setLoading(true);
    try {
      // --- extra guard: if we’re logging in ensure phone exists in users collection ---
      if (isLogin) {
        const q = query(collection(db, "users"), where("phone", "==", phone));
        const snap = await getDocs(q);
        if (snap.empty) {
          setLoading(false);
          setError(
            t("notRegistered") ??
              "This number isn’t registered – try the Register tab instead."
          );
          return; // don’t send SMS
        }
      }

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

  const verifyCodeAndSignIn = async () => {
    setError("");
    if (!code.trim())
      return setError(t("codeRequired") ?? "Enter verification code");

    setLoading(true);
    try {
      const credential = PhoneAuthProvider.credential(verificationId, code);
      const userCred = await signInWithCredential(auth, credential);

      if (!isLogin) {
        // first‑time registration – create Firestore user doc
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

  // once AuthContext sees the logged‑in user, send them home
  useEffect(() => {
    if (pendingLogin && currentUser) {
      setPendingLogin(false);
      navigate("/");
    }
  }, [pendingLogin, currentUser, navigate]);

  // helper to detect the specific not‑registered error so we can style its background
  const isNotRegisteredError =
    error && error ===
      (t("notRegistered") ??
        "This number isn’t registered – try the Register tab instead.");

  return (
    <div className="auth-container">
      {/* always render the hidden reCAPTCHA container – the SDK injects the iframe here */}
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
                  setVerificationId(null); // back to phone entry
                  setCode("");
                  setError("");
                }}
              >
                {t("changePhone") || "Back / Change phone"}
              </button>
            </form>
          )}

          {error && (
            <div
              className="auth-error"
              style={isNotRegisteredError ? { background: "#fff" } : {}}
            >
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

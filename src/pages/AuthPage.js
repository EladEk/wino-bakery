import React, { useState, useRef, useEffect } from "react";
import { auth, db } from "../firebase";
import {
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
import { getRecaptcha, clearRecaptcha } from "../utils/recaptchaSingleton";
import BreadLoader from "../components/BreadLoader";
import "./AuthPage.css";

export default function AuthPage() {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const phoneRef = useRef();
  const [isLogin, setIsLogin] = useState(true);
  const [verificationId, setVerificationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recaptchaReady, setRecaptchaReady] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const navigate = useNavigate();
  const { t } = useTranslation();
  const verifierRef = useRef(null);
  const hostDivRef = useRef(null);

  useEffect(() => {
    if (["localhost", "127.0.0.1"].includes(window.location.hostname)) {
      auth.settings.appVerificationDisabledForTesting = true;
    }
  }, []);

  const buildFreshRecaptcha = async () => {
    clearRecaptcha();
    setRecaptchaReady(false);

    if (hostDivRef.current?.parentNode) {
      hostDivRef.current.parentNode.removeChild(hostDivRef.current);
    }

    const uniqueId = `recaptcha-container-${Date.now()}`;
    const host = document.createElement("div");
    host.id = uniqueId;
    Object.assign(host.style, {
      position: "absolute",
      top: "-10000px",
      left: "-10000px",
      width: "1px",
      height: "1px",
      overflow: "hidden",
    });
    document.body.appendChild(host);
    hostDivRef.current = host;

    try {
      verifierRef.current = await getRecaptcha(auth, uniqueId);
      setRecaptchaReady(true);
    } catch (e) {
      console.error("reCAPTCHA render failed:", e);
      setError(
        "Failed to load verification widget – please refresh the page or check your network."
      );
    }
  };

  useEffect(() => {
    buildFreshRecaptcha();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!cooldown) return;
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

  const sendVerificationCode = async () => {
    setError("");
    const raw = phoneRef.current.value.trim();
    const phone = normalizePhone(raw);
    if (!raw) return withError(t("phoneRequired") ?? "Enter phone number");
    if (!isLogin && !name.trim())
      return withError(t("nameRequired") ?? "Enter your name");
    if (cooldown) return;

    setLoading(true);
    try {
      await buildFreshRecaptcha();

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

      const result = await signInWithPhoneNumber(
        auth,
        phone,
        verifierRef.current
      );

      setVerificationId(result.verificationId);
      setCooldown(60);
    } catch (err) {
      if (
        err.code === "auth/internal-error" ||
        err.code === "auth/too-many-requests"
      ) {
        await buildFreshRecaptcha();
      }
      return withError(
        err.code === "auth/too-many-requests"
          ? t("tooManyRequests") ??
              "Too many attempts – wait a minute and try again."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyCodeAndSignIn = async () => {
    setError("");
    if (!code.trim())
      return withError(t("codeRequired") ?? "Enter verification code");
    setLoading(true);

    try {
      const cred = PhoneAuthProvider.credential(verificationId, code);
      const userCred = await signInWithCredential(auth, cred);

      if (!isLogin) {
        try {
          await setDoc(
            doc(db, "users", userCred.user.uid),
            {
              phone: normalizePhone(phoneRef.current.value),
              name, // <-- Only set name here!
              createdAt: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (e) {
          console.error("Failed to save profile:", e);
          setError(
            "Could not save your name – please check your connection or contact support."
          );
        }
      }

      navigate("/");
    } catch (err) {
      withError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {!recaptchaReady ? (
        <BreadLoader />
      ) : (
        <div>
          <h2 className="auth-title">
            {isLogin ? t("login") : t("register")}
          </h2>

          {/* -------- Phone form -------- */}
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

              <button
                type="submit"
                disabled={loading || cooldown}
                className="auth-btn"
              >
                {loading ? (
                  <BreadLoader />
                ) : cooldown ? (
                  `${t("sendCode") ?? "Send code"} (${cooldown})`
                ) : (
                  t("sendCode")
                )}
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

              <button
                type="submit"
                disabled={loading}
                className="auth-btn"
              >
                {loading ? <BreadLoader /> : t("verifyCode")}
              </button>

              <button
                type="button"
                className="auth-btn-secondary"
                onClick={async () => {
                  setVerificationId(null);
                  setCode("");
                  setError("");
                  await buildFreshRecaptcha();
                }}
              >
                {t("changePhone") || "Back / Change phone"}
              </button>
            </form>
          )}

          {error && (
            <div
              className="auth-error"
              style={
                error.includes("not registered") ? { background: "#fff" } : undefined
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

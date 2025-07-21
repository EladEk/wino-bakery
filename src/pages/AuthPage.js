import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
} from "firebase/auth";

import { auth, authReady } from "../firebase";
import { getRecaptcha, clearRecaptcha } from "../utils/recaptchaSingleton";
import BreadLoader from "../components/BreadLoader";
import "./AuthPage.css";

/**
 * AuthPage – Phone‑based login with Firebase
 *
 * Major fixes vs. the previous draft:
 * 1.   Better error handling: if the widget fails to render we surface a
 *      helpful message (usually caused by a non‑authorised production domain).
 * 2.   recaptchaSolved is now optional when we use the “invisible” size.
 * 3.   Added guard styles via CSS (see comment at end) so the widget isn’t
 *      hidden behind other elements on small screens.
 */

export default function AuthPage() {
  const phoneRef     = useRef(null);
  const recaptchaDiv = useRef(null);
  const verifier     = useRef(null);

  const [code, setCode]               = useState("");
  const [verificationId, setVerificationId] = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [cooldown, setCooldown]       = useState(0);
  const [captchaSolved, setCaptchaSolved] = useState(false);
  const [recReady, setRecReady]       = useState(false);

  const navigate  = useNavigate();
  const { t }     = useTranslation();

  /**
   * Disable the CAPTCHA entirely when we run on localhost (dev)
   * Firebase allows that flag only on trusted hosts.
   */
  useEffect(() => {
    (async () => {
      if (["localhost", "127.0.0.1"].includes(window.location.hostname)) {
        await authReady;
        auth.settings.appVerificationDisabledForTesting = true;
        setRecReady(true);
        setCaptchaSolved(true);
      }
    })();
  }, []);

  /**
   * Build (or rebuild) the reCAPTCHA widget inside <div ref={recaptchaDiv} />
   * The helper returns a singleton so we can safely call it multiple times.
   */
  const buildRecaptcha = async () => {
    clearRecaptcha();            // clean up any previous widget
    setRecReady(false);
    setCaptchaSolved(false);
    setError("");

    try {
      verifier.current = await getRecaptcha(
        auth,
        recaptchaDiv.current,
        setCaptchaSolved
      );

      if (!verifier.current) {
        throw new Error();
      }
      setRecReady(true);
    } catch (e) {
      /*
       * Most common root cause: your production domain isn’t whitelisted in
       * Firebase → Authentication → Sign‑in method → Authorised domains.
       */
      setError(
        "Google reCAPTCHA widget failed to initialise. " +
          "Make sure your domain is added to Firebase 'Authorised domains'."
      );
    }
  };

  // Create the widget when we’re on the phone‑entry step
  useEffect(() => {
    if (!verificationId) buildRecaptcha();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verificationId]);

  /* Cool‑down timer between SMS attempts */
  useEffect(() => {
    if (!cooldown) return;
    const id = setInterval(() => setCooldown((c) => c - 1), 1_000);
    return () => clearInterval(id);
  }, [cooldown]);

  /* ===== helpers ===== */
  const normalizePhone = (raw) => {
    let p = raw.replace(/\D/g, "");
    if (p.startsWith("0")) p = p.slice(1);
    return "+972" + p;
  };
  const withError = (msg) => {
    setError(msg);
    setLoading(false);
  };

  /* ===== step 1 – send SMS ===== */
  const sendVerificationCode = async () => {
    setError("");
    const raw   = phoneRef.current.value.trim();
    const phone = normalizePhone(raw);

    if (!raw)           return withError(t("enter_phone"));
    if (!recReady)      return withError(t("captcha_not_ready"));
    // Invisible CAPTCHA doesn’t require manual solve
    if (!captchaSolved && verifier.current?.options?.size !== "invisible") {
      return withError(t("captcha_complete"));
    }

    setLoading(true);
    try {
      const result = await signInWithPhoneNumber(
        auth,
        phone,
        verifier.current
      );
      setVerificationId(result.verificationId);
      setCooldown(60);
    } catch (e) {
      withError(e.message);
    } finally {
      setLoading(false);
    }
  };

  /* ===== step 2 – verify code & login ===== */
  const verifyCodeAndSignIn = async () => {
    setError("");
    if (!code.trim()) return withError(t("enter_code"));

    setLoading(true);
    try {
      const cred = PhoneAuthProvider.credential(verificationId, code.trim());
      await signInWithCredential(auth, cred);
      navigate("/");
    } catch (e) {
      withError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeNumber = () => {
    setVerificationId(null);
    setCode("");
    setError("");
  };

  /* ===== render ===== */
  return (
    <div className="auth-container">
      <h2 className="auth-title">{t("login")}</h2>

      {!verificationId ? (
        <form
          className="auth-form"
          onSubmit={(e) => {
            e.preventDefault();
            sendVerificationCode();
          }}
        >
          <label htmlFor="ph" className="auth-label">
            {t("phone")}
          </label>

          <input
            id="ph"
            ref={phoneRef}
            className="auth-input"
            placeholder="50 123 4567"
            pattern="[0-9]{9,10}"
            required
          />

          <button
            className="auth-btn"
            disabled={loading || cooldown || !recReady || (!captchaSolved && verifier.current?.options?.size !== "invisible")}
          >
            {loading ? (
              <BreadLoader />
            ) : cooldown ? (
              `${t("send_code")} (${cooldown})`
            ) : (
              t("send_code")
            )}
          </button>

          <div className="auth-caption">{t("captcha_prompt")}</div>

          {/* Google reCAPTCHA mounts here */}
          <div
            id="recaptcha-container"
            ref={recaptchaDiv}
            className="recaptcha-container"
            dir="ltr"
          />
        </form>
      ) : (
        <form
          className="auth-form"
          onSubmit={(e) => {
            e.preventDefault();
            verifyCodeAndSignIn();
          }}
        >
          <label htmlFor="code" className="auth-label">
            {t("verification_code")}
          </label>

          <input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="auth-input"
            placeholder="SMS code"
            required
          />

          <button className="auth-btn" disabled={loading}>
            {loading ? <BreadLoader /> : t("verify_and_login")}
          </button>

          <button
            type="button"
            className="auth-btn-secondary"
            onClick={handleChangeNumber}
          >
            {t("change_number")}
          </button>
        </form>
      )}

      {error && <div className="auth-error">{error}</div>}
    </div>
  );
}

/*
==================================================
Add this to AuthPage.css so the widget isn’t hidden:

.recaptcha-container {
  margin-top: 12px;
  display: flex;
  justify-content: center;
  z-index: 999; /* stay above background image */
}
==================================================
*/

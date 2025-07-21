// src/pages/AuthPage.js
import React, { useState, useRef, useEffect } from "react";
import { auth } from "../firebase";
import {
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getRecaptcha, clearRecaptcha } from "../utils/recaptchaSingleton";
import BreadLoader from "../components/BreadLoader";
import "./AuthPage.css";

export default function AuthPage() {
  /* ---------------- state ---------------- */
  const [code, setCode]         = useState("");
  const phoneRef                = useRef();
  const [verificationId, setVerificationId] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [recReady, setRecReady] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const navigate = useNavigate();
  const verifier = useRef(null);
  const hostDiv  = useRef(null);

  /* local-dev bypass */
  useEffect(() => {
    if (["localhost","127.0.0.1"].includes(window.location.hostname)) {
      auth.settings.appVerificationDisabledForTesting = true;
    }
  }, []);

  /* ------------ reCAPTCHA ------------ */
  const buildRecaptcha = async () => {
    clearRecaptcha();
    setRecReady(false);

    if (hostDiv.current?.parentNode)
      hostDiv.current.parentNode.removeChild(hostDiv.current);

    const id  = `recaptcha-${Date.now()}`;
    const div = document.createElement("div");
    div.id = id;
    Object.assign(div.style,{ position:"absolute", top:"-9999px", left:"-9999px" });
    document.body.appendChild(div);
    hostDiv.current = div;

    try {
      verifier.current = await getRecaptcha(auth, id);
      setRecReady(true);
    } catch (e) {
      console.error("reCAPTCHA init failed:", e);
      setError("reCAPTCHA failed – refresh and try again.");
    }
  };
  useEffect(()=>{ buildRecaptcha(); },[]);

  /* cooldown timer */
  useEffect(()=>{
    if (!cooldown) return;
    const id = setInterval(()=>setCooldown(c=>c-1),1000);
    return ()=>clearInterval(id);
  },[cooldown]);

  const normalizePhone = raw => {
    let p = raw.replace(/\D/g,"");
    if (p.startsWith("0")) p = p.slice(1);
    return "+972"+p;
  };
  const withError = msg => { setError(msg); setLoading(false); };

  /* ---------- Step 1: send SMS ---------- */
  const sendVerificationCode = async () => {
    setError("");
    const raw   = phoneRef.current.value.trim();
    const phone = normalizePhone(raw);
    if (!raw) return withError("Enter phone number");
    if (cooldown) return;

    setLoading(true);
    try {
      await buildRecaptcha();
      const res = await signInWithPhoneNumber(auth, phone, verifier.current);
      setVerificationId(res.verificationId);
      setCooldown(60);
    } catch (e) { withError(e.message); }
    finally    { setLoading(false); }
  };

  /* ---------- Step 2: verify code ---------- */
  const verifyCodeAndSignIn = async () => {
    setError("");
    if (!code.trim()) return withError("Enter verification code");
    setLoading(true);
    try {
      const cred = PhoneAuthProvider.credential(verificationId, code);
      await signInWithCredential(auth, cred);
      /* NamePrompt will show after AuthContext loads */
      navigate("/");
    } catch (e) { withError(e.message); }
    finally    { setLoading(false); }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="auth-container">
      {!recReady ? (
        <BreadLoader />
      ) : (
        <div>
          <h2 className="auth-title">כניסה</h2>

          {/* -------- Phone form -------- */}
          {!verificationId ? (
            <form className="auth-form" onSubmit={e=>{e.preventDefault();sendVerificationCode();}}>
              <label htmlFor="ph" className="auth-label">טלפון</label>
              <input  id="ph" ref={phoneRef} className="auth-input"
                      placeholder="50 123 4567" pattern="[0-9]{9,10}" required/>
              <button className="auth-btn" disabled={loading||cooldown}>
                {loading ? <BreadLoader/> :
                 cooldown ? `שלח קוד (${cooldown})` : "שלח קוד"}
              </button>
            </form>
          ) : (
            /* -------- Code form -------- */
            <form className="auth-form" onSubmit={e=>{e.preventDefault();verifyCodeAndSignIn();}}>
              <label htmlFor="code" className="auth-label">קוד אימות</label>
              <input id="code" value={code} onChange={e=>setCode(e.target.value)}
                     className="auth-input" placeholder="SMS code" required/>
              <button className="auth-btn" disabled={loading}>
                {loading ? <BreadLoader/> : "אמת והיכנס"}
              </button>
              <button type="button" className="auth-btn-secondary"
                      onClick={async()=>{ setVerificationId(null); setCode(""); setError(""); await buildRecaptcha(); }}>
                שינוי מספר
              </button>
            </form>
          )}

          {error && <div className="auth-error">{error}</div>}
        </div>
      )}
    </div>
  );
}

import React, { useState, useRef, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import {
  setDoc, doc, serverTimestamp,
  query, collection, where, getDocs,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getRecaptcha, clearRecaptcha } from "../utils/recaptchaSingleton";
import BreadLoader from "../components/BreadLoader";
import "./AuthPage.css";

export default function AuthPage() {
  /* state */
  const [name, setName]         = useState("");
  const [code, setCode]         = useState("");
  const [isLogin, setIsLogin]   = useState(true);
  const [verificationId, setVerificationId] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [recReady, setRecReady] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const phoneRef   = useRef();
  const verifier   = useRef(null);
  const hostDivRef = useRef(null);

  const navigate = useNavigate();
  const { t }    = useTranslation();

  /* ---------------- helpers ---------------- */
  const normalizePhone = raw => {
    let p = raw.replace(/\D/g, "");
    if (p.startsWith("0")) p = p.slice(1);
    return "+972" + p;
  };
  const withError = msg => { setError(msg); setLoading(false); };

  /* ---------------- reCAPTCHA ---------------- */
  const buildRecaptcha = async () => {
    clearRecaptcha();
    setRecReady(false);
    if (hostDivRef.current?.parentNode)
      hostDivRef.current.parentNode.removeChild(hostDivRef.current);

    const id = `recaptcha-${Date.now()}`;
    const div = document.createElement("div");
    div.id = id;
    Object.assign(div.style, { position:"absolute", top:"-9999px", left:"-9999px" });
    document.body.appendChild(div);
    hostDivRef.current = div;

    try {
      verifier.current = await getRecaptcha(auth, id);
      setRecReady(true);
    } catch (e) {
      console.error("reCAPTCHA init failed:", e);
      setError("reCAPTCHA failed – refresh and try again.");
    }
  };
  useEffect(() => { buildRecaptcha(); }, []);

  /* ---------------- SMS step ---------------- */
  const sendVerificationCode = async () => {
    setError("");
    const raw = phoneRef.current.value.trim();
    const phone = normalizePhone(raw);
    if (!raw)         return withError(t("phoneRequired"));
    if (!isLogin && !name.trim()) return withError(t("nameRequired"));
    if (cooldown)     return;

    setLoading(true);
    try {
      await buildRecaptcha();
      if (isLogin) {
        const q = query(collection(db,"users"), where("phone","==",phone));
        const s = await getDocs(q);
        if (s.empty)
          return withError(t("notRegistered") ?? "Number not registered.");
      }
      const res = await signInWithPhoneNumber(auth, phone, verifier.current);
      setVerificationId(res.verificationId);
      setCooldown(60);
    } catch (e) {
      return withError(e.message);
    } finally { setLoading(false); }
  };

  /* ---------------- Verify step ---------------- */
  const verifyCodeAndSignIn = async () => {
    if (!code.trim()) return withError(t("codeRequired"));
    setLoading(true);
    try {
      const cred = PhoneAuthProvider.credential(verificationId, code);
      const { user } = await signInWithCredential(auth, cred);

      /* REGISTER path only */
      if (!isLogin) {
        console.log("⏩  about to write user doc:", name);
        await setDoc(
          doc(db,"users",user.uid),
          { phone: normalizePhone(phoneRef.current.value), name,
            createdAt: serverTimestamp() },
          { merge:true }
        );
        console.log("✅  user doc written");
      }
      navigate("/");
    } catch(e){ withError(e.message); }
    finally   { setLoading(false); }
  };

  /* cooldown timer */
  useEffect(() => {
    if (!cooldown) return;
    const id = setInterval(()=>setCooldown(c=>c-1),1000);
    return ()=>clearInterval(id);
  },[cooldown]);

  /* ---------------- UI ---------------- */
  return (
    <div className="auth-container">
      {!recReady ? <BreadLoader/> : (
        <div>
          <h2 className="auth-title">{isLogin?t("login"):t("register")}</h2>

          {!verificationId ? (
            <form className="auth-form" onSubmit={e=>{e.preventDefault();sendVerificationCode();}}>
              {!isLogin && (
                <input value={name} onChange={e=>setName(e.target.value)}
                       className="auth-input" placeholder={t("name")} required/>
              )}
              <label htmlFor="ph" className="auth-label">{t("phone")}</label>
              <input id="ph" ref={phoneRef} className="auth-input"
                     placeholder="50 123 4567" pattern="[0-9]{9,10}" required/>
              <button className="auth-btn" disabled={loading||cooldown}>
                {loading ? <BreadLoader/> :
                 cooldown ? `${t("sendCode")} (${cooldown})` : t("sendCode")}
              </button>
              <button type="button" className="auth-btn-secondary"
                      onClick={()=>{setIsLogin(!isLogin);setError("");setName("");setCode("");}}>
                {isLogin ? t("needAccount") : t("alreadyAccount")}
              </button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={e=>{e.preventDefault();verifyCodeAndSignIn();}}>
              <label htmlFor="c" className="auth-label">{t("verificationCode")}</label>
              <input id="c" value={code} onChange={e=>setCode(e.target.value)}
                     className="auth-input" placeholder={t("verificationCode")} required/>
              <button className="auth-btn" disabled={loading}>
                {loading ? <BreadLoader/> : t("verifyCode")}
              </button>
              <button type="button" className="auth-btn-secondary"
                      onClick={async()=>{setVerificationId(null);setCode("");setError("");await buildRecaptcha();}}>
                {t("changePhone")}
              </button>
            </form>
          )}

          {error && <div className="auth-error">{error}</div>}
        </div>
      )}
    </div>
  );
}

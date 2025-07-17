// src/pages/AuthPage.js
import React, { useRef, useState } from "react";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import { useTranslation } from "react-i18next";

export default function AuthPage() {
  const emailRef = useRef();
  const passwordRef = useRef();
  const phoneRef = useRef();              // ← added
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const email = emailRef.current.value;
    const password = passwordRef.current.value;

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const phone = phoneRef.current.value.trim();   // collect phone
        const cred = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        // create user doc in Firestore with phone
        await setDoc(doc(db, "users", cred.user.uid), {
          email,
          phone,
          isAdmin: false,
          isBlocked: false,
          createdAt: serverTimestamp(),
        });
      }
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "50px auto" }}>
      <h2>{isLogin ? t("login") : t("register")}</h2>
      <form onSubmit={handleSubmit}>
        <input
          ref={emailRef}
          type="email"
          placeholder={t("email")}
          required
        />
        <input
          ref={passwordRef}
          type="password"
          placeholder={t("password")}
          required
        />
        {!isLogin && (                                // show only on register
          <input
            ref={phoneRef}
            type="tel"
            placeholder={t("phone")}
            required
            style={{ marginTop: 8 }}
          />
        )}
        <button type="submit">
          {isLogin ? t("login") : t("register")}
        </button>
      </form>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <button onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? t("needAccount") : t("alreadyAccount")}
      </button>
    </div>
  );
}

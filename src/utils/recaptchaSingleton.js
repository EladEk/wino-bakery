// src/utils/recaptchaSingleton.js
import { RecaptchaVerifier } from "firebase/auth";
import { auth } from "../firebase";

let verifier = null;

/**
 * Singleton wrapper for Firebase v2 reCAPTCHA (visible “normal” widget).
 *
 * @param {HTMLElement} container - DOM node for the widget
 * @param {Function} setCaptchaSolved - callback to set solved state in React
 */
export async function getRecaptcha(container, setCaptchaSolved) {
  if (verifier) return verifier;

  verifier = new RecaptchaVerifier(
    auth, container,
    {
      size: "normal",
      callback: (token) => {
        setCaptchaSolved(true);       // called when the reCAPTCHA is solved
      },
      "expired-callback": () => {
        setCaptchaSolved(false);      // called when token expires
        console.warn("reCAPTCHA expired – clearing verifier");
        clearRecaptcha();
      },
    },
  );

  await verifier.render();  // initialise iframe & token
  return verifier;
}

/* Destroy widget + token so the next call starts fresh */
export function clearRecaptcha() {
  if (verifier?.clear) verifier.clear();
  verifier = null;
}

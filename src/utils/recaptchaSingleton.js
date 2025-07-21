// src/utils/recaptchaSingleton.js
import { RecaptchaVerifier } from "firebase/auth";
import { auth } from "../firebase";

let verifier = null;

/**
 * Creates (or re-uses) a visible v2 reCAPTCHA widget and returns the verifier.
 * @param {HTMLElement} container - DOM node for the widget
 * @param {Function} setCaptchaSolved - callback to set solved state in React
 */
export async function getRecaptcha(container, setCaptchaSolved) {
  if (verifier) return verifier;

  verifier = new RecaptchaVerifier(
    container,       // ✅ CORRECT: container DOM node or string ID
    {
      size: "normal",
      callback: (token) => {
        setCaptchaSolved(true);
      },
      "expired-callback": () => {
        setCaptchaSolved(false);
        clearRecaptcha();
      },
    },
    auth             // ✅ CORRECT: pass your auth instance as third argument
  );

  await verifier.render();  // initialise iframe & token
  return verifier;
}

/** Destroys the widget so the next call starts fresh. */
export function clearRecaptcha() {
  if (verifier?.clear) verifier.clear();
  verifier = null;
}

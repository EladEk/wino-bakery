// src/utils/recaptchaSingleton.js
import { RecaptchaVerifier } from "firebase/auth";

/**
 * Singleton wrapper for Firebase *v2 Invisible* reCAPTCHA.
 * (Free – no App Check or billing.)
 *
 * getRecaptcha(auth, containerId)  → returns a ready-rendered verifier
 * clearRecaptcha()                 → destroys the verifier
 */

let verifier = null;

/* Create (or reuse) a reCAPTCHA widget and render it */
export async function getRecaptcha(auth, containerId) {
  if (verifier) return verifier;

  verifier = new RecaptchaVerifier(auth, containerId, {
    size: "normal",
    callback: () => {
      // Called when the reCAPTCHA is solved
    },
    'expired-callback': () => {
      console.warn("reCAPTCHA expired – please solve it again.");
    },
  });

  try {
    await verifier.render(); // initialise iframe & token
  } catch (e) {
    console.error("reCAPTCHA render failed (singleton):", e);
    verifier = null;
    throw e; // let the caller handle it
  }

  return verifier;
}

/* Destroy widget + token so the next call starts fresh */
export function clearRecaptcha() {
  if (verifier?.clear) verifier.clear();
  verifier = null;
}

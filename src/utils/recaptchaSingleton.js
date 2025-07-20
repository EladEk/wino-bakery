// src/utils/recaptchaSingleton.js
import { RecaptchaVerifier } from "firebase/auth";

/**
 * Singleton wrapper for Firebase Enterprise reCAPTCHA.
 *
 * • getRecaptcha(auth, containerId) → returns existing verifier
 *   or creates a new one.
 * • clearRecaptcha() → destroys the verifier so the next login
 *   gets a fresh Enterprise token.
 */

let verifier = null;

/**
 * Create (or reuse) an invisible Enterprise reCAPTCHA verifier.
 * @param {import("firebase/auth").Auth} auth - initialized Firebase auth instance
 * @param {string} containerId - DOM id for the CAPTCHA element
 * @returns {import("firebase/auth").RecaptchaVerifier}
 */
export function getRecaptcha(auth, containerId = "recaptcha-container") {
  if (verifier) return verifier;

  verifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    type: "enterprise",
  });

  return verifier;
}

/**
 * Destroy the current verifier so a new one can be created.
 * Call this right after signOut(auth).
 */
export function clearRecaptcha() {
  if (verifier?.clear) verifier.clear();  // remove iframe & token
  verifier = null;
}

// src/utils/recaptchaSingleton.js
import { RecaptchaVerifier } from "firebase/auth";

/**
 * Singleton wrapper for Firebase *v2 Invisible* reCAPTCHA.
 * (No App Check / Enterprise, completely free.)
 *
 * • getRecaptcha(auth, containerId) – returns existing verifier or creates a new one
 * • clearRecaptcha()               – destroys it so the next login gets a fresh token
 */

let verifier = null;

/**
 * Get the existing verifier or create a brand-new v2 Invisible reCAPTCHA.
 * @param {import("firebase/auth").Auth} auth  Initialized Firebase Auth instance
 * @param {string} containerId                 DOM id for the off-screen element
 * @returns {import("firebase/auth").RecaptchaVerifier}
 */
export function getRecaptcha(auth, containerId = "recaptcha-container") {
  if (verifier) return verifier;

  verifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible",       // ← v2 Invisible (free)
    callback: () => {},      // Firebase handles the actual callback internally
  });

  return verifier;
}

/**
 * Destroy the current verifier (call after signOut or on error) so the next
 * call to getRecaptcha() creates a fresh widget and token.
 */
export function clearRecaptcha() {
  if (verifier?.clear) verifier.clear();   // remove iframe & token
  verifier = null;
}

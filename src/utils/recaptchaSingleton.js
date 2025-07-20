// src/utils/recaptchaSingleton.js
import { RecaptchaVerifier } from "firebase/auth";

/**
 * Singleton wrapper for Firebase *v2 Invisible* reCAPTCHA.
 *
 * • getRecaptcha(auth, containerId) – returns existing verifier
 *   (rendered or not). If it’s brand-new, we immediately attempt
 *   to render it with a defensive try/catch so the caller can
 *   await a fully-initialised widget.
 *
 * • clearRecaptcha() – destroys the verifier so the next call
 *   creates a fresh widget and token.
 *
 * No App Check / Enterprise → completely free, no billing needed.
 */

let verifier = null;

/**
 * Create (or reuse) an invisible v2 reCAPTCHA verifier and render it.
 * @param {import("firebase/auth").Auth} auth
 * @param {string} containerId
 * @returns {Promise<import("firebase/auth").RecaptchaVerifier>}
 */
export async function getRecaptcha(auth, containerId = "recaptcha-container") {
  /* Re-use if already created & rendered */
  if (verifier) return verifier;

  verifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible", // v2 Invisible (free)
    callback: () => {}, // SDK handles callback internally
  });

  try {
    await verifier.render(); // initialise iframe & token
  } catch (e) {
    console.error("reCAPTCHA render failed (singleton):", e);
    verifier = null; // discard broken instance
    throw e; // let caller decide how to react
  }

  return verifier;
}

/**
 * Destroy current verifier so the next login gets a fresh token.
 */
export function clearRecaptcha() {
  if (verifier?.clear) verifier.clear(); // remove iframe & reset token
  verifier = null;
}

// src/utils/recaptchaSingleton.js
import { RecaptchaVerifier } from "firebase/auth";

/**
 * Singleton wrapper for Firebase *v2 Invisible* reCAPTCHA.
 * No App Check / Enterprise → completely free.
 */

let verifier = null;
const DEFAULT_ID = "recaptcha-container";

/* Create (or reuse) an invisible v2 widget and render it */
export async function getRecaptcha(auth, containerId = DEFAULT_ID) {
  if (verifier) return verifier;

  verifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    callback: () => {},
  });

  try {
    await verifier.render();   // initialise iframe & token
  } catch (e) {
    console.error("reCAPTCHA render failed (singleton):", e);
    verifier = null;
    throw e;
  }

  return verifier;
}

/* Destroy widget and clean DOM so a fresh one can mount */
export function clearRecaptcha() {
  if (verifier?.clear) verifier.clear();
  verifier = null;

  /* ⭐️ remove old iframe markup so re-render won’t crash */
  const host = document.getElementById(DEFAULT_ID);
  if (host) host.innerHTML = "";
}

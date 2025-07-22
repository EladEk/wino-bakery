import { RecaptchaVerifier } from "firebase/auth";

let verifier = null;

/**
 * Build (or return an existing) reCAPTCHA v2 verifier.
 * @param {import("firebase/auth").Auth}  auth            – Firebase auth instance
 * @param {HTMLElement|string}           container       – DOM node or element id
 * @param {(ok:boolean)=>void}           setCaptchaSolved– State setter from React
 */
export async function getRecaptcha(auth, container, setCaptchaSolved) {
  // Return the same verifier if it’s still valid
  if (verifier) return verifier;

  const targetContainer =
    typeof container === "string"
      ? document.getElementById(container)
      : container;

  if (!auth || !auth.app || !targetContainer) return null;

  try {
    verifier = new RecaptchaVerifier(
      targetContainer,
      {
        size: "normal",
        callback: () => setCaptchaSolved?.(true),
        "expired-callback": () => {
          setCaptchaSolved?.(false);
          clearRecaptcha();
        },
      },
      auth
    );
    await verifier.render();
    return verifier;
  } catch (error) {
    verifier = null;
    return null;
  }
}

export function clearRecaptcha() {
  try {
    verifier?.clear();        // resets widget & frees DOM node
  } catch (_) {
    /* ignore */
  }
  verifier = null;
}
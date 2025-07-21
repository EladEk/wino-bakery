// src/utils/recaptchaSingleton.js
import { RecaptchaVerifier } from "firebase/auth";
import { auth } from "../firebase";          // uses your singleton Auth export

let verifier = null;

/* Create (or reuse) a reCAPTCHA widget and render it */
export async function getRecaptcha(container) {   // ← **no auth param needed**
  if (verifier) return verifier;

  verifier = new RecaptchaVerifier(
    auth, container,                                   // 1️⃣ element or ID
    {
      size: "normal",
      callback: () => {},
      "expired-callback": () => {
        console.warn("reCAPTCHA expired – clearing verifier");
        clearRecaptcha();
      },
    },                                         // 3️⃣ Auth instance
  );

  await verifier.render();                       // initialise iframe & token
  return verifier;
}

export function clearRecaptcha() {
  if (verifier?.clear) verifier.clear();
  verifier = null;
}

import { RecaptchaVerifier } from "firebase/auth";
import { auth } from "../firebase";

let verifier = null;

export async function getRecaptcha(container, setCaptchaSolved) {
  console.log("[recaptchaSingleton.js] Received container:", container);
  console.log("[recaptchaSingleton.js] Received setCaptchaSolved:", setCaptchaSolved);
  console.log("[recaptchaSingleton.js] Imported auth:", auth);

  if (verifier) {
    console.log("[recaptchaSingleton.js] Returning existing verifier");
    return verifier;
  }

  // Log argument types for sanity
  console.log("[recaptchaSingleton.js] Types – container:", typeof container, 
              "options:", typeof setCaptchaSolved, 
              "auth:", typeof auth);

  try {
    verifier = new RecaptchaVerifier(
      container, // <-- must be HTMLElement or string ID
      {
        size: "normal",
        callback: (token) => {
          setCaptchaSolved && setCaptchaSolved(true);
          console.log("[recaptchaVerifier] Captcha solved! Token:", token);
        },
        "expired-callback": () => {
          setCaptchaSolved && setCaptchaSolved(false);
          console.warn("[recaptchaVerifier] Captcha expired");
          clearRecaptcha();
        },
      },
      auth // <-- must be a real Auth instance
    );
    console.log("[recaptchaSingleton.js] Created RecaptchaVerifier:", verifier);

    await verifier.render();
    console.log("[recaptchaSingleton.js] Verifier rendered!");

    return verifier;
  } catch (e) {
    console.error("[recaptchaSingleton.js] Error in RecaptchaVerifier constructor:", e);
    verifier = null;
    throw e;
  }
}

export function clearRecaptcha() {
  if (verifier?.clear) {
    console.log("[recaptchaSingleton.js] Clearing verifier...");
    verifier.clear();
  }
  verifier = null;
}

import { RecaptchaVerifier } from "firebase/auth";
import { auth } from "../firebase";

let verifier = null;

export async function getRecaptcha(container, setCaptchaSolved) {
  if (verifier) return verifier;

  verifier = new RecaptchaVerifier(
    auth, container,
    {
      size: "compact",
      callback: (token) => {
        setCaptchaSolved && setCaptchaSolved(true);
        console.log("[recaptchaVerifier] Captcha solved! Token:", token);
      },
      "expired-callback": () => {
        setCaptchaSolved && setCaptchaSolved(false);
        clearRecaptcha();
      },
    },
  );

  await verifier.render();
  return verifier;
}

export function clearRecaptcha() {
  if (verifier?.clear) verifier.clear();
  verifier = null;
}
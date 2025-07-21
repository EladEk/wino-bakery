import { RecaptchaVerifier } from "firebase/auth";

let verifier = null;

export async function getRecaptcha(auth, container, setCaptchaSolved) {
  if (verifier) return verifier;

  const targetContainer =
    typeof container === "string"
      ? document.getElementById(container)
      : container;

  if (!auth || !auth.app) return null;
  if (!targetContainer) return null;

  try {
    verifier = new RecaptchaVerifier(
      targetContainer,
      {
        size: "compact", // or "normal"
        callback: () => setCaptchaSolved && setCaptchaSolved(true),
        "expired-callback": () => {
          setCaptchaSolved && setCaptchaSolved(false);
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
  if (verifier?.clear) verifier.clear();
  verifier = null;
}

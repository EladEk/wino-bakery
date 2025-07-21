import { RecaptchaVerifier } from "firebase/auth";

// Should be declared at module scope to preserve across calls
let verifier = null;

// Always: container (DOM node or string), options, auth (as 3rd arg)
export async function getRecaptcha(auth, container, setCaptchaSolved) {
  if (verifier) return verifier;

  // Defensive: Ensure DOM element exists
  const targetContainer =
    typeof container === 'string'
      ? document.getElementById(container)
      : container;

  if (!auth || !auth.app) return null;
  if (!targetContainer) return null;

  try {
    verifier = new RecaptchaVerifier(
      targetContainer,                 // 1st: container
      {
        size: "compact",               // "normal" or "compact"—never "invisible" for SMS/phone
        callback: () => setCaptchaSolved && setCaptchaSolved(true),
        "expired-callback": () => {
          setCaptchaSolved && setCaptchaSolved(false);
          if (verifier?.clear) verifier.clear();
          verifier = null;
        }
      },
      auth                             // 3rd: Auth instance!
    );
    await verifier.render();
    return verifier;
  } catch (error) {
    verifier = null;
    return null;
  }
}

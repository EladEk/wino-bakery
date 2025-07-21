import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from "firebase/app-check";

const firebaseConfig = {
  apiKey: "AIzaSyBAde-r0Rrh_D1oYTfGU8XvL_APfMSZHrE",
  authDomain: "wino-fb03d.firebaseapp.com",
  projectId: "wino-fb03d",
  storageBucket: "wino-fb03d.appspot.com",
  messagingSenderId: "45483660067",
  appId: "1:45483660067:web:fbf7f384c3536d5835b296",
  measurementId: "G-XWSF568GQD",
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);

const db = getFirestore(app);
const storage = getStorage(app);

// initializeAppCheck(app, {
//   provider: new ReCaptchaEnterpriseProvider(
//     "6Le-W4krAAAAALA7GzYA7IZg8yUDvLmxreAGlcNc"
//   ),
//   isTokenAutoRefreshEnabled: true,
// });

// 🔵 Logger
console.log("[firebase.js] Exporting app:", app);
console.log("[firebase.js] Exporting auth:", auth);

export { app, auth, db, storage };

// src/firebase.js – updated with App Check + Enterprise key

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

// Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyBAde-r0Rrh_D1oYTfGU8XvL_APfMSZHrE",
  authDomain: "wino-fb03d.firebaseapp.com",
  projectId: "wino-fb03d",
  storageBucket: "wino-fb03d.appspot.com",
  messagingSenderId: "45483660067",
  appId: "1:45483660067:web:fbf7f384c3536d5835b296",
  measurementId: "G-XWSF568GQD",
};

// Initialise Firebase
const app = initializeApp(firebaseConfig);

// Auth with local persistence (optional but recommended)
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);

// Firestore & Storage
const db = getFirestore(app);
const storage = getStorage(app);

// App Check – uses your Enterprise score‑based site‑key
initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider(
    "6Le-W4krAAAAALA7GzYA7IZg8yUDvLmxreAGlcNc" // ← your Enterprise site‑key
  ),
  isTokenAutoRefreshEnabled: true, // keeps tokens fresh in the background
});

export { app, auth, db, storage };
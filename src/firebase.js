import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBAde-r0Rrh_D1oYTfGU8XvL_APfMSZHrE",
  authDomain: "wino-fb03d.firebaseapp.com",
  projectId: "wino-fb03d",
  storageBucket: "wino-fb03d.appspot.com",   // ← Fixed here!
  messagingSenderId: "45483660067",
  appId: "1:45483660067:web:fbf7f384c3536d5835b296",
  measurementId: "G-XWSF568GQD"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
// Only use analytics if you really need it in your app:
export const analytics = getAnalytics(app);

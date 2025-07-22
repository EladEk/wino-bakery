import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

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
const db = getFirestore(app);
const storage = getStorage(app);

export const authReady = setPersistence(auth, browserLocalPersistence).then(() => auth);
export { app, auth, db, storage };
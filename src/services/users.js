import { db } from "./firestore";
import { doc, getDoc } from "firebase/firestore";
export async function getUser(uid){
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { id: uid, ...snap.data() } : null;
}

import { db } from "./firestore";
import { doc, getDoc, setDoc } from "firebase/firestore";

const REF = () => doc(db, "config", "saleDate");

export async function getSaleConfig(){
  const snap = await getDoc(REF());
  return snap.exists() ? snap.data() : {};
}

export async function saveSaleConfig(data){
  await setDoc(REF(), data);
}

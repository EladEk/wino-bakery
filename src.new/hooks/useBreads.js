import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";

export default function useBreads(){
  const [breads, setBreads] = useState([]);
  useEffect(()=>{
    const unsub = onSnapshot(collection(db, "breads"), (snap)=>{
      setBreads(snap.docs.map(d=>({id:d.id, ...d.data()})));
    });
    return () => unsub();
  }, []);
  return breads;
}

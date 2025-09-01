import { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";

export default function useUserProfile(){
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(()=>{
    async function run(){
      if(!currentUser) return;
      const snap = await getDoc(doc(db, "users", currentUser.uid));
      setProfile(snap.exists() ? snap.data() : null);
    }
    run();
  }, [currentUser]);

  return { profile };
}

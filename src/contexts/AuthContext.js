import React, { useState, useEffect, useContext, createContext } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import BreadLoader from "../components/BreadLoader";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData,    setUserData]    = useState(null);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setLoading(true);

      if (user) {
        try {
          const ref  = doc(db, "users", user.uid);
          let   snap = await getDoc(ref);

          /* FIRST sign-in ever → create minimal doc (no name!) */
          if (!snap.exists()) {
            await setDoc(
              ref,
              { phone: user.phoneNumber, createdAt: serverTimestamp() },
              { merge: true }           // never overwrite later fields
            );
            snap = await getDoc(ref);   // re-read
          }
          setUserData(snap.data());
        } catch (e) {
          console.error("AuthContext load error:", e);
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ currentUser, userData, logout, loading }}>
      {loading ? <BreadLoader /> : children}
    </AuthContext.Provider>
  );
}

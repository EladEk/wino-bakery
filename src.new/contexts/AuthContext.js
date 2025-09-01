import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import BreadLoader from "../components/BreadLoader";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [currentUser,  setCurrentUser]  = useState(null);
  const [userData,     setUserData]     = useState(null);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      setCurrentUser(user);
      setLoading(true);

      if (user) {
        const ref  = doc(db, "users", user.uid);
        let   snap = await getDoc(ref);

        if (!snap.exists()) {
          await setDoc(
            ref,
            { phone: user.phoneNumber, createdAt: serverTimestamp() },
            { merge: true }
          );
          snap = await getDoc(ref);
        }

        const data = snap.data();
        setUserData(data);
        setNeedsProfile(!data?.name);
      } else {
        setUserData(null);
        setNeedsProfile(false);
      }

      setLoading(false);
    });

    return unsub;
  }, []);

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userData,
        setUserData, 
        needsProfile,
        setNeedsProfile,
        logout,
        loading
      }}
    >
      {loading ? <BreadLoader /> : children}
    </AuthContext.Provider>
  );
}

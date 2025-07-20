import React, { useState, useEffect, useContext, createContext } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import BreadLoader from "../components/BreadLoader";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setLoading(true);

      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          let snap = await getDoc(userDocRef);

          // Only set phone/createdAt, never set 'name' (never clobber)
          if (!snap.exists()) {
            await setDoc(
              userDocRef,
              {
                phone: user.phoneNumber,
                createdAt: serverTimestamp(),
              },
              { merge: true }
            );
            snap = await getDoc(userDocRef);
          }

          setUserData(snap.data());
        } catch (err) {
          console.error("Failed to load user profile:", err);
          setUserData(null);
        }
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  async function logout() {
    await signOut(auth);
  }

  const value = {
    currentUser,
    userData,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <BreadLoader /> : children}
    </AuthContext.Provider>
  );
}

// src/contexts/AuthContext.js
import React, { useState, useEffect, useContext, createContext } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import BreadLoader from "../components/BreadLoader";
import { clearRecaptcha } from "../utils/recaptchaSingleton";   // 🆕 destroy verifier on logout

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  /* Watch Firebase auth state */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setLoading(true);

      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          let userDoc = await getDoc(userDocRef);

          /* First-time SMS login: create a minimal user document */
          if (!userDoc.exists()) {
            await setDoc(userDocRef, {
              phone: user.phoneNumber,
              name: "",
              isAdmin: false,
              isBlocked: false,
              createdAt: serverTimestamp(),
            });
            userDoc = await getDoc(userDocRef);
          }

          setUserData(userDoc.data());
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

  /* Disconnect button uses this */
  const logout = async () => {
    await signOut(auth);   // normal Firebase sign-out
    clearRecaptcha();      // 🔑 ensure fresh Enterprise token next login
  };

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

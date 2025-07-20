// src/contexts/AuthContext.js
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
          let userDoc = await getDoc(userDocRef);
          if (!userDoc.exists()) {
            // If user logs in before registering, create minimal doc
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
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const logout = () => signOut(auth);

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

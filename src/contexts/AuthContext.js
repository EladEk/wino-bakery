// src/contexts/AuthContext.js
import React, { useState, useEffect, useContext, createContext } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import BreadLoader from "../components/BreadLoader";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);   // Firebase user object
  const [userData, setUserData] = useState(null);         // Firestore user data
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setLoading(true);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          setUserData(userDoc.exists() ? userDoc.data() : null);
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

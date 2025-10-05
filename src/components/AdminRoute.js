import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function AdminRoute({ children }) {
  const { currentUser, userData, loading } = useAuth();

  if (loading) return null;
  if (!currentUser || !userData?.isAdmin) return <Navigate to="/" />;
  return children;
}

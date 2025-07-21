// src/App.js
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useTranslation } from "react-i18next";

import AuthPage   from "./pages/AuthPage";
import HomePage   from "./pages/HomePage";
import AdminPage  from "./pages/AdminPage";

import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute     from "./components/AdminRoute";

import Header            from "./components/Header";
import BackgroundSlider  from "./components/BackgroundSlider";
import NamePrompt        from "./components/NamePrompt";   // ⬅️ new

/* A thin wrapper so we can access AuthContext inside Router */
function AppShell() {
  const { i18n } = useTranslation();
  const { loading, needsProfile } = useAuth();

  /* LTR / RTL switch */
  useEffect(() => {
    document.dir = i18n.language === "he" ? "rtl" : "ltr";
  }, [i18n.language]);

  if (loading) return null;        // AuthContext shows <BreadLoader />

  return (
    <Router>
      <BackgroundSlider />
      <Header />

      {/* Block the entire UI until user sets a name */}
      {needsProfile && <NamePrompt />}

      <Routes>
        <Route path="/login" element={<AuthPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

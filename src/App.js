import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useTranslation } from "react-i18next";

import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import AdminPage from "./pages/AdminPage";
import UserManagementPage from "./pages/UserManagementPage";
import OrderSummary from "./pages/OrderSummary";
import OrderHistoryPage from "./pages/OrderHistoryPage"; // ✅ חדש

import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

import Header from "./components/Header";
import BackgroundSlider from "./components/BackgroundSlider";
import NamePrompt from "./components/NamePrompt";

function AppShell() {
  const { i18n } = useTranslation();
  const { loading, needsProfile } = useAuth();

  useEffect(() => {
    document.dir = i18n.language === "he" ? "rtl" : "ltr";
  }, [i18n.language]);

  if (loading) return null;

  return (
    <Router>
      <BackgroundSlider />
      <Header />
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
        <Route
          path="/users"
          element={
            <AdminRoute>
              <UserManagementPage />
            </AdminRoute>
          }
        />
        <Route path="/orders" element={<OrderSummary />} />
        {/* --- הוספנו את היסטוריית ההזמנות --- */}
        <Route
          path="/order-history"
          element={
            <AdminRoute>
              <OrderHistoryPage />
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

import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useTranslation } from "react-i18next";

import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import AdminPage from "./pages/AdminPage";
import UserManagementPage from "./pages/UserManagementPage";
import OrderSummary from "./pages/OrderSummary";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import KibbutzManagementPage from "./pages/KibbutzManagementPage";
import WorkshopRegistrationPage from "./pages/WorkshopRegistrationPage";
import WorkshopManagementPage from "./pages/WorkshopManagementPage"; 

import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { DirectionProvider } from "./contexts/DirectionContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

import Header from "./components/Header";
import BackgroundSlider from "./components/BackgroundSlider";
import NamePrompt from "./components/HomePage/NamePrompt";
import ToastContainer from "./components/common/ToastContainer";

function AppShell() {
  const { loading, needsProfile } = useAuth();

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
        <Route
          path="/admin/kibbutz"
          element={
            <AdminRoute>
              <KibbutzManagementPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/workshops"
          element={
            <AdminRoute>
              <WorkshopManagementPage />
            </AdminRoute>
          }
        />
        <Route path="/orders" element={<OrderSummary />} />
        <Route
          path="/workshops"
          element={
            <ProtectedRoute>
              <WorkshopRegistrationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/order-history"
          element={
            <AdminRoute>
              <OrderHistoryPage />
            </AdminRoute>
          }
        />
      </Routes>
      <ToastContainer />
    </Router>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <DirectionProvider>
        <ToastProvider>
          <AuthProvider>
            <AppShell />
          </AuthProvider>
        </ToastProvider>
      </DirectionProvider>
    </ThemeProvider>
  );
}

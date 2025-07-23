import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logo from "../img/LOGO.jpg";
import "./Header.css";

export default function Header() {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);

  // Listen for install prompt event
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // If already installed, hide the button
    window.addEventListener("appinstalled", () => {
      setShowInstall(false);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", () => setShowInstall(false));
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowInstall(false);
      setDeferredPrompt(null);
    }
  };

  const atHome = location.pathname === "/";
  const atAdmin = location.pathname === "/admin";
  const atLogin = location.pathname === "/login";
  const atUsers = location.pathname === "/users";
  const isAdmin = userData?.isAdmin;

  return (
    <header className="app-header">
      <div className="left-buttons">
        {/* Hide logout on login page */}
        {!atLogin && isAdmin && <button onClick={logout}>{t("logout")}</button>}
      </div>

      <div className="app-logo" onClick={() => navigate("/")}>
        <img src={logo} alt="Logo" height="70" />
      </div>

      <div className="right-buttons">
        {showInstall && (
          <button onClick={handleInstallClick} className="install-btn">
            📱 {t("installApp") || "Install App"}
          </button>
        )}
        {atHome && isAdmin && (
          <button onClick={() => navigate("/admin")}>{t("adminPanel")}</button>
        )}
        {atAdmin && (
          <button onClick={() => navigate("/")}>{t("backHome")}</button>
        )}
        {atUsers && isAdmin && (
          <button onClick={() => navigate("/admin")}>{t("backToAdmin") || "Back to Admin"}</button>
        )}
        {/* Hide logout on login page */}
        {!atLogin && !isAdmin && (
          <button onClick={logout}>{t("logout")}</button>
        )}
      </div>
    </header>
  );
}

import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useKibbutz } from "../hooks/useKibbutz";
import KibbutzModal from "./KibbutzModal";
import logo from "../img/LOGO.jpg";
import "./Header.css";

export default function Header() {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { kibbutzim } = useKibbutz();

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);
  const [showKibbutzModal, setShowKibbutzModal] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      // Store the event for later use
      setDeferredPrompt(e);
      setShowInstall(true);
    };
    
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setShowInstall(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", () => setShowInstall(false));
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
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
  const atOrders = location.pathname === "/orders";
  const atOrderHistory = location.pathname === "/order-history";
  const atKibbutzManagement = location.pathname === "/admin/kibbutz";
  const atWorkshops = location.pathname === "/workshops";
  const atWorkshopManagement = location.pathname === "/admin/workshops";
  const isAdmin = userData?.isAdmin;
  const isKibbutzMember = userData?.kibbutzId;

  // Debug logging
  console.log('Header Debug:', {
    pathname: location.pathname,
    atWorkshopManagement,
    isAdmin,
    shouldShowBack: (atOrderHistory || atOrders || atUsers || atKibbutzManagement || atWorkshopManagement) && isAdmin
  });

  return (
    <header className="app-header">
      <div className="left-buttons">
        {/* Show back to home only for admin main page */}
        {isAdmin && atAdmin && (
          <button onClick={() => navigate("/")} data-testid="back-home-button">{t("backHome")}</button>
        )}
        
        {/* Show admin panel button only on home page */}
        {atHome && isAdmin && (
          <button onClick={() => navigate("/admin")} data-testid="admin-panel-button">{t("adminPanel")}</button>
        )}
        
        {/* Show kibbutz button only on home page for non-admin users */}
        {atHome && !isAdmin && userData && (
          <button 
            onClick={() => setShowKibbutzModal(true)}
            className={`kibbutz-btn ${isKibbutzMember ? 'kibbutz-member' : 'kibbutz-join'}`}
            data-testid="kibbutz-button"
          >
            {isKibbutzMember ? '🏘️ ' + userData.kibbutzName : '🏘️ ' + t('joinKibbutzButton')}
          </button>
        )}

        {/* Show back to home for workshops page */}
        {atWorkshops && (
          <button onClick={() => navigate("/")} data-testid="back-home-button">
            {t("backHome")}
          </button>
        )}

        {/* Show back to admin for sub-pages */}
        {(atOrderHistory || atOrders || atUsers || atKibbutzManagement || atWorkshopManagement) && isAdmin && (
          <button onClick={() => navigate("/admin")} data-testid="back-to-admin-button">
            {t("back") || "Back to Admin"}
          </button>
        )}
      </div>

      <div className="app-logo" onClick={() => navigate("/")}>
        <img src={logo} alt="Logo" className="logo-img" />
      </div>

      <div className="right-buttons">
        {!atLogin && (
          <button onClick={logout} data-testid="logout-button">{t("logout")}</button>
        )}

        {showInstall && (
          <button onClick={handleInstallClick} className="install-btn" data-testid="install-app-button">
            📱 {t("installApp") || "Install App"}
          </button>
        )}
      </div>

      <KibbutzModal 
        isOpen={showKibbutzModal} 
        onClose={() => setShowKibbutzModal(false)} 
      />
    </header>
  );
}

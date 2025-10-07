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
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
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
  const atOrders = location.pathname === "/orders";
  const atOrderHistory = location.pathname === "/order-history";
  const atKibbutzManagement = location.pathname === "/admin/kibbutz";
  const isAdmin = userData?.isAdmin;
  const isKibbutzMember = userData?.kibbutzId;

  return (
    <header className="app-header">
      <div className="left-buttons">
        {!atLogin && (
          <button onClick={logout} data-testid="logout-button">{t("logout")}</button>
        )}
      </div>

      <div className="app-logo" onClick={() => navigate("/")}>
        <img src={logo} alt="Logo" className="logo-img" />
      </div>

      <div className="right-buttons">
        {atHome && !isAdmin && userData && (
          <button 
            onClick={() => setShowKibbutzModal(true)}
            className={`kibbutz-btn ${isKibbutzMember ? 'kibbutz-member' : 'kibbutz-join'}`}
            data-testid="kibbutz-button"
          >
            {isKibbutzMember ? '🏘️ ' + userData.kibbutzName : '🏘️ ' + t('joinKibbutzButton')}
          </button>
        )}

        {showInstall && (
          <button onClick={handleInstallClick} className="install-btn" data-testid="install-app-button">
            📱 {t("installApp") || "Install App"}
          </button>
        )}

        {atHome && isAdmin && (
          <button onClick={() => navigate("/admin")} data-testid="admin-panel-button">{t("adminPanel")}</button>
        )}

        {atAdmin && (
          <>
            <button onClick={() => navigate("/")} data-testid="back-home-button">{t("backHome")}</button>
          </>
        )}

        {atOrderHistory && isAdmin && (
          <button onClick={() => navigate("/admin")} data-testid="back-to-admin-button">{t("back") || "Back to Admin"}</button>
        )}

        {atOrders && isAdmin && (
          <button onClick={() => navigate("/admin")} data-testid="back-to-admin-button">{t("back") || "Back to Admin"}</button>
        )}

        {atUsers && isAdmin && (
          <button onClick={() => navigate("/admin")} data-testid="back-to-admin-button">{t("back") || "Back to Admin"}</button>
        )}

        {atKibbutzManagement && isAdmin && (
          <button onClick={() => navigate("/admin")} data-testid="back-to-admin-button">{t("BackToAdmin")}</button>
        )}
      </div>

      <KibbutzModal 
        isOpen={showKibbutzModal} 
        onClose={() => setShowKibbutzModal(false)} 
      />
    </header>
  );
}

// src/components/Header.js
import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Logo from "../img/LOGO.jpg";

export default function Header() {
  const { logout, userData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const atLogin = location.pathname === "/login";
  const atHome = location.pathname === "/";
  const atAdmin = location.pathname.startsWith("/admin");

  return (
    <header className="app-header">
      {/* centered logo */}
      <img src={Logo} alt="Logo" className="app-logo" />

      {/* only show buttons when NOT on /login */}
      {!atLogin && (
        <div className="header-buttons">
          {atHome && userData?.isAdmin && (
            <button onClick={() => navigate("/admin")}>
              {t("adminPanel")}
            </button>
          )}
          {atAdmin && (
            <button onClick={() => navigate("/")}>
              {t("backHome")}
            </button>
          )}
          <button onClick={logout}>{t("logout")}</button>
        </div>
      )}
    </header>
  );
}

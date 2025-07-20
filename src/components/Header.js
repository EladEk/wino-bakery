import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./Header.css";

export default function Header() {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const atHome = location.pathname === "/";
  const atAdmin = location.pathname === "/admin";

  const isAdmin = userData?.isAdmin;

  return (
    <header className="app-header">
      {/* Left side buttons container */}
      <div className="left-buttons">
        {isAdmin && (
          <>
            {atHome && (
              <button onClick={() => navigate("/admin")}>{t("adminPanel")}</button>
            )}
            <button onClick={logout}>{t("logout")}</button>
          </>
        )}
      </div>

      {/* Centered logo */}
      <div className="app-logo" onClick={() => navigate("/")}>
        <img src="/logo.png" alt="Logo" height="60" />
      </div>

      {/* Right side buttons container */}
      <div className="right-buttons">
        {!isAdmin && (
          <>
            {atHome && (
              <button onClick={() => navigate("/admin")}>{t("adminPanel")}</button>
            )}
            {atAdmin && (
              <button onClick={() => navigate("/")}>{t("backHome")}</button>
            )}
            <button onClick={logout}>{t("logout")}</button>
          </>
        )}
        {isAdmin && atAdmin && (
          <button onClick={() => navigate("/")}>{t("backHome")}</button>
        )}
      </div>
    </header>
  );
}

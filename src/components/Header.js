import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./Header.css";

export default function Header() {
  const { currentUser, userData, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const atHome = location.pathname === "/";
  const atAdmin = location.pathname === "/admin";

  const buttonsClass = `header-buttons ${userData?.isAdmin ? "admin-buttons" : ""}`;

  return (
    <header className="app-header">
      <div className="app-logo" onClick={() => navigate("/")}>
        <img src="/logo.png" alt="Logo" height="60" />
      </div>

      <div className={buttonsClass}>
        {atHome && userData?.isAdmin && (
          <button onClick={() => navigate("/admin")}>{t("adminPanel")}</button>
        )}
        {atAdmin && (
          <button onClick={() => navigate("/")}>{t("backHome")}</button>
        )}
        <button onClick={logout}>{t("logout")}</button>
      </div>
    </header>
  );
}

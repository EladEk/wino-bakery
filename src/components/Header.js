import React from "react";
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

  const atHome = location.pathname === "/";
  const atAdmin = location.pathname === "/admin";

  const isAdmin = userData?.isAdmin;

  return (
    <header className="app-header">
      <div className="left-buttons">
        {isAdmin && <button onClick={logout}>{t("logout")}</button>}
      </div>

      <div className="app-logo" onClick={() => navigate("/")}>
        <img src={logo} alt="Logo" height="60" />
      </div>

      <div className="right-buttons">
        {atHome && isAdmin && (
          <button onClick={() => navigate("/admin")}>{t("adminPanel")}</button>
        )}
        {atAdmin && (
          <button onClick={() => navigate("/")}>{t("backHome")}</button>
        )}
        {!isAdmin && <button onClick={logout}>{t("logout")}</button>}
      </div>
    </header>
  );
}

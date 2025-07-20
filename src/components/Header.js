import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logo from "../img/LOGO.jpg"; // adjust path as needed
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
      {/* Left buttons (admins only) */}
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
        <img src={logo} alt="Logo" height="60" />
      </div>

      {/* Right buttons (non-admins only) */}
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
        {/* Admin on admin page gets backHome button on right */}
        {isAdmin && atAdmin && (
          <button onClick={() => navigate("/")}>{t("backHome")}</button>
        )}
      </div>
    </header>
  );
}

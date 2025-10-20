import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./AdminNavigation.css";

export default function AdminNavigation({ className = "" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // Two rows as requested:
  const row1 = [
    { key: "users",  label: t("ManageUsers"),  to: "/users" },
    { key: "orders", label: t("OrderSummary"), to: "/orders" },
    { key: "hist",   label: t("OrderHistory"), to: "/order-history" },
  ];
  const row2 = [
    { key: "kibbutz", label: t("kibbutzManagement"), to: "/admin/kibbutz" },
    { key: "workshops", label: t("workshops"), to: "/admin/workshops" },
  ];

  return (
    <nav className={`admin-navigation ${className}`}>
      <div className="admin-navigation__inner">
        <div className="admin-navigation__row">
        {row1.map((it) => {
          const active = location.pathname === it.to;
          return (
            <button
              key={it.key}
              className={`admin-nav-link ${active ? "active" : ""}`}
              onClick={() => navigate(it.to)}
              data-testid={`admin-nav-${it.key}`}
            >
              {it.label}
            </button>
          );
        })}
        </div>
        <div className="admin-navigation__row">
        {row2.map((it) => {
          const active = location.pathname === it.to;
          return (
            <button
              key={it.key}
              className={`admin-nav-link ${active ? "active" : ""}`}
              onClick={() => navigate(it.to)}
              data-testid={`admin-nav-${it.key}`}
            >
              {it.label}
            </button>
          );
        })}
        </div>
      </div>
    </nav>
  );
}

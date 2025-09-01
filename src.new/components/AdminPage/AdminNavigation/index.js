import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./styles.css";

export default function AdminNavigation({ className = "" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const items = [
    { key: "users",  label: t("ManageUsers"),  to: "/users" },
    { key: "orders", label: t("OrderSummary"), to: "/orders" },
    { key: "hist",   label: t("OrderHistory"), to: "/order-history" },
  ];

  return (
    <nav className={`admin-navigation ${className}`}>
      <div className="admin-navigation__inner">
        {items.map(it => {
          const active = location.pathname === it.to;
          return (
            <button
              key={it.key}
              className={`admin-nav-link ${active ? "active" : ""}`}
              onClick={() => navigate(it.to)}
            >
              {it.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

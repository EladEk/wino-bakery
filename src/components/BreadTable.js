import React from "react";

export default function BreadTable({ bread, t, onEdit, onToggleShow }) {
  const dir = document.dir || "rtl";
  const alignEnd = dir === "rtl" ? "flex-start" : "flex-end";
  const labelMargin = dir === "rtl" ? { marginLeft: 8 } : { marginRight: 8 };

  return (
    <div>
      {/* Show checkbox above table */}
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: alignEnd, alignItems: 'center', marginBottom: 6 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
          <input
            type="checkbox"
            checked={bread.show !== false}
            onChange={() => onToggleShow(bread.id, bread.show !== false)}
            style={{ accentColor: '#222', ...labelMargin }}
          />
          {t("show")}
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500, marginInlineStart: 20 }}>
          <input
            type="checkbox"
            checked={bread.isFocaccia || false}
            disabled // Only editable via admin modal/form
            style={{ accentColor: '#222', ...labelMargin }}
          />
          {t("foccia")}
        </label>
      </div>
      <div className="table-responsive">
        <table className="cream-table">
          <thead>
            <tr>
              <th>{t("Name")}</th>
              <th>{t("description")}</th>
              <th>{t("available")}</th>
              <th>{t("price")}</th>
              <th>{t("Actions")}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="bread-name">{bread.name}</td>
              <td>{bread.description}</td>
              <td>{bread.availablePieces}</td>
              <td>{bread.price?.toFixed(2)}</td>
              <td>
                <button onClick={() => onEdit(bread)} className="edit-bread-btn">
                  {t("Edit")}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

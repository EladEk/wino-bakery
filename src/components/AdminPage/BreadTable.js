import React from "react";
import { useKibbutz } from "../../hooks/useKibbutz";

export default function BreadTable({ bread, t, onEdit, onToggleShow }) {
  const { kibbutzim } = useKibbutz();
  const dir = document.dir || "rtl";
  const alignEnd = dir === "rtl" ? "flex-start" : "flex-end";
  const labelMargin = dir === "rtl" ? { marginLeft: 8 } : { marginRight: 8 };
  
  // Calculate general available quantity (total - allocated to kibbutzim)
  const totalAllocated = Object.values(bread.kibbutzQuantities || {}).reduce((sum, qty) => sum + (qty || 0), 0);
  const generalAvailable = bread.availablePieces - totalAllocated;

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
            disabled
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
              <td>
                {generalAvailable}
                {totalAllocated > 0 && (
                  <div style={{ fontSize: '0.8em', color: '#666', marginTop: '2px' }}>
                    ({t("total")}: {bread.availablePieces}, {t("allocated")}: {totalAllocated})
                  </div>
                )}
              </td>
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

      {/* Kibbutz Allocations Table */}
      {bread.kibbutzQuantities && 
       Object.keys(bread.kibbutzQuantities).length > 0 && 
       Object.values(bread.kibbutzQuantities).some(qty => qty > 0) && (
        <div style={{ marginTop: '10px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9em', color: '#2c5aa0' }}>
            {t("kibbutzAllocations")}
          </h4>
          <div className="table-responsive">
            <table className="cream-table" style={{ fontSize: '0.85em' }}>
              <thead>
                <tr>
                  <th>{t("kibbutzName")}</th>
                  <th>{t("allocatedQuantity")}</th>
                  <th>{t("claimedQuantity")}</th>
                  <th>{t("availableQuantity")}</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(bread.kibbutzQuantities).map(([kibbutzId, allocatedQty]) => {
                  const kibbutz = kibbutzim?.find(k => k.id === kibbutzId);
                  const claimedByKibbutz = (bread.claimedBy || []).filter(claim => claim.kibbutzId === kibbutzId);
                  const claimedQty = claimedByKibbutz.reduce((sum, claim) => sum + (claim.quantity || 0), 0);
                  const availableQty = Math.max(0, allocatedQty - claimedQty);
                  
                  return (
                    <tr key={kibbutzId}>
                      <td>{kibbutz?.name || `Kibbutz ${kibbutzId}`}</td>
                      <td>{allocatedQty}</td>
                      <td>{claimedQty}</td>
                      <td style={{ color: availableQty > 0 ? '#2e7d32' : '#d32f2f', fontWeight: 'bold' }}>
                        {availableQty}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

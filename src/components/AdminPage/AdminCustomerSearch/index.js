import React, { useMemo, useState } from "react";
import "./styles.css";

export default function AdminCustomerSearch({ t, breads, dir, toggleSupplied, togglePaid }) {
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const rows = [];
    for (const b of breads) {
      (b.claimedBy || []).forEach((c, idx) => {
        const hay = `${c.name||""} ${c.phone||""} ${c.userId||""}`.toLowerCase();
        if (hay.includes(term)) {
          rows.push({ bread: b, claim: c, idx });
        }
      });
    }
    return rows;
  }, [q, breads]);

  return (
    <div>
      <div className={`customer-search ${dir === "rtl" ? "rtl" : ""}`}>
        <input
          className="search-input"
          placeholder={t("searchByNameOrPhone") || t("Search")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {!!q && (
          <button className="clear-btn" onClick={() => setQ("")}>{t("clear") || "Clear"}</button>
        )}
      </div>

      {q && (
        <div className="customer-results">
          <div className="results-title">
            {results.length ? t("results") : t("noResultsFound")}
          </div>
          {results.length > 0 && (
            <div className="table-responsive customer-table">
              <table className="ordered-table">
                <thead>
                  <tr>
                    <th>{t("bread")}</th>
                    <th>{t("Name")}</th>
                    <th>{t("phone") || "Phone"}</th>
                    <th className="num-col">{t("quantity")}</th>
                    <th className="num-col">{t("price")}</th>
                    <th className="num-col">{t("total")}</th>
                    <th>{t("markSupplied")}</th>
                    <th>{t("markPaid")}</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map(({ bread, claim, idx }) => (
                    <tr key={`${bread.id}_${idx}`}>
                      <td>{bread.name}</td>
                      <td>{claim.name}</td>
                      <td>{claim.phone || ""}</td>
                      <td className="num-col">{claim.quantity}</td>
                      <td className="num-col">{bread.price?.toFixed(2) || ""}</td>
                      <td className="num-col">{((bread.price||0) * (claim.quantity||0)).toFixed(2)}</td>
                      <td className="check-cell">
                        <input type="checkbox" checked={!!claim.supplied} onChange={() => toggleSupplied(bread.id, idx)} />
                      </td>
                      <td className="check-cell">
                        <input type="checkbox" checked={!!claim.paid} onChange={() => togglePaid(bread.id, idx)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

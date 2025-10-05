import React, { useMemo, useState } from "react";

export default function AdminCustomerSearch({ t, breads, dir = "rtl", toggleSupplied, togglePaid }) {
  const [searchTerm, setSearchTerm] = useState("");

  const normalized = (s) => (s || "").toString().trim().toLowerCase();
  const search = normalized(searchTerm);

  const customerResults = useMemo(() => {
    if (!search) return [];
    const rows = [];
    breads.forEach((b) => {
      (b.claimedBy || []).forEach((c, idx) => {
        const hay = `${c.name || ""} ${c.phone || ""} ${c.userId || ""}`.toLowerCase();
        if (hay.includes(search)) {
          rows.push({
            userId: c.userId || "",
            name: c.name || "",
            phone: c.phone || "",
            breadId: b.id,
            breadName: b.name,
            idx,
            quantity: Number(c.quantity || 0),
            price: Number(b.price || 0),
            supplied: !!c.supplied,
            paid: !!c.paid,
            timestamp: c.timestamp || null,
          });
        }
      });
    });
    rows.sort((a, b) => {
      const an = a.name.toLowerCase();
      const bn = b.name.toLowerCase();
      if (an !== bn) return an.localeCompare(bn);
      return a.breadName.toLowerCase().localeCompare(b.breadName.toLowerCase());
    });
    return rows;
  }, [search, breads]);

  return (
    <>
      <div className={`customer-search ${dir === "rtl" ? "rtl" : ""}`}>
        <input
          type="text"
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t("searchCustomerPlaceholder")}
        />
        {searchTerm && (
          <button className="clear-btn" onClick={() => setSearchTerm("")}>
            {t("clear")}
          </button>
        )}
      </div>

      {searchTerm && (
        <div className="customer-results">
          <h4 className="results-title">
            {t("customerOrders")}
            {customerResults.length > 0 ? ` · ${customerResults.length}` : ""}
          </h4>

          <div className="table-responsive">
            <table className="ordered-table customer-table">
              <thead>
                <tr>
                  <th>{t("customer")}</th>
                  <th>{t("phone")}</th>
                  <th>{t("bread")}</th>
                  <th className="num-col">{t("quantity")}</th>
                  <th className="num-col">{t("price")}</th>
                  <th className="num-col">{t("subtotal")}</th>
                  <th>{t("supplied")}</th>
                  <th>{t("paid")}</th>
                </tr>
              </thead>
              <tbody>
                {customerResults.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", opacity: 0.7 }}>
                      {t("noResults")}
                    </td>
                  </tr>
                ) : (
                  customerResults.map((r) => (
                    <tr key={`${r.userId}_${r.breadId}_${r.idx}`}>
                      <td>{r.name || "-"}</td>
                      <td>{r.phone || "-"}</td>
                      <td>{r.breadName}</td>
                      <td className="num-col">{r.quantity}</td>
                      <td className="num-col">{r.price.toFixed(2)}</td>
                      <td className="num-col">{(r.price * r.quantity).toFixed(2)}</td>
                      <td className="check-cell">
                        <input
                          type="checkbox"
                          checked={r.supplied}
                          onChange={() => toggleSupplied(r.breadId, r.idx)}
                        />
                      </td>
                      <td className="check-cell">
                        <input
                          type="checkbox"
                          checked={r.paid}
                          onChange={() => togglePaid(r.breadId, r.idx)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

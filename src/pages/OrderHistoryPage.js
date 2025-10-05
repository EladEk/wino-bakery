import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { useTranslation } from "react-i18next";
import "./OrderHistoryPage.css";

export default function OrderHistoryPage() {
  const [history, setHistory] = useState([]);
  const [filterName, setFilterName] = useState("");
  const [popup, setPopup] = useState({ show: false, message: "", error: false });
  const { t } = useTranslation();

  useEffect(() => {
    const q = query(collection(db, "ordersHistory"), orderBy("saleDate", "desc"));
    const unsub = onSnapshot(q, snapshot => {
      setHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsub;
  }, []);

  const handleDeleteSale = async (saleId) => {
    if (!window.confirm(t("areYouSureDeleteSale") || "Are you sure you want to delete this sale from history?")) return;
    try {
      await deleteDoc(doc(db, "ordersHistory", saleId));
      setHistory(prev => prev.filter(s => s.id !== saleId));
      setPopup({ show: true, message: t("saleDeletedSuccessfully") || "Sale deleted", error: false });
    } catch (err) {
      setPopup({ show: true, message: t("saleDeleteError") || "Error deleting sale", error: true });
      console.error(err);
    }
    setTimeout(() => setPopup({ show: false, message: "", error: false }), 2500);
  };

  function getBreadsTotals(sale) {
    if (!sale || !sale.breads) return [];
    return sale.breads.map(bread => ({
      name: bread.breadName,
      totalSold: (bread.orders || []).reduce((sum, o) => sum + (o.quantity || 0), 0)
    }));
  }

  function getTotalRevenue(sale) {
    if (!sale || !sale.breads) return 0;
    return sale.breads.reduce(
      (sum, bread) =>
        sum +
        (bread.orders || []).reduce(
          (s, o) => s + ((o.quantity || 0) * (bread.breadPrice || 0)),
          0
        ),
      0
    );
  }

  return (
    <div className="order-history-page">
      {/* פופאפ הודעה */}
      {popup.show && (
        <div className={`popup-message ${popup.error ? "error" : ""}`}>
          <span className="popup-text">{popup.message}</span>
          <button
            className="popup-close"
            onClick={() => setPopup({ show: false, message: "", error: false })}
            aria-label="close"
          >
            ×
          </button>
        </div>
      )}

      <h2>{t("OrderHistory")}</h2>
      <input
        type="text"
        value={filterName}
        onChange={e => setFilterName(e.target.value)}
        placeholder={t("FilterByCustomerName")}
        className="history-filter"
      />
      {history.length === 0 && <p>{t("NoOrderHistoryYet")}</p>}
      {history.map(sale => (
        <div key={sale.id} className="sale-block">
          <div className="sale-header-row">
            <h3 className="sale-date">
              {t("saleDate")}:{" "}
              {sale.saleDate && sale.saleDate.seconds
                ? new Date(sale.saleDate.seconds * 1000).toLocaleDateString("he-IL")
                : t("UnknownDate")}
            </h3>
            <button
              className="sale-delete-btn"
              onClick={() => handleDeleteSale(sale.id)}
              title={t("deleteSale") || "Delete Sale"}
            >
              🗑️ {t("deleteSale") || "Delete Sale"}
            </button>
          </div>

          {/* Responsive scrollable table container */}
          <div className="sale-table-responsive">
            <table className="sale-table">
              <thead>
                <tr>
                  <th>{t("BreadName")}</th>
                  <th>{t("price")}</th>
                  <th>{t("Pieces")}</th>
                  <th>{t("name")}</th>
                  <th>{t("phone")}</th>
                  <th>{t("kibbutz")}</th>
                  <th>{t("description")}</th>
                  <th>{t("supplied")}</th>
                  <th>{t("paid")}</th>
                </tr>
              </thead>
              <tbody>
                {sale.breads.map(bread =>
                  (bread.orders || [])
                    .filter(order =>
                      !filterName ||
                      (order.name && order.name.toLowerCase().includes(filterName.toLowerCase()))
                    )
                    .map(order => {
                      const isKibbutzMember = order.kibbutzId;
                      const rowStyle = isKibbutzMember ? { backgroundColor: '#e3f2fd', color: '#1976d2' } : {};
                      
                      return (
                        <tr key={bread.breadId + "-" + (order.userId || order.name)} style={rowStyle}>
                          <td>{bread.breadName}</td>
                          <td>{bread.breadPrice}</td>
                          <td>{order.quantity}</td>
                          <td>
                            {order.name}
                            {isKibbutzMember && <span style={{ marginLeft: 5 }}>🏘️</span>}
                          </td>
                          <td>{order.phone}</td>
                          <td>{order.kibbutzId ? (order.kibbutzName || t("unknownKibbutz")) : t("notAssignedToKibbutz")}</td>
                          <td>{bread.breadDescription}</td>
                          <td>{order.supplied ? t("Yes") : t("No")}</td>
                          <td>{order.paid ? t("Yes") : t("No")}</td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>

          {/* טבלת סיכום */}
          <div className="sale-table-responsive">
            <table className="sale-totals-table">
              <thead>
                <tr>
                  <th>{t("BreadName")}</th>
                  <th>{t("totalSold")}</th>
                </tr>
              </thead>
              <tbody>
                {getBreadsTotals(sale).map(row => (
                  <tr key={row.name}>
                    <td>{row.name}</td>
                    <td>{row.totalSold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* סך הכנסות */}
          <div className="sale-total-revenue">
            {t("totalRevenue")}: {getTotalRevenue(sale).toFixed(2)}
          </div>
        </div>
      ))}
    </div>
  );
}

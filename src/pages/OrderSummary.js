import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { useTranslation } from "react-i18next";
import { useKibbutz } from "../hooks/useKibbutz";
import BreadLoader from "../components/BreadLoader";
import "./OrderSummary.css";

export default function OrderSummary() {
  const { t } = useTranslation();
  const { kibbutzim } = useKibbutz();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSupplied, setShowSupplied] = useState(false);
  const [selectedKibbutz, setSelectedKibbutz] = useState("all");

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const breadsSnapshot = await getDocs(collection(db, "breads"));
    const usersSnapshot = await getDocs(collection(db, "users"));

    const usersMap = {};
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      usersMap[data.id] = { 
        name: data.name || data.email, 
        phone: data.phone || "",
        kibbutzId: data.kibbutzId,
        kibbutzName: data.kibbutzName
      };
    });

    const userOrders = {};
    breadsSnapshot.forEach(breadDoc => {
      const bread = breadDoc.data();
      (bread.claimedBy || []).forEach((claim, idx) => {
        if (!userOrders[claim.userId]) {
          userOrders[claim.userId] = {
            name: usersMap[claim.userId]?.name || claim.name || "Unknown",
            phone: usersMap[claim.userId]?.phone || claim.phone || "",
            kibbutzId: usersMap[claim.userId]?.kibbutzId || claim.kibbutzId,
            kibbutzName: usersMap[claim.userId]?.kibbutzName || claim.kibbutzName,
            items: [],
          };
        }
        userOrders[claim.userId].items.push({
          breadId: breadDoc.id,
          breadName: bread.name,
          quantity: claim.quantity,
          paid: !!claim.paid,
          supplied: !!claim.supplied,
          claimIndex: idx,
          kibbutzId: claim.kibbutzId,
          kibbutzName: claim.kibbutzName,
          discountPercentage: claim.discountPercentage,
        });
      });
    });

    setOrders(
      Object.entries(userOrders).map(([userId, data]) => ({
        userId,
        ...data,
      }))
    );
    setLoading(false);
  };

  // Just update state, do not filter out supplied items
  const toggleCheckbox = async (breadId, claimIndex, type) => {
    const breadRef = doc(db, "breads", breadId);
    const breadDocSnap = await getDoc(breadRef);
    const breadDoc = breadDocSnap.data();

    const updatedClaims = (breadDoc.claimedBy || []).map((claim, idx) =>
      idx === claimIndex
        ? { ...claim, [type]: !claim[type] }
        : claim
    );

    await updateDoc(breadRef, { claimedBy: updatedClaims });

    setOrders(prevOrders =>
      prevOrders.map(order => ({
        ...order,
        items: order.items.map(item =>
          item.breadId === breadId && item.claimIndex === claimIndex
            ? { ...item, [type]: !item[type] }
            : item
        ),
      }))
    );
  };

  return (
    <div className="order-summary">
      <h2>{t("OrderSummary")}</h2>
      <div style={{ textAlign: "right", marginBottom: 16, display: "flex", gap: "16px", justifyContent: "flex-end", flexWrap: "wrap" }}>
        <label style={{ 
          cursor: "pointer", 
          fontSize: "1.05em",
          backgroundColor: "white",
          padding: "8px 12px",
          borderRadius: "6px",
          border: "1px solid #ddd",
          display: "inline-block"
        }}>
          <input
            type="checkbox"
            checked={showSupplied}
            onChange={e => setShowSupplied(e.target.checked)}
            style={{ marginLeft: 6 }}
          />
          {t("showSupplied")}
        </label>
        
        <select
          value={selectedKibbutz}
          onChange={e => setSelectedKibbutz(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            border: "1px solid #ddd",
            backgroundColor: "white",
            fontSize: "1.05em",
            cursor: "pointer"
          }}
        >
          <option value="all">{t("allKibbutzim")}</option>
          <option value="no-kibbutz">{t("noKibbutz")}</option>
          {kibbutzim.filter(k => k.isActive).map(kibbutz => (
            <option key={kibbutz.id} value={kibbutz.id}>
              🏘️ {kibbutz.name}
            </option>
          ))}
        </select>
      </div>
      {loading ? (
        <BreadLoader />
      ) : orders.length === 0 ? (
        <p>{t("No pending orders")}</p>
      ) : (
        orders
          .filter(order => {
            // Filter by kibbutz
            if (selectedKibbutz === "all") return true;
            if (selectedKibbutz === "no-kibbutz") return !order.kibbutzId;
            return order.kibbutzId === selectedKibbutz;
          })
          .map(order => {
            // Filter items by showSupplied flag
            const visibleItems = showSupplied
              ? order.items
              : order.items.filter(item => !item.supplied);

            if (visibleItems.length === 0) return null;

            const isKibbutzMember = order.kibbutzId;
            const orderCardStyle = isKibbutzMember ? { backgroundColor: '#e3f2fd', borderColor: '#1976d2' } : {};

            return (
              <div key={order.userId} className="order-card" style={orderCardStyle}>
                <h3 style={{ color: isKibbutzMember ? '#1976d2' : 'inherit' }}>
                  {order.name}
                  {isKibbutzMember && <span style={{ marginLeft: 5 }}>🏘️</span>}
                </h3>
                <p>{order.phone}</p>
                {isKibbutzMember && (
                  <p style={{ color: '#1976d2', fontWeight: 'bold' }}>
                    {t("kibbutzMember")}: {order.kibbutzName}
                  </p>
                )}
              <ul>
                {visibleItems.map((item, idx) => (
                  <li key={idx} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span>
                      <b>{item.breadName}</b> × {item.quantity}
                    </span>
                    <label>
                      <input
                        type="checkbox"
                        checked={item.paid}
                        onChange={() => toggleCheckbox(item.breadId, item.claimIndex, "paid")}
                      />{" "}
                      {t("paid")}
                    </label>
                    <label style={{ marginLeft: 10 }}>
                      <input
                        type="checkbox"
                        checked={item.supplied}
                        onChange={() => toggleCheckbox(item.breadId, item.claimIndex, "supplied")}
                      />{" "}
                      {t("supplied")}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          );
        })
      )}
    </div>
  );
}

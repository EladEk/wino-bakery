import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { useTranslation } from "react-i18next";
import BreadLoader from "../components/BreadLoader";
import "./OrderSummary.css";

export default function OrderSummary() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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
      usersMap[data.id] = { name: data.name || data.email, phone: data.phone || "" };
    });

    const userOrders = {};
    breadsSnapshot.forEach(breadDoc => {
      const bread = breadDoc.data();
      (bread.claimedBy || []).forEach((claim, idx) => {
        if (claim.supplied) return; // show only not supplied
        if (!userOrders[claim.userId]) {
          userOrders[claim.userId] = {
            name: usersMap[claim.userId]?.name || claim.name || "Unknown",
            phone: usersMap[claim.userId]?.phone || claim.phone || "",
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

  // Now updates local state instantly, no reload
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

    // Instant local update (without refetch)
    setOrders(prevOrders =>
      prevOrders
        .map(order => ({
          ...order,
          items: order.items.map(item =>
            item.breadId === breadId && item.claimIndex === claimIndex
              ? { ...item, [type]: !item[type] }
              : item
          ),
        }))
        // Remove order if all items are now supplied (for supplied checkbox only)
        .filter(order =>
          order.items.some(item => !item.supplied)
        )
        .map(order => ({
          ...order,
          items: order.items.filter(item => !item.supplied),
        }))
        .filter(order => order.items.length > 0)
    );
  };

  return (
    <div className="order-summary">
      <h2>{t("OrderSummary")}</h2>
      {loading ? (
        <BreadLoader />
      ) : orders.length === 0 ? (
        <p>{t("No pending orders")}</p>
      ) : (
        orders.map(order => (
          <div key={order.userId} className="order-card">
            <h3>{order.name}</h3>
            <p>{order.phone}</p>
            <ul>
              {order.items.map((item, idx) => (
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
        ))
      )}
    </div>
  );
}

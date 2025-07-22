import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, doc, updateDoc, getDoc } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import "./HomePage.css";

export default function HomePage() {
  const [breads, setBreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userData, currentUser } = useAuth();
  const { t, i18n } = useTranslation();

  const [orderQuantities, setOrderQuantities] = useState({});
  const [editQuantities, setEditQuantities] = useState({});
  const [saleDate, setSaleDate] = useState("");
  const [startHour, setStartHour] = useState("");
  const [endHour, setEndHour] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "breads"), snap => {
      setBreads(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    const saleDateRef = doc(db, "config", "saleDate");
    getDoc(saleDateRef).then(docSnap => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSaleDate(data.value || "");
        setStartHour(data.startHour || "");
        setEndHour(data.endHour || "");
        setAddress(data.address || "");
      }
    });
    return unsub;
  }, []);

  const handleClaim = async breadId => {
    const ref = doc(db, "breads", breadId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data();
    const qty = Number(orderQuantities[breadId] || 1);
    if (!qty || qty < 1) return alert(t("invalidQuantity"));
    if (data.availablePieces < qty) return alert(t("notEnoughAvailable"));
    if (data.claimedBy?.some(c => c.userId === currentUser.uid))
      return alert(t("alreadyClaimed"));

    await updateDoc(ref, {
      availablePieces: data.availablePieces - qty,
      claimedBy: [
        ...(data.claimedBy || []),
        {
          phone: userData?.phone || "",
          name:
            (userData && (userData.name || userData.phone || userData.email)) ||
            "Unknown",
          quantity: qty,
          userId: currentUser.uid,
          timestamp: new Date()
        }
      ],
    });
    setOrderQuantities(q => ({ ...q, [breadId]: 1 }));
  };

  const handleUnclaim = async breadId => {
    const ref = doc(db, "breads", breadId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data();
    const claim = (data.claimedBy || []).find(c => c.userId === currentUser.uid);
    if (!claim) return alert(t("notClaimed"));

    await updateDoc(ref, {
      availablePieces: data.availablePieces + claim.quantity,
      claimedBy: (data.claimedBy || []).filter(c => c.userId !== currentUser.uid),
    });
    setEditQuantities(q => ({ ...q, [breadId]: undefined }));
  };

  const handleEditOrder = async (bread, newQty) => {
    newQty = Number(newQty);
    if (!newQty || newQty < 1) return alert(t("invalidQuantity"));

    const ref = doc(db, "breads", bread.id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data();
    const claim = (data.claimedBy || []).find(c => c.userId === currentUser.uid);
    if (!claim) return;

    const diff = newQty - claim.quantity;
    if (diff === 0) return;
    if (diff > 0 && data.availablePieces < diff) return alert(t("notEnoughAvailable"));

    await updateDoc(ref, {
      availablePieces: data.availablePieces - diff,
      claimedBy: (data.claimedBy || []).map(c =>
        c.userId === currentUser.uid ? { ...c, quantity: newQty } : c
      ),
    });
    setEditQuantities(q => ({ ...q, [bread.id]: newQty }));
  };

  const userTotalCost = breads.reduce((sum, bread) => {
    const claim = (bread.claimedBy || []).find(c => c.userId === currentUser.uid);
    return claim && bread.price != null ? sum + claim.quantity * bread.price : sum;
  }, 0);

  const dir = document.dir || i18n.dir();

  return (
    <div className="page-container">
      <h2>{t("breadsList")}</h2>
      {(saleDate || address) && (
        <div className={`delivery-details ${dir === "rtl" ? "rtl" : ""}`}>
          {saleDate && (
            <>
              {t("saleDate")}: {saleDate}
              {(startHour && endHour) && (
                <> {t("between")} {startHour}-{endHour}</>
              )}
            </>
          )}
          {address && (
            <>
              <br />
              {t("pickupAddress")}: {address}
            </>
          )}
        </div>
      )}

      {loading ? (
        <div>{t("loading")}</div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="cream-table home-table">
              <thead>
                <tr>
                  <th>{t("bread")}</th>
                  <th>{t("description")}</th>
                  <th>{t("available")}</th>
                  <th>{t("price")}</th>
                  <th>{t("action")}</th>
                </tr>
              </thead>
              <tbody>
                {breads.map(bread => {
                  const claim = (bread.claimedBy || []).find(c => c.userId === currentUser.uid);
                  return (
                    <tr key={bread.id}>
                      <td>{bread.name}</td>
                      <td>{bread.description}</td>
                      <td>{bread.availablePieces}</td>
                      <td>{bread.price?.toFixed(2) || ""}</td>
                      <td>
                        {claim ? (
                          <>
                            <span>{t("ordered")}: </span>
                            <div className="order-quantity-row">
                              <button
                                className="qty-btn"
                                onClick={() =>
                                  setEditQuantities(q => ({
                                    ...q,
                                    [bread.id]: Math.max(1, Number(q[bread.id] ?? claim.quantity) - 1)
                                  }))
                                }
                                disabled={(editQuantities[bread.id] ?? claim.quantity) <= 1}
                                type="button"
                                aria-label="decrease quantity"
                              >
                                –
                              </button>
                              <input
                                type="number"
                                min={1}
                                max={bread.availablePieces + claim.quantity}
                                value={editQuantities[bread.id] ?? claim.quantity}
                                readOnly
                                className="order-input"
                                style={{ textAlign: "center" }}
                              />
                              <button
                                className="qty-btn"
                                onClick={() =>
                                  setEditQuantities(q => ({
                                    ...q,
                                    [bread.id]: Math.min(
                                      bread.availablePieces + claim.quantity,
                                      Number(q[bread.id] ?? claim.quantity) + 1
                                    )
                                  }))
                                }
                                disabled={
                                  (editQuantities[bread.id] ?? claim.quantity) >=
                                  bread.availablePieces + claim.quantity
                                }
                                type="button"
                                aria-label="increase quantity"
                              >
                                +
                              </button>
                              <button
                                onClick={() =>
                                  handleEditOrder(
                                    bread,
                                    editQuantities[bread.id] ?? claim.quantity
                                  )
                                }
                                disabled={
                                  (editQuantities[bread.id] ?? claim.quantity) ===
                                  claim.quantity
                                }
                                style={{ marginLeft: 8 }}
                              >
                                {t("updateOrder")}
                              </button>
                              <button
                                onClick={() => handleUnclaim(bread.id)}
                                className="cancel-btn"
                              >
                                {t("cancelOrder")}
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="order-quantity-row">
                              <button
                                className="qty-btn"
                                onClick={() =>
                                  setOrderQuantities(q => ({
                                    ...q,
                                    [bread.id]: Math.max(1, Number(q[bread.id] || 1) - 1)
                                  }))
                                }
                                disabled={(orderQuantities[bread.id] || 1) <= 1}
                                type="button"
                                aria-label="decrease quantity"
                              >
                                –
                              </button>
                              <input
                                type="number"
                                min={1}
                                max={bread.availablePieces}
                                value={orderQuantities[bread.id] || 1}
                                readOnly
                                className="order-input"
                                style={{ textAlign: "center" }}
                              />
                              <button
                                className="qty-btn"
                                onClick={() =>
                                  setOrderQuantities(q => ({
                                    ...q,
                                    [bread.id]: Math.min(
                                      bread.availablePieces,
                                      Number(q[bread.id] || 1) + 1
                                    )
                                  }))
                                }
                                disabled={
                                  (orderQuantities[bread.id] || 1) >= bread.availablePieces
                                }
                                type="button"
                                aria-label="increase quantity"
                              >
                                +
                              </button>
                              <button
                                onClick={() => handleClaim(bread.id)}
                                disabled={bread.availablePieces < 1}
                                style={{ marginLeft: 8 }}
                              >
                                {t("order")}
                              </button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="total-revenue user-total-cost">
            {t("userTotalCost")}: {userTotalCost.toFixed(2)}
          </div>
        </>
      )}
    </div>
  );
}

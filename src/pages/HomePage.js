import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, doc, updateDoc, getDoc } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const [breads, setBreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userData, logout, currentUser } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // For new order quantities and editing existing orders
  const [orderQuantities, setOrderQuantities] = useState({});
  const [editQuantities, setEditQuantities] = useState({});

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "breads"), (snap) => {
      setBreads(
        snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }))
      );
      setLoading(false);
    });
    return unsub;
  }, []);

  // Place a new order claim
  const handleClaim = async (breadId) => {
    const breadRef = doc(db, "breads", breadId);
    const breadDoc = await getDoc(breadRef);
    if (!breadDoc.exists()) return;
    const data = breadDoc.data();

    const qty = Number(orderQuantities[breadId] || 1);
    if (!qty || qty < 1) return alert(t("invalidQuantity"));
    if (data.availablePieces < qty) return alert(t("notEnoughAvailable"));

    const alreadyClaimed = data.claimedBy?.find(
      (c) => c.userId === currentUser.uid
    );
    if (alreadyClaimed) return alert(t("alreadyClaimed"));

    await updateDoc(breadRef, {
      availablePieces: data.availablePieces - qty,
      claimedBy: [
        ...(data.claimedBy || []),
        {
          // Use name or phone or email as fallback for claim display
          name: userData.name || userData.phone || userData.email || "Unknown",
          quantity: qty,
          userId: currentUser.uid,
          timestamp: new Date()
        }
      ]
    });
    setOrderQuantities((q) => ({ ...q, [breadId]: 1 }));
  };

  // Cancel an existing order
  const handleUnclaim = async (breadId) => {
    const breadRef = doc(db, "breads", breadId);
    const breadDoc = await getDoc(breadRef);
    if (!breadDoc.exists()) return;
    const data = breadDoc.data();
    const claimedBy = (data.claimedBy || []).filter(
      (c) => c.userId !== currentUser.uid
    );
    const alreadyClaimed = (data.claimedBy || []).find(
      (c) => c.userId === currentUser.uid
    );
    if (!alreadyClaimed) return alert(t("notClaimed"));
    await updateDoc(breadRef, {
      availablePieces: data.availablePieces + (alreadyClaimed.quantity || 1),
      claimedBy
    });
    setEditQuantities((q) => ({ ...q, [breadId]: undefined }));
  };

  // Edit quantity of an existing order
  const handleEditOrder = async (bread, newQty) => {
    newQty = Number(newQty);
    if (!newQty || newQty < 1) return alert(t("invalidQuantity"));

    const breadRef = doc(db, "breads", bread.id);
    const breadDoc = await getDoc(breadRef);
    if (!breadDoc.exists()) return;
    const data = breadDoc.data();
    const claimedBy = data.claimedBy || [];
    const currentClaim = claimedBy.find(c => c.userId === currentUser.uid);

    if (!currentClaim) return;

    const qtyDiff = newQty - currentClaim.quantity;
    if (qtyDiff === 0) return;
    if (data.availablePieces < qtyDiff && qtyDiff > 0)
      return alert(t("notEnoughAvailable"));

    const newClaimedBy = claimedBy.map(c =>
      c.userId === currentUser.uid ? { ...c, quantity: newQty } : c
    );

    await updateDoc(breadRef, {
      availablePieces: data.availablePieces - qtyDiff,
      claimedBy: newClaimedBy
    });
    setEditQuantities((q) => ({ ...q, [bread.id]: newQty }));
  };

  // Calculate total cost for user orders
  const userTotalCost = breads.reduce((sum, bread) => {
    const claim = (bread.claimedBy || []).find(c => c.userId === currentUser.uid);
    if (claim && bread.price != null) {
      return sum + claim.quantity * bread.price;
    }
    return sum;
  }, 0);

  return (
    <div style={{ maxWidth: 800, margin: "30px auto" }}>
      <h2>{t("breadsList")}</h2>
      <button onClick={logout}>{t("logout")}</button>
      {userData?.isAdmin && (
        <button
          onClick={() => navigate("/admin")}
          style={{ marginRight: 10 }}
        >
          {t("adminPanel")}
        </button>
      )}
      {loading ? (
        <div>{t("loading")}</div>
      ) : (
        <>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
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
              {breads.map((bread) => {
                const userClaimed = (bread.claimedBy || []).find(
                  (c) => c.userId === currentUser.uid
                );
                return (
                  <tr key={bread.id}>
                    <td>{bread.name}</td>
                    <td>{bread.description}</td>
                    <td>{bread.availablePieces}</td>
                    <td>{bread.price !== undefined ? bread.price.toFixed(2) : ""}</td>
                    <td>
                      {userClaimed ? (
                        <>
                          <span>
                            {t("ordered")}: {userClaimed.quantity}
                          </span>
                          <input
                            type="number"
                            min={1}
                            max={bread.availablePieces + userClaimed.quantity}
                            value={editQuantities[bread.id] ?? userClaimed.quantity}
                            onChange={e =>
                              setEditQuantities(q => ({
                                ...q,
                                [bread.id]: e.target.value
                              }))
                            }
                            style={{ width: 50, margin: "0 8px" }}
                          />
                          <button
                            onClick={() =>
                              handleEditOrder(bread, editQuantities[bread.id] ?? userClaimed.quantity)
                            }
                            disabled={
                              (editQuantities[bread.id] ?? userClaimed.quantity) === userClaimed.quantity
                            }
                          >
                            {t("updateOrder")}
                          </button>
                          <button
                            onClick={() => handleUnclaim(bread.id)}
                            style={{ marginRight: 6 }}
                          >
                            {t("cancelOrder")}
                          </button>
                        </>
                      ) : (
                        <>
                          <input
                            type="number"
                            min={1}
                            max={bread.availablePieces}
                            value={orderQuantities[bread.id] || 1}
                            onChange={e =>
                              setOrderQuantities(q => ({
                                ...q,
                                [bread.id]: e.target.value
                              }))
                            }
                            style={{ width: 50, marginRight: 8 }}
                          />
                          <button
                            onClick={() => handleClaim(bread.id)}
                            disabled={bread.availablePieces < 1}
                          >
                            {t("order")}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ marginTop: 20, fontWeight: "bold", fontSize: "1.2em" }}>
            {t("userTotalCost")}: {userTotalCost.toFixed(2)}
          </div>
        </>
      )}
    </div>
  );
}

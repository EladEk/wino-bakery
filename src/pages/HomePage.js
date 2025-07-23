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
  const [saleDate, setSaleDate] = useState("");
  const [startHour, setStartHour] = useState("");
  const [endHour, setEndHour] = useState("");
  const [address, setAddress] = useState("");
  const [bitNumber, setBitNumber] = useState("");
  const [showThanks, setShowThanks] = useState(false);
  const [showUpdated, setShowUpdated] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);
  const [userClaims, setUserClaims] = useState({});

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "breads"), snap => {
      const breadsArr = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBreads(breadsArr);
      const claims = {};
      breadsArr.forEach(bread => {
        const claim = (bread.claimedBy || []).find(c => c.userId === currentUser.uid);
        if (claim) claims[bread.id] = claim;
      });
      setUserClaims(claims);
      setOrderQuantities(q => {
        const newQ = {};
        breadsArr.forEach(bread => {
          newQ[bread.id] = claims[bread.id]?.quantity || 0;
        });
        return newQ;
      });
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
        setBitNumber(data.bitNumber || "");
      }
    });

    return unsub;
  }, [currentUser.uid]);

  const handleOrder = async () => {
    let name = userData?.name;
    let phone = userData?.phone;
    if (!name || !phone) {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        name = data.name;
        phone = data.phone;
      }
    }
    if (!name || !phone) {
      return alert(t("pleaseCompleteProfile"));
    }

    await Promise.all(breads.map(async bread => {
      const qty = Number(orderQuantities[bread.id] || 0);
      const hasClaim = !!userClaims[bread.id];
      if (qty > 0 && !hasClaim) {
        const ref = doc(db, "breads", bread.id);
        await updateDoc(ref, {
          availablePieces: bread.availablePieces - qty,
          claimedBy: [
            ...(bread.claimedBy || []),
            { phone, name, quantity: qty, userId: currentUser.uid, timestamp: new Date() }
          ]
        });
      }
    }));

    setShowThanks(true);
    setTimeout(() => setShowThanks(false), 3000);
  };

  const handleUpdateOrder = async () => {
    await Promise.all(breads.map(async bread => {
      const prevClaim = userClaims[bread.id];
      const newQty = Number(orderQuantities[bread.id] || 0);

      if (prevClaim) {
        if (newQty === 0) {
          const ref = doc(db, "breads", bread.id);
          await updateDoc(ref, {
            availablePieces: bread.availablePieces + prevClaim.quantity,
            claimedBy: (bread.claimedBy || []).filter(c => c.userId !== currentUser.uid)
          });
        } else if (newQty !== prevClaim.quantity) {
          const diff = newQty - prevClaim.quantity;
          const ref = doc(db, "breads", bread.id);
          await updateDoc(ref, {
            availablePieces: bread.availablePieces - diff,
            claimedBy: (bread.claimedBy || []).map(c =>
              c.userId === currentUser.uid ? { ...c, quantity: newQty } : c
            )
          });
        }
      } else if (newQty > 0) {
        let name = userData?.name;
        let phone = userData?.phone;
        if (!name || !phone) {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            name = data.name;
            phone = data.phone;
          }
        }
        if (!name || !phone) {
          alert(t("pleaseCompleteProfile"));
          return;
        }
        const ref = doc(db, "breads", bread.id);
        await updateDoc(ref, {
          availablePieces: bread.availablePieces - newQty,
          claimedBy: [
            ...(bread.claimedBy || []),
            { phone, name, quantity: newQty, userId: currentUser.uid, timestamp: new Date() }
          ]
        });
      }
    }));

    setShowUpdated(true);
    setTimeout(() => setShowUpdated(false), 3000);
  };

  const handleCancelOrder = async () => {
    await Promise.all(breads.map(async bread => {
      const prevClaim = userClaims[bread.id];
      if (!prevClaim) return;
      const ref = doc(db, "breads", bread.id);
      await updateDoc(ref, {
        availablePieces: bread.availablePieces + prevClaim.quantity,
        claimedBy: (bread.claimedBy || []).filter(c => c.userId !== currentUser.uid)
      });
    }));

    setShowCancelled(true);
    setTimeout(() => setShowCancelled(false), 3000);
  };

  const userTotalCost = breads.reduce((sum, bread) => {
    const qty = orderQuantities[bread.id] || 0;
    return bread.price != null ? sum + qty * bread.price : sum;
  }, 0);

  const hasOrder = Object.keys(userClaims).length > 0;
  const isAboutToOrder = Object.values(orderQuantities).some(q => q > 0);
  const isFirstOrder = !hasOrder && isAboutToOrder;
  const isOrderChanged = hasOrder && breads.some(bread => {
    const prev = userClaims[bread.id]?.quantity || 0;
    const now = orderQuantities[bread.id] || 0;
    return prev !== now;
  });

  const dir = document.dir || i18n.dir();

  return (
    <div className={`page-container ${dir === "rtl" ? "rtl" : ""}`}>
      {showThanks    && <div className="thanks-popup">{t("thanksForOrder")}</div>}
      {showUpdated   && <div className="updated-popup">{t("updatedOrder")}</div>}
      {showCancelled && <div className="cancelled-popup">{t("cancelledOrder")}</div>}

      {(saleDate || address) && (
        <div className={`delivery-details-wrapper ${dir === "rtl" ? "rtl" : ""}`}>
          {saleDate && (
            <div className="delivery-card">
              <span className="icon">📅</span>
              <span>
                {t("saleDate")}: {saleDate}
                {startHour && endHour && <> {t("between")} {startHour} - {endHour}</>}
              </span>
            </div>
          )}
          {address && (
            <div
              className="delivery-card clickable"
              onClick={() => window.open(`https://waze.com/ul?q=${encodeURIComponent(address)}`, "_blank")}
            >
              <span className="icon">📍</span>
              <span>{t("pickupAddress")}: {address}</span>
            </div>
          )}
        </div>
      )}

      <h2 className="bread-heading">{t("breadsList")}</h2>

      {loading ? (
        <div>{t("loading")}</div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="cream-table home-table">
              <colgroup>
                <col className="name-col"/>
                <col className="desc-col" />
                <col className="avail-col" />
                <col className="price-col" />
                <col className="action-col"/>
              </colgroup>
              <thead>
                <tr>
                  <th>{t("bread")}</th>
                  <th>{t("description")}</th>
                  <th className="num-col">{t("available")}</th>
                  <th className="num-col">{t("price")}</th>
                  <th>{t("quantity")}</th>
                </tr>
              </thead>
              <tbody>
                {breads.map(bread => (
                  <tr key={bread.id}>
                    <td>{bread.name}</td>
                    <td>{bread.description}</td>
                    <td className="num-col">{bread.availablePieces}</td>
                    <td className="num-col">{bread.price?.toFixed(2) || ""}</td>
                    <td>
                      <div className="order-quantity-row">
                        <button
                          className="qty-btn"
                          onClick={() =>
                            setOrderQuantities(q => ({
                              ...q,
                              [bread.id]: Math.min(
                                bread.availablePieces + (userClaims[bread.id]?.quantity || 0),
                                Number(q[bread.id] || 0) + 1
                              )
                            }))
                          }
                          disabled={
                            (orderQuantities[bread.id] || 0) >= (
                              bread.availablePieces + (userClaims[bread.id]?.quantity || 0)
                            )
                          }
                        >+</button>
                        <input
                          type="number"
                          min={0}
                          max={bread.availablePieces + (userClaims[bread.id]?.quantity || 0)}
                          value={orderQuantities[bread.id] || 0}
                          readOnly
                          className="order-input"
                        />
                        <button
                          className="qty-btn"
                          onClick={() =>
                            setOrderQuantities(q => ({
                              ...q,
                              [bread.id]: Math.max(0, Number(q[bread.id] || 0) - 1)
                            }))
                          }
                          disabled={(orderQuantities[bread.id] || 0) <= 0}
                        >–</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="action-buttons-wrapper">
            {!hasOrder ? (
              <button
                onClick={handleOrder}
                className={`order-btn${isFirstOrder ? " flash" : ""}`}
                disabled={!isAboutToOrder}
              >
                {t("order")}
              </button>
            ) : (
              <>
                <button
                  onClick={handleUpdateOrder}
                  className={`updt-btn${isOrderChanged ? " flash" : ""}`}
                  disabled={!isOrderChanged}
                >
                  {t("updateOrder")}
                </button>
                <button
                  onClick={handleCancelOrder}
                  className="cancel-btn"
                >
                  {t("cancelOrder")}
                </button>
              </>
            )}
          </div>

          <div className="total-revenue user-total-cost">
            {t("userTotalCost")}: {userTotalCost.toFixed(2)}
          </div>

          {bitNumber && (
            <div className="transfer-number-info">
              {t("transferNumberLabel")}: <b>{bitNumber}</b>
            </div>
          )}
        </>
      )}
    </div>
  );
}

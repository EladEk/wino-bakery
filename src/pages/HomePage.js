import React, { useEffect, useState, useMemo } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, doc, updateDoc, getDoc } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { useKibbutz } from "../hooks/useKibbutz";
import "./HomePage.css";

import PopupWidget from "../components/HomePage/PopupWidget";
import CustomerBreadsTable from "../components/HomePage/CustomerBreadsTable";

export default function HomePage() {
  const [breads, setBreads] = useState([]);
  const [loading, setLoading] = useState(true);

  const { userData, currentUser } = useAuth();
  const { t, i18n } = useTranslation();
  const { kibbutzim } = useKibbutz();

  const getHebrewDay = (dateString) => {
    const daysHebrew = [t("sunday"), t("monday"), t("tuesday"), t("wednesday"), t("thursday"), t("friday"), t("saturday")];
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return daysHebrew[date.getDay()];
  };

  const [orderQuantities, setOrderQuantities] = useState({});
  const [userClaims, setUserClaims] = useState({});

  const [saleDate, setSaleDate] = useState("");
  const [startHour, setStartHour] = useState("");
  const [endHour, setEndHour] = useState("");
  const [address, setAddress] = useState("");
  const [bitNumber, setBitNumber] = useState("");

  const [popupType, setPopupType] = useState("");

  const saleDateDay = saleDate ? getHebrewDay(saleDate) : "";
  const dir = document.dir || i18n.dir();

  const showPopup = (type) => {
    setPopupType(type);
    setTimeout(() => setPopupType(""), 2000);
  };

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "breads"), snap => {
      const arr = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(b => b.show !== false);

      setBreads(arr);

      const claims = {};
      arr.forEach(b => {
        const claim = (b.claimedBy || []).find(c => c.userId === currentUser.uid);
        if (claim) claims[b.id] = claim;
      });
      setUserClaims(claims);

      setOrderQuantities(() => {
        const m = {};
        arr.forEach(b => (m[b.id] = Number(claims[b.id]?.quantity || 0)));
        return m;
      });

      setLoading(false);
    });

    const saleDateRef = doc(db, "config", "saleDate");
    getDoc(saleDateRef).then(snap => {
      if (snap.exists) {
        const d = snap.data();
        setSaleDate(d.value || "");
        setStartHour(d.startHour || "");
        setEndHour(d.endHour || "");
        setAddress(d.address || "");
        setBitNumber(d.bitNumber || "");
      }
    });

    return unsub;
  }, [currentUser.uid]);

  const ensureProfile = async () => {
    let name = userData?.name;
    let phone = userData?.phone;
    if (!name || !phone) {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists) {
        const d = userDoc.data();
        name = d.name;
        phone = d.phone;
      }
    }
    if (!name || !phone) throw new Error("PROFILE_INCOMPLETE");
    return { name, phone };
  };

  const handleOrder = async () => {
    try {
      const { name, phone } = await ensureProfile();

      await Promise.all(
        breads.map(async b => {
          const qty = Number(orderQuantities[b.id] || 0);
          const hasClaim = !!userClaims[b.id];
          if (qty > 0 && !hasClaim) {
            const ref = doc(db, "breads", b.id);
            await updateDoc(ref, {
              availablePieces: b.availablePieces - qty,
              claimedBy: [
                ...(b.claimedBy || []),
                { phone, name, quantity: qty, userId: currentUser.uid, timestamp: new Date() }
              ]
            });
          }
        })
      );

      showPopup("success");
    } catch (e) {
      if (e.message === "PROFILE_INCOMPLETE") alert(t("pleaseCompleteProfile"));
      else console.error(e);
    }
  };

  const handleUpdateOrder = async () => {
    try {
      await Promise.all(
        breads.map(async b => {
          const prev = userClaims[b.id];
          const newQty = Number(orderQuantities[b.id] || 0);

        if (prev) {
            if (newQty === 0) {
              const ref = doc(db, "breads", b.id);
              await updateDoc(ref, {
                availablePieces: b.availablePieces + prev.quantity,
                claimedBy: (b.claimedBy || []).filter(c => c.userId !== currentUser.uid)
              });
            } else if (newQty !== prev.quantity) {
              const diff = newQty - prev.quantity;
              const ref = doc(db, "breads", b.id);
              await updateDoc(ref, {
                availablePieces: b.availablePieces - diff,
                claimedBy: (b.claimedBy || []).map(c =>
                  c.userId === currentUser.uid ? { ...c, quantity: newQty } : c
                )
              });
            }
          } else if (newQty > 0) {
            const { name, phone } = await ensureProfile();
            const ref = doc(db, "breads", b.id);
            await updateDoc(ref, {
              availablePieces: b.availablePieces - newQty,
              claimedBy: [
                ...(b.claimedBy || []),
                { phone, name, quantity: newQty, userId: currentUser.uid, timestamp: new Date() }
              ]
            });
          }
        })
      );

      showPopup("update");
    } catch (e) {
      if (e.message === "PROFILE_INCOMPLETE") alert(t("pleaseCompleteProfile"));
      else console.error(e);
    }
  };

  const handleCancelOrder = async () => {
    await Promise.all(
      breads.map(async b => {
        const prev = userClaims[b.id];
        if (!prev) return;
        const ref = doc(db, "breads", b.id);
        await updateDoc(ref, {
          availablePieces: b.availablePieces + prev.quantity,
          claimedBy: (b.claimedBy || []).filter(c => c.userId !== currentUser.uid)
        });
      })
    );
    showPopup("cancel");
  };

  const breadsToOrder = useMemo(
    () => breads.filter(b => Number(userClaims[b.id]?.quantity || 0) === 0),
    [breads, userClaims]
  );
  const breadsOrdered = useMemo(
    () => breads.filter(b => Number(userClaims[b.id]?.quantity || 0) > 0),
    [breads, userClaims]
  );

  const hasChanges = useMemo(
    () => breads.some(b => Number(userClaims[b.id]?.quantity || 0) !== Number(orderQuantities[b.id] || 0)),
    [breads, userClaims, orderQuantities]
  );

  const hasAnyInput = useMemo(
    () => Object.values(orderQuantities).some(q => Number(q) > 0),
    [orderQuantities]
  );

  const userTotalCost = useMemo(() => {
    const total = breadsOrdered.reduce((sum, b) => {
      const qty = Number(orderQuantities[b.id] || 0);
      if (b.price == null) return sum;
      
      let finalPrice = b.price;
      
      // Apply kibbutz discount and surcharge if user is a kibbutz member
      if (userData?.kibbutzId && kibbutzim) {
        const userKibbutz = kibbutzim.find(k => k.id === userData.kibbutzId);
        if (userKibbutz) {
          // Apply discount
          if (userKibbutz.discountPercentage > 0) {
            const discount = userKibbutz.discountPercentage / 100;
            finalPrice = finalPrice * (1 - discount);
          }
          
          // Apply surcharge
          if (userKibbutz.surchargeType && userKibbutz.surchargeType !== 'none' && userKibbutz.surchargeValue > 0) {
            if (userKibbutz.surchargeType === 'percentage') {
              finalPrice = finalPrice * (1 + userKibbutz.surchargeValue / 100);
            } else if (userKibbutz.surchargeType === 'fixedPerBread') {
              finalPrice = finalPrice + userKibbutz.surchargeValue;
            }
            // Note: fixedPerOrder is handled after the loop
          }
        }
      }
      
      return sum + (qty * finalPrice);
    }, 0);
    
    // Add per-order surcharge if applicable
    if (userData?.kibbutzId && kibbutzim) {
      const userKibbutz = kibbutzim.find(k => k.id === userData.kibbutzId);
      if (userKibbutz && userKibbutz.surchargeType === 'fixedPerOrder' && userKibbutz.surchargeValue > 0) {
        const hasAnyOrders = Object.values(orderQuantities).some(q => Number(q) > 0);
        if (hasAnyOrders) {
          return total + userKibbutz.surchargeValue;
        }
      }
    }
    
    return total;
  }, [breadsOrdered, orderQuantities, userData?.kibbutzId, kibbutzim]);

  const orderSurcharge = useMemo(() => {
    if (userData?.kibbutzId && kibbutzim) {
      const userKibbutz = kibbutzim.find(k => k.id === userData.kibbutzId);
      if (userKibbutz && userKibbutz.surchargeType === 'fixedPerOrder' && userKibbutz.surchargeValue > 0) {
        const hasAnyOrders = Object.values(orderQuantities).some(q => Number(q) > 0);
        return hasAnyOrders ? userKibbutz.surchargeValue : 0;
      }
    }
    return 0;
  }, [userData?.kibbutzId, kibbutzim, orderQuantities]);

  const subtotal = useMemo(() => {
    return userTotalCost - orderSurcharge;
  }, [userTotalCost, orderSurcharge]);

  const onChangeQty = (breadId, next) =>
    setOrderQuantities(q => ({ ...q, [breadId]: next }));

  return (
    <div className={`page-container ${dir === "rtl" ? "rtl" : ""}`}>
      {popupType && <PopupWidget type={popupType} />}

      {(saleDate || address) && (
        <div className={`delivery-details-wrapper ${dir === "rtl" ? "rtl" : ""}`}>
          {saleDate && (
            <div className="delivery-card">
              <span className="icon">📅</span>
              <span>
                {t("saleDate")}: {saleDate} {saleDateDay && `(${saleDateDay})`}
                <br />
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

      {/* Section: Breads to order */}
      <h2 className="bread-heading">{t("breadsToOrder") || t("breadsList") || "Breads to order"}</h2>
      {loading ? (
        <div>{t("loading")}</div>
      ) : (
        <>
          <CustomerBreadsTable
            breads={breadsToOrder}
            t={t}
            userClaims={userClaims}
            orderQuantities={orderQuantities}
            onChangeQty={onChangeQty}
            userData={userData}
            kibbutzim={kibbutzim}
          />

          {/* Section: Breads I ordered (render ONLY if any saved order exists) */}
          {breadsOrdered.length > 0 && (
            <>
              <h3 className="bread-heading sub">{t("breadsIOrdered") || "Breads I ordered"}</h3>
              <CustomerBreadsTable
                breads={breadsOrdered}
                t={t}
                userClaims={userClaims}
                orderQuantities={orderQuantities}
                onChangeQty={onChangeQty}
                userData={userData}
                kibbutzim={kibbutzim}
              />
              <div className="order-summary">
                <div className="subtotal-line">
                  {t("subtotal")}: {subtotal.toFixed(2)} ₪
                </div>
                {orderSurcharge > 0 && (
                  <div className="surcharge-line">
                    {t("orderSurcharge")}: {orderSurcharge.toFixed(2)} ₪
                  </div>
                )}
                <div className="total-line">
                  {t("userTotalCost")}: {userTotalCost.toFixed(2)} ₪
                </div>
              </div>
            </>
          )}

          <div className="action-buttons-wrapper">
            {Object.keys(userClaims).length === 0 ? (
              <button
                onClick={handleOrder}
                className={`order-btn${hasAnyInput ? " flash" : ""}`}
                disabled={!hasAnyInput}
              >
                {t("order")}
              </button>
            ) : (
              <>
                <button
                  onClick={handleUpdateOrder}
                  className={`updt-btn${hasChanges ? " flash" : ""}`}
                  disabled={!hasChanges}
                >
                  {t("updateOrder")}
                </button>
                <button onClick={handleCancelOrder} className="cancel-btn">
                  {t("cancelOrder")}
                </button>
              </>
            )}
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

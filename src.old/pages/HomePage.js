import React, { useEffect, useState, useMemo } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, doc, updateDoc, getDoc } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import "./HomePage.css";

import PopupWidget from "../components/HomePage/PopupWidget";
import CustomerBreadsTable from "../components/HomePage/CustomerBreadsTable";

function getHebrewDay(dateString) {
  const daysHebrew = ["יום ראשון","יום שני","יום שלישי","יום רביעי","יום חמישי","יום שישי","שבת"];
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  return daysHebrew[date.getDay()];
}

export default function HomePage() {
  const [breads, setBreads] = useState([]);
  const [loading, setLoading] = useState(true);

  const { userData, currentUser } = useAuth();
  const { t, i18n } = useTranslation();

  // Live UI quantities (user edits here before saving)
  const [orderQuantities, setOrderQuantities] = useState({});
  // Persisted claims of the current user (from Firestore)
  const [userClaims, setUserClaims] = useState({});

  // Sale/delivery info
  const [saleDate, setSaleDate] = useState("");
  const [startHour, setStartHour] = useState("");
  const [endHour, setEndHour] = useState("");
  const [address, setAddress] = useState("");
  const [bitNumber, setBitNumber] = useState("");

  // UI helpers
  const [popupType, setPopupType] = useState("");

  const saleDateDay = saleDate ? getHebrewDay(saleDate) : "";
  const dir = document.dir || i18n.dir();

  const showPopup = (type) => {
    setPopupType(type);
    setTimeout(() => setPopupType(""), 2000);
  };

  // Load breads and user claims
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "breads"), snap => {
      const arr = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(b => b.show !== false); // show==true (or undefined)

      setBreads(arr);

      // extract current user claims
      const claims = {};
      arr.forEach(b => {
        const claim = (b.claimedBy || []).find(c => c.userId === currentUser.uid);
        if (claim) claims[b.id] = claim;
      });
      setUserClaims(claims);

      // sync UI inputs with saved claims
      setOrderQuantities(() => {
        const m = {};
        arr.forEach(b => (m[b.id] = Number(claims[b.id]?.quantity || 0)));
        return m;
      });

      setLoading(false);
    });

    // load config doc
    const saleDateRef = doc(db, "config", "saleDate");
    getDoc(saleDateRef).then(snap => {
      if (snap.exists()) {
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

  // Guard to ensure profile has name+phone before ordering
  const ensureProfile = async () => {
    let name = userData?.name;
    let phone = userData?.phone;
    if (!name || !phone) {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
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

  // Split lists by **saved** quantities so rows move only after Order/Update
  const breadsToOrder = useMemo(
    () => breads.filter(b => Number(userClaims[b.id]?.quantity || 0) === 0),
    [breads, userClaims]
  );
  const breadsOrdered = useMemo(
    () => breads.filter(b => Number(userClaims[b.id]?.quantity || 0) > 0),
    [breads, userClaims]
  );

  // Are there unsaved changes?
  const hasChanges = useMemo(
    () => breads.some(b => Number(userClaims[b.id]?.quantity || 0) !== Number(orderQuantities[b.id] || 0)),
    [breads, userClaims, orderQuantities]
  );

  // Is there any input selected (for first-time Order button)
  const hasAnyInput = useMemo(
    () => Object.values(orderQuantities).some(q => Number(q) > 0),
    [orderQuantities]
  );

  // Total (live preview) for the “ordered” section
  const userTotalCost = useMemo(() => {
    return breadsOrdered.reduce((sum, b) => {
      const qty = Number(orderQuantities[b.id] || 0);
      return b.price != null ? sum + qty * b.price : sum;
    }, 0);
  }, [breadsOrdered, orderQuantities]);

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
              />
              <div className="total-revenue user-total-cost">
                {t("userTotalCost")}: {userTotalCost.toFixed(2)}
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

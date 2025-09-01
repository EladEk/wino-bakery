import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import "./HomePage.css";
import PopupWidget from "../components/PopupWidget";

/** Local helper: day name in Hebrew for a date string (yyyy-mm-dd) */
function getHebrewDay(dateString) {
  const daysHebrew = [
    "יום ראשון", // Sunday
    "יום שני",
    "יום שלישי",
    "יום רביעי",
    "יום חמישי",
    "יום שישי",
    "שבת",
  ];
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

  // Staged quantities (NOT saved yet). Keys = bread.id
  const [orderQuantities, setOrderQuantities] = useState({});
  // Map of current saved claims by this user. Keys = bread.id
  const [userClaims, setUserClaims] = useState({});

  // Sale/delivery info
  const [saleDate, setSaleDate] = useState("");
  const [startHour, setStartHour] = useState("");
  const [endHour, setEndHour] = useState("");
  const [address, setAddress] = useState("");
  const [bitNumber, setBitNumber] = useState("");

  // Small popup after actions
  const [popupType, setPopupType] = useState("");
  const showPopup = (type) => {
    setPopupType(type);
    setTimeout(() => setPopupType(""), 2000);
  };

  const saleDateDay = saleDate ? getHebrewDay(saleDate) : "";
  const dir = document.dir || i18n.dir();

  useEffect(() => {
    // Live breads list
    const unsub = onSnapshot(collection(db, "breads"), (snap) => {
      const breadsArr = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((b) => b.show !== false); // only show when show===true or undefined

      setBreads(breadsArr);

      // Build current saved claims of this user
      const claims = {};
      breadsArr.forEach((bread) => {
        const claim = (bread.claimedBy || []).find(
          (c) => c.userId === currentUser.uid
        );
        if (claim) claims[bread.id] = claim;
      });
      setUserClaims(claims);

      // Initialize staged quantities to what's already saved (or 0)
      setOrderQuantities((prev) => {
        const next = {};
        breadsArr.forEach((bread) => {
          next[bread.id] = claims[bread.id]?.quantity || 0;
        });
        return next;
      });

      setLoading(false);
    });

    // Config document for sale date & pickup details
    const saleDateRef = doc(db, "config", "saleDate");
    getDoc(saleDateRef).then((snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setSaleDate(d.value || "");
        setStartHour(d.startHour || "");
        setEndHour(d.endHour || "");
        setAddress(d.address || "");
        setBitNumber(d.bitNumber || "");
      }
    });

    return () => unsub();
  }, [currentUser.uid]);

  /** Place NEW claims only (for users with no saved claims yet). */
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
      alert(t("pleaseCompleteProfile"));
      return;
    }

    await Promise.all(
      breads.map(async (bread) => {
        const qty = Number(orderQuantities[bread.id] || 0);
        const hasSavedClaim = !!userClaims[bread.id];
        // Only create new claims for breads with no saved claim yet
        if (qty > 0 && !hasSavedClaim) {
          const ref = doc(db, "breads", bread.id);
          await updateDoc(ref, {
            availablePieces: bread.availablePieces - qty,
            claimedBy: [
              ...(bread.claimedBy || []),
              {
                phone,
                name,
                quantity: qty,
                userId: currentUser.uid,
                timestamp: new Date(),
              },
            ],
          });
        }
      })
    );

    showPopup("success");
  };

  /** Update existing claims, cancel (qty=0), and also add new ones if user already has some. */
  const handleUpdateOrder = async () => {
    await Promise.all(
      breads.map(async (bread) => {
        const prevClaim = userClaims[bread.id];
        const newQty = Number(orderQuantities[bread.id] || 0);

        if (prevClaim) {
          // Remove claim if set to 0
          if (newQty === 0) {
            const ref = doc(db, "breads", bread.id);
            await updateDoc(ref, {
              availablePieces: bread.availablePieces + prevClaim.quantity,
              claimedBy: (bread.claimedBy || []).filter(
                (c) => c.userId !== currentUser.uid
              ),
            });
          }
          // Change quantity if different
          else if (newQty !== prevClaim.quantity) {
            const diff = newQty - prevClaim.quantity;
            const ref = doc(db, "breads", bread.id);
            await updateDoc(ref, {
              availablePieces: bread.availablePieces - diff,
              claimedBy: (bread.claimedBy || []).map((c) =>
                c.userId === currentUser.uid ? { ...c, quantity: newQty } : c
              ),
            });
          }
        } else if (newQty > 0) {
          // User already has SOME order -> allow adding new breads too
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
              {
                phone,
                name,
                quantity: newQty,
                userId: currentUser.uid,
                timestamp: new Date(),
              },
            ],
          });
        }
      })
    );

    showPopup("update");
  };

  /** Cancel ALL claims by this user. */
  const handleCancelOrder = async () => {
    await Promise.all(
      breads.map(async (bread) => {
        const prevClaim = userClaims[bread.id];
        if (!prevClaim) return;
        const ref = doc(db, "breads", bread.id);
        await updateDoc(ref, {
          availablePieces: bread.availablePieces + prevClaim.quantity,
          claimedBy: (bread.claimedBy || []).filter(
            (c) => c.userId !== currentUser.uid
          ),
        });
      })
    );
    showPopup("cancel");
  };

  // Totals (based on staged quantities)
  const userTotalCost = breads.reduce((sum, bread) => {
    const qty = Number(orderQuantities[bread.id] || 0);
    return bread.price != null ? sum + qty * bread.price : sum;
  }, 0);

  // Do we have any saved order? (controls the main action buttons)
  const hasSavedOrder = Object.keys(userClaims).length > 0;
  // Are we staging something to order?
  const isAboutToOrder = Object.values(orderQuantities).some((q) => Number(q) > 0);
  // Did staged quantities differ from saved ones?
  const isOrderChanged =
    hasSavedOrder &&
    breads.some((bread) => {
      const prev = userClaims[bread.id]?.quantity || 0;
      const now = Number(orderQuantities[bread.id] || 0);
      return prev !== now;
    });

  // Split view: show only saved-claimed breads in "My Orders" table
  const myBreads = breads.filter((b) => !!userClaims[b.id]);
  const availableBreads = breads.filter((b) => !userClaims[b.id]);

  const stepOf = (bread) => (bread.isFocaccia ? 0.5 : 1);
  const maxFor = (bread) =>
    (bread.availablePieces || 0) + (userClaims[bread.id]?.quantity || 0);

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
                {startHour && endHour && (
                  <>
                    {" "}{t("between")} {startHour} - {endHour}
                  </>
                )}
              </span>
            </div>
          )}
          {address && (
            <div
              className="delivery-card clickable"
              onClick={() =>
                window.open(
                  `https://waze.com/ul?q=${encodeURIComponent(address)}`,
                  "_blank"
                )
              }
            >
              <span className="icon">📍</span>
              <span>
                {t("pickupAddress")}: {address}
              </span>
            </div>
          )}
        </div>
      )}

      {/* AVAILABLE BREADS */}
      <h2 className="bread-heading">{t("breadsList")}</h2>

      {loading ? (
        <div>{t("loading")}</div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="cream-table home-table">
              <colgroup>
                <col className="name-col" />
                <col className="desc-col" />
                <col className="avail-col" />
                <col className="price-col" />
                <col className="action-col" />
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
                {availableBreads.map((bread) => (
                  <tr key={bread.id}>
                    <td>{bread.name}</td>
                    <td>{bread.description}</td>
                    <td className="num-col">{bread.availablePieces}</td>
                    <td className="num-col">
                      {bread.price != null ? bread.price.toFixed(2) : ""}
                    </td>
                    <td>
                      <div className="order-quantity-row">
                        <button
                          className="qty-btn"
                          onClick={() =>
                            setOrderQuantities((q) => ({
                              ...q,
                              [bread.id]: Math.min(
                                maxFor(bread),
                                Number(q[bread.id] || 0) + stepOf(bread)
                              ),
                            }))
                          }
                          disabled={
                            Number(orderQuantities[bread.id] || 0) >= maxFor(bread)
                          }
                        >
                          +
                        </button>
                        <input
                          type="number"
                          min={0}
                          step={stepOf(bread)}
                          max={maxFor(bread)}
                          value={orderQuantities[bread.id] || 0}
                          readOnly
                          className="order-input"
                        />
                        <button
                          className="qty-btn"
                          onClick={() =>
                            setOrderQuantities((q) => ({
                              ...q,
                              [bread.id]: Math.max(
                                0,
                                Number(q[bread.id] || 0) - stepOf(bread)
                              ),
                            }))
                          }
                          disabled={Number(orderQuantities[bread.id] || 0) <= 0}
                        >
                          –
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {availableBreads.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", opacity: 0.7 }}>
                      {t("noAvailableBreads") || ""}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ACTION BUTTONS */}
          <div className="action-buttons-wrapper">
            {!hasSavedOrder ? (
              <button
                onClick={handleOrder}
                className={`order-btn${
                  !hasSavedOrder && isAboutToOrder ? " flash" : ""
                }`}
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
                <button onClick={handleCancelOrder} className="cancel-btn">
                  {t("cancelOrder")}
                </button>
              </>
            )}
          </div>

          {/* MY ORDERED BREADS (only show if there are saved claims) */}
          {myBreads.length > 0 && (
            <>
              <h2 className="bread-heading">
                {t("breadsIOrdered") || t("myOrders") || "הזמנות שלי"}
              </h2>
              <div className="table-responsive">
                <table className="cream-table home-table">
                  <colgroup>
                    <col className="name-col" />
                    <col className="desc-col" />
                    <col className="avail-col" />
                    <col className="price-col" />
                    <col className="action-col" />
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
                    {myBreads.map((bread) => (
                      <tr key={bread.id}>
                        <td>{bread.name}</td>
                        <td>{bread.description}</td>
                        <td className="num-col">{bread.availablePieces}</td>
                        <td className="num-col">
                          {bread.price != null ? bread.price.toFixed(2) : ""}
                        </td>
                        <td>
                          <div className="order-quantity-row">
                            <button
                              className="qty-btn"
                              onClick={() =>
                                setOrderQuantities((q) => ({
                                  ...q,
                                  [bread.id]: Math.min(
                                    maxFor(bread),
                                    Number(q[bread.id] || 0) + stepOf(bread)
                                  ),
                                }))
                              }
                              disabled={
                                Number(orderQuantities[bread.id] || 0) >=
                                maxFor(bread)
                              }
                            >
                              +
                            </button>
                            <input
                              type="number"
                              min={0}
                              step={stepOf(bread)}
                              max={maxFor(bread)}
                              value={orderQuantities[bread.id] || 0}
                              readOnly
                              className="order-input"
                            />
                            <button
                              className="qty-btn"
                              onClick={() =>
                                setOrderQuantities((q) => ({
                                  ...q,
                                  [bread.id]: Math.max(
                                    0,
                                    Number(q[bread.id] || 0) - stepOf(bread)
                                  ),
                                }))
                              }
                              disabled={Number(orderQuantities[bread.id] || 0) <= 0}
                            >
                              –
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Total & Bit info */}
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

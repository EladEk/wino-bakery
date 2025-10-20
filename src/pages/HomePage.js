import React, { useEffect, useState, useMemo } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, doc, updateDoc, getDoc } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { useKibbutz } from "../hooks/useKibbutz";
import { useWorkshops } from "../hooks/useWorkshops";
import { useNavigate } from "react-router-dom";
// import { calculateDisplayPrice } from "../utils/pricing";
import "./HomePage.css";

import PopupWidget from "../components/HomePage/PopupWidget";
import CustomerBreadsTable from "../components/HomePage/CustomerBreadsTable";

export default function HomePage() {
  const [breads, setBreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userWorkshops, setUserWorkshops] = useState([]);

  const { userData, currentUser } = useAuth();
  const { t, i18n } = useTranslation();
  const { kibbutzim } = useKibbutz();
  const { getAvailableWorkshops, activeWorkshops, unregisterUser } = useWorkshops();
  const navigate = useNavigate();

  const getHebrewDay = (dateString) => {
    const daysHebrew = [t("sunday"), t("monday"), t("tuesday"), t("wednesday"), t("thursday"), t("friday"), t("saturday")];
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return daysHebrew[date.getDay()];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleUnregisterFromWorkshop = async (workshopId) => {
    if (!window.confirm(t('confirmUnregisterFromWorkshop'))) {
      return;
    }

    try {
      await unregisterUser(workshopId, currentUser.uid);
      // Update local state
      setUserWorkshops(prev => prev.filter(workshop => workshop.id !== workshopId));
    } catch (error) {
      console.error('Error unregistering from workshop:', error);
      alert(t('errorUnregisteringFromWorkshop'));
    }
  };

  const [orderQuantities, setOrderQuantities] = useState({});
  const [userClaims, setUserClaims] = useState({});

  const [saleDate, setSaleDate] = useState("");
  const [startHour, setStartHour] = useState("");
  const [endHour, setEndHour] = useState("");
  const [address, setAddress] = useState("");
  const [bitNumber, setBitNumber] = useState("");

  const [popupType, setPopupType] = useState("");
  const [availableWorkshops, setAvailableWorkshops] = useState([]);

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

  // Update workshops when activeWorkshops changes
  useEffect(() => {
    const workshops = getAvailableWorkshops();
    console.log('Available workshops updated:', workshops);
    setAvailableWorkshops(workshops);
  }, [getAvailableWorkshops]);

  // Get workshops user is registered to
  useEffect(() => {
    if (!currentUser?.uid || !activeWorkshops.length) {
      setUserWorkshops([]);
      return;
    }

    const userRegisteredWorkshops = activeWorkshops.filter(workshop => {
      return workshop.registeredUsers?.some(user => 
        user.userId === currentUser.uid || 
        user.email === currentUser.email ||
        user.email === userData?.email
      );
    });

    console.log('User registered workshops:', userRegisteredWorkshops);
    setUserWorkshops(userRegisteredWorkshops);
  }, [activeWorkshops, currentUser?.uid, currentUser?.email, userData?.email]);

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

      // Update local state immediately for better UX
      const newClaims = { ...userClaims };
      const newBreads = [...breads];
      
      await Promise.all(
        breads.map(async (b, index) => {
          const qty = Number(orderQuantities[b.id] || 0);
          const hasClaim = !!userClaims[b.id];
          if (qty > 0 && !hasClaim) {
            const newClaim = { 
              phone, 
              name, 
              quantity: qty, 
              userId: currentUser.uid, 
              timestamp: new Date(),
              kibbutzId: userData?.kibbutzId || null,
              kibbutzName: userData?.kibbutzName || null,
              discountPercentage: userData?.kibbutzId ? 
                (kibbutzim.find(k => k.id === userData.kibbutzId)?.discountPercentage || 0) : 0,
              surchargeType: userData?.kibbutzId ? 
                (kibbutzim.find(k => k.id === userData.kibbutzId)?.surchargeType || 'none') : 'none',
              surchargeValue: userData?.kibbutzId ? 
                (kibbutzim.find(k => k.id === userData.kibbutzId)?.surchargeValue || 0) : 0
            };
            
            // Update local state immediately
            newClaims[b.id] = newClaim;
            
            // Update breads state immediately
            newBreads[index] = {
              ...b,
              claimedBy: [
                ...(b.claimedBy || []),
                newClaim
              ]
            };
            
            const ref = doc(db, "breads", b.id);
            await updateDoc(ref, {
              claimedBy: [
                ...(b.claimedBy || []),
                newClaim
              ]
            });
          }
        })
      );

      // Update local state immediately
      setUserClaims(newClaims);
      setBreads(newBreads);

      showPopup("success");
    } catch (e) {
      if (e.message === "PROFILE_INCOMPLETE") alert(t("pleaseCompleteProfile"));
      else console.error(e);
    }
  };

  const handleUpdateOrder = async () => {
    try {
      // Update local state immediately for better UX
      const newClaims = { ...userClaims };
      const newBreads = [...breads];
      
      await Promise.all(
        breads.map(async (b, index) => {
          const prev = userClaims[b.id];
          const newQty = Number(orderQuantities[b.id] || 0);

        if (prev) {
            if (newQty === 0) {
              // Remove from local state
              delete newClaims[b.id];
              
              // Update breads state immediately
              newBreads[index] = {
                ...b,
                claimedBy: (b.claimedBy || []).filter(c => c.userId !== currentUser.uid)
              };
              
              const ref = doc(db, "breads", b.id);
              await updateDoc(ref, {
                claimedBy: (b.claimedBy || []).filter(c => c.userId !== currentUser.uid)
              });
            } else if (newQty !== prev.quantity) {
              // Update local state
              const updatedClaim = {
                ...prev,
                quantity: newQty,
                kibbutzId: userData?.kibbutzId || prev.kibbutzId || null,
                kibbutzName: userData?.kibbutzName || prev.kibbutzName || null,
                discountPercentage: userData?.kibbutzId ? 
                  (kibbutzim.find(k => k.id === userData.kibbutzId)?.discountPercentage || 0) : (prev.discountPercentage || 0),
                surchargeType: userData?.kibbutzId ? 
                  (kibbutzim.find(k => k.id === userData.kibbutzId)?.surchargeType || 'none') : (prev.surchargeType || 'none'),
                surchargeValue: userData?.kibbutzId ? 
                  (kibbutzim.find(k => k.id === userData.kibbutzId)?.surchargeValue || 0) : (prev.surchargeValue || 0)
              };
              
              newClaims[b.id] = updatedClaim;
              
              // Update breads state immediately
              newBreads[index] = {
                ...b,
                claimedBy: (b.claimedBy || []).map(c =>
                  c.userId === currentUser.uid ? updatedClaim : c
                )
              };
              
              const ref = doc(db, "breads", b.id);
              await updateDoc(ref, {
                claimedBy: (b.claimedBy || []).map(c =>
                  c.userId === currentUser.uid ? { 
                    ...c, 
                    quantity: newQty,
                    kibbutzId: userData?.kibbutzId || c.kibbutzId || null,
                    kibbutzName: userData?.kibbutzName || c.kibbutzName || null,
                    discountPercentage: userData?.kibbutzId ? 
                      (kibbutzim.find(k => k.id === userData.kibbutzId)?.discountPercentage || 0) : (c.discountPercentage || 0),
                    surchargeType: userData?.kibbutzId ? 
                      (kibbutzim.find(k => k.id === userData.kibbutzId)?.surchargeType || 'none') : (c.surchargeType || 'none'),
                    surchargeValue: userData?.kibbutzId ? 
                      (kibbutzim.find(k => k.id === userData.kibbutzId)?.surchargeValue || 0) : (c.surchargeValue || 0)
                  } : c
                )
              });
            }
          } else if (newQty > 0) {
            const { name, phone } = await ensureProfile();
            const newClaim = { 
              phone, 
              name, 
              quantity: newQty, 
              userId: currentUser.uid, 
              timestamp: new Date(),
              kibbutzId: userData?.kibbutzId || null,
              kibbutzName: userData?.kibbutzName || null,
              discountPercentage: userData?.kibbutzId ? 
                (kibbutzim.find(k => k.id === userData.kibbutzId)?.discountPercentage || 0) : 0,
              surchargeType: userData?.kibbutzId ? 
                (kibbutzim.find(k => k.id === userData.kibbutzId)?.surchargeType || 'none') : 'none',
              surchargeValue: userData?.kibbutzId ? 
                (kibbutzim.find(k => k.id === userData.kibbutzId)?.surchargeValue || 0) : 0
            };
            
            // Update local state
            newClaims[b.id] = newClaim;
            
            // Update breads state immediately
            newBreads[index] = {
              ...b,
              claimedBy: [
                ...(b.claimedBy || []),
                newClaim
              ]
            };
            
            const ref = doc(db, "breads", b.id);
            await updateDoc(ref, {
              claimedBy: [
                ...(b.claimedBy || []),
                newClaim
              ]
            });
          }
        })
      );

      // Update local state immediately
      setUserClaims(newClaims);
      setBreads(newBreads);

      showPopup("update");
    } catch (e) {
      if (e.message === "PROFILE_INCOMPLETE") alert(t("pleaseCompleteProfile"));
      else console.error(e);
    }
  };

  const handleCancelOrder = async () => {
    // Update local state immediately for better UX
    const newClaims = { ...userClaims };
    const newBreads = [...breads];
    
    await Promise.all(
      breads.map(async (b, index) => {
        const prev = userClaims[b.id];
        if (!prev) return;
        
        // Remove from local state
        delete newClaims[b.id];
        
        // Update breads state immediately
        newBreads[index] = {
          ...b,
          claimedBy: (b.claimedBy || []).filter(c => c.userId !== currentUser.uid)
        };
        
        const ref = doc(db, "breads", b.id);
        await updateDoc(ref, {
          claimedBy: (b.claimedBy || []).filter(c => c.userId !== currentUser.uid)
        });
      })
    );
    
    // Update local state immediately
    setUserClaims(newClaims);
    setBreads(newBreads);
    
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
      // Use the saved quantity from userClaims for ordered breads, not orderQuantities
      const qty = Number(userClaims[b.id]?.quantity || 0);
      if (b.price == null) return sum;
      
      let finalPrice = b.price;
      
      if (userData?.kibbutzId && kibbutzim) {
        const userKibbutz = kibbutzim.find(k => k.id === userData.kibbutzId);
        if (userKibbutz) {
          if (userKibbutz.discountPercentage > 0) {
            const discount = userKibbutz.discountPercentage / 100;
            finalPrice = finalPrice * (1 - discount);
          }
          
          if (userKibbutz.surchargeType && userKibbutz.surchargeType !== 'none' && userKibbutz.surchargeValue > 0) {
            if (userKibbutz.surchargeType === 'percentage') {
              finalPrice = finalPrice * (1 + userKibbutz.surchargeValue / 100);
            } else if (userKibbutz.surchargeType === 'fixedPerBread') {
              finalPrice = finalPrice + userKibbutz.surchargeValue;
            }
          }
        }
      }
      
      return sum + (qty * finalPrice);
    }, 0);
    
    if (userData?.kibbutzId && kibbutzim) {
      const userKibbutz = kibbutzim.find(k => k.id === userData.kibbutzId);
      if (userKibbutz && userKibbutz.surchargeType === 'fixedPerOrder' && userKibbutz.surchargeValue > 0) {
        const hasAnyOrders = Object.values(userClaims).some(claim => Number(claim?.quantity || 0) > 0);
        if (hasAnyOrders) {
          return total + userKibbutz.surchargeValue;
        }
      }
    }
    
    return total;
  }, [breadsOrdered, userClaims, userData?.kibbutzId, kibbutzim]);

  const orderSurcharge = useMemo(() => {
    if (userData?.kibbutzId && kibbutzim) {
      const userKibbutz = kibbutzim.find(k => k.id === userData.kibbutzId);
      if (userKibbutz && userKibbutz.surchargeType === 'fixedPerOrder' && userKibbutz.surchargeValue > 0) {
        const hasAnyOrders = Object.values(userClaims).some(claim => Number(claim?.quantity || 0) > 0);
        return hasAnyOrders ? userKibbutz.surchargeValue : 0;
      }
    }
    return 0;
  }, [userData?.kibbutzId, kibbutzim, userClaims]);

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

      {userWorkshops.length > 0 && (
        <div className="user-workshops-section">
          <h3 className="user-workshops-title">🎯 {t('myWorkshops')}</h3>
          <div className="user-workshops-list">
            {userWorkshops.map(workshop => (
              <div key={workshop.id} className="user-workshop-card">
                <div className="workshop-info">
                  <h4 className="workshop-name">{workshop.name}</h4>
                  <p className="workshop-date">
                    {t('workshopDate')}: {formatDate(workshop.date)}
                  </p>
                  <p className="workshop-price">
                    {t('workshopPrice')}: ₪{workshop.price}
                  </p>
                  {workshop.location && (
                    <p className="workshop-location">
                      {t('workshopLocation')}: {workshop.location}
                    </p>
                  )}
                </div>
                <div className="workshop-actions">
                  <button
                    className="unregister-workshop-btn"
                    onClick={() => handleUnregisterFromWorkshop(workshop.id)}
                  >
                    ❌ {t('unregisterFromWorkshop')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bread-heading-container">
        <h2 className="bread-heading">{t("breadsToOrder") || t("breadsList") || "Breads to order"}</h2>
        {availableWorkshops.length > 0 && (
          <button
            className="workshops-button"
            onClick={() => navigate('/workshops')}
          >
            🎯 {t('registerToWorkshops')}
          </button>
        )}
      </div>
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
                data-testid="order-button"
              >
                {t("order")}
              </button>
            ) : (
              <>
                <button
                  onClick={handleUpdateOrder}
                  className={`updt-btn${hasChanges ? " flash" : ""}`}
                  disabled={!hasChanges}
                  data-testid="update-order-button"
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

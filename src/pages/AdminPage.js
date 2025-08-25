import React, { useEffect, useState, useMemo } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp,
  writeBatch
} from "firebase/firestore";
import { useTranslation } from "react-i18next";
import BreadEditModal from "../components/BreadEditModal";
import BreadList from "../components/BreadList";
import EndSaleModal from "../components/EndSaleModal";
import "./AdminPage.css";
import { useNavigate } from "react-router-dom";

const HOUR_OPTIONS = Array.from({ length: 15 }, (_, i) =>
  String(i + 7).padStart(2, "0") + ":00"
);

export default function AdminPage() {
  const [breads, setBreads] = useState([]);
  const [breadName, setBreadName] = useState("");
  const [breadPieces, setBreadPieces] = useState(1);
  const [breadDescription, setBreadDescription] = useState("");
  const [breadPrice, setBreadPrice] = useState("");
  const [breadShow, setBreadShow] = useState(true);
  const [breadIsFocaccia, setBreadIsFocaccia] = useState(false);
  const [editingOrder, setEditingOrder] = useState({});
  const [saleDate, setSaleDate] = useState("");
  const [startHour, setStartHour] = useState("");
  const [endHour, setEndHour] = useState("");
  const [address, setAddress] = useState("");
  const [bitNumber, setBitNumber] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalBread, setModalBread] = useState(null);

  // End-sale modal & popup state
  const [showEndSaleDialog, setShowEndSaleDialog] = useState(false);
  const [endSaleLoading, setEndSaleLoading] = useState(false);
  const [popup, setPopup] = useState({ show: false, message: "", error: false });

  // Customer search
  const [searchTerm, setSearchTerm] = useState("");

  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    const breadsUnsub = onSnapshot(collection(db, "breads"), (snapshot) => {
      setBreads(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    const saleDateRef = doc(db, "config", "saleDate");
    getDoc(saleDateRef).then((docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSaleDate(data.value || "");
        setStartHour(data.startHour || "");
        setEndHour(data.endHour || "");
        setAddress(data.address || "");
        setBitNumber(data.bitNumber || "");
      }
    });
    return () => breadsUnsub();
  }, []);

  const saveSaleDate = async () => {
    const saleDateRef = doc(db, "config", "saleDate");
    await setDoc(saleDateRef, {
      value: saleDate,
      startHour,
      endHour,
      address,
      bitNumber,
    });
    alert(t("updated"));
  };

  const handleAddBread = async (e) => {
    e.preventDefault();
    if (!breadName || breadPieces < 1 || breadPrice === "") return;
    await addDoc(collection(db, "breads"), {
      name: breadName,
      availablePieces: Number(breadPieces),
      description: breadDescription,
      price: Number(breadPrice),
      claimedBy: [],
      show: breadShow,
      isFocaccia: breadIsFocaccia,
    });
    setBreadName("");
    setBreadPieces(1);
    setBreadDescription("");
    setBreadPrice("");
    setBreadShow(true);
    setBreadIsFocaccia(false);
  };

  // Bread edit modal handlers
  const openEditModal = (bread) => {
    setModalBread(bread);
    setModalOpen(true);
  };
  const closeEditModal = () => {
    setModalOpen(false);
    setModalBread(null);
  };

  const handleModalSave = async (updatedBread) => {
    await updateDoc(doc(db, "breads", updatedBread.id), {
      name: updatedBread.name,
      availablePieces: Number(updatedBread.availablePieces),
      description: updatedBread.description,
      price: Number(updatedBread.price),
      show: !!updatedBread.show,
      isFocaccia: !!updatedBread.isFocaccia,
    });
    closeEditModal();
  };

  const handleModalDelete = async (breadToDelete) => {
    if (window.confirm(t("areYouSure"))) {
      await deleteDoc(doc(db, "breads", breadToDelete.id));
      closeEditModal();
    }
  };

  const handleToggleShow = async (breadId, currentShow) => {
    await updateDoc(doc(db, "breads", breadId), {
      show: !currentShow,
    });
  };

  // Orders editing inside BreadList (unchanged)
  const startEditingOrder = (breadId, idx, claim) => {
    setEditingOrder({ [`${breadId}_${idx}`]: { quantity: claim.quantity } });
  };

  const saveOrderEdit = async (breadId, idx, claim) => {
    const bread = breads.find((b) => b.id === breadId);
    const key = `${breadId}_${idx}`;
    const newVal = editingOrder[key];
    const newQty = Number(newVal.quantity);

    if (!newQty || newQty < 1) {
      alert(t("invalidQuantity"));
      return;
    }

    const diff = newQty - claim.quantity;
    const updated = (bread.claimedBy || []).map((c, i) =>
      i === idx ? { ...c, quantity: newQty } : c
    );

    await updateDoc(doc(db, "breads", breadId), {
      claimedBy: updated,
      availablePieces: bread.availablePieces - diff,
    });
    setEditingOrder({});
  };

  const cancelOrderEdit = () => {
    setEditingOrder({});
  };

  const handleOrderInputChange = (breadId, idx, field, value) => {
    if (field !== "quantity") return;
    const key = `${breadId}_${idx}`;
    setEditingOrder((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const deleteOrder = async (breadId, idx) => {
    const bread = breads.find((b) => b.id === breadId);
    const claimToDelete = bread.claimedBy[idx];
    const updated = (bread.claimedBy || []).filter((_, i) => i !== idx);
    await updateDoc(doc(db, "breads", breadId), {
      claimedBy: updated,
      availablePieces: bread.availablePieces + (claimToDelete.quantity || 0),
    });
  };

  const toggleSupplied = async (breadId, idx) => {
    const bread = breads.find((b) => b.id === breadId);
    const updated = (bread.claimedBy || []).map((c, i) =>
      i === idx ? { ...c, supplied: !c.supplied } : c
    );
    await updateDoc(doc(db, "breads", breadId), { claimedBy: updated });
  };

  const togglePaid = async (breadId, idx) => {
    const bread = breads.find((b) => b.id === breadId);
    const updated = (bread.claimedBy || []).map((c, i) =>
      i === idx ? { ...c, paid: !c.paid } : c
    );
    await updateDoc(doc(db, "breads", breadId), { claimedBy: updated });
  };

  const totalRevenue = breads.reduce(
    (sum, bread) =>
      sum +
      (bread.claimedBy || []).reduce(
        (s, c) => s + (c.quantity || 0) * (bread.price || 0),
        0
      ),
    0
  );

  // End Sale Logic (with popup)
  async function handleEndSale() {
    setEndSaleLoading(true);
    try {
      const breadsSnap = await getDocs(collection(db, "breads"));
      const allBreads = breadsSnap.docs.map((docRef) => ({
        id: docRef.id,
        ...docRef.data(),
      }));

      const orderHistoryDoc = {
        saleDate: serverTimestamp(),
        breads: allBreads.map((bread) => ({
          breadId: bread.id,
          breadName: bread.name,
          breadDescription: bread.description,
          breadPrice: bread.price,
          orders: (bread.claimedBy || []).map((order) => ({ ...order })),
        })),
      };
      await addDoc(collection(db, "ordersHistory"), orderHistoryDoc);

      const batch = writeBatch(db);
      breadsSnap.docs.forEach((docRef) => {
        batch.update(docRef.ref, { claimedBy: [] });
      });
      await batch.commit();

      setShowEndSaleDialog(false);
      setPopup({
        show: true,
        message: t("saleEndedSuccessfully"),
        error: false,
      });
    } catch (err) {
      setPopup({ show: true, message: t("saleEndError"), error: true });
      console.error(err);
    }
    setEndSaleLoading(false);

    // Auto close popup after 2.5s
    setTimeout(() => setPopup({ show: false, message: "", error: false }), 2500);
  }

  // RTL/LTR
  const dir = i18n.dir();
  const labelMargin = dir === "rtl" ? { marginLeft: 8 } : { marginRight: 8 };

  // --- Customer search ---
  const normalized = (s) => (s || "").toString().trim().toLowerCase();
  const search = normalized(searchTerm);

  const customerResults = useMemo(() => {
    if (!search) return [];
    const rows = [];
    breads.forEach((b) => {
      (b.claimedBy || []).forEach((c, idx) => {
        const hay = `${c.name || ""} ${c.phone || ""} ${c.userId || ""}`.toLowerCase();
        if (hay.includes(search)) {
          rows.push({
            userId: c.userId || "",
            name: c.name || "",
            phone: c.phone || "",
            breadId: b.id,
            breadName: b.name,
            idx,
            quantity: Number(c.quantity || 0),
            price: Number(b.price || 0),
            supplied: !!c.supplied,
            paid: !!c.paid,
            timestamp: c.timestamp || null,
          });
        }
      });
    });
    rows.sort((a, b) => {
      const an = a.name.toLowerCase();
      const bn = b.name.toLowerCase();
      if (an !== bn) return an.localeCompare(bn);
      return a.breadName.toLowerCase().localeCompare(b.breadName.toLowerCase());
    });
    return rows;
  }, [search, breads]);

  return (
    <div className="admin-container">
      <BreadEditModal
        open={modalOpen}
        bread={modalBread}
        t={t}
        onSave={handleModalSave}
        onDelete={handleModalDelete}
        onCancel={closeEditModal}
      />

      {/* popup */}
      {popup.show && (
        <div
          style={{
            position: "fixed",
            top: "30px",
            left: "50%",
            transform: "translateX(-50%)",
            background: popup.error ? "#dc2b2b" : "#31b931",
            color: "#fff",
            padding: "18px 40px",
            borderRadius: "16px",
            fontSize: "1.1rem",
            fontWeight: 600,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
          }}
        >
          <span style={{ flex: 1 }}>{popup.message}</span>
          <button
            onClick={() => setPopup({ show: false, message: "", error: false })}
            style={{
              background: "transparent",
              color: "#fff",
              border: "none",
              fontSize: "1.3rem",
              cursor: "pointer",
              marginLeft: 18,
              fontWeight: 700,
            }}
            aria-label="close"
          >
            ×
          </button>
        </div>
      )}

      {/* End sale dialog */}
      <EndSaleModal
        open={showEndSaleDialog}
        loading={endSaleLoading}
        onConfirm={handleEndSale}
        onCancel={() => setShowEndSaleDialog(false)}
        t={t}
      />

      <br />
      <h2>{t("Admin Dashboard")}</h2>
      <div>
        <button onClick={() => (window.location.href = "/users")}>
          {t("ManageUsers")}
        </button>
        <button onClick={() => (window.location.href = "/orders")}>
          {t("OrderSummary")}
        </button>
        <button onClick={() => navigate("/order-history")}>
          {t("OrderHistory")}
        </button>
        <button
          className="end-sale-btn"
          onClick={() => setShowEndSaleDialog(true)}
          disabled={endSaleLoading}
          style={{ background: "#c00", color: "#fff", marginLeft: 8 }}
        >
          {t("EndSale")}
        </button>
      </div>

      <div className="delivery-settings">
        <div className="delivery-fields">
          <label>
            {t("saleDate")}:{" "}
            <input
              type="date"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
              className="date-input"
            />
          </label>
          <br />
          <label>
            {t("between")}:{" "}
            <select
              value={startHour}
              onChange={(e) => setStartHour(e.target.value)}
              className="hour-select"
            >
              <option value="">{t("startHour")}</option>
              {HOUR_OPTIONS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
            -
            <select
              value={endHour}
              onChange={(e) => setEndHour(e.target.value)}
              className="hour-select"
            >
              <option value="">{t("endHour")}</option>
              {HOUR_OPTIONS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="address-field">
          <label>
            {t("address")}:{" "}
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="address-input"
              placeholder={t("pickupAddressInput")}
            />
          </label>
        </div>
        <div className="bit-field">
          <label>
            {t("phone")}:{" "}
            <input
              type="text"
              value={bitNumber}
              onChange={(e) => setBitNumber(e.target.value)}
              className="address-input"
              placeholder={t("bitNumberPlaceholder")}
            />
          </label>
        </div>
        <button
          onClick={saveSaleDate}
          disabled={!saleDate || !startHour || !endHour}
          className="save-btn"
        >
          {t("Save")}
        </button>
      </div>

      <h3 className="add-bread">{t("Add Bread")}</h3>
      <form onSubmit={handleAddBread} className="bread-form">
        <label>
          {t("Name")}:{" "}
          <input
            type="text"
            value={breadName}
            onChange={(e) => setBreadName(e.target.value)}
            required
            className="bread-input"
          />
        </label>
        <label>
          {t("Pieces")}:{" "}
          <input
            type="number"
            value={breadPieces}
            min={1}
            onChange={(e) => setBreadPieces(e.target.value)}
            required
            className="bread-input"
          />
        </label>
        <label>
          {t("description")}:{" "}
          <textarea
            value={breadDescription}
            onChange={(e) => setBreadDescription(e.target.value)}
            className="bread-input"
            rows={3}
            style={{ resize: "vertical" }}
          />
        </label>
        <label>
          {t("price")}:{" "}
          <input
            type="number"
            value={breadPrice}
            min={0}
            step="0.01"
            onChange={(e) => setBreadPrice(e.target.value)}
            required
            className="bread-input"
          />
        </label>
        <label style={{ display: "flex", alignItems: "center", ...labelMargin }}>
          <input
            type="checkbox"
            checked={breadShow}
            onChange={(e) => setBreadShow(e.target.checked)}
            style={{ accentColor: "#222", ...labelMargin }}
          />
          {t("show")}
        </label>
        <label style={{ display: "flex", alignItems: "center", ...labelMargin }}>
          <input
            type="checkbox"
            checked={breadIsFocaccia}
            onChange={(e) => setBreadIsFocaccia(e.target.checked)}
            style={{ accentColor: "#222", ...labelMargin }}
          />
          {t("foccia")}
        </label>
        <button type="submit" className="add-bread-btn">
          {t("Add Bread")}
        </button>
      </form>

      <h3 className="bread-list">{t("breadList")}</h3>

      {/* Customer search under the bread list title */}
      <div className={`customer-search ${dir === "rtl" ? "rtl" : ""}`}>
        <input
          type="text"
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t("searchCustomerPlaceholder") || "חיפוש לקוח (שם / טלפון / UID)"}
        />
        {searchTerm && (
          <button className="clear-btn" onClick={() => setSearchTerm("")}>
            {t("Clear") || "נקה"}
          </button>
        )}
      </div>

      {searchTerm && (
        <div className="customer-results">
          <h4 className="results-title">
            {t("customerOrders") || "הזמנות הלקוח"}
            {customerResults.length > 0 ? ` · ${customerResults.length}` : ""}
          </h4>

          <div className="table-responsive">
            <table className="ordered-table customer-table">
              <thead>
                <tr>
                  <th>{t("customer") || "לקוח"}</th>
                  <th>{t("phone") || "טלפון"}</th>
                  <th>{t("bread") || "לחם"}</th>
                  <th className="num-col">{t("quantity") || "כמות"}</th>
                  <th className="num-col">{t("price") || "מחיר"}</th>
                  <th className="num-col">{t("subtotal") || "סכום"}</th>
                  <th>{t("supplied") || "סופק"}</th>
                  <th>{t("paid") || "שולם"}</th>
                </tr>
              </thead>
              <tbody>
                {customerResults.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", opacity: 0.7 }}>
                      {t("noResults") || "לא נמצאו תוצאות"}
                    </td>
                  </tr>
                ) : (
                  customerResults.map((r) => (
                    <tr key={`${r.userId}_${r.breadId}_${r.idx}`}>
                      <td>{r.name || "-"}</td>
                      <td>{r.phone || "-"}</td>
                      <td>{r.breadName}</td>
                      <td className="num-col">{r.quantity}</td>
                      <td className="num-col">{r.price.toFixed(2)}</td>
                      <td className="num-col">{(r.price * r.quantity).toFixed(2)}</td>
                      <td className="check-cell">
                        <input
                          type="checkbox"
                          checked={r.supplied}
                          onChange={() => toggleSupplied(r.breadId, r.idx)}
                        />
                      </td>
                      <td className="check-cell">
                        <input
                          type="checkbox"
                          checked={r.paid}
                          onChange={() => togglePaid(r.breadId, r.idx)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <BreadList
        breads={breads}
        t={t}
        onEditBread={openEditModal}
        onToggleShow={handleToggleShow}
        editingOrder={editingOrder}
        startEditingOrder={startEditingOrder}
        saveOrderEdit={saveOrderEdit}
        cancelOrderEdit={cancelOrderEdit}
        handleOrderInputChange={handleOrderInputChange}
        deleteOrder={deleteOrder}
        toggleSupplied={toggleSupplied}
        togglePaid={togglePaid}
      />

      <div className="total-revenue">
        {t("totalRevenue")}: {totalRevenue.toFixed(2)}
      </div>
    </div>
  );
}

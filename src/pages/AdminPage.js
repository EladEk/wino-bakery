import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  setDoc
} from "firebase/firestore";
import { useTranslation } from "react-i18next";
import BreadEditModal from "../components/BreadEditModal";
import BreadList from "../components/BreadList";
import "./AdminPage.css";

const HOUR_OPTIONS = Array.from({ length: 15 }, (_, i) =>
  String(i + 7).padStart(2, '0') + ':00'
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
  const { t, i18n } = useTranslation();

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalBread, setModalBread] = useState(null);

  useEffect(() => {
    const breadsUnsub = onSnapshot(collection(db, "breads"), (snapshot) => {
      setBreads(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
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
      show: !currentShow
    });
  };

  // Orders logic (same as before)
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

    const otherClaimsTotal = (bread.claimedBy || []).reduce((sum, c, i) => {
      if (i !== idx) return sum + (c.quantity || 0);
      return sum;
    }, 0);

    const maxAllowed = bread.availablePieces + (claim.quantity || 0);
    if (newQty > maxAllowed - otherClaimsTotal) {
      alert(t("notEnoughAvailable"));
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
    await updateDoc(doc(db, "breads", breadId), {
      claimedBy: updated,
    });
  };

  const togglePaid = async (breadId, idx) => {
    const bread = breads.find((b) => b.id === breadId);
    const updated = (bread.claimedBy || []).map((c, i) =>
      i === idx ? { ...c, paid: !c.paid } : c
    );
    await updateDoc(doc(db, "breads", breadId), {
      claimedBy: updated,
    });
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

  // RTL/LTR
  const dir = i18n.dir();
  const labelMargin = dir === "rtl" ? { marginLeft: 8 } : { marginRight: 8 };

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
      <br/>
      <h2>{t("Admin Dashboard")}</h2>
      <div>
        <button onClick={() => window.location.href = "/users"}>
          {t("ManageUsers")}
        </button>
        <button onClick={() => window.location.href = "/orders"}>
          {t("OrderSummary")}
        </button>
      </div>
      <div className="delivery-settings">
        <div className="delivery-fields">
          <label>
            {t("saleDate")}:{" "}
            <input
              type="date"
              value={saleDate}
              onChange={e => setSaleDate(e.target.value)}
              className="date-input"
            />
          </label>
          <br/>
          <label>
            {t("between")}:{" "}
            <select
              value={startHour}
              onChange={e => setStartHour(e.target.value)}
              className="hour-select"
            >
              <option value="">{t("startHour")}</option>
              {HOUR_OPTIONS.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
            -
            <select
              value={endHour}
              onChange={e => setEndHour(e.target.value)}
              className="hour-select"
            >
              <option value="">{t("endHour")}</option>
              {HOUR_OPTIONS.map(h => (
                <option key={h} value={h}>{h}</option>
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
              onChange={e => setAddress(e.target.value)}
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
              onChange={e => setBitNumber(e.target.value)}
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
      <form
        onSubmit={handleAddBread}
        className="bread-form"
      >
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
            onChange={e => setBreadShow(e.target.checked)}
            style={{ accentColor: "#222", ...labelMargin }}
          />
          {t("show")}
        </label>
        <label style={{ display: "flex", alignItems: "center", ...labelMargin }}>
          <input
            type="checkbox"
            checked={breadIsFocaccia}
            onChange={e => setBreadIsFocaccia(e.target.checked)}
            style={{ accentColor: "#222", ...labelMargin }}
          />
          {t("foccia")}
        </label>
        <button type="submit" className="add-bread-btn">
          {t("Add Bread")}
        </button>
      </form>
      <h3 className="bread-list">{t("breadList")}</h3>
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

import React, { useEffect, useMemo, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { useTranslation } from "react-i18next";

import "./AdminPage.css";

import BreadEditModal from "../components/AdminPage/BreadEditModal";
import BreadList from "../components/AdminPage/BreadList";
import EndSaleModal from "../components/AdminPage/EndSaleModal";
import AdminDeliverySettings from "../components/AdminPage/AdminDeliverySettings";
import AdminAddBreadForm from "../components/AdminPage/AdminAddBreadForm";
import AdminCustomerSearch from "../components/AdminPage/AdminCustomerSearch";
import AdminNavigation from "../components/AdminPage/AdminNavigation";
import AdminAddBreadModal from "../components/AdminPage/AdminAddBreadModal";

export default function AdminPage() {
  const { t, i18n } = useTranslation();

  // Breads + editing (for BreadList + modal)
  const [breads, setBreads] = useState([]);
  const [editingOrder, setEditingOrder] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalBread, setModalBread] = useState(null);

  // Sale/delivery config
  const [saleDate, setSaleDate] = useState("");
  const [startHour, setStartHour] = useState("");
  const [endHour, setEndHour] = useState("");
  const [address, setAddress] = useState("");
  const [bitNumber, setBitNumber] = useState("");

  // End-sale modal & toast
  const [showEndSaleDialog, setShowEndSaleDialog] = useState(false);
  const [endSaleLoading, setEndSaleLoading] = useState(false);
  const [popup, setPopup] = useState({ show: false, message: "", error: false });

  // NEW: Add-bread modal
  const [showAddModal, setShowAddModal] = useState(false);

  const dir = i18n.dir();

  // Live breads + config
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "breads"), (snapshot) => {
      setBreads(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
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
  }, []);

  // Save sale/delivery config
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

  // Modal open/close
  const openEditModal = (bread) => {
    setModalBread(bread);
    setModalOpen(true);
  };
  const closeEditModal = () => {
    setModalOpen(false);
    setModalBread(null);
  };

  // Save & delete bread (from modal)
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

  // Toggle show/hide bread
  const handleToggleShow = async (breadId, currentShow) => {
    await updateDoc(doc(db, "breads", breadId), { show: !currentShow });
  };

  // Order editing inside BreadList
  const startEditingOrder = (breadId, idx, claim) => {
    setEditingOrder({ [`${breadId}_${idx}`]: { quantity: claim.quantity } });
  };
  const cancelOrderEdit = () => setEditingOrder({});
  const handleOrderInputChange = (breadId, idx, field, value) => {
    if (field !== "quantity") return;
    const key = `${breadId}_${idx}`;
    setEditingOrder((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };
  const saveOrderEdit = async (breadId, idx, claim) => {
    const bread = breads.find((b) => b.id === breadId);
    const key = `${breadId}_${idx}`;
    const newQty = Number(editingOrder[key]?.quantity);
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
  const deleteOrder = async (breadId, idx) => {
    const bread = breads.find((b) => b.id === breadId);
    const claimToDelete = bread.claimedBy[idx];
    const updated = (bread.claimedBy || []).filter((_, i) => i !== idx);
    await updateDoc(doc(db, "breads", breadId), {
      claimedBy: updated,
      availablePieces: bread.availablePieces + (claimToDelete.quantity || 0),
    });
  };

  // Mark supplied/paid (used by BreadList AND Customer search component)
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

  // End sale: archive to ordersHistory and clear claimedBy
  async function handleEndSale() {
    setEndSaleLoading(true);
    try {
      const breadsSnap = await getDocs(collection(db, "breads"));
      const allBreads = breadsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      await addDoc(collection(db, "ordersHistory"), {
        saleDate: serverTimestamp(),
        breads: allBreads.map((bread) => ({
          breadId: bread.id,
          breadName: bread.name,
          breadDescription: bread.description,
          breadPrice: bread.price,
          orders: (bread.claimedBy || []).map((o) => ({ ...o })),
        })),
      });
      const batch = writeBatch(db);
      breadsSnap.docs.forEach((d) => batch.update(d.ref, { claimedBy: [] }));
      await batch.commit();

      setShowEndSaleDialog(false);
      setPopup({ show: true, message: t("saleEndedSuccessfully"), error: false });
    } catch (err) {
      console.error(err);
      setPopup({ show: true, message: t("saleEndError"), error: true });
    }
    setEndSaleLoading(false);
    setTimeout(() => setPopup({ show: false, message: "", error: false }), 2500);
  }

  // Revenue
  const totalRevenue = useMemo(
    () =>
      breads.reduce(
        (sum, b) =>
          sum +
          (b.claimedBy || []).reduce(
            (s, c) => s + (c.quantity || 0) * (b.price || 0),
            0
          ),
        0
      ),
    [breads]
  );

  return (
    <div className="admin-container">
      {/* Toast */}
      {popup.show && (
        <div className={`admin-toast ${popup.error ? "error" : ""}`}>
          <span className="toast-message">{popup.message}</span>
          <button
            className="toast-close"
            onClick={() => setPopup({ show: false, message: "", error: false })}
          >
            ×
          </button>
        </div>
      )}

      {/* End-sale dialog */}
      <EndSaleModal
        open={showEndSaleDialog}
        loading={endSaleLoading}
        onConfirm={handleEndSale}
        onCancel={() => setShowEndSaleDialog(false)}
        t={t}
      />

      {/* Management buttons bar just under the header */}
      <AdminNavigation />

      <h2>{t("Admin Dashboard")}</h2>

      {/* Centered red End Sale button */}
      <div className="end-sale-bar">
        <button
          className="end-sale-btn"
          onClick={() => setShowEndSaleDialog(true)}
          disabled={endSaleLoading}
        >
          {t("EndSale")}
        </button>
      </div>

      {/* Delivery / pickup config */}
      <AdminDeliverySettings
        t={t}
        saleDate={saleDate}
        setSaleDate={setSaleDate}
        startHour={startHour}
        setStartHour={setStartHour}
        endHour={endHour}
        setEndHour={setEndHour}
        address={address}
        setAddress={setAddress}
        bitNumber={bitNumber}
        setBitNumber={setBitNumber}
        onSave={saveSaleDate}
      />

      {/* Open Add Bread modal button */}
      <div style={{ display: "flex", justifyContent: "center", margin: "10px 0 16px" }}>
        <button className="add-bread" onClick={() => setShowAddModal(true)}>
          {t("addBread") || "Add Bread"}
        </button>
      </div>

      {/* Add Bread Modal */}
      <AdminAddBreadModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        t={t}
      >
        <AdminAddBreadForm t={t} />
      </AdminAddBreadModal>

      {/* --- Customer Search FIRST --- */}
      <AdminCustomerSearch
        t={t}
        breads={breads}
        dir={dir}
        toggleSupplied={toggleSupplied}
        togglePaid={togglePaid}
      />

      {/* Now the bread list title BELOW the search */}
      <h3 className="bread-list">{t("breadList")}</h3>

      {/* Main breads + per-bread orders table */}
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

      {/* Edit bread modal */}
      <BreadEditModal
        open={modalOpen}
        bread={modalBread}
        t={t}
        onSave={handleModalSave}
        onDelete={handleModalDelete}
        onCancel={closeEditModal}
      />
    </div>
  );
}

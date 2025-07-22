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
import "./AdminPage.css";

const HOUR_OPTIONS = Array.from({ length: 15 }, (_, i) =>
  String(i + 7).padStart(2, '0') + ':00'
); // 07:00 to 21:00

export default function AdminPage() {
  const [breads, setBreads] = useState([]);
  const [breadName, setBreadName] = useState("");
  const [breadPieces, setBreadPieces] = useState(1);
  const [breadDescription, setBreadDescription] = useState("");
  const [breadPrice, setBreadPrice] = useState("");
  const [editingBreadId, setEditingBreadId] = useState(null);
  const [editBreadName, setEditBreadName] = useState("");
  const [editBreadPieces, setEditBreadPieces] = useState(1);
  const [editBreadDescription, setEditBreadDescription] = useState("");
  const [editBreadPrice, setEditBreadPrice] = useState("");
  const [editingOrder, setEditingOrder] = useState({});
  const [saleDate, setSaleDate] = useState("");
  const [startHour, setStartHour] = useState("");
  const [endHour, setEndHour] = useState("");
  const [address, setAddress] = useState("");
  const [bitNumber, setBitNumber] = useState("");
  const { t } = useTranslation();

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
    alert(t("saleDate") + " " + t("updated"));
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
    });
    setBreadName("");
    setBreadPieces(1);
    setBreadDescription("");
    setBreadPrice("");
  };

  const startEditingBread = (bread) => {
    setEditingBreadId(bread.id);
    setEditBreadName(bread.name);
    setEditBreadPieces(bread.availablePieces);
    setEditBreadDescription(bread.description || "");
    setEditBreadPrice(bread.price ?? "");
  };

  const cancelEditingBread = () => {
    setEditingBreadId(null);
    setEditBreadName("");
    setEditBreadPieces(1);
    setEditBreadDescription("");
    setEditBreadPrice("");
  };

  const saveEditingBread = async (breadId) => {
    await updateDoc(doc(db, "breads", breadId), {
      name: editBreadName,
      availablePieces: Number(editBreadPieces),
      description: editBreadDescription,
      price: Number(editBreadPrice),
    });
    cancelEditingBread();
  };

  const deleteBread = async (breadId) => {
    await deleteDoc(doc(db, "breads", breadId));
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

  const totalRevenue = breads.reduce(
    (sum, bread) =>
      sum +
      (bread.claimedBy || []).reduce(
        (s, c) => s + (c.quantity || 0) * (bread.price || 0),
        0
      ),
    0
  );

  return (
    <div className="admin-container">
      <h2>{t("Admin Dashboard")}</h2>
      <button onClick={() => window.location.href = "/users"}>
        {t("ManageUsers")}
      </button>

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
            {t("bitNumber")}:{" "}
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
          <input
            type="text"
            value={breadDescription}
            onChange={(e) => setBreadDescription(e.target.value)}
            className="bread-input"
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
        <button type="submit" className="add-bread-btn">
          {t("Add Bread")}
        </button>
      </form>
      <h3 className="bread-list">{t("breadList")}</h3>
      {breads.map((bread) => (
        <div key={bread.id} className="bread-section">
          <div className="table-responsive">
            <table className="cream-table">
              <thead>
                <tr>
                  <th>{t("Name")}</th>
                  <th>{t("description")}</th>
                  <th>{t("available")}</th>
                  <th>{t("price")}</th>
                  <th>{t("Actions")}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  {editingBreadId === bread.id ? (
                    <>
                      <td>
                        <input
                          type="text"
                          value={editBreadName}
                          onChange={(e) => setEditBreadName(e.target.value)}
                          className="bread-input"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editBreadDescription}
                          onChange={(e) => setEditBreadDescription(e.target.value)}
                          className="bread-input"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={editBreadPieces}
                          min={0}
                          onChange={(e) => setEditBreadPieces(e.target.value)}
                          className="bread-input"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={editBreadPrice}
                          min={0}
                          step="0.01"
                          onChange={(e) => setEditBreadPrice(e.target.value)}
                          className="bread-input"
                        />
                      </td>
                      <td>
                        <button
                          onClick={() => saveEditingBread(bread.id)}
                          className="edit-bread-btn"
                        >
                          {t("Save")}
                        </button>
                        <button onClick={cancelEditingBread} className="edit-bread-btn">
                          {t("Cancel")}
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="bread-name">{bread.name}</td>
                      <td>{bread.description}</td>
                      <td>{bread.availablePieces}</td>
                      <td>{bread.price?.toFixed(2)}</td>
                      <td>
                        <button onClick={() => startEditingBread(bread)} className="edit-bread-btn">
                          {t("Edit")}
                        </button>
                        <button onClick={() => deleteBread(bread.id)} className="edit-bread-btn">
                          {t("Delete")}
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="orders-heading">{t("ordersList")}</h3>
          <div className="table-responsive">
            <table className="cream-table">
              <thead>
                <tr>
                  <th>{t("name")}</th>
                  <th>{t("phone")}</th>
                  <th>{t("supplied")}</th>
                  <th>{t("paid")}</th>
                  <th>{t("cost")}</th>
                  <th>{t("orderedAt")}</th>
                  <th>{t("quantity")}</th>
                  <th>{t("Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {(bread.claimedBy || []).map((claim, i) => {
                  const key = `${bread.id}_${i}`;
                  const isEditing = editingOrder[key];

                  return (
                    <tr key={i}>
                      <td>
                        <span style={{ paddingLeft: 6, display: "inline-block", width: 120 }}>
                          {claim.name}
                        </span>
                      </td>
                      <td>
                        <span style={{ paddingLeft: 6, display: "inline-block", width: 120 }}>
                          {claim.phone}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={!!claim.supplied}
                          onChange={() => toggleSupplied(bread.id, i)}
                        />
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={!!claim.paid}
                          onChange={() => togglePaid(bread.id, i)}
                        />
                      </td>
                      <td>{((claim.quantity || 0) * bread.price).toFixed(2)}</td>
                      <td>
                        {claim.timestamp?.seconds
                          ? new Date(claim.timestamp.seconds * 1000).toLocaleString()
                          : ""}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            value={isEditing.quantity}
                            min={1}
                            className="bread-input"
                            onChange={e =>
                              handleOrderInputChange(bread.id, i, "quantity", e.target.value)
                            }
                          />
                        ) : (
                          claim.quantity
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveOrderEdit(bread.id, i, claim)}
                              className="edit-bread-btn"
                            >
                              {t("Save")}
                            </button>
                            <button onClick={cancelOrderEdit} className="edit-bread-btn">
                              {t("Cancel")}
                            </button>
                            <button
                              onClick={() => deleteOrder(bread.id, i)}
                              className="edit-bread-btn"
                              style={{ color: "red" }}
                            >
                              {t("Delete")}
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEditingOrder(bread.id, i, claim)} className="edit-bread-btn">
                              {t("Edit")}
                            </button>
                            <button
                              onClick={() => deleteOrder(bread.id, i)}
                              className="edit-bread-btn"
                              style={{ color: "red" }}
                            >
                              {t("Delete")}
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <div className="total-revenue">
        {t("totalRevenue")}: {totalRevenue.toFixed(2)}
      </div>
    </div>
  );
}
            

import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { useTranslation } from "react-i18next";

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [breads, setBreads] = useState([]);

  // New-bread form state
  const [breadName, setBreadName] = useState("");
  const [breadPieces, setBreadPieces] = useState(1);
  const [breadDescription, setBreadDescription] = useState("");
  const [breadPrice, setBreadPrice] = useState("");

  // Edit-bread state
  const [editingBreadId, setEditingBreadId] = useState(null);
  const [editBreadName, setEditBreadName] = useState("");
  const [editBreadPieces, setEditBreadPieces] = useState(1);
  const [editBreadDescription, setEditBreadDescription] = useState("");
  const [editBreadPrice, setEditBreadPrice] = useState("");

  // Edit-order state
  const [editingOrder, setEditingOrder] = useState({}); // { [breadId_idx]: { quantity, name } }

  const { t } = useTranslation();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const usersSnap = await getDocs(collection(db, "users"));
    setUsers(usersSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

    const breadsSnap = await getDocs(collection(db, "breads"));
    setBreads(breadsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
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
    await fetchData();
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
    await fetchData();
  };
  const deleteBread = async (breadId) => {
    await deleteDoc(doc(db, "breads", breadId));
    await fetchData();
  };

  const toggleAdmin = async (user) => {
    await updateDoc(doc(db, "users", user.id), {
      isAdmin: !user.isAdmin,
    });
    setUsers((u) =>
      u.map((x) =>
        x.id === user.id ? { ...x, isAdmin: !x.isAdmin } : x
      )
    );
  };
  const toggleBlockUser = async (user) => {
    await updateDoc(doc(db, "users", user.id), {
      isBlocked: !user.isBlocked,
    });
    setUsers((u) =>
      u.map((x) =>
        x.id === user.id ? { ...x, isBlocked: !x.isBlocked } : x
      )
    );
  };

  const toggleSupplied = async (breadId, idx) => {
    const bread = breads.find((b) => b.id === breadId);
    const updated = (bread.claimedBy || []).map((c, i) =>
      i === idx ? { ...c, supplied: !c.supplied } : c
    );
    await updateDoc(doc(db, "breads", breadId), {
      claimedBy: updated,
    });
    setBreads((bs) =>
      bs.map((b) =>
        b.id === breadId ? { ...b, claimedBy: updated } : b
      )
    );
  };

  const togglePaid = async (breadId, idx) => {
    const bread = breads.find((b) => b.id === breadId);
    const updated = (bread.claimedBy || []).map((c, i) =>
      i === idx ? { ...c, paid: !c.paid } : c
    );
    await updateDoc(doc(db, "breads", breadId), {
      claimedBy: updated,
    });
    setBreads((bs) =>
      bs.map((b) =>
        b.id === breadId ? { ...b, claimedBy: updated } : b
      )
    );
  };

  const startEditingOrder = (breadId, idx, claim) => {
    setEditingOrder({ [`${breadId}_${idx}`]: { quantity: claim.quantity, name: claim.name } });
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

    // Check available stock considering other orders
    const otherClaimsTotal = (bread.claimedBy || []).reduce((sum, c, i) => {
      if (i !== idx) return sum + (c.quantity || 0);
      return sum;
    }, 0);
    const maxAllowed = bread.availablePieces + (claim.quantity || 0);
    if (newQty > maxAllowed - otherClaimsTotal) {
      alert(t("notEnoughAvailable"));
      return;
    }

    const updated = (bread.claimedBy || []).map((c, i) =>
      i === idx
        ? { ...c, quantity: newQty, name: newVal.name }
        : c
    );
    await updateDoc(doc(db, "breads", breadId), {
      claimedBy: updated,
    });
    setEditingOrder({});
    await fetchData();
  };
  const cancelOrderEdit = () => setEditingOrder({});

  const handleOrderInputChange = (breadId, idx, field, value) => {
    const key = `${breadId}_${idx}`;
    setEditingOrder((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const deleteOrder = async (breadId, idx) => {
    const bread = breads.find((b) => b.id === breadId);
    const updated = (bread.claimedBy || []).filter((_, i) => i !== idx);
    await updateDoc(doc(db, "breads", breadId), {
      claimedBy: updated,
    });
    await fetchData();
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
    <div style={{ maxWidth: 1000, margin: "30px auto", fontFamily: "inherit" }}>
      <h2>{t("Admin Dashboard")}</h2>

      <form
        onSubmit={handleAddBread}
        style={{ margin: "32px 0", background: "#f7f7ee", padding: 24, borderRadius: 10 }}
      >
        <h3>{t("Add Bread")}</h3>
        <label>
          {t("Name")}:{" "}
          <input
            type="text"
            value={breadName}
            onChange={(e) => setBreadName(e.target.value)}
            required
            style={{ marginRight: 10 }}
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
            style={{ width: 60, marginRight: 10 }}
          />
        </label>
        <label>
          {t("description")}:{" "}
          <input
            type="text"
            value={breadDescription}
            onChange={(e) => setBreadDescription(e.target.value)}
            style={{ width: 140, marginRight: 10 }}
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
            style={{ width: 80, marginRight: 10 }}
          />
        </label>
        <button type="submit" style={{ marginLeft: 18, padding: "4px 16px" }}>
          {t("Add Bread")}
        </button>
      </form>

      <h3>{t("Users")}</h3>
      <div className="table-responsive">
        <table className="cream-table">
          <thead>
            <tr>
              <th>{t("Phone")}</th>
              <th>{t("Name")}</th>
              <th>{t("Email")}</th>
              <th>{t("Admin")}</th>
              <th>{t("Blocked")}</th>
              <th>{t("Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.phone || "-"}</td>
                <td>{u.name || "-"}</td>
                <td>{u.email || "-"}</td>
                <td>{u.isAdmin ? t("Yes") : t("No")}</td>
                <td>{u.isBlocked ? t("Yes") : t("No")}</td>
                <td>
                  <button onClick={() => toggleAdmin(u)}>
                    {u.isAdmin ? t("Remove Admin") : t("Make Admin")}
                  </button>
                  <button onClick={() => toggleBlockUser(u)} style={{ marginLeft: 6 }}>
                    {u.isBlocked ? t("Unblock") : t("Block")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
                          style={{ width: 120 }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editBreadDescription}
                          onChange={(e) => setEditBreadDescription(e.target.value)}
                          style={{ width: 120 }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={editBreadPieces}
                          min={0}
                          onChange={(e) => setEditBreadPieces(e.target.value)}
                          style={{ width: 60 }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={editBreadPrice}
                          min={0}
                          step="0.01"
                          onChange={(e) => setEditBreadPrice(e.target.value)}
                          style={{ width: 80 }}
                        />
                      </td>
                      <td>
                        <button
                          onClick={() => saveEditingBread(bread.id)}
                          style={{ marginRight: 6 }}
                        >
                          {t("Save")}
                        </button>
                        <button onClick={cancelEditingBread}>{t("Cancel")}</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{bread.name}</td>
                      <td>{bread.description}</td>
                      <td>{bread.availablePieces}</td>
                      <td>{bread.price?.toFixed(2)}</td>
                      <td>
                        <button onClick={() => startEditingBread(bread)} style={{ marginRight: 6 }}>
                          {t("Edit")}
                        </button>
                        <button onClick={() => deleteBread(bread.id)}>{t("Delete")}</button>
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
                  <th>{t("supplied")}</th>
                  <th>{t("paid") || "Paid"}</th>
                  <th>{t("cost")}</th>
                  <th>{t("price")}</th>
                  <th>{t("orderedAt")}</th>
                  <th>{t("quantity")}</th>
                  <th>{t("name")}</th>
                  <th>{t("Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {(bread.claimedBy || []).map((claim, i) => {
                  const key = `${bread.id}_${i}`;
                  const isEditing = editingOrder[key];

                  return (
                    <tr key={i}>
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
                      <td>{bread.price?.toFixed(2)}</td>
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
                            style={{ width: 55 }}
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
                          <input
                            type="text"
                            value={isEditing.name}
                            style={{ width: 100 }}
                            onChange={e =>
                              handleOrderInputChange(bread.id, i, "name", e.target.value)
                            }
                          />
                        ) : (
                          claim.name
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveOrderEdit(bread.id, i, claim)}
                              style={{ marginRight: 6 }}
                            >
                              {t("Save")}
                            </button>
                            <button onClick={cancelOrderEdit} style={{ marginRight: 6 }}>
                              {t("Cancel")}
                            </button>
                            <button
                              onClick={() => deleteOrder(bread.id, i)}
                              style={{ color: "red" }}
                            >
                              {t("Delete")}
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEditingOrder(bread.id, i, claim)} style={{ marginRight: 6 }}>
                              {t("Edit")}
                            </button>
                            <button
                              onClick={() => deleteOrder(bread.id, i)}
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

import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, updateDoc, doc, deleteDoc, getDocs } from "firebase/firestore";
import { useTranslation } from "react-i18next";
import { useKibbutz } from "../hooks/useKibbutz";
import { usersService } from "../services/users";
import { useToast } from "../contexts/ToastContext";
import "../pages/AdminPage.css"; // reuse same styles

export default function UserManagementPage() {
  const { t } = useTranslation();
  const { kibbutzim } = useKibbutz();
  const { showSuccess, showError } = useToast();
  const [users, setUsers] = useState([]);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editData, setEditData] = useState({ name: "", email: "", phone: "" });
  const [showKibbutzModal, setShowKibbutzModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), snapshot => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  // 🔄 Update breads.claimedBy when user info changes
  async function updateBreadClaimsForUser(userId, newUserFields) {
    const breadsSnapshot = await getDocs(collection(db, "breads"));
    for (const breadDoc of breadsSnapshot.docs) {
      const bread = breadDoc.data();
      const claimedBy = bread.claimedBy || [];
      let updated = false;
      const updatedClaims = claimedBy.map(claim => {
        if (claim.userId === userId) {
          updated = true;
          return {
            ...claim,
            ...newUserFields, // update name/email/phone
          };
        }
        return claim;
      });
      if (updated) {
        await updateDoc(doc(db, "breads", breadDoc.id), { claimedBy: updatedClaims });
      }
    }
  }

  // ❌ Remove all orders for this user from breads.claimedBy
  // ❌ Remove all orders for this user from breads.claimedBy and restore availablePieces
  async function removeBreadClaimsForUser(userId) {
    const breadsSnapshot = await getDocs(collection(db, "breads"));
    for (const breadDoc of breadsSnapshot.docs) {
      const bread = breadDoc.data();
      const claimedBy = bread.claimedBy || [];
      // Find all claims by this user:
      const claimsToRemove = claimedBy.filter(claim => claim.userId === userId);
      const filtered = claimedBy.filter(claim => claim.userId !== userId);

      if (claimsToRemove.length > 0) {
        // Sum the quantity to restore
        const totalQtyToAdd = claimsToRemove.reduce((sum, claim) => sum + (claim.quantity || 0), 0);
        await updateDoc(doc(db, "breads", breadDoc.id), {
          claimedBy: filtered,
          availablePieces: (bread.availablePieces || 0) + totalQtyToAdd,
        });
      }
    }
  }


  const startEditing = (user) => {
    setEditingUserId(user.id);
    setEditData({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
    });
  };

  const cancelEditing = () => {
    setEditingUserId(null);
    setEditData({ name: "", email: "", phone: "" });
  };

  const saveEdit = async (userId) => {
    await updateDoc(doc(db, "users", userId), {
      name: editData.name,
      email: editData.email,
      phone: editData.phone,
    });
    // 🔄 Update breads where claimedBy[].userId === userId
    await updateBreadClaimsForUser(userId, {
      name: editData.name,
      email: editData.email,
      phone: editData.phone,
    });
    cancelEditing();
  };

  const handleInputChange = (e) => {
    setEditData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const toggleAdmin = async (user) => {
    await updateDoc(doc(db, "users", user.id), {
      isAdmin: !user.isAdmin,
    });
  };

  const toggleBlockUser = async (user) => {
    await updateDoc(doc(db, "users", user.id), {
      isBlocked: !user.isBlocked,
    });
  };

  const deleteUser = async (userId, email) => {
    if (window.confirm(`Delete user ${email || userId}? This action is permanent. All their orders will be deleted.`)) {
      // ❌ Delete all their orders from all breads
      await removeBreadClaimsForUser(userId);
      // ❌ Delete user doc
      await deleteDoc(doc(db, "users", userId));
      // User can now re-register!
    }
  };

  const handleAssignToKibbutz = async (userId, kibbutzId, kibbutzName) => {
    try {
      await usersService.assignToKibbutz(userId, kibbutzId, kibbutzName);
      showSuccess(`${t("kibbutzAssignmentSuccess")} ${kibbutzName}`);
      setShowKibbutzModal(false);
      setSelectedUser(null);
    } catch (error) {
      showError(t("kibbutzAssignmentError"));
    }
  };

  const handleRemoveFromKibbutz = async (userId, userName) => {
    if (window.confirm(`${t("removeUserFromKibbutz")} ${userName}?`)) {
      try {
        await usersService.removeFromKibbutz(userId);
        showSuccess(t("kibbutzRemovalSuccess"));
      } catch (error) {
        showError(t("kibbutzRemovalError"));
      }
    }
  };

  const openKibbutzModal = (user) => {
    setSelectedUser(user);
    setShowKibbutzModal(true);
  };

  return (
    <div className="admin-container">
      <h2>{t("Users")}</h2>
      <div className="table-responsive">
        <table className="cream-table">
          <thead>
            <tr>
              <th>{t("Phone")}</th>
              <th>{t("Name")}</th>
              <th>{t("Email")}</th>
              <th>{t("kibbutzManagement")}</th>
              <th>{t("Admin")}</th>
              <th>{t("Blocked")}</th>
              <th>{t("Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  {editingUserId === u.id ? (
                    <input
                      type="text"
                      name="phone"
                      value={editData.phone}
                      onChange={handleInputChange}
                      className="bread-input"
                    />
                  ) : (
                    u.phone || "-"
                  )}
                </td>
                <td>
                  {editingUserId === u.id ? (
                    <input
                      type="text"
                      name="name"
                      value={editData.name}
                      onChange={handleInputChange}
                      className="bread-input"
                    />
                  ) : (
                    <span>
                      {u.name || "-"}
                      {u.kibbutzId && <span style={{ marginLeft: 5 }}>🏘️</span>}
                    </span>
                  )}
                </td>
                <td>
                  {editingUserId === u.id ? (
                    <input
                      type="text"
                      name="email"
                      value={editData.email}
                      onChange={handleInputChange}
                      className="bread-input"
                    />
                  ) : (
                    u.email || "-"
                  )}
                </td>
                <td>
                  {u.kibbutzName ? (
                    <span className="kibbutz-badge">🏘️ {u.kibbutzName}</span>
                  ) : (
                    <span className="no-kibbutz">{t("notAssignedToKibbutz")}</span>
                  )}
                </td>
                <td>{u.isAdmin ? t("Yes") : t("No")}</td>
                <td>{u.isBlocked ? t("Yes") : t("No")}</td>
                <td>
                  {editingUserId === u.id ? (
                    <>
                      <button onClick={() => saveEdit(u.id)}>{t("Save")}</button>
                      <button onClick={cancelEditing} style={{ marginLeft: 6 }}>{t("Cancel")}</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => toggleAdmin(u)}>
                        {u.isAdmin ? t("Remove Admin") : t("Make Admin")}
                      </button>
                      <button onClick={() => toggleBlockUser(u)} style={{ marginLeft: 6 }}>
                        {u.isBlocked ? t("Unblock") : t("Block")}
                      </button>
                      {u.kibbutzId ? (
                        <button 
                          onClick={() => handleRemoveFromKibbutz(u.id, u.name)}
                          style={{ marginLeft: 6, backgroundColor: "#ff6b6b" }}
                        >
                          {t("removeFromKibbutz")}
                        </button>
                      ) : (
                        <button 
                          onClick={() => openKibbutzModal(u)}
                          style={{ marginLeft: 6, backgroundColor: "#4ecdc4" }}
                        >
                          {t("assignToKibbutz")}
                        </button>
                      )}
                      <button onClick={() => startEditing(u)} style={{ marginLeft: 6 }}>
                        {t("Edit")}
                      </button>
                      <button
                        onClick={() => deleteUser(u.id, u.email)}
                        style={{ color: "red", marginLeft: 6 }}
                      >
                        {t("Delete")}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Kibbutz Selection Modal */}
      {showKibbutzModal && selectedUser && (
        <div className="modal-overlay" onClick={() => {setShowKibbutzModal(false); setSelectedUser(null);}}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t("assignUserToKibbutz")}</h3>
              <button className="close-btn" onClick={() => {setShowKibbutzModal(false); setSelectedUser(null);}}>×</button>
            </div>
            <div className="modal-body">
              <p>{t("User")}: <strong>{selectedUser.name || selectedUser.email}</strong></p>
              <div className="kibbutz-list">
                {kibbutzim.filter(k => k.isActive).map(kibbutz => (
                  <div key={kibbutz.id} className="kibbutz-option">
                    <div className="kibbutz-info">
                      <div className="kibbutz-name">🏘️ {kibbutz.name}</div>
                      <div className="kibbutz-discount">{t("discountPercentage")}: {kibbutz.discountPercentage}%</div>
                    </div>
                    <button 
                      className="assign-btn"
                      onClick={() => handleAssignToKibbutz(selectedUser.id, kibbutz.id, kibbutz.name)}
                    >
                      {t("assignToKibbutz")}
                    </button>
                  </div>
                ))}
              </div>
              {kibbutzim.filter(k => k.isActive).length === 0 && (
                <p>{t("noActiveKibbutzim")}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

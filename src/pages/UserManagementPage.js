import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, updateDoc, doc, deleteDoc, getDocs } from "firebase/firestore";
import { useTranslation } from "react-i18next";
import { useKibbutz } from "../hooks/useKibbutz";
import { useWorkshops } from "../hooks/useWorkshops";
import { usersService } from "../services/users";
import { useToast } from "../contexts/ToastContext";
import "../pages/AdminPage.css";

export default function UserManagementPage() {
  const { t } = useTranslation();
  const { kibbutzim } = useKibbutz();
  const { activeWorkshops, registerUser } = useWorkshops();
  
  const { showSuccess, showError } = useToast();
  const [users, setUsers] = useState([]);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editData, setEditData] = useState({ name: "", email: "", phone: "" });
  const [showKibbutzModal, setShowKibbutzModal] = useState(false);
  const [showWorkshopModal, setShowWorkshopModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), async snapshot => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      for (const user of usersData) {
        if (user.kibbutzId && !user.kibbutzName && kibbutzim) {
          const kibbutz = kibbutzim.find(k => k.id === user.kibbutzId);
          if (kibbutz) {
            try {
              await usersService.updateProfile(user.id, {
                name: user.name,
                phone: user.phone,
                kibbutzId: user.kibbutzId,
                kibbutzName: kibbutz.name
              });
            } catch (error) {
              console.error('Error updating user kibbutz name:', error);
            }
          }
        }
      }
      
      
      setUsers(usersData);
    });
    return () => unsub();
  }, [kibbutzim]);

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
            ...newUserFields,
          };
        }
        return claim;
      });
      if (updated) {
        await updateDoc(doc(db, "breads", breadDoc.id), { claimedBy: updatedClaims });
      }
    }
  }

  async function removeBreadClaimsForUser(userId) {
    const breadsSnapshot = await getDocs(collection(db, "breads"));
    for (const breadDoc of breadsSnapshot.docs) {
      const bread = breadDoc.data();
      const claimedBy = bread.claimedBy || [];
      const claimsToRemove = claimedBy.filter(claim => claim.userId === userId);
      const filtered = claimedBy.filter(claim => claim.userId !== userId);

      if (claimsToRemove.length > 0) {
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
      await removeBreadClaimsForUser(userId);
      await deleteDoc(doc(db, "users", userId));
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

  const openWorkshopModal = (user) => {
    setSelectedUser(user);
    setShowWorkshopModal(true);
  };

  const handleRegisterToWorkshop = async (workshopId) => {
    if (!selectedUser) return;
    
    try {
      await registerUser(workshopId, {
        name: selectedUser.name,
        email: selectedUser.email,
        phone: selectedUser.phone
      });
      showSuccess(t('userRegisteredToWorkshop'));
      setShowWorkshopModal(false);
      setSelectedUser(null);
    } catch (error) {
      showError(t('workshopRegistrationError'));
    }
  };

  const getAvailableWorkshops = () => {
    const now = new Date();
    return activeWorkshops.filter(workshop => {
      const workshopDate = new Date(workshop.date);
      const isFuture = workshopDate > now;
      const hasSpots = workshop.registeredUsers.length < workshop.maxParticipants;
      const isNotRegistered = !workshop.registeredUsers.some(user => user.userId === selectedUser?.id);
      return isFuture && hasSpots && isNotRegistered;
    });
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

  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (user.name && user.name.toLowerCase().includes(term)) ||
      (user.email && user.email.toLowerCase().includes(term)) ||
      (user.phone && user.phone.toString().includes(term)) ||
      (user.id && user.id.toLowerCase().includes(term))
    );
  });

  return (
    <div className="admin-container">
      <h2>{t("Users")}</h2>
      
      <div style={{ marginBottom: "20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
        <input
          type="text"
          placeholder={t("searchUsers")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: "10px 15px",
            borderRadius: "6px",
            border: "1px solid #ddd",
            fontSize: "1rem",
            minWidth: "300px",
            direction: "rtl",
            textAlign: "center"
          }}
        />
        <div style={{ 
          color: "#666", 
          fontSize: "0.9rem",
          backgroundColor: "white",
          padding: "8px 16px",
          borderRadius: "6px",
          border: "1px solid #ddd",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
          {searchTerm ? (
            `${filteredUsers.length} ${t("ofUsers")} ${users.length} ${t("usersCount")}`
          ) : (
            `${users.length} ${t("usersCount")}`
          )}
        </div>
      </div>

      {filteredUsers.length === 0 && searchTerm ? (
        <div style={{ 
          textAlign: "center", 
          padding: "40px", 
          color: "#666", 
          fontSize: "1.1rem",
          backgroundColor: "#f9f9f9",
          borderRadius: "8px",
          border: "2px dashed #ddd"
        }}>
{t("noUsersFound")} "{searchTerm}"
        </div>
      ) : (
        <div className="users-container">
          {filteredUsers.map((u) => (
            <div key={u.id} className="user-card">
              <div className="user-header">
                <div className="user-name">
                  {editingUserId === u.id ? (
                    <input
                      type="text"
                      name="name"
                      value={editData.name}
                      onChange={handleInputChange}
                      className="user-input"
                      placeholder={t("Name")}
                    />
                  ) : (
                    <span>
                      {u.name || "-"}
                      {u.kibbutzId && <span className="kibbutz-icon">🏘️</span>}
                    </span>
                  )}
                </div>
                <div className="user-status">
                  {u.isAdmin && <span className="admin-badge">{t("Admin")}</span>}
                  {u.isBlocked && <span className="blocked-badge">{t("Blocked")}</span>}
                </div>
              </div>
              
              <div className="user-details">
                <div className="user-detail-row">
                  <span className="detail-label">{t("Phone")}:</span>
                  {editingUserId === u.id ? (
                    <input
                      type="text"
                      name="phone"
                      value={editData.phone}
                      onChange={handleInputChange}
                      className="user-input"
                      placeholder={t("Phone")}
                    />
                  ) : (
                    <span className="detail-value">{u.phone || "-"}</span>
                  )}
                </div>
                
                <div className="user-detail-row">
                  <span className="detail-label">{t("Email")}:</span>
                  {editingUserId === u.id ? (
                    <input
                      type="text"
                      name="email"
                      value={editData.email}
                      onChange={handleInputChange}
                      className="user-input"
                      placeholder={t("Email")}
                    />
                  ) : (
                    <span className="detail-value">{u.email || "-"}</span>
                  )}
                </div>
                
                <div className="user-detail-row">
                  <span className="detail-label">{t("kibbutz")}:</span>
                  <span className="detail-value">
                    {u.kibbutzId ? (
                      <span className="kibbutz-badge">🏘️ {u.kibbutzName || t("unknownKibbutz")}</span>
                    ) : (
                      <span className="no-kibbutz">{t("notAssignedToKibbutz")}</span>
                    )}
                  </span>
                </div>
              </div>
              
              <div className="user-actions">
                {editingUserId === u.id ? (
                  <div className="edit-actions">
                    <button onClick={() => saveEdit(u.id)} className="save-btn">{t("Save")}</button>
                    <button onClick={cancelEditing} className="cancel-btn">{t("Cancel")}</button>
                  </div>
                ) : (
                  <div className="action-buttons">
                    <button onClick={() => toggleAdmin(u)} className="admin-btn">
                      {u.isAdmin ? t("Remove Admin") : t("Make Admin")}
                    </button>
                    <button onClick={() => toggleBlockUser(u)} className="block-btn">
                      {u.isBlocked ? t("Unblock") : t("Block")}
                    </button>
                    {u.kibbutzId ? (
                      <button 
                        onClick={() => handleRemoveFromKibbutz(u.id, u.name)}
                        className="remove-kibbutz-btn"
                      >
                        {t("removeFromKibbutz")}
                      </button>
                    ) : (
                      <button 
                        onClick={() => openKibbutzModal(u)}
                        className="assign-kibbutz-btn"
                      >
                        {t("assignToKibbutz")}
                      </button>
                    )}
                    <button 
                      onClick={() => openWorkshopModal(u)}
                      className="workshop-btn"
                    >
                      {t("addToWorkshop")}
                    </button>
                    <button onClick={() => startEditing(u)} className="edit-btn">
                      {t("Edit")}
                    </button>
                    <button
                      onClick={() => deleteUser(u.id, u.email)}
                      className="delete-btn"
                    >
                      {t("Delete")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

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

      {showWorkshopModal && selectedUser && (
        <div className="modal-overlay" onClick={() => {setShowWorkshopModal(false); setSelectedUser(null);}}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('addUserToWorkshop')}</h3>
              <button className="close-btn" onClick={() => {setShowWorkshopModal(false); setSelectedUser(null);}}>×</button>
            </div>
            <div className="modal-body">
              <p>{t('User')}: <strong>{selectedUser.name || selectedUser.email}</strong></p>
              <div className="workshop-list">
                {getAvailableWorkshops().length === 0 ? (
                  <p className="no-workshops">{t('noAvailableWorkshops')}</p>
                ) : (
                  getAvailableWorkshops().map(workshop => (
                    <div key={workshop.id} className="workshop-option">
                      <div className="workshop-info">
                        <div className="workshop-name">🎯 {workshop.name}</div>
                        <div className="workshop-date">{t('workshopDate')}: {formatDate(workshop.date)}</div>
                        <div className="workshop-price">{t('workshopPrice')}: ₪{workshop.price}</div>
                        <div className="workshop-spots">
                          {t('availableSpots')}: {workshop.maxParticipants - workshop.registeredUsers.length}/{workshop.maxParticipants}
                        </div>
                        {workshop.location && (
                          <div className="workshop-location">{t('workshopLocation')}: {workshop.location}</div>
                        )}
                      </div>
                      <button 
                        className="register-btn"
                        onClick={() => handleRegisterToWorkshop(workshop.id)}
                      >
                        {t('registerToWorkshop')}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

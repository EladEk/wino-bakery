import React, { useState } from 'react';
import { useKibbutz } from '../../hooks/useKibbutz';
import { useToast } from '../../contexts/ToastContext';
import { useDirection } from '../../contexts/DirectionContext';
import './AdminKibbutzManagement.css';

export default function AdminKibbutzManagement({ t }) {
  const { kibbutzim, loading, createKibbutz, updateKibbutz, deleteKibbutz, toggleKibbutzActive, getKibbutzOrders, getKibbutzUsers, removeUserFromKibbutz } = useKibbutz();
  const { showSuccess, showError } = useToast();
  const { isRTL } = useDirection();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [selectedKibbutz, setSelectedKibbutz] = useState(null);
  const [kibbutzOrders, setKibbutzOrders] = useState([]);
  const [kibbutzUsers, setKibbutzUsers] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discountPercentage: 0,
    isActive: true
  });

  const handleAddKibbutz = async (e) => {
    e.preventDefault();
    try {
      await createKibbutz(formData);
      showSuccess('קיבוץ נוסף בהצלחה!');
      setShowAddModal(false);
      setFormData({ name: '', description: '', discountPercentage: 0, isActive: true });
    } catch (error) {
      showError('שגיאה בהוספת הקיבוץ');
    }
  };

  const handleEditKibbutz = async (e) => {
    e.preventDefault();
    try {
      await updateKibbutz(selectedKibbutz.id, formData);
      showSuccess('קיבוץ עודכן בהצלחה!');
      setShowEditModal(false);
      setSelectedKibbutz(null);
      setFormData({ name: '', description: '', discountPercentage: 0, isActive: true });
    } catch (error) {
      showError('שגיאה בעדכון הקיבוץ');
    }
  };

  const handleDeleteKibbutz = async (kibbutz) => {
    if (window.confirm(`האם אתה בטוח שברצונך למחוק את הקיבוץ "${kibbutz.name}"?`)) {
      try {
        await deleteKibbutz(kibbutz.id);
        showSuccess('קיבוץ נמחק בהצלחה!');
      } catch (error) {
        showError('שגיאה במחיקת הקיבוץ');
      }
    }
  };

  const handleToggleActive = async (kibbutz) => {
    try {
      await toggleKibbutzActive(kibbutz.id, kibbutz.isActive);
      showSuccess(`קיבוץ ${kibbutz.isActive ? 'הושבת' : 'הופעל'} בהצלחה!`);
    } catch (error) {
      showError('שגיאה בשינוי סטטוס הקיבוץ');
    }
  };

  const handleViewOrders = async (kibbutz) => {
    setSelectedKibbutz(kibbutz);
    setOrdersLoading(true);
    try {
      const orders = await getKibbutzOrders(kibbutz.id);
      setKibbutzOrders(orders);
      setShowOrdersModal(true);
    } catch (error) {
      showError('שגיאה בטעינת הזמנות הקיבוץ');
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleViewUsers = async (kibbutz) => {
    setSelectedKibbutz(kibbutz);
    setUsersLoading(true);
    try {
      const users = await getKibbutzUsers(kibbutz.id);
      setKibbutzUsers(users);
      setShowUsersModal(true);
    } catch (error) {
      showError('שגיאה בטעינת משתמשי הקיבוץ');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleRemoveUserFromKibbutz = async (userId, userName) => {
    if (window.confirm(`${t("removeUserFromKibbutz")} ${userName}?`)) {
      try {
        await removeUserFromKibbutz(userId);
        showSuccess(t("kibbutzRemovalSuccess"));
        // Refresh users list
        const users = await getKibbutzUsers(selectedKibbutz.id);
        setKibbutzUsers(users);
      } catch (error) {
        showError(t("kibbutzRemovalError"));
      }
    }
  };

  const openEditModal = (kibbutz) => {
    setSelectedKibbutz(kibbutz);
    setFormData({
      name: kibbutz.name,
      description: kibbutz.description || '',
      discountPercentage: kibbutz.discountPercentage || 0,
      isActive: kibbutz.isActive
    });
    setShowEditModal(true);
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowOrdersModal(false);
    setShowUsersModal(false);
    setSelectedKibbutz(null);
    setFormData({ name: '', description: '', discountPercentage: 0, isActive: true });
  };

  if (loading) {
    return <div className="loading">טוען קיבוצים...</div>;
  }

  return (
    <div className={`admin-kibbutz-management ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="kibbutz-header">
        <h2>ניהול קיבוצים</h2>
        <button 
          className="add-kibbutz-btn"
          onClick={() => setShowAddModal(true)}
        >
          + הוסף קיבוץ חדש
        </button>
      </div>

      <div className="kibbutz-stats">
        <div className="stat-card">
          <div className="stat-number">{kibbutzim.length}</div>
          <div className="stat-label">סה"כ קיבוצים</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{kibbutzim.filter(k => k.isActive).length}</div>
          <div className="stat-label">קיבוצים פעילים</div>
        </div>
      </div>

      <div className="kibbutz-list">
        {kibbutzim.length === 0 ? (
          <div className="no-kibbutzim">
            אין קיבוצים רשומים במערכת
          </div>
        ) : (
          kibbutzim.map(kibbutz => (
            <div key={kibbutz.id} className={`kibbutz-card ${!kibbutz.isActive ? 'inactive' : ''}`}>
              <div className="kibbutz-info">
                <div className="kibbutz-name">
                  🏘️ {kibbutz.name}
                  {!kibbutz.isActive && <span className="inactive-badge">לא פעיל</span>}
                </div>
                {kibbutz.description && (
                  <div className="kibbutz-description">{kibbutz.description}</div>
                )}
                <div className="kibbutz-discount">
                  הנחה: {kibbutz.discountPercentage}%
                </div>
              </div>
              
              <div className="kibbutz-actions">
                <button 
                  className="view-orders-btn"
                  onClick={() => handleViewOrders(kibbutz)}
                >
                  צפה בהזמנות
                </button>
        <button 
          className="view-users-btn"
          onClick={() => handleViewUsers(kibbutz)}
        >
          {t("viewKibbutzUsers")}
        </button>
                <button 
                  className="edit-btn"
                  onClick={() => openEditModal(kibbutz)}
                >
                  ערוך
                </button>
                <button 
                  className={`toggle-btn ${kibbutz.isActive ? 'deactivate' : 'activate'}`}
                  onClick={() => handleToggleActive(kibbutz)}
                >
                  {kibbutz.isActive ? 'השבת' : 'הפעל'}
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => handleDeleteKibbutz(kibbutz)}
                >
                  מחק
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Kibbutz Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>הוסף קיבוץ חדש</h3>
              <button className="close-btn" onClick={closeModals}>×</button>
            </div>
            <form onSubmit={handleAddKibbutz} className="kibbutz-form">
              <div className="form-group">
                <label>שם הקיבוץ:</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>תיאור:</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>אחוז הנחה:</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discountPercentage}
                  onChange={(e) => setFormData({...formData, discountPercentage: Number(e.target.value)})}
                />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  />
                  קיבוץ פעיל
                </label>
              </div>
              <div className="form-actions">
                <button type="button" onClick={closeModals}>ביטול</button>
                <button type="submit">הוסף קיבוץ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Kibbutz Modal */}
      {showEditModal && selectedKibbutz && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>ערוך קיבוץ</h3>
              <button className="close-btn" onClick={closeModals}>×</button>
            </div>
            <form onSubmit={handleEditKibbutz} className="kibbutz-form">
              <div className="form-group">
                <label>שם הקיבוץ:</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>תיאור:</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>אחוז הנחה:</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discountPercentage}
                  onChange={(e) => setFormData({...formData, discountPercentage: Number(e.target.value)})}
                />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  />
                  קיבוץ פעיל
                </label>
              </div>
              <div className="form-actions">
                <button type="button" onClick={closeModals}>ביטול</button>
                <button type="submit">עדכן קיבוץ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Orders Modal */}
      {showOrdersModal && selectedKibbutz && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content orders-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>הזמנות קיבוץ {selectedKibbutz.name}</h3>
              <button className="close-btn" onClick={closeModals}>×</button>
            </div>
            <div className="orders-content">
              {ordersLoading ? (
                <div className="loading">טוען הזמנות...</div>
              ) : kibbutzOrders.length === 0 ? (
                <div className="no-orders">אין הזמנות לקיבוץ זה</div>
              ) : (
                <div className="orders-list">
                  {kibbutzOrders.map((order, index) => (
                    <div key={index} className="order-item">
                      <div className="order-info">
                        <div className="order-customer">
                          <strong>{order.order.name}</strong>
                          <span className="customer-phone">📞 {order.order.phone}</span>
                        </div>
                        <div className="order-bread">🍞 {order.breadName}</div>
                        <div className="order-quantity">כמות: {order.order.quantity}</div>
                        <div className="order-price">
                          מחיר: ₪{order.breadPrice.toFixed(2)}
                          {order.order.discountPercentage > 0 && (
                            <span className="discount">
                              (הנחה: {order.order.discountPercentage}%)
                            </span>
                          )}
                        </div>
                        <div className="order-status">
                          <span className={`status-badge ${order.order.supplied ? 'supplied' : 'pending'}`}>
                            {order.order.supplied ? `✅ ${t("supplied")}` : `⏳ ${t("pending")}`}
                          </span>
                          <span className={`status-badge ${order.order.paid ? 'paid' : 'unpaid'}`}>
                            {order.order.paid ? `💰 ${t("paid")}` : `💳 ${t("unpaid")}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Users Modal */}
      {showUsersModal && selectedKibbutz && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content users-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t("kibbutzUsers")} {selectedKibbutz.name}</h3>
              <button className="close-btn" onClick={closeModals}>×</button>
            </div>
            <div className="users-content">
              {usersLoading ? (
                <div className="loading">{t("Loading")}...</div>
              ) : kibbutzUsers.length === 0 ? (
                <div className="no-users">{t("noKibbutzUsers")}</div>
              ) : (
                <div className="users-list">
                  {kibbutzUsers.map((user) => (
                    <div key={user.id} className="user-item">
                      <div className="user-info">
                        <div className="user-name">{user.name || t("noName")}</div>
                        <div className="user-email">{user.email}</div>
                        <div className="user-phone">{user.phone || t("noPhone")}</div>
                      </div>
                      <div className="user-actions">
                        <button 
                          className="remove-user-btn"
                          onClick={() => handleRemoveUserFromKibbutz(user.id, user.name || user.email)}
                        >
                          {t("removeFromKibbutz")}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

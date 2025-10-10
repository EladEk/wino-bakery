import React, { useState, useEffect } from 'react';
import { useKibbutz } from '../../hooks/useKibbutz';
import { useToast } from '../../contexts/ToastContext';
import { useDirection } from '../../contexts/DirectionContext';
import { breadsService } from '../../services';
import './AdminKibbutzManagement.css';

export default function AdminKibbutzManagement({ t }) {
  const { kibbutzim, loading, createKibbutz, updateKibbutz, deleteKibbutz, toggleKibbutzActive, getKibbutzOrders, getKibbutzUsers, removeUserFromKibbutz } = useKibbutz();
  const { showSuccess, showError } = useToast();
  const { isRTL } = useDirection();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [selectedKibbutz, setSelectedKibbutz] = useState(null);
  const [kibbutzUsers, setKibbutzUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [kibbutzOrdersData, setKibbutzOrdersData] = useState({});

  useEffect(() => {
    const loadAllKibbutzOrders = async () => {
      if (kibbutzim && kibbutzim.length > 0) {
        for (const kibbutz of kibbutzim) {
          try {
            const orders = await getKibbutzOrders(kibbutz.id);
            setKibbutzOrdersData(prev => ({
              ...prev,
              [kibbutz.id]: orders
            }));
          } catch (error) {
            console.error('Error loading kibbutz orders:', error);
          }
        }
      }
    };
    
    loadAllKibbutzOrders();
  }, [kibbutzim, getKibbutzOrders]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discountPercentage: 0,
    surchargeType: 'none',
    surchargeValue: 0,
    isActive: true,
    isClub: false,
    password: ''
  });

  const handleAddKibbutz = async (e) => {
    e.preventDefault();
    try {
      await createKibbutz(formData);
      showSuccess(t('kibbutzAddedSuccessfully'));
      setShowAddModal(false);
      setFormData({ name: '', description: '', discountPercentage: 0, surchargeType: 'none', surchargeValue: 0, isActive: true, isClub: false, password: '' });
    } catch (error) {
      showError(t('errorAddingKibbutz'));
    }
  };

  const handleEditKibbutz = async (e) => {
    e.preventDefault();
    try {
      await updateKibbutz(selectedKibbutz.id, formData);
      showSuccess(t('kibbutzUpdatedSuccessfully'));
      setShowEditModal(false);
      setSelectedKibbutz(null);
      setFormData({ name: '', description: '', discountPercentage: 0, surchargeType: 'none', surchargeValue: 0, isActive: true, isClub: false, password: '' });
    } catch (error) {
      showError(t('errorUpdatingKibbutz'));
    }
  };

  const handleDeleteKibbutz = async (kibbutz) => {
    if (window.confirm(t('confirmDeleteKibbutz', { name: kibbutz.name }))) {
      try {
        await deleteKibbutz(kibbutz.id);
        showSuccess(t('kibbutzDeletedSuccessfully'));
      } catch (error) {
        showError(t('errorDeletingKibbutz'));
      }
    }
  };

  const handleToggleActive = async (kibbutz) => {
    try {
      await toggleKibbutzActive(kibbutz.id, kibbutz.isActive);
      showSuccess(t('kibbutzStatusChanged', { status: kibbutz.isActive ? t('deactivate') : t('activate') }));
    } catch (error) {
      showError(t('errorChangingKibbutzStatus'));
    }
  };


  const handleUpdateOrderStatus = async (orderData, field, value) => {
    try {
      await breadsService.updateOrderStatus(orderData.breadId, orderData.order.userId, field, value);
      
      setKibbutzOrdersData(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(kibbutzId => {
          if (updated[kibbutzId]) {
            updated[kibbutzId] = updated[kibbutzId].map(order => {
              if (order.breadId === orderData.breadId && order.order.userId === orderData.order.userId) {
                return {
                  ...order,
                  order: {
                    ...order.order,
                    [field]: value
                  }
                };
              }
              return order;
            });
          }
        });
        return updated;
      });
      
      showSuccess(field === 'paid' ? t('paymentStatusUpdated') : t('supplyStatusUpdated'));
    } catch (error) {
      console.error('Error updating order status:', error);
      showError(`${t('errorUpdatingOrderStatus')}: ${error.message}`);
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
      showError(t('errorLoadingKibbutzUsers'));
    } finally {
      setUsersLoading(false);
    }
  };

  const handleRemoveUserFromKibbutz = async (userId, userName) => {
    if (window.confirm(`${t("removeUserFromKibbutz")} ${userName}?`)) {
      try {
        await removeUserFromKibbutz(userId);
        showSuccess(t("kibbutzRemovalSuccess"));
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
      surchargeType: kibbutz.surchargeType || 'none',
      surchargeValue: kibbutz.surchargeValue || 0,
      isActive: kibbutz.isActive,
      isClub: kibbutz.isClub || false,
      password: kibbutz.password || ''
    });
    setShowEditModal(true);
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowUsersModal(false);
    setSelectedKibbutz(null);
    setFormData({ name: '', description: '', discountPercentage: 0, isActive: true, isClub: false });
  };

  if (loading) {
    return <div className="loading">{t("loadingKibbutzim")}</div>;
  }

  return (
    <div className={`admin-kibbutz-management ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="kibbutz-header">
        <h2>{t("kibbutzManagement")}</h2>
        <button 
          className="add-kibbutz-btn"
          onClick={() => setShowAddModal(true)}
        >
          + {t("addNewKibbutz")}
        </button>
      </div>

      <div className="kibbutz-stats">
        <div className="stat-card">
          <div className="stat-number">{kibbutzim.length}</div>
          <div className="stat-label">{t("totalKibbutzim")}</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{kibbutzim.filter(k => k.isActive).length}</div>
          <div className="stat-label">{t("activeKibbutzim")}</div>
        </div>
      </div>

      <div className="kibbutz-list">
        {kibbutzim.length === 0 ? (
          <div className="no-kibbutzim">
            {t("noKibbutzimInSystem")}
          </div>
        ) : (
          kibbutzim.map(kibbutz => (
            <div key={kibbutz.id} className={`kibbutz-card ${!kibbutz.isActive ? 'inactive' : ''}`}>
              <div className="kibbutz-main-content">
                <div className="kibbutz-info">
                  <div className="kibbutz-name">
                    🏘️ {kibbutz.name}
                    {!kibbutz.isActive && <span className="inactive-badge">{t("inactive")}</span>}
                  </div>
                  {kibbutz.description && (
                    <div className="kibbutz-description">{kibbutz.description}</div>
                  )}
                  <div className="kibbutz-discount">
                    {t("discountPercentage")}: {kibbutz.discountPercentage}%
                  </div>
                  {kibbutz.surchargeType && kibbutz.surchargeType !== 'none' && (
                    <div className="kibbutz-surcharge">
                      {t("surcharge")}: {kibbutz.surchargeValue}
                      {kibbutz.surchargeType === 'percentage' ? '%' : '₪'}
                      {kibbutz.surchargeType === 'fixedPerBread' && ` (${t("perBread")})`}
                      {kibbutz.surchargeType === 'fixedPerOrder' && ` (${t("perOrder")})`}
                    </div>
                  )}
                  {kibbutz.password && (
                    <div className="kibbutz-password">
                      🔒 {t("passwordProtected")}
                    </div>
                  )}
                </div>
                
                <div className="kibbutz-actions">
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
                    {t("Edit")}
                  </button>
                  <button 
                    className={`toggle-btn ${kibbutz.isActive ? 'deactivate' : 'activate'}`}
                    onClick={() => handleToggleActive(kibbutz)}
                  >
                    {kibbutz.isActive ? t('deactivate') : t('activate')}
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDeleteKibbutz(kibbutz)}
                  >
                    {t("Delete")}
                  </button>
                </div>
              </div>
              
              <div className="kibbutz-orders-section">
                <h4>{t("kibbutzOrders")}:</h4>
                {kibbutzOrdersData[kibbutz.id] ? (
                  kibbutzOrdersData[kibbutz.id].length > 0 ? (
                    <div className="orders-list">
                      {kibbutzOrdersData[kibbutz.id].map((orderData, index) => (
                          <div key={index} className="order-item">
                            <div className="order-info">
                              <div className="order-customer">
                                <strong>{orderData.order.name}</strong>
                                <span className="customer-phone">📞 {orderData.order.phone}</span>
                              </div>
                              <div className="order-bread">
                                <strong>{orderData.breadName}</strong>
                                <span className="order-quantity">{t("quantity")}: {orderData.order.quantity}</span>
                                <span className="order-price">
                                  {orderData.order.discountPercentage > 0 ? (
                                    <span>
                                      <span style={{ textDecoration: 'line-through', color: '#999', marginRight: '8px' }}>
                                        ₪{orderData.originalPrice.toFixed(2)}
                                      </span>
                                      <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>
                                        ₪{orderData.breadPrice.toFixed(2)}
                                      </span>
                                    </span>
                                  ) : (
                                    `₪${orderData.breadPrice.toFixed(2)}`
                                  )}
                                </span>
                                {orderData.order.discountPercentage > 0 && (
                                  <span className="discount">{t("discount")}: {orderData.order.discountPercentage}%</span>
                                )}
                              </div>
                              <div className="order-status">
                                <div className="status-controls">
                                  <label className="status-checkbox">
                                    <input
                                      type="checkbox"
                                      checked={orderData.order.supplied || false}
                                      onChange={(e) => handleUpdateOrderStatus(orderData, 'supplied', e.target.checked)}
                                    />
                                    <span className={`status-badge ${orderData.order.supplied ? 'supplied' : 'pending'}`}>
                                      {orderData.order.supplied ? t('supplied') : t('pending')}
                                    </span>
                                  </label>
                                  <label className="status-checkbox">
                                    <input
                                      type="checkbox"
                                      checked={orderData.order.paid || false}
                                      onChange={(e) => handleUpdateOrderStatus(orderData, 'paid', e.target.checked)}
                                    />
                                    <span className={`status-badge ${orderData.order.paid ? 'paid' : 'unpaid'}`}>
                                      {orderData.order.paid ? t('paid') : t('unpaid')}
                                    </span>
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-orders">{t("noOrdersForKibbutz")}</p>
                  )
                ) : (
                  <p className="loading-orders">{t("loadingOrders")}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t("addNewKibbutz")}</h3>
              <button className="close-btn" onClick={closeModals}>×</button>
            </div>
            <form onSubmit={handleAddKibbutz} className="kibbutz-form">
              <div className="form-group">
                <label>{t("kibbutzName")}:</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t("description")}:</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>{t("discountPercentage")}:</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discountPercentage}
                  onChange={(e) => setFormData({...formData, discountPercentage: Number(e.target.value)})}
                />
              </div>
              <div className="form-group">
                <label>{t("surchargeType")}:</label>
                <select
                  value={formData.surchargeType}
                  onChange={(e) => setFormData({...formData, surchargeType: e.target.value})}
                >
                  <option value="none">{t("none")}</option>
                  <option value="percentage">{t("percentage")}</option>
                  <option value="fixedPerBread">{t("fixedAmount")} - {t("perBread")}</option>
                  <option value="fixedPerOrder">{t("fixedAmount")} - {t("perOrder")}</option>
                </select>
              </div>
              {formData.surchargeType !== 'none' && (
                <div className="form-group">
                  <label>{t("surchargeValue")}:</label>
                  <input
                    type="number"
                    min="0"
                    step={formData.surchargeType === 'percentage' ? '0.1' : '1'}
                    value={formData.surchargeValue}
                    onChange={(e) => setFormData({...formData, surchargeValue: Number(e.target.value)})}
                    placeholder={formData.surchargeType === 'percentage' ? '5' : '5'}
                  />
                  <small className="form-help">
                    {formData.surchargeType === 'percentage' ? '%' : '₪'}
                    {formData.surchargeType === 'fixedPerBread' && ` (${t("perBread")})`}
                    {formData.surchargeType === 'fixedPerOrder' && ` (${t("perOrder")})`}
                  </small>
                </div>
              )}
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  />
                  {t("activeKibbutz")}
                </label>
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isClub}
                    onChange={(e) => setFormData({...formData, isClub: e.target.checked})}
                  />
                  {t("isClub")}
                </label>
                <small className="form-help">
                  {t("isClubHelp")}
                </small>
              </div>
              <div className="form-group">
                <label>
                  {t("kibbutzPassword")}:
                  {selectedKibbutz?.password && !formData.password && (
                    <span className="current-password-indicator">
                      🔒 {t("currentlyProtected")}
                    </span>
                  )}
                </label>
                <div className="password-input-group">
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder={formData.password ? t("newPassword") : t("kibbutzPasswordPlaceholder")}
                    className="password-input"
                  />
                  {formData.password && (
                    <button
                      type="button"
                      className="clear-password-btn"
                      onClick={() => setFormData({...formData, password: ''})}
                      title={t("clearPassword")}
                    >
                      ✕
                    </button>
                  )}
                </div>
                <small className="form-help">
                  {formData.password ? t("passwordWillBeSet") : t("kibbutzPasswordHelp")}
                </small>
              </div>
              <div className="form-actions">
                <button type="button" onClick={closeModals}>{t("cancel")}</button>
                <button type="submit">{t("addKibbutz")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && selectedKibbutz && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t("editKibbutz")}</h3>
              <button className="close-btn" onClick={closeModals}>×</button>
            </div>
            <form onSubmit={handleEditKibbutz} className="kibbutz-form">
              <div className="form-group">
                <label>{t("kibbutzName")}:</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t("description")}:</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>{t("discountPercentage")}:</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discountPercentage}
                  onChange={(e) => setFormData({...formData, discountPercentage: Number(e.target.value)})}
                />
              </div>
              <div className="form-group">
                <label>{t("surchargeType")}:</label>
                <select
                  value={formData.surchargeType}
                  onChange={(e) => setFormData({...formData, surchargeType: e.target.value})}
                >
                  <option value="none">{t("none")}</option>
                  <option value="percentage">{t("percentage")}</option>
                  <option value="fixedPerBread">{t("fixedAmount")} - {t("perBread")}</option>
                  <option value="fixedPerOrder">{t("fixedAmount")} - {t("perOrder")}</option>
                </select>
              </div>
              {formData.surchargeType !== 'none' && (
                <div className="form-group">
                  <label>{t("surchargeValue")}:</label>
                  <input
                    type="number"
                    min="0"
                    step={formData.surchargeType === 'percentage' ? '0.1' : '1'}
                    value={formData.surchargeValue}
                    onChange={(e) => setFormData({...formData, surchargeValue: Number(e.target.value)})}
                    placeholder={formData.surchargeType === 'percentage' ? '5' : '5'}
                  />
                  <small className="form-help">
                    {formData.surchargeType === 'percentage' ? '%' : '₪'}
                    {formData.surchargeType === 'fixedPerBread' && ` (${t("perBread")})`}
                    {formData.surchargeType === 'fixedPerOrder' && ` (${t("perOrder")})`}
                  </small>
                </div>
              )}
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  />
                  {t("activeKibbutz")}
                </label>
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isClub}
                    onChange={(e) => setFormData({...formData, isClub: e.target.checked})}
                  />
                  {t("isClub")}
                </label>
                <small className="form-help">
                  {t("isClubHelp")}
                </small>
              </div>
              <div className="form-group">
                <label>
                  {t("kibbutzPassword")}:
                  {selectedKibbutz?.password && !formData.password && (
                    <span className="current-password-indicator">
                      🔒 {t("currentlyProtected")}
                    </span>
                  )}
                </label>
                <div className="password-input-group">
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder={formData.password ? t("newPassword") : t("kibbutzPasswordPlaceholder")}
                    className="password-input"
                  />
                  {formData.password && (
                    <button
                      type="button"
                      className="clear-password-btn"
                      onClick={() => setFormData({...formData, password: ''})}
                      title={t("clearPassword")}
                    >
                      ✕
                    </button>
                  )}
                </div>
                <small className="form-help">
                  {formData.password ? t("passwordWillBeSet") : t("kibbutzPasswordHelp")}
                </small>
              </div>
              <div className="form-actions">
                <button type="button" onClick={closeModals}>{t("cancel")}</button>
                <button type="submit">{t("updateKibbutz")}</button>
              </div>
            </form>
          </div>
        </div>
      )}


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

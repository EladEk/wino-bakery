import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useKibbutz } from '../hooks/useKibbutz';
import { useToast } from '../contexts/ToastContext';
import { useDirection } from '../contexts/DirectionContext';
import { useTranslation } from 'react-i18next';
import { usersService } from '../services/users';
import { kibbutzService } from '../services/kibbutz';
import { db } from '../firebase';
import KibbutzPasswordModal from './KibbutzPasswordModal';
import './KibbutzModal.css';

export default function KibbutzModal({ isOpen, onClose }) {
  const { userData, setUserData, currentUser } = useAuth();
  const { kibbutzim, loading, error: kibbutzError } = useKibbutz();
  const { showSuccess, showError } = useToast();
  const { isRTL } = useDirection();
  const { t } = useTranslation();
  
  const [selectedKibbutz, setSelectedKibbutz] = useState(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isUpdatingOrders, setIsUpdatingOrders] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingKibbutz, setPendingKibbutz] = useState(null);

  const isKibbutzMember = userData?.kibbutzId;

  if (kibbutzError) {
    console.error('Kibbutz loading error:', kibbutzError);
  }

  const handleJoinKibbutz = async (kibbutz) => {
    const userId = currentUser?.uid;
    
    if (!kibbutz || !userId) {
      return;
    }
    
    // Check if kibbutz has password protection
    if (kibbutz.password) {
      setPendingKibbutz(kibbutz);
      setShowPasswordModal(true);
      return;
    }
    
    // Proceed with joining if no password
    await joinKibbutz(kibbutz);
  };

  const joinKibbutz = async (kibbutz) => {
    const userId = currentUser?.uid;
    
    if (!kibbutz || !userId) {
      return;
    }
    
    setIsJoining(true);
    try {
      const safeUserData = {
        uid: userId,
        email: userData.email || '',
        name: userData.name || '',
        phone: userData.phone || ''
      };

      const userDoc = await usersService.getById(userId);
      
      if (!userDoc) {
        await usersService.create(userId, {
          email: safeUserData.email,
          name: safeUserData.name,
          phone: safeUserData.phone,
          isAdmin: false,
          isBlocked: false
        });
      }

      await usersService.updateProfile(userId, {
        name: safeUserData.name,
        phone: safeUserData.phone,
        kibbutzId: kibbutz.id,
        kibbutzName: kibbutz.name
      });

      const { collection, getDocs, updateDoc, doc } = await import('firebase/firestore');
      const breadsSnapshot = await getDocs(collection(db, "breads"));
      
      for (const breadDoc of breadsSnapshot.docs) {
        const bread = breadDoc.data();
        if (bread.claimedBy) {
          let updated = false;
          const updatedClaims = bread.claimedBy.map(claim => {
            if (claim.userId === userId) {
              updated = true;
              return {
                ...claim,
                kibbutzId: kibbutz.id,
                kibbutzName: kibbutz.name,
                discountPercentage: kibbutz.discountPercentage || 0,
                surchargeType: kibbutz.surchargeType || 'none',
                surchargeValue: kibbutz.surchargeValue || 0
              };
            }
            return claim;
          });
          
          if (updated) {
            await updateDoc(doc(db, "breads", breadDoc.id), {
              claimedBy: updatedClaims
            });
          }
        }
      }

      setUserData(prev => ({
        ...prev,
        kibbutzId: kibbutz.id,
        kibbutzName: kibbutz.name
      }));

      showSuccess(t('joinedKibbutzSuccessfully', { name: kibbutz.name }));
      onClose();
    } catch (error) {
      showError(`${t('errorJoiningKibbutz')}: ${error.message}`);
      console.error('Error joining kibbutz:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const handlePasswordSubmit = async (password) => {
    if (!pendingKibbutz) return;
    
    try {
      const isValid = await kibbutzService.verifyPassword(pendingKibbutz.id, password);
      if (isValid) {
        setShowPasswordModal(false);
        await joinKibbutz(pendingKibbutz);
        setPendingKibbutz(null);
      } else {
        showError(t('incorrectPassword'));
      }
    } catch (error) {
      showError(t('passwordVerificationError'));
    }
  };

  const handlePasswordModalClose = () => {
    setShowPasswordModal(false);
    setPendingKibbutz(null);
  };

  const handleUpdateExistingOrders = async () => {
    const userId = currentUser?.uid;
    if (!userId || !userData?.kibbutzId) return;
    
    setIsUpdatingOrders(true);
    try {
      const { collection, getDocs, updateDoc, doc } = await import('firebase/firestore');
      const breadsSnapshot = await getDocs(collection(db, "breads"));
      
      let updatedCount = 0;
      for (const breadDoc of breadsSnapshot.docs) {
        const bread = breadDoc.data();
        if (bread.claimedBy) {
          let updated = false;
          const updatedClaims = bread.claimedBy.map(claim => {
            if (claim.userId === userId) {
              updated = true;
              const userKibbutz = kibbutzim?.find(k => k.id === userData.kibbutzId);
              return {
                ...claim,
                kibbutzId: userData.kibbutzId,
                kibbutzName: userData.kibbutzName,
                discountPercentage: userKibbutz?.discountPercentage || 0,
                surchargeType: userKibbutz?.surchargeType || 'none',
                surchargeValue: userKibbutz?.surchargeValue || 0
              };
            }
            return claim;
          });
          
          if (updated) {
            await updateDoc(doc(db, "breads", breadDoc.id), {
              claimedBy: updatedClaims
            });
            updatedCount++;
          }
        }
      }
      
      showSuccess(t('updatedOrdersCount', { count: updatedCount }));
    } catch (error) {
      showError(`${t('errorUpdatingOrders')}: ${error.message}`);
      console.error('Error updating orders:', error);
    } finally {
      setIsUpdatingOrders(false);
    }
  };

  const handleLeaveKibbutz = async () => {
    const userId = currentUser?.uid;
    if (!userId) return;
    
    setIsLeaving(true);
    try {
      const safeUserData = {
        uid: userId,
        name: userData.name || '',
        phone: userData.phone || ''
      };

      await usersService.updateProfile(userId, {
        name: safeUserData.name,
        phone: safeUserData.phone,
        kibbutzId: null,
        kibbutzName: null
      });

      const { collection, getDocs, updateDoc, doc } = await import('firebase/firestore');
      const breadsSnapshot = await getDocs(collection(db, "breads"));
      
      for (const breadDoc of breadsSnapshot.docs) {
        const bread = breadDoc.data();
        if (bread.claimedBy) {
          let updated = false;
          const updatedClaims = bread.claimedBy.map(claim => {
            if (claim.userId === userId) {
              updated = true;
              return {
                ...claim,
                kibbutzId: null,
                kibbutzName: null,
                discountPercentage: 0,
                surchargeType: 'none',
                surchargeValue: 0
              };
            }
            return claim;
          });
          
          if (updated) {
            await updateDoc(doc(db, "breads", breadDoc.id), {
              claimedBy: updatedClaims
            });
          }
        }
      }

      setUserData(prev => ({
        ...prev,
        kibbutzId: null,
        kibbutzName: null
      }));

      showSuccess(t('leftKibbutzSuccessfully'));
      onClose();
    } catch (error) {
      showError(`${t('errorLeavingKibbutz')}: ${error.message}`);
      console.error('Error leaving kibbutz:', error);
    } finally {
      setIsLeaving(false);
    }
  };

  if (!isOpen) return null;

  const activeKibbutzim = (kibbutzim || []).filter(k => k && k.isActive);
  

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={`kibbutz-modal ${isRTL ? 'rtl' : 'ltr'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>
            {isKibbutzMember ? t('kibbutzManagement') : t('joinKibbutz')}
          </h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {isKibbutzMember ? (
            <div className="kibbutz-member-info">
              <div className="current-kibbutz">
                <h4>{t("yourCurrentKibbutz")}:</h4>
                <div className="kibbutz-card current">
                  <div className="kibbutz-name">🏘️ {userData.kibbutzName}</div>
                </div>
              </div>
              
              <div className="kibbutz-actions">
                <button 
                  className="update-orders-btn"
                  onClick={handleUpdateExistingOrders}
                  disabled={isUpdatingOrders}
                  style={{ 
                    backgroundColor: '#4CAF50', 
                    color: 'white', 
                    marginBottom: '10px',
                    width: '100%'
                  }}
                >
                  {isUpdatingOrders ? t('updating') : t('updateExistingOrders')}
                </button>
                <button 
                  className="leave-kibbutz-btn"
                  onClick={handleLeaveKibbutz}
                  disabled={isLeaving}
                >
                  {isLeaving ? t('processing') : t('removeKibbutzAssociation')}
                </button>
              </div>
            </div>
          ) : (
            <div className="kibbutz-selection">
              <h4>{t("selectKibbutzToJoin")}:</h4>
              
              {loading ? (
                <div className="loading">{t("loadingKibbutzim")}</div>
              ) : activeKibbutzim.length === 0 ? (
                <div className="no-kibbutzim">
                  {t("noKibbutzimAvailable")}
                </div>
              ) : (
                <div className="kibbutz-list">
                  {activeKibbutzim.map(kibbutz => (
                    <div 
                      key={kibbutz.id}
                      className={`kibbutz-card ${selectedKibbutz?.id === kibbutz.id ? 'selected' : ''}`}
                      onClick={() => setSelectedKibbutz(kibbutz)}
                    >
                      <div className="kibbutz-name">
                        🏘️ {kibbutz.name}
                        {kibbutz.password && <span className="password-indicator"> 🔒</span>}
                      </div>
                      {kibbutz.description && (
                        <div className="kibbutz-description">{kibbutz.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {selectedKibbutz && (
                <div className="kibbutz-actions">
                  <button 
                    className="join-kibbutz-btn"
                    onClick={() => handleJoinKibbutz(selectedKibbutz)}
                    disabled={isJoining}
                  >
                    {isJoining ? t('joining') : t('joinKibbutzName', { name: selectedKibbutz.name })}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <KibbutzPasswordModal
        isOpen={showPasswordModal}
        onClose={handlePasswordModalClose}
        kibbutzName={pendingKibbutz?.name}
        onPasswordSubmit={handlePasswordSubmit}
      />
    </div>
  );
}

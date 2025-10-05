import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useKibbutz } from '../hooks/useKibbutz';
import { useToast } from '../contexts/ToastContext';
import { useDirection } from '../contexts/DirectionContext';
import { usersService } from '../services/users';
import './KibbutzModal.css';

export default function KibbutzModal({ isOpen, onClose }) {
  const { userData, setUserData } = useAuth();
  const { kibbutzim, loading } = useKibbutz();
  const { showSuccess, showError } = useToast();
  const { isRTL } = useDirection();
  
  const [selectedKibbutz, setSelectedKibbutz] = useState(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const isKibbutzMember = userData?.kibbutzId;

  const handleJoinKibbutz = async () => {
    if (!selectedKibbutz) return;
    
    setIsJoining(true);
    try {
      // First ensure user document exists with all required fields
      const userDoc = await usersService.getById(userData.uid);
      if (!userDoc) {
        // Create user document if it doesn't exist
        await usersService.create(userData.uid, {
          email: userData.email,
          name: userData.name || '',
          phone: userData.phone || '',
          isAdmin: false,
          isBlocked: false
        });
      }

      await usersService.updateProfile(userData.uid, {
        name: userData.name || '',
        phone: userData.phone || '',
        kibbutzId: selectedKibbutz.id,
        kibbutzName: selectedKibbutz.name
      });

      // Update local user data
      setUserData(prev => ({
        ...prev,
        kibbutzId: selectedKibbutz.id,
        kibbutzName: selectedKibbutz.name
      }));

      showSuccess(`הצטרפת לקיבוץ ${selectedKibbutz.name}!`);
      onClose();
    } catch (error) {
      showError(`שגיאה בהצטרפות לקיבוץ: ${error.message}`);
      console.error('Error joining kibbutz:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveKibbutz = async () => {
    setIsLeaving(true);
    try {
      await usersService.updateProfile(userData.uid, {
        name: userData.name || '',
        phone: userData.phone || '',
        kibbutzId: null,
        kibbutzName: null
      });

      // Update local user data
      setUserData(prev => ({
        ...prev,
        kibbutzId: null,
        kibbutzName: null
      }));

      showSuccess('עזבת את הקיבוץ בהצלחה');
      onClose();
    } catch (error) {
      showError(`שגיאה בעזיבת הקיבוץ: ${error.message}`);
      console.error('Error leaving kibbutz:', error);
    } finally {
      setIsLeaving(false);
    }
  };

  if (!isOpen) return null;

  const activeKibbutzim = kibbutzim.filter(k => k.isActive);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={`kibbutz-modal ${isRTL ? 'rtl' : 'ltr'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>
            {isKibbutzMember ? 'ניהול שיוך לקיבוץ' : 'הצטרפות לקיבוץ'}
          </h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {isKibbutzMember ? (
            // User is already a kibbutz member
            <div className="kibbutz-member-info">
              <div className="current-kibbutz">
                <h4>הקיבוץ הנוכחי שלך:</h4>
                <div className="kibbutz-card current">
                  <div className="kibbutz-name">🏘️ {userData.kibbutzName}</div>
                </div>
              </div>
              
              <div className="kibbutz-actions">
                <button 
                  className="leave-kibbutz-btn"
                  onClick={handleLeaveKibbutz}
                  disabled={isLeaving}
                >
                  {isLeaving ? 'מעבד...' : 'הסר שיוך לקיבוץ'}
                </button>
              </div>
            </div>
          ) : (
            // User is not a kibbutz member
            <div className="kibbutz-selection">
              <h4>בחר קיבוץ להצטרפות:</h4>
              
              {loading ? (
                <div className="loading">טוען קיבוצים...</div>
              ) : activeKibbutzim.length === 0 ? (
                <div className="no-kibbutzim">
                  אין קיבוצים זמינים להצטרפות
                </div>
              ) : (
                <div className="kibbutz-list">
                  {activeKibbutzim.map(kibbutz => (
                    <div 
                      key={kibbutz.id}
                      className={`kibbutz-card ${selectedKibbutz?.id === kibbutz.id ? 'selected' : ''}`}
                      onClick={() => setSelectedKibbutz(kibbutz)}
                    >
                      <div className="kibbutz-name">🏘️ {kibbutz.name}</div>
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
                    onClick={handleJoinKibbutz}
                    disabled={isJoining}
                  >
                    {isJoining ? 'מצטרף...' : `הצטרף לקיבוץ ${selectedKibbutz.name}`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

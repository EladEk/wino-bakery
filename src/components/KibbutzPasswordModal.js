import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDirection } from '../contexts/DirectionContext';
import './KibbutzPasswordModal.css';

export default function KibbutzPasswordModal({ 
  isOpen, 
  onClose, 
  kibbutzName, 
  onPasswordSubmit 
}) {
  const { t } = useTranslation();
  const { isRTL } = useDirection();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setError(t('passwordRequired'));
      return;
    }
    onPasswordSubmit(password);
    setPassword('');
    setError('');
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="kibbutz-password-modal-overlay" onClick={handleClose}>
      <div 
        className="kibbutz-password-modal" 
        onClick={(e) => e.stopPropagation()}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="modal-header">
          <h3>{t('enterKibbutzPassword')}</h3>
          <button 
            className="close-btn" 
            onClick={handleClose}
            aria-label={t('close')}
            data-testid="close-password-modal-button"
          >
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <p className="kibbutz-name">
            {t('joiningKibbutz')}: <strong>{kibbutzName}</strong>
          </p>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="kibbutz-password">{t('password')}:</label>
              <input
                id="kibbutz-password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder={t('enterPassword')}
                autoFocus
              />
              {error && <div className="error-message">{error}</div>}
            </div>
            
            <div className="form-actions">
              <button type="submit" className="submit-btn" data-testid="submit-password-button">
                {t('joinKibbutz')}
              </button>
              <button type="button" className="cancel-btn" onClick={handleClose} data-testid="cancel-password-button">
                {t('cancel')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

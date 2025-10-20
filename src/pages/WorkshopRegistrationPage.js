import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useWorkshops } from '../hooks/useWorkshops';
import { useNavigate } from 'react-router-dom';
import './WorkshopRegistrationPage.css';

export default function WorkshopRegistrationPage() {
  const { t } = useTranslation();
  const { currentUser, userData } = useAuth();
  const { getAvailableWorkshops, registerUser, isUserRegistered } = useWorkshops();
  const navigate = useNavigate();
  
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState({});

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }

    const availableWorkshops = getAvailableWorkshops();
    setWorkshops(availableWorkshops);
    setLoading(false);
  }, [currentUser, navigate, getAvailableWorkshops]);

  const handleRegister = async (workshopId) => {
    if (!currentUser || !userData) {
      alert(t('pleaseLoginFirst'));
      return;
    }

    setRegistering(prev => ({ ...prev, [workshopId]: true }));

    try {
      await registerUser(workshopId, {
        userId: currentUser.uid,
        name: userData.name || currentUser.displayName || 'Unknown',
        phone: userData.phone || '',
        email: userData.email || currentUser.email || ''
      });
      
      // Refresh workshops to update registration status
      const updatedWorkshops = getAvailableWorkshops();
      setWorkshops(updatedWorkshops);
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setRegistering(prev => ({ ...prev, [workshopId]: false }));
    }
  };

  const formatDate = (workshop) => {
    if (workshop.startAt) {
      const dt = new Date(workshop.startAt);
      return dt.toLocaleString('he-IL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    if (workshop.date && workshop.time) {
      const dt = new Date(`${workshop.date}T${workshop.time}:00`);
      return dt.toLocaleString('he-IL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    if (workshop.date) {
      const dt = new Date(workshop.date);
      return dt.toLocaleDateString('he-IL');
    }
    return '';
  };

  if (loading) {
    return (
      <div className="workshop-registration-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{t('Loading')}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="workshop-registration-page">
      <div className="page-header">
        <h1>{t('registerToWorkshops')}</h1>
        <button 
          className="back-button"
          onClick={() => navigate('/')}
        >
          ← {t('backToHome')}
        </button>
      </div>

      {workshops.length === 0 ? (
        <div className="no-workshops">
          <div className="no-workshops-content">
            <h2>🎯</h2>
            <h3>{t('noActiveWorkshops')}</h3>
            <p>{t('noWorkshopsAvailable')}</p>
          </div>
        </div>
      ) : (
        <div className="workshops-grid">
          {workshops.map((workshop) => {
            const isRegistered = isUserRegistered(workshop, currentUser?.uid);
            const isRegistering = registering[workshop.id];
            const availableSpots = workshop.maxParticipants - (workshop.registeredUsers?.length || 0);

            return (
              <div key={workshop.id} className="workshop-card">
                <div className="workshop-header">
                  <h3 className="workshop-title">{workshop.name}</h3>
                  <div className="workshop-price">₪{workshop.price}</div>
                </div>

                <div className="workshop-details">
                  <div className="workshop-description">
                    <p>{workshop.description}</p>
                  </div>

                  <div className="workshop-info">
                    <div className="info-row">
                      <span className="info-label">📅 {t('workshopDate')}:</span>
                      <span className="info-value">{formatDate(workshop)}</span>
                    </div>
                    
                    <div className="info-row">
                      <span className="info-label">👥 {t('maxParticipants')}:</span>
                      <span className="info-value">{workshop.maxParticipants}</span>
                    </div>
                    
                    <div className="info-row">
                      <span className="info-label">✅ {t('availableSpots')}:</span>
                      <span className="info-value">{availableSpots}</span>
                    </div>
                  </div>
                </div>

                <div className="workshop-actions">
                  {isRegistered ? (
                    <div className="registered-status">
                      <span className="registered-icon">✅</span>
                      <span className="registered-text">{t('registered')}</span>
                    </div>
                  ) : (
                    <button
                      className={`register-button ${availableSpots === 0 ? 'disabled' : ''}`}
                      onClick={() => handleRegister(workshop.id)}
                      disabled={availableSpots === 0 || isRegistering}
                    >
                      {isRegistering ? (
                        <span className="loading-text">{t('registering')}...</span>
                      ) : availableSpots === 0 ? (
                        t('workshopFull')
                      ) : (
                        `${t('register')} - ₪${workshop.price}`
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


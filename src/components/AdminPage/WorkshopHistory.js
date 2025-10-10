import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useWorkshops } from '../../hooks/useWorkshops';
import './WorkshopHistory.css';

export default function WorkshopHistory() {
  const { t } = useTranslation();
  const { workshopHistory, loading, error } = useWorkshops();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e) => {
    setFilterStatus(e.target.value);
  };

  const filteredWorkshops = workshopHistory.filter(workshop => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      workshop.name.toLowerCase().includes(searchLower) ||
      workshop.description.toLowerCase().includes(searchLower) ||
      workshop.location?.toLowerCase().includes(searchLower) ||
      workshop.registeredUsers.some(user => 
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );

    const matchesFilter = 
      filterStatus === 'all' || 
      workshop.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#28a745';
      case 'cancelled':
        return '#dc3545';
      case 'moved':
        return '#ffc107';
      default:
        return '#6c757d';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return t('completed');
      case 'cancelled':
        return t('cancelled');
      case 'moved':
        return t('movedToHistory');
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>{t('Loading')}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{t('Error')}: {error}</p>
      </div>
    );
  }

  return (
    <div className="workshop-history">
      <div className="history-header">
        <h2>{t('workshopHistory')}</h2>
        <p className="history-description">{t('workshopHistoryDescription')}</p>
      </div>

      <div className="history-filters">
        <div className="search-container">
          <input
            type="text"
            placeholder={t('searchWorkshops')}
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
        
        <div className="filter-container">
          <select
            value={filterStatus}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="all">{t('allStatuses')}</option>
            <option value="completed">{t('completed')}</option>
            <option value="cancelled">{t('cancelled')}</option>
            <option value="moved">{t('movedToHistory')}</option>
          </select>
        </div>
      </div>

      {filteredWorkshops.length === 0 ? (
        <div className="no-history-message">
          <h3>{t('noWorkshopHistory')}</h3>
          <p>{t('noWorkshopHistoryDescription')}</p>
        </div>
      ) : (
        <div className="history-list">
          {filteredWorkshops.map(workshop => (
            <div key={workshop.id} className="history-workshop-card">
              <div className="workshop-header">
                <h3 className="workshop-name">{workshop.name}</h3>
                <div className="workshop-status">
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(workshop.status) }}
                  >
                    {getStatusText(workshop.status)}
                  </span>
                </div>
              </div>

              <div className="workshop-details">
                <p className="workshop-date">
                  <strong>{t('workshopDate')}:</strong> {formatDate(workshop.date)}
                </p>
                <p className="workshop-price">
                  <strong>{t('workshopPrice')}:</strong> ₪{workshop.price}
                </p>
                {workshop.location && (
                  <p className="workshop-location">
                    <strong>{t('workshopLocation')}:</strong> {workshop.location}
                  </p>
                )}
                <p className="workshop-participants">
                  <strong>{t('registeredUsers')}:</strong> {workshop.registeredUsers.length}/{workshop.maxParticipants}
                </p>
                <p className="workshop-description">{workshop.description}</p>
              </div>

              {workshop.registeredUsers.length > 0 && (
                <div className="participants-section">
                  <h4>{t('participants')}</h4>
                  <div className="participants-list">
                    {workshop.registeredUsers.map((participant, index) => (
                      <div key={index} className="participant-item">
                        <div className="participant-info">
                          <span className="participant-name">{participant.name}</span>
                          <span className="participant-email">{participant.email}</span>
                          {participant.phone && (
                            <span className="participant-phone">{participant.phone}</span>
                          )}
                        </div>
                        <div className="participant-registered">
                          {t('registered')}: {formatDate(participant.registeredAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {workshop.movedToHistoryAt && (
                <div className="history-info">
                  <p className="moved-date">
                    <strong>{t('movedToHistoryOn')}:</strong> {formatDate(workshop.movedToHistoryAt)}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

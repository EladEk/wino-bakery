import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWorkshops } from '../../hooks/useWorkshops';
import { useAuth } from '../../contexts/AuthContext';
import './ActiveWorkshops.css';

export default function ActiveWorkshops() {
  const { t } = useTranslation();
  const { activeWorkshops, loading, error, updateActiveWorkshop, deleteActiveWorkshop, moveToHistory, unregisterUser } = useWorkshops();
  const { userData } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [searchUsers, setSearchUsers] = useState('');
  const [foundUsers, setFoundUsers] = useState([]);
  const [showUserSearch, setShowUserSearch] = useState(false);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleEditWorkshop = (workshop) => {
    setSelectedWorkshop(workshop);
    setShowParticipantModal(true);
  };

  const handleCloseModal = () => {
    setSelectedWorkshop(null);
    setShowParticipantModal(false);
  };

  const handleOpenAddParticipant = () => {
    setShowAddParticipantModal(true);
  };

  const handleCloseAddParticipant = () => {
    setShowAddParticipantModal(false);
    setSearchUsers('');
    setFoundUsers([]);
  };


  const handleUserSearchChange = (e) => {
    const value = e.target.value;
    setSearchUsers(value);
    
    // Only search if at least 4 characters
    if (value.length >= 4) {
      searchExistingUsers(value);
    } else {
      setFoundUsers([]);
    }
  };

  const searchExistingUsers = async (searchTerm) => {
    try {
      console.log('Searching for:', searchTerm);
      // Import users service
      const { usersService } = await import('../../services/users');
      const users = await usersService.searchUsers(searchTerm);
      console.log('Found users:', users);
      
      setFoundUsers(users.slice(0, 20)); // Limit to 20 results
    } catch (error) {
      console.error('Error searching users:', error);
      setFoundUsers([]);
    }
  };

  const addUserToWorkshop = async (user) => {
    try {
      // Check if workshop is full
      if (selectedWorkshop.registeredUsers.length >= selectedWorkshop.maxParticipants) {
        alert(t('workshopIsFull'));
        return;
      }

      // Check if user already registered
      const isAlreadyRegistered = selectedWorkshop.registeredUsers.some(
        participant => participant.email === user.email
      );
      
      if (isAlreadyRegistered) {
        alert(t('userAlreadyRegistered'));
        return;
      }

      // Add user to workshop
      const updatedUsers = [...selectedWorkshop.registeredUsers, {
        userId: user.id,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        registeredAt: new Date().toISOString()
      }];

      await updateActiveWorkshop(selectedWorkshop.id, {
        registeredUsers: updatedUsers
      });

      // Update the selectedWorkshop state to reflect the change
      setSelectedWorkshop(prev => ({
        ...prev,
        registeredUsers: updatedUsers
      }));

      alert(t('userAddedToWorkshopSuccessfully'));
      setSearchUsers('');
      setFoundUsers([]);
    } catch (error) {
      console.error('Error adding user to workshop:', error);
      alert(t('errorAddingUserToWorkshop'));
    }
  };


  const handleRemoveParticipant = async (workshopId, userId) => {
    if (window.confirm(t('confirmRemoveParticipant'))) {
      try {
        await unregisterUser(workshopId, userId);
        
        // Update the selectedWorkshop state to reflect the change
        setSelectedWorkshop(prev => ({
          ...prev,
          registeredUsers: prev.registeredUsers.filter(participant => participant.userId !== userId)
        }));
      } catch (error) {
        console.error('Error removing participant:', error);
      }
    }
  };

  const handleMoveToHistory = async (workshopId) => {
    if (window.confirm(t('confirmMoveToHistory'))) {
      try {
        await moveToHistory(workshopId);
      } catch (error) {
        console.error('Error moving to history:', error);
      }
    }
  };

  const handleDeleteWorkshop = async (workshopId) => {
    if (window.confirm(t('confirmDeleteWorkshop'))) {
      try {
        await deleteActiveWorkshop(workshopId);
      } catch (error) {
        console.error('Error deleting workshop:', error);
      }
    }
  };

  const filteredWorkshops = activeWorkshops.filter(workshop => {
    const searchLower = searchTerm.toLowerCase();
    return (
      workshop.name.toLowerCase().includes(searchLower) ||
      workshop.description.toLowerCase().includes(searchLower) ||
      workshop.location?.toLowerCase().includes(searchLower) ||
      workshop.registeredUsers.some(user => 
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      )
    );
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

  const getAvailableSpots = (workshop) => {
    return workshop.maxParticipants - workshop.registeredUsers.length;
  };

  const isWorkshopFull = (workshop) => {
    return workshop.registeredUsers.length >= workshop.maxParticipants;
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
    <div className="active-workshops">
      <div className="workshops-header">
        <h2>{t('activeWorkshops')}</h2>
        <div className="search-container">
          <input
            type="text"
            placeholder={t('searchWorkshops')}
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
      </div>

      {filteredWorkshops.length === 0 ? (
        <div className="no-workshops-message">
          <h3>{t('noActiveWorkshops')}</h3>
          <p>{t('noActiveWorkshopsDescription')}</p>
        </div>
      ) : (
        <div className="workshops-grid">
          {filteredWorkshops.map(workshop => (
            <div key={workshop.id} className={`workshop-card ${isWorkshopFull(workshop) ? 'full' : ''}`}>
              <div className="workshop-header">
                <h3 className="workshop-name">{workshop.name}</h3>
                <div className="workshop-status">
                  {isWorkshopFull(workshop) ? (
                    <span className="status-full">{t('workshopFull')}</span>
                  ) : (
                    <span className="status-available">
                      {getAvailableSpots(workshop)} {t('availableSpots')}
                    </span>
                  )}
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

              <div className="workshop-actions">
                <button
                  onClick={() => handleEditWorkshop(workshop)}
                  className="edit-workshop-btn"
                >
                  {t('manageParticipants')}
                </button>
                <button
                  onClick={() => handleMoveToHistory(workshop.id)}
                  className="move-history-btn"
                >
                  {t('moveToHistory')}
                </button>
                <button
                  onClick={() => handleDeleteWorkshop(workshop.id)}
                  className="delete-workshop-btn"
                >
                  {t('Delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showParticipantModal && selectedWorkshop && (
        <div className="participant-modal-overlay">
          <div className="participant-modal">
            <div className="modal-header">
              <h3>{t('manageParticipants')} - {selectedWorkshop.name}</h3>
              <div className="modal-header-actions">
                <button 
                  onClick={handleOpenAddParticipant}
                  className="add-participant-btn"
                  disabled={selectedWorkshop.registeredUsers.length >= selectedWorkshop.maxParticipants}
                >
                  + {t('addParticipant')}
                </button>
                <button onClick={handleCloseModal} className="close-modal-btn">
                  ×
                </button>
              </div>
            </div>
            
            <div className="participants-list">
              {selectedWorkshop.registeredUsers.length === 0 ? (
                <p className="no-participants">{t('noParticipants')}</p>
              ) : (
                selectedWorkshop.registeredUsers.map((participant, index) => (
                  <div key={index} className="participant-item">
                    <div className="participant-info">
                      <h4>{participant.name}</h4>
                      <p>{participant.email}</p>
                      {participant.phone && <p>{participant.phone}</p>}
                      <small>
                        {t('registered')}: {formatDate(participant.registeredAt)}
                      </small>
                    </div>
                    <button
                      onClick={() => handleRemoveParticipant(selectedWorkshop.id, participant.userId)}
                      className="remove-participant-btn"
                    >
                      {t('removeParticipant')}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showAddParticipantModal && selectedWorkshop && (
        <div className="add-participant-modal-overlay">
          <div className="add-participant-modal">
            <div className="modal-header">
              <h3>{t('addParticipant')} - {selectedWorkshop.name}</h3>
              <button onClick={handleCloseAddParticipant} className="close-modal-btn">
                ×
              </button>
            </div>
            
            <div className="add-participant-form">
              <div className="form-group">
                <label>{t('searchAndAddUsers')}:</label>
                <input
                  type="text"
                  value={searchUsers}
                  onChange={handleUserSearchChange}
                  placeholder={t('searchUsersPlaceholder')}
                  className="user-search-input"
                />
              </div>

              {searchUsers.length >= 4 && (
                <div className="search-results-table">
                  <h4>{t('searchResults')}</h4>
                  {foundUsers.length > 0 ? (
                    <div className="users-table">
                      <div className="table-header">
                        <div className="col-name">{t('Name')}</div>
                        <div className="col-email">{t('Email')}</div>
                        <div className="col-phone">{t('Phone')}</div>
                        <div className="col-status">{t('Status')}</div>
                        <div className="col-action">{t('Action')}</div>
                      </div>
                      <div className="table-body">
                        {foundUsers.map(user => {
                          const isAlreadyRegistered = selectedWorkshop.registeredUsers.some(
                            participant => participant.email === user.email
                          );
                          return (
                            <div key={user.id} className="table-row">
                              <div className="col-name">
                                <strong>{user.name || t('noName')}</strong>
                              </div>
                              <div className="col-email">{user.email}</div>
                              <div className="col-phone">{user.phone || '-'}</div>
                              <div className="col-status">
                                {isAlreadyRegistered ? (
                                  <span className="status-registered">{t('alreadyRegistered')}</span>
                                ) : (
                                  <span className="status-available">{t('available')}</span>
                                )}
                              </div>
                              <div className="col-action">
                                <button
                                  className="add-user-to-workshop-btn"
                                  onClick={() => addUserToWorkshop(user)}
                                  disabled={isAlreadyRegistered || selectedWorkshop.registeredUsers.length >= selectedWorkshop.maxParticipants}
                                >
                                  {isAlreadyRegistered ? t('alreadyRegistered') : t('addToWorkshop')}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="no-users-found">
                      <p>{t('noUsersFound')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

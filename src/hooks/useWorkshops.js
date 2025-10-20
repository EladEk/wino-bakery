import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { workshopsService } from '../services/workshops';
import { useToast } from '../contexts/ToastContext';

export const useWorkshops = () => {
  const { t } = useTranslation();
  const { showSuccess, showError } = useToast();
  const [templates, setTemplates] = useState([]);
  const [activeWorkshops, setActiveWorkshops] = useState([]);
  const [workshopHistory, setWorkshopHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load all workshop data
  const loadWorkshops = useCallback(async () => {
    try {
      setLoading(true);
      const [templatesData, activeData, historyData] = await Promise.all([
        workshopsService.getTemplates(),
        workshopsService.getActiveWorkshops(),
        workshopsService.getWorkshopHistory()
      ]);
      
      setTemplates(templatesData);
      setActiveWorkshops(activeData);
      setWorkshopHistory(historyData);
      setError(null);
    } catch (err) {
      setError(err.message);
      showError(`Error loading workshops: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadWorkshops();
  }, [loadWorkshops]);

  // Template management
  const createTemplate = useCallback(async (templateData) => {
    try {
      await workshopsService.createTemplate({
        ...templateData,
        createdAt: new Date(),
        isActive: true
      });
      await loadWorkshops();
      showSuccess(t('templateCreated'));
    } catch (err) {
      showError(t('errorAddingKibbutz'));
      throw err;
    }
  }, [loadWorkshops, showSuccess, showError]);

  const updateTemplate = useCallback(async (id, templateData) => {
    try {
      await workshopsService.updateTemplate(id, templateData);
      await loadWorkshops();
      showSuccess(t('templateUpdated'));
    } catch (err) {
      showError(t('errorUpdatingKibbutz'));
      throw err;
    }
  }, [loadWorkshops, showSuccess, showError]);

  const deleteTemplate = useCallback(async (id) => {
    try {
      await workshopsService.deleteTemplate(id);
      await loadWorkshops();
      showSuccess(t('templateDeleted'));
    } catch (err) {
      showError(t('errorDeletingKibbutz'));
      throw err;
    }
  }, [loadWorkshops, showSuccess, showError]);

  // Active workshop management
  const createActiveWorkshop = useCallback(async (workshopData) => {
    try {
      await workshopsService.createActiveWorkshop({
        ...workshopData,
        createdAt: new Date(),
        registeredUsers: []
      });
      await loadWorkshops();
      showSuccess(t('workshopCreated'));
    } catch (err) {
      showError(t('workshopRegistrationError'));
      throw err;
    }
  }, [loadWorkshops, showSuccess, showError]);

  const updateActiveWorkshop = useCallback(async (id, workshopData) => {
    try {
      await workshopsService.updateActiveWorkshop(id, workshopData);
      await loadWorkshops();
      showSuccess(t('workshopUpdated'));
    } catch (err) {
      showError(t('workshopRegistrationError'));
      throw err;
    }
  }, [loadWorkshops, showSuccess, showError]);

  const deleteActiveWorkshop = useCallback(async (id) => {
    try {
      await workshopsService.deleteActiveWorkshop(id);
      await loadWorkshops();
      showSuccess(t('workshopDeleted'));
    } catch (err) {
      showError(t('workshopRegistrationError'));
      throw err;
    }
  }, [loadWorkshops, showSuccess, showError]);

  const moveToHistory = useCallback(async (id) => {
    try {
      await workshopsService.moveToHistory(id);
      await loadWorkshops();
      showSuccess(t('workshopMovedToHistory'));
    } catch (err) {
      showError(t('workshopRegistrationError'));
      throw err;
    }
  }, [loadWorkshops, showSuccess, showError]);

  // User registration
  const registerUser = useCallback(async (workshopId, userData) => {
    try {
      await workshopsService.registerUser(workshopId, userData);
      await loadWorkshops();
      showSuccess(t('registrationSuccess'));
    } catch (err) {
      showError(t('workshopRegistrationError'));
      throw err;
    }
  }, [loadWorkshops, showSuccess, showError]);

  const unregisterUser = useCallback(async (workshopId, userId) => {
    try {
      await workshopsService.unregisterUser(workshopId, userId);
      await loadWorkshops();
      showSuccess(t('unregistrationSuccess'));
    } catch (err) {
      showError(t('errorUnregisteringFromWorkshop'));
      throw err;
    }
  }, [loadWorkshops, showSuccess, showError]);

  // Helper functions
  const getAvailableWorkshops = useCallback(() => {
    return activeWorkshops.filter(workshop => {
      const now = new Date();
      const workshopDate = new Date(workshop.date);
      const isFuture = workshopDate > now;
      const hasSpots = (workshop.registeredUsers?.length || 0) < (workshop.maxParticipants || 0);
      return isFuture && hasSpots;
    });
  }, [activeWorkshops]);

  const getUpcomingWorkshops = useCallback(() => {
    return activeWorkshops.filter(workshop => {
      const now = new Date();
      const workshopDate = new Date(workshop.date);
      return workshopDate > now;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [activeWorkshops]);

  return {
    // Data
    templates,
    activeWorkshops,
    workshopHistory,
    loading,
    error,
    
    // Template operations
    createTemplate,
    updateTemplate,
    deleteTemplate,
    
    // Active workshop operations
    createActiveWorkshop,
    updateActiveWorkshop,
    deleteActiveWorkshop,
    moveToHistory,
    
    // User operations
    registerUser,
    unregisterUser,
    
    // Helper functions
    getAvailableWorkshops,
    getUpcomingWorkshops,
    
    // Utility functions
    isWorkshopFull: workshopsService.isWorkshopFull,
    getAvailableSpots: workshopsService.getAvailableSpots,
    isUserRegistered: workshopsService.isUserRegistered
  };
};

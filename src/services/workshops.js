import { firestoreService, collections, docs } from './firestore';

export const workshopsService = {
  // Workshop Templates (יצירת סדנאות)
  getTemplates: () => firestoreService.getDocs(collections.workshopTemplates()),
  getTemplate: (id) => firestoreService.getDoc(docs.workshopTemplate(id)),
  createTemplate: (data) => firestoreService.addDoc(collections.workshopTemplates(), data),
  updateTemplate: (id, data) => firestoreService.updateDoc(docs.workshopTemplate(id), data),
  deleteTemplate: (id) => firestoreService.deleteDoc(docs.workshopTemplate(id)),

  // Active Workshops (סדנאות פעילות)
  getActiveWorkshops: () => firestoreService.getDocs(collections.activeWorkshops()),
  getActiveWorkshop: (id) => firestoreService.getDoc(docs.activeWorkshop(id)),
  createActiveWorkshop: (data) => firestoreService.addDoc(collections.activeWorkshops(), data),
  updateActiveWorkshop: (id, data) => firestoreService.updateDoc(docs.activeWorkshop(id), data),
  deleteActiveWorkshop: (id) => firestoreService.deleteDoc(docs.activeWorkshop(id)),

  // Workshop History (היסטורית סדנאות)
  getWorkshopHistory: () => firestoreService.getDocs(collections.workshopHistory()),
  moveToHistory: async (workshopId) => {
    const workshop = await workshopsService.getActiveWorkshop(workshopId);
    if (workshop) {
      const historyData = {
        ...workshop,
        movedToHistoryAt: firestoreService.serverTimestamp(),
        status: 'completed'
      };
      await firestoreService.addDoc(collections.workshopHistory(), historyData);
      await workshopsService.deleteActiveWorkshop(workshopId);
    }
  },

  // User Registration
  registerUser: async (workshopId, userData) => {
    const workshop = await workshopsService.getActiveWorkshop(workshopId);
    if (!workshop) throw new Error('Workshop not found');
    
    if (workshop.registeredUsers && workshop.registeredUsers.length >= workshop.maxParticipants) {
      throw new Error('Workshop is full');
    }

    const registeredUsers = workshop.registeredUsers || [];
    const isAlreadyRegistered = registeredUsers.some(user => user.userId === userData.userId);
    
    if (isAlreadyRegistered) {
      throw new Error('User already registered');
    }

    const newRegistration = {
      ...userData,
      registeredAt: new Date().toISOString()
    };

    return workshopsService.updateActiveWorkshop(workshopId, {
      registeredUsers: [...registeredUsers, newRegistration]
    });
  },

  unregisterUser: async (workshopId, userId) => {
    const workshop = await workshopsService.getActiveWorkshop(workshopId);
    if (!workshop) throw new Error('Workshop not found');

    const registeredUsers = (workshop.registeredUsers || []).filter(user => user.userId !== userId);
    
    return workshopsService.updateActiveWorkshop(workshopId, {
      registeredUsers
    });
  },

  // Helper functions
  isWorkshopFull: (workshop) => {
    const registeredCount = workshop.registeredUsers ? workshop.registeredUsers.length : 0;
    return registeredCount >= workshop.maxParticipants;
  },

  getAvailableSpots: (workshop) => {
    const registeredCount = workshop.registeredUsers ? workshop.registeredUsers.length : 0;
    return Math.max(0, workshop.maxParticipants - registeredCount);
  },

  isUserRegistered: (workshop, userId) => {
    if (!workshop.registeredUsers) return false;
    return workshop.registeredUsers.some(user => user.userId === userId);
  }
};

import { collections, docs, firestoreService } from './firestore';
import { where } from 'firebase/firestore';

export const usersService = {
  getById: (id) => firestoreService.getDoc(docs.user(id)),

  getAll: () => firestoreService.getDocs(collections.users()),

  subscribe: (callback) => firestoreService.subscribeToCollection(collections.users(), callback),

  create: async (userId, userData) => {
    const data = {
      email: userData.email,
      name: userData.name || '',
      phone: userData.phone || '',
      isAdmin: !!userData.isAdmin,
      isBlocked: !!userData.isBlocked,
      createdAt: firestoreService.serverTimestamp()
    };
    return await firestoreService.setDoc(docs.user(userId), data);
  },

  update: async (userId, userData) => {
    const data = {
      ...userData,
      updatedAt: firestoreService.serverTimestamp()
    };
    return await firestoreService.updateDoc(docs.user(userId), data);
  },

  updateProfile: async (userId, profileData) => {
    const data = {
      name: profileData.name,
      phone: profileData.phone,
      kibbutzId: profileData.kibbutzId || null,
      kibbutzName: profileData.kibbutzName || null,
      updatedAt: firestoreService.serverTimestamp()
    };
    return await firestoreService.updateDoc(docs.user(userId), data);
  },

  // Toggle admin status
  toggleAdmin: async (userId, currentStatus) => {
    return await firestoreService.updateDoc(docs.user(userId), {
      isAdmin: !currentStatus,
      updatedAt: firestoreService.serverTimestamp()
    });
  },

  // Toggle blocked status
  toggleBlocked: async (userId, currentStatus) => {
    return await firestoreService.updateDoc(docs.user(userId), {
      isBlocked: !currentStatus,
      updatedAt: firestoreService.serverTimestamp()
    });
  },

  // Check if name exists
  checkNameExists: async (name, excludeUserId = null) => {
    const constraints = [where('name', '==', name)];
    const users = await firestoreService.queryDocs(collections.users(), constraints);
    return users.some(user => user.id !== excludeUserId);
  },

  // Search users by name, phone, or email
  searchUsers: async (searchTerm) => {
    const allUsers = await usersService.getAll();
    const term = searchTerm.toLowerCase();
    
    return allUsers.filter(user => 
      (user.name && user.name.toLowerCase().includes(term)) ||
      (user.phone && user.phone.toString().includes(term)) ||
      (user.email && user.email.toLowerCase().includes(term)) ||
      user.id.includes(term)
    );
  },

  // Assign user to kibbutz
  assignToKibbutz: async (userId, kibbutzId, kibbutzName) => {
    return await firestoreService.updateDoc(docs.user(userId), {
      kibbutzId: kibbutzId,
      kibbutzName: kibbutzName,
      updatedAt: firestoreService.serverTimestamp()
    });
  },

  // Remove user from kibbutz
  removeFromKibbutz: async (userId) => {
    return await firestoreService.updateDoc(docs.user(userId), {
      kibbutzId: null,
      kibbutzName: null,
      updatedAt: firestoreService.serverTimestamp()
    });
  },

  // Get users by kibbutz
  getUsersByKibbutz: async (kibbutzId) => {
    const constraints = [where('kibbutzId', '==', kibbutzId)];
    return await firestoreService.queryDocs(collections.users(), constraints);
  }
};

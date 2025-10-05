import { collections, docs, firestoreService } from './firestore';

export const kibbutzService = {
  getAll: () => firestoreService.getDocs(collections.kibbutzim()),

  getById: (id) => firestoreService.getDoc(docs.kibbutz(id)),

  subscribe: (callback) => firestoreService.subscribeToCollection(collections.kibbutzim(), callback),

  create: async (kibbutzData) => {
    const data = {
      name: kibbutzData.name,
      description: kibbutzData.description || '',
      discountPercentage: Number(kibbutzData.discountPercentage) || 0,
      surchargeType: kibbutzData.surchargeType || 'none',
      surchargeValue: Number(kibbutzData.surchargeValue) || 0,
      isActive: !!kibbutzData.isActive,
      isClub: !!kibbutzData.isClub,
      password: kibbutzData.password || '',
      createdAt: firestoreService.serverTimestamp(),
      updatedAt: firestoreService.serverTimestamp()
    };
    return await firestoreService.addDoc(collections.kibbutzim(), data);
  },

  update: async (id, kibbutzData) => {
    const data = {
      name: kibbutzData.name,
      description: kibbutzData.description || '',
      discountPercentage: Number(kibbutzData.discountPercentage) || 0,
      surchargeType: kibbutzData.surchargeType || 'none',
      surchargeValue: Number(kibbutzData.surchargeValue) || 0,
      isActive: !!kibbutzData.isActive,
      isClub: !!kibbutzData.isClub,
      password: kibbutzData.password || '',
      updatedAt: firestoreService.serverTimestamp()
    };
    return await firestoreService.updateDoc(docs.kibbutz(id), data);
  },

  delete: (id) => firestoreService.deleteDoc(docs.kibbutz(id)),

  toggleActive: async (id, currentStatus) => {
    return await firestoreService.updateDoc(docs.kibbutz(id), {
      isActive: !currentStatus,
      updatedAt: firestoreService.serverTimestamp()
    });
  },

  getOrdersByKibbutz: async (kibbutzId) => {
    const allBreads = await firestoreService.getDocs(collections.breads());
    const kibbutzOrders = [];

    allBreads.forEach(bread => {
      if (bread.claimedBy) {
        bread.claimedBy.forEach(order => {
          if (order.kibbutzId === kibbutzId) {
            kibbutzOrders.push({
              breadId: bread.id,
              breadName: bread.name,
              breadPrice: bread.price,
              order: order
            });
          }
        });
      }
    });

    return kibbutzOrders;
  },

  calculateKibbutzRevenue: async (kibbutzId) => {
    const orders = await kibbutzService.getOrdersByKibbutz(kibbutzId);
    return orders.reduce((total, order) => {
      return total + (order.order.quantity * order.breadPrice);
    }, 0);
  },

  verifyPassword: async (kibbutzId, password) => {
    const kibbutz = await kibbutzService.getById(kibbutzId);
    if (!kibbutz) return false;
    return kibbutz.password === password;
  }
};

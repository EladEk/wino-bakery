import { collections, docs, firestoreService } from './firestore';

export const kibbutzService = {
  // Get all kibbutzim
  getAll: () => firestoreService.getDocs(collections.kibbutzim()),

  // Get kibbutz by ID
  getById: (id) => firestoreService.getDoc(docs.kibbutz(id)),

  // Subscribe to kibbutzim changes
  subscribe: (callback) => firestoreService.subscribeToCollection(collections.kibbutzim(), callback),

  // Create new kibbutz
  create: async (kibbutzData) => {
    const data = {
      name: kibbutzData.name,
      description: kibbutzData.description || '',
      discountPercentage: Number(kibbutzData.discountPercentage) || 0,
      isActive: !!kibbutzData.isActive,
      createdAt: firestoreService.serverTimestamp(),
      updatedAt: firestoreService.serverTimestamp()
    };
    return await firestoreService.addDoc(collections.kibbutzim(), data);
  },

  // Update kibbutz
  update: async (id, kibbutzData) => {
    const data = {
      name: kibbutzData.name,
      description: kibbutzData.description || '',
      discountPercentage: Number(kibbutzData.discountPercentage) || 0,
      isActive: !!kibbutzData.isActive,
      updatedAt: firestoreService.serverTimestamp()
    };
    return await firestoreService.updateDoc(docs.kibbutz(id), data);
  },

  // Delete kibbutz
  delete: (id) => firestoreService.deleteDoc(docs.kibbutz(id)),

  // Toggle kibbutz active status
  toggleActive: async (id, currentStatus) => {
    return await firestoreService.updateDoc(docs.kibbutz(id), {
      isActive: !currentStatus,
      updatedAt: firestoreService.serverTimestamp()
    });
  },

  // Get orders by kibbutz
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

  // Calculate kibbutz total revenue
  calculateKibbutzRevenue: async (kibbutzId) => {
    const orders = await kibbutzService.getOrdersByKibbutz(kibbutzId);
    return orders.reduce((total, order) => {
      return total + (order.order.quantity * order.breadPrice);
    }, 0);
  }
};

import { collections, docs, firestoreService } from './firestore';
import { calculateDisplayPrice, calculateOrderTotal } from '../utils/pricing';

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
            // Calculate the display price (per-bread only, no per-order surcharges)
            const pricing = calculateDisplayPrice(bread.price, order);
            
            kibbutzOrders.push({
              breadId: bread.id,
              breadName: bread.name,
              breadPrice: pricing.displayPrice, // Use display price (no per-order surcharges)
              originalPrice: pricing.originalPrice, // Keep original price for reference
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
      // Use calculateOrderTotal to include per-order surcharges in revenue calculation
      return total + calculateOrderTotal(order.originalPrice, order.order);
    }, 0);
  },

  verifyPassword: async (kibbutzId, password) => {
    const kibbutz = await kibbutzService.getById(kibbutzId);
    if (!kibbutz) return false;
    return kibbutz.password === password;
  }
};

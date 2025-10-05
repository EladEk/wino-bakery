import { collections, docs, firestoreService } from './firestore';

export const orderHistoryService = {
  getAll: () => firestoreService.getDocs(collections.ordersHistory()),

  getById: (id) => firestoreService.getDoc(docs.ordersHistory(id)),

  subscribe: (callback) => firestoreService.subscribeToCollection(collections.ordersHistory(), callback),

  delete: (id) => firestoreService.deleteDoc(docs.ordersHistory(id)),

  getByDateRange: async (startDate, endDate) => {
    const allHistory = await orderHistoryService.getAll();
    return allHistory.filter(entry => {
      const entryDate = entry.saleDate?.toDate();
      return entryDate >= startDate && entryDate <= endDate;
    });
  },

  getByCustomer: async (customerId) => {
    const allHistory = await orderHistoryService.getAll();
    return allHistory.map(entry => ({
      ...entry,
      breads: entry.breads.map(bread => ({
        ...bread,
        orders: bread.orders.filter(order => order.userId === customerId)
      })).filter(bread => bread.orders.length > 0)
    })).filter(entry => entry.breads.length > 0);
  },

  calculateTotalRevenue: async () => {
    const allHistory = await orderHistoryService.getAll();
    return allHistory.reduce((total, entry) => {
      const entryTotal = entry.breads.reduce((breadTotal, bread) => {
        return breadTotal + bread.orders.reduce((orderTotal, order) => {
          return orderTotal + (order.quantity * bread.breadPrice);
        }, 0);
      }, 0);
      return total + entryTotal;
    }, 0);
  }
};

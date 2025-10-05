import { collections, docs, firestoreService } from './firestore';

export const orderHistoryService = {
  // Get all order history
  getAll: () => firestoreService.getDocs(collections.ordersHistory()),

  // Get order history by ID
  getById: (id) => firestoreService.getDoc(docs.ordersHistory(id)),

  // Subscribe to order history changes
  subscribe: (callback) => firestoreService.subscribeToCollection(collections.ordersHistory(), callback),

  // Delete order history entry
  delete: (id) => firestoreService.deleteDoc(docs.ordersHistory(id)),

  // Get orders by date range
  getByDateRange: async (startDate, endDate) => {
    const allHistory = await orderHistoryService.getAll();
    return allHistory.filter(entry => {
      const entryDate = entry.saleDate?.toDate();
      return entryDate >= startDate && entryDate <= endDate;
    });
  },

  // Get orders by customer
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

  // Calculate total revenue from history
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

import { collections, docs, firestoreService } from './firestore';

export const breadsService = {
  // Get all breads
  getAll: () => firestoreService.getDocs(collections.breads()),

  // Get bread by ID
  getById: (id) => firestoreService.getDoc(docs.bread(id)),

  // Subscribe to breads changes
  subscribe: (callback) => firestoreService.subscribeToCollection(collections.breads(), callback),

  // Create new bread
  create: async (breadData) => {
    const data = {
      name: breadData.name,
      description: breadData.description || '',
      availablePieces: Number(breadData.availablePieces),
      price: Number(breadData.price),
      show: !!breadData.show,
      isFocaccia: !!breadData.isFocaccia,
      claimedBy: [],
      createdAt: firestoreService.serverTimestamp()
    };
    return await firestoreService.addDoc(collections.breads(), data);
  },

  // Update bread
  update: async (id, breadData) => {
    const data = {
      name: breadData.name,
      description: breadData.description || '',
      availablePieces: Number(breadData.availablePieces),
      price: Number(breadData.price),
      show: !!breadData.show,
      isFocaccia: !!breadData.isFocaccia,
      updatedAt: firestoreService.serverTimestamp()
    };
    return await firestoreService.updateDoc(docs.bread(id), data);
  },

  // Delete bread
  delete: (id) => firestoreService.deleteDoc(docs.bread(id)),

  // Toggle bread visibility
  toggleShow: async (id, currentShow) => {
    return await firestoreService.updateDoc(docs.bread(id), { 
      show: !currentShow,
      updatedAt: firestoreService.serverTimestamp()
    });
  },

  // Add order to bread
  addOrder: async (breadId, orderData) => {
    const bread = await breadsService.getById(breadId);
    if (!bread) throw new Error('Bread not found');

    const newOrder = {
      userId: orderData.userId,
      name: orderData.name,
      phone: orderData.phone,
      quantity: Number(orderData.quantity),
      timestamp: new Date(),
      supplied: false,
      paid: false,
      kibbutzId: orderData.kibbutzId || null,
      kibbutzName: orderData.kibbutzName || null,
      discountPercentage: orderData.discountPercentage || 0
    };

    const updatedClaimedBy = [...(bread.claimedBy || []), newOrder];
    const newAvailablePieces = bread.availablePieces - newOrder.quantity;

    return await firestoreService.updateDoc(docs.bread(breadId), {
      claimedBy: updatedClaimedBy,
      availablePieces: newAvailablePieces,
      updatedAt: firestoreService.serverTimestamp()
    });
  },

  // Update order quantity
  updateOrderQuantity: async (breadId, orderIndex, newQuantity) => {
    const bread = await breadsService.getById(breadId);
    if (!bread || !bread.claimedBy[orderIndex]) throw new Error('Order not found');

    const oldQuantity = bread.claimedBy[orderIndex].quantity;
    const diff = newQuantity - oldQuantity;

    const updatedClaimedBy = bread.claimedBy.map((order, index) => 
      index === orderIndex ? { ...order, quantity: newQuantity } : order
    );

    return await firestoreService.updateDoc(docs.bread(breadId), {
      claimedBy: updatedClaimedBy,
      availablePieces: bread.availablePieces - diff,
      updatedAt: firestoreService.serverTimestamp()
    });
  },

  // Remove order
  removeOrder: async (breadId, orderIndex) => {
    const bread = await breadsService.getById(breadId);
    if (!bread || !bread.claimedBy[orderIndex]) throw new Error('Order not found');

    const removedOrder = bread.claimedBy[orderIndex];
    const updatedClaimedBy = bread.claimedBy.filter((_, index) => index !== orderIndex);

    return await firestoreService.updateDoc(docs.bread(breadId), {
      claimedBy: updatedClaimedBy,
      availablePieces: bread.availablePieces + removedOrder.quantity,
      updatedAt: firestoreService.serverTimestamp()
    });
  },

  // Toggle order supplied status
  toggleSupplied: async (breadId, orderIndex) => {
    const bread = await breadsService.getById(breadId);
    if (!bread || !bread.claimedBy[orderIndex]) throw new Error('Order not found');

    const updatedClaimedBy = bread.claimedBy.map((order, index) => 
      index === orderIndex ? { ...order, supplied: !order.supplied } : order
    );

    return await firestoreService.updateDoc(docs.bread(breadId), {
      claimedBy: updatedClaimedBy,
      updatedAt: firestoreService.serverTimestamp()
    });
  },

  // Toggle order paid status
  togglePaid: async (breadId, orderIndex) => {
    const bread = await breadsService.getById(breadId);
    if (!bread || !bread.claimedBy[orderIndex]) throw new Error('Order not found');

    const updatedClaimedBy = bread.claimedBy.map((order, index) => 
      index === orderIndex ? { ...order, paid: !order.paid } : order
    );

    return await firestoreService.updateDoc(docs.bread(breadId), {
      claimedBy: updatedClaimedBy,
      updatedAt: firestoreService.serverTimestamp()
    });
  },

  // End sale - archive and clear all orders
  endSale: async () => {
    const allBreads = await breadsService.getAll();
    
    // Archive current orders
    const archiveData = {
      saleDate: firestoreService.serverTimestamp(),
      breads: allBreads.map(bread => ({
        breadId: bread.id,
        breadName: bread.name,
        breadDescription: bread.description,
        breadPrice: bread.price,
        orders: (bread.claimedBy || []).map(order => ({ ...order }))
      }))
    };
    
    await firestoreService.addDoc(collections.ordersHistory(), archiveData);

    // Clear all orders from breads
    const batch = firestoreService.batch();
    allBreads.forEach(bread => {
      batch.update(docs.bread(bread.id), { 
        claimedBy: [],
        updatedAt: firestoreService.serverTimestamp()
      });
    });
    
    return await batch.commit();
  }
};

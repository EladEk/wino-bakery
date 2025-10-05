import { collections, docs, firestoreService } from './firestore';

export const breadsService = {
  getAll: () => firestoreService.getDocs(collections.breads()),

  getById: (id) => firestoreService.getDoc(docs.bread(id)),

  subscribe: (callback) => firestoreService.subscribeToCollection(collections.breads(), callback),

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

  delete: (id) => firestoreService.deleteDoc(docs.bread(id)),

  toggleShow: async (id, currentShow) => {
    return await firestoreService.updateDoc(docs.bread(id), { 
      show: !currentShow,
      updatedAt: firestoreService.serverTimestamp()
    });
  },

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
      discountPercentage: orderData.discountPercentage || 0,
      surchargeType: orderData.surchargeType || 'none',
      surchargeValue: orderData.surchargeValue || 0
    };

    const updatedClaimedBy = [...(bread.claimedBy || []), newOrder];
    const newAvailablePieces = bread.availablePieces - newOrder.quantity;

    return await firestoreService.updateDoc(docs.bread(breadId), {
      claimedBy: updatedClaimedBy,
      availablePieces: newAvailablePieces,
      updatedAt: firestoreService.serverTimestamp()
    });
  },

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

  endSale: async () => {
    const allBreads = await breadsService.getAll();
    
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

    const batch = firestoreService.batch();
    allBreads.forEach(bread => {
      batch.update(docs.bread(bread.id), { 
        claimedBy: [],
        updatedAt: firestoreService.serverTimestamp()
      });
    });
    
    return await batch.commit();
  },

  updateOrderStatus: async (breadId, userId, field, value) => {
    const breadDoc = await firestoreService.getDoc(docs.bread(breadId));
    
    if (!breadDoc) {
      throw new Error(`Bread not found with ID: ${breadId}`);
    }
    
    const updatedClaimedBy = breadDoc.claimedBy.map(claim => {
      if (claim.userId === userId) {
        return {
          ...claim,
          [field]: value
        };
      }
      return claim;
    });

    return await firestoreService.updateDoc(docs.bread(breadId), {
      claimedBy: updatedClaimedBy,
      updatedAt: firestoreService.serverTimestamp()
    });
  }
};

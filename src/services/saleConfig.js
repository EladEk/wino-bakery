import { docs, firestoreService } from './firestore';

const CONFIG_ID = 'saleDate';

export const saleConfigService = {
  // Get sale configuration
  get: async () => {
    return await firestoreService.getDoc(docs.config(CONFIG_ID));
  },

  // Subscribe to sale configuration changes
  subscribe: (callback) => {
    return firestoreService.subscribeToDoc(docs.config(CONFIG_ID), callback);
  },

  // Update sale configuration
  update: async (configData) => {
    const data = {
      value: configData.saleDate,
      startHour: configData.startHour,
      endHour: configData.endHour,
      address: configData.address,
      bitNumber: configData.bitNumber,
      updatedAt: firestoreService.serverTimestamp()
    };
    return await firestoreService.setDoc(docs.config(CONFIG_ID), data, { merge: true });
  },

  // Get sale date
  getSaleDate: async () => {
    const config = await saleConfigService.get();
    return config?.value || '';
  },

  // Get pickup address
  getPickupAddress: async () => {
    const config = await saleConfigService.get();
    return config?.address || '';
  },

  // Get payment info
  getPaymentInfo: async () => {
    const config = await saleConfigService.get();
    return {
      bitNumber: config?.bitNumber || '',
      startHour: config?.startHour || '',
      endHour: config?.endHour || ''
    };
  }
};

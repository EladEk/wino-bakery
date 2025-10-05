import { docs, firestoreService } from './firestore';

const CONFIG_ID = 'saleDate';

export const saleConfigService = {
  get: async () => {
    return await firestoreService.getDoc(docs.config(CONFIG_ID));
  },

  subscribe: (callback) => {
    return firestoreService.subscribeToDoc(docs.config(CONFIG_ID), callback);
  },

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

  getSaleDate: async () => {
    const config = await saleConfigService.get();
    return config?.value || '';
  },

  getPickupAddress: async () => {
    const config = await saleConfigService.get();
    return config?.address || '';
  },

  getPaymentInfo: async () => {
    const config = await saleConfigService.get();
    return {
      bitNumber: config?.bitNumber || '',
      startHour: config?.startHour || '',
      endHour: config?.endHour || ''
    };
  }
};

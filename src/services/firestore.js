import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  writeBatch, 
  serverTimestamp 
} from 'firebase/firestore';

export const collections = {
  breads: () => collection(db, 'breads'),
  users: () => collection(db, 'users'),
  config: () => collection(db, 'config'),
  ordersHistory: () => collection(db, 'ordersHistory'),
  kibbutzim: () => collection(db, 'kibbutzim'),
  workshopTemplates: () => collection(db, 'workshopTemplates'),
  activeWorkshops: () => collection(db, 'activeWorkshops'),
  workshopHistory: () => collection(db, 'workshopHistory')
};

export const docs = {
  bread: (id) => doc(db, 'breads', id),
  user: (id) => doc(db, 'users', id),
  config: (id) => doc(db, 'config', id),
  ordersHistory: (id) => doc(db, 'ordersHistory', id),
  kibbutz: (id) => doc(db, 'kibbutzim', id),
  workshopTemplate: (id) => doc(db, 'workshopTemplates', id),
  activeWorkshop: (id) => doc(db, 'activeWorkshops', id),
  workshopHistory: (id) => doc(db, 'workshopHistory', id)
};

export const firestoreService = {
  getDoc: async (docRef) => {
    const snap = await getDoc(docRef);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  getDocs: async (collectionRef) => {
    const snap = await getDocs(collectionRef);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  setDoc: async (docRef, data, options = {}) => {
    return await setDoc(docRef, data, options);
  },

  updateDoc: async (docRef, data) => {
    return await updateDoc(docRef, data);
  },

  deleteDoc: async (docRef) => {
    return await deleteDoc(docRef);
  },

  addDoc: async (collectionRef, data) => {
    return await addDoc(collectionRef, data);
  },

  subscribeToCollection: (collectionRef, callback) => {
    return onSnapshot(collectionRef, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(docs);
    });
  },

  subscribeToDoc: (docRef, callback) => {
    return onSnapshot(docRef, (snapshot) => {
      const doc = snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
      callback(doc);
    });
  },

  queryDocs: async (collectionRef, constraints) => {
    const q = query(collectionRef, ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  batch: () => writeBatch(db),

  serverTimestamp: () => serverTimestamp()
};

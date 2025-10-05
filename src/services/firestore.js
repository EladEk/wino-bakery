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

// Collection references
export const collections = {
  breads: () => collection(db, 'breads'),
  users: () => collection(db, 'users'),
  config: () => collection(db, 'config'),
  ordersHistory: () => collection(db, 'ordersHistory'),
  kibbutzim: () => collection(db, 'kibbutzim')
};

// Document references
export const docs = {
  bread: (id) => doc(db, 'breads', id),
  user: (id) => doc(db, 'users', id),
  config: (id) => doc(db, 'config', id),
  ordersHistory: (id) => doc(db, 'ordersHistory', id),
  kibbutz: (id) => doc(db, 'kibbutzim', id)
};

// Generic Firestore operations
export const firestoreService = {
  // Get single document
  getDoc: async (docRef) => {
    const snap = await getDoc(docRef);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  // Get all documents from collection
  getDocs: async (collectionRef) => {
    const snap = await getDocs(collectionRef);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // Set document
  setDoc: async (docRef, data, options = {}) => {
    return await setDoc(docRef, data, options);
  },

  // Update document
  updateDoc: async (docRef, data) => {
    return await updateDoc(docRef, data);
  },

  // Delete document
  deleteDoc: async (docRef) => {
    return await deleteDoc(docRef);
  },

  // Add document
  addDoc: async (collectionRef, data) => {
    return await addDoc(collectionRef, data);
  },

  // Subscribe to collection changes
  subscribeToCollection: (collectionRef, callback) => {
    return onSnapshot(collectionRef, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(docs);
    });
  },

  // Subscribe to document changes
  subscribeToDoc: (docRef, callback) => {
    return onSnapshot(docRef, (snapshot) => {
      const doc = snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
      callback(doc);
    });
  },

  // Query documents
  queryDocs: async (collectionRef, constraints) => {
    const q = query(collectionRef, ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // Batch operations
  batch: () => writeBatch(db),

  // Server timestamp
  serverTimestamp: () => serverTimestamp()
};

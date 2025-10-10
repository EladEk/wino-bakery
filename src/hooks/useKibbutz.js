import { useState, useEffect, useCallback } from 'react';
import { kibbutzService } from '../services/kibbutz';
import { usersService } from '../services/users';

export const useKibbutz = () => {
  const [kibbutzim, setKibbutzim] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = kibbutzService.subscribe((kibbutzimData) => {
      setKibbutzim(kibbutzimData);
      setLoading(false);
      setError(null);
    });

    return () => unsubscribe();
  }, []);

  const createKibbutz = useCallback(async (kibbutzData) => {
    try {
      setError(null);
      return await kibbutzService.create(kibbutzData);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const updateKibbutz = useCallback(async (id, kibbutzData) => {
    try {
      setError(null);
      return await kibbutzService.update(id, kibbutzData);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const deleteKibbutz = useCallback(async (id) => {
    try {
      setError(null);
      return await kibbutzService.delete(id);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const toggleKibbutzActive = useCallback(async (id, currentStatus) => {
    try {
      setError(null);
      return await kibbutzService.toggleActive(id, currentStatus);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const getKibbutzOrders = useCallback(async (kibbutzId) => {
    try {
      setError(null);
      return await kibbutzService.getOrdersByKibbutz(kibbutzId);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const calculateKibbutzRevenue = useCallback(async (kibbutzId) => {
    try {
      setError(null);
      return await kibbutzService.calculateKibbutzRevenue(kibbutzId);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const getKibbutzUsers = useCallback(async (kibbutzId) => {
    try {
      setError(null);
      return await usersService.getUsersByKibbutz(kibbutzId);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const removeUserFromKibbutz = useCallback(async (userId) => {
    try {
      setError(null);
      return await usersService.removeFromKibbutz(userId);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    kibbutzim,
    loading,
    error,
    createKibbutz,
    updateKibbutz,
    deleteKibbutz,
    toggleKibbutzActive,
    getKibbutzOrders,
    calculateKibbutzRevenue,
    getKibbutzUsers,
    removeUserFromKibbutz
  };
};

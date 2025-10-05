import { useState, useEffect } from 'react';
import { breadsService } from '../services/breads';

export const useBreads = () => {
  const [breads, setBreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = breadsService.subscribe((breadsData) => {
      setBreads(breadsData);
      setLoading(false);
      setError(null);
    });

    return () => unsubscribe();
  }, []);

  const createBread = async (breadData) => {
    try {
      setError(null);
      return await breadsService.create(breadData);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateBread = async (id, breadData) => {
    try {
      setError(null);
      return await breadsService.update(id, breadData);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteBread = async (id) => {
    try {
      setError(null);
      return await breadsService.delete(id);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const toggleBreadShow = async (id, currentShow) => {
    try {
      setError(null);
      return await breadsService.toggleShow(id, currentShow);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const endSale = async () => {
    try {
      setError(null);
      return await breadsService.endSale();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    breads,
    loading,
    error,
    createBread,
    updateBread,
    deleteBread,
    toggleBreadShow,
    endSale
  };
};

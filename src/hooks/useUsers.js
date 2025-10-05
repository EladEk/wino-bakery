import { useState, useEffect } from 'react';
import { usersService } from '../services/users';

export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = usersService.subscribe((usersData) => {
      setUsers(usersData);
      setLoading(false);
      setError(null);
    });

    return () => unsubscribe();
  }, []);

  const createUser = async (userId, userData) => {
    try {
      setError(null);
      return await usersService.create(userId, userData);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateUser = async (userId, userData) => {
    try {
      setError(null);
      return await usersService.update(userId, userData);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateUserProfile = async (userId, profileData) => {
    try {
      setError(null);
      return await usersService.updateProfile(userId, profileData);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const toggleAdmin = async (userId, currentStatus) => {
    try {
      setError(null);
      return await usersService.toggleAdmin(userId, currentStatus);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const toggleBlocked = async (userId, currentStatus) => {
    try {
      setError(null);
      return await usersService.toggleBlocked(userId, currentStatus);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const checkNameExists = async (name, excludeUserId = null) => {
    try {
      setError(null);
      return await usersService.checkNameExists(name, excludeUserId);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const searchUsers = async (searchTerm) => {
    try {
      setError(null);
      return await usersService.searchUsers(searchTerm);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    users,
    loading,
    error,
    createUser,
    updateUser,
    updateUserProfile,
    toggleAdmin,
    toggleBlocked,
    checkNameExists,
    searchUsers
  };
};

import { useState, useEffect } from 'react';
import api from '../services/api';
import { User } from '../types/auth';

interface UserFilters {
  nombre?: string;
  email?: string;
  rol?: string;
  isActive?: boolean;
}

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<UserFilters>({});

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users', { params: filters });
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: number) => {
    try {
      await api.patch(`/users/${userId}/toggle-status`);
      await fetchUsers();
      return true;
    } catch (error) {
      console.error('Error toggling user status:', error);
      return false;
    }
  };

  const deleteUser = async (userId: number) => {
    try {
      await api.delete(`/users/${userId}`);
      await fetchUsers();
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  };

  return { users, loading, filters, setFilters, toggleUserStatus, deleteUser };
}; 
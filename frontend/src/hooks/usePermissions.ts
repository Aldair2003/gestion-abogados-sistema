import { useState, useEffect } from 'react';
import api from '../services/api';

interface Permission {
  id: number;
  nombre: string;
  descripcion: string;
  modulo: string;
}

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const response = await api.get('/permissions');
      setPermissions(response.data);
    } catch (error) {
      console.error('Error fetching permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const assignPermission = async (userId: number, permissionId: number) => {
    try {
      await api.post('/permissions/assign', { userId, permissionIds: [permissionId] });
      return true;
    } catch (error) {
      console.error('Error assigning permission:', error);
      return false;
    }
  };

  const removePermission = async (userId: number, permissionId: number) => {
    try {
      await api.delete(`/permissions/user/${userId}/permission/${permissionId}`);
      return true;
    } catch (error) {
      console.error('Error removing permission:', error);
      return false;
    }
  };

  return { permissions, loading, assignPermission, removePermission };
}; 
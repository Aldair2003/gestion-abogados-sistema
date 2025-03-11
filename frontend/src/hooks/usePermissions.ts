import { useState, useEffect } from 'react';
import { permissionService } from '../services/permissionService';

interface Permission {
  view: boolean;
  edit: boolean;
  delete: boolean;
  createExpedientes: boolean;
}

interface CantonPermission {
  cantonId: string;
  permissions: Permission;
}

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<CantonPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const response = await permissionService.getCantonPermissions();
      setPermissions(response);
      setError(null);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setError('Error al cargar los permisos');
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const assignPermission = async (data: {
    userId: string;
    cantonIds: string[];
    permissions: Permission;
  }) => {
    try {
      await permissionService.assignCantonPermission(data);
      await fetchPermissions(); // Recargar permisos después de asignar
      return true;
    } catch (error) {
      console.error('Error assigning permission:', error);
      return false;
    }
  };

  const removePermission = async (userId: string, cantonId: string) => {
    try {
      await permissionService.revokeCantonPermission(userId, cantonId);
      await fetchPermissions(); // Recargar permisos después de revocar
      return true;
    } catch (error) {
      console.error('Error removing permission:', error);
      return false;
    }
  };

  return { 
    permissions, 
    loading, 
    error,
    assignPermission, 
    removePermission,
    refreshPermissions: fetchPermissions 
  };
}; 
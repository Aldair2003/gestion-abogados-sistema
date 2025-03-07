import { useState } from 'react';
import api from '../services/api';
import { UserWithActivity } from '../types/user';

export const useUserDetails = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserWithActivity | null>(null);

  const fetchUserDetails = async (userId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/users/${userId}/details`);
      if (response.data?.status === 'success') {
        const userData = response.data.data;
        // Convertir ActivityLog a Activity si es necesario
        const userWithActivity: UserWithActivity = {
          ...userData,
          activityLogs: userData.activityLogs?.map((log: any) => ({
            ...log,
            category: log.category || 'ADMINISTRATIVE',
            isImportant: log.isImportant || false
          }))
        };
        setUserDetails(userWithActivity);
      } else {
        setError('Error al cargar los detalles del usuario');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error al cargar los detalles del usuario');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    userDetails,
    fetchUserDetails
  };
}; 
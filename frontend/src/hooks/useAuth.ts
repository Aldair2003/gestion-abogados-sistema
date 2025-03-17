import { useCallback } from 'react';
import { useAuth as useAuthContext } from '../contexts/AuthContext';
import api from '../services/api';

export const useAuth = () => {
  const context = useAuthContext();
  
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      // Siempre limpiar el estado local y redirigir, incluso si falla la petición
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      context.updateUser(null);
      window.location.href = '/login'; // Usar window.location para forzar recarga completa
    }
  }, [context]);

  const refreshToken = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No hay refresh token disponible');
      }

      const response = await api.post('/users/refresh-token', { refreshToken });
      const { token } = response.data.data;

      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      return token;
    } catch (error) {
      console.error('Error al renovar el token:', error);
      throw error;
    }
  }, []);

  return {
    ...context,
    logout,
    refreshToken
  };
}; 
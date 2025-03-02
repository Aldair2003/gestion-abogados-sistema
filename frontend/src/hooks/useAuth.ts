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
      localStorage.removeItem('user');
      context.updateUser(null);
      window.location.href = '/login'; // Usar window.location para forzar recarga completa
    }
  }, [context]);

  return {
    ...context,
    logout
  };
}; 
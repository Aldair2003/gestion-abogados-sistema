import api from './api';
import { UserRole } from '../types/user';

export interface RoleChangeRequest {
  userId: number;
  newRole: UserRole;
  reason: string;
}

export const roleService = {
  changeUserRole: async (request: RoleChangeRequest) => {
    try {
      const response = await api.post('/users/change-role', request);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al cambiar el rol del usuario');
    }
  },

  // Obtener roles disponibles
  getAvailableRoles: () => {
    return Object.values(UserRole);
  },

  // Validar si un usuario puede cambiar a cierto rol
  validateRoleChange: (currentRole: UserRole, newRole: UserRole): boolean => {
    // Aquí puedes agregar lógica adicional de validación si es necesaria
    return currentRole !== newRole;
  }
}; 
import api from './api';

interface PermissionData {
  userId: string;
  cantonId?: string;
  personaId?: string;
  permissions: {
    view: boolean;
    edit: boolean;
    delete: boolean;
    createExpedientes: boolean;
  };
}

interface Canton {
  id: number;
  nombre: string;
  provincia: string;
}

interface AssignCantonPermissionRequest {
  userId: string;
  cantonIds: string[];
  permissions: {
    view: boolean;
    edit: boolean;
    delete: boolean;
    createExpedientes: boolean;
  };
}

export const permissionService = {
  // Permisos de Cantones
  getCantonPermissions: async () => {
    try {
      const response = await api.get('/permissions/canton');
      return response.data?.data?.permissions || [];
    } catch (error) {
      console.error('Error al obtener permisos de cantones:', error);
      throw error;
    }
  },

  getAssignedCantones: async () => {
    try {
      const response = await api.get('/permissions/canton/assigned');
      console.log('Respuesta completa de cantones asignados:', response);
      
      const cantones = response.data?.data?.cantones || [];
      console.log('Cantones asignados extraídos:', cantones);
      
      // Asegurarse de que los cantones tengan el formato correcto
      const formattedCantones = cantones.map((canton: any) => ({
        id: canton.id.toString(),
        nombre: canton.nombre || '',
        codigo: canton.codigo || '',
        imagenUrl: canton.imagenUrl || '',
        isActive: canton.isActive ?? true,
        createdAt: canton.createdAt || new Date().toISOString(),
        updatedAt: canton.updatedAt || new Date().toISOString(),
        totalJueces: canton.totalJueces || 0,
        totalPersonas: canton.totalPersonas || 0
      }));
      
      console.log('Cantones asignados formateados:', formattedCantones);
      return formattedCantones;
    } catch (error) {
      console.error('Error detallado al obtener cantones asignados:', error);
      throw error;
    }
  },

  assignCantonPermission: async (data: AssignCantonPermissionRequest) => {
    try {
      const response = await api.post('/permissions/canton/assign', data);
      return response.data;
    } catch (error) {
      console.error('Error al asignar permisos de cantón:', error);
      throw error;
    }
  },

  assignMultipleCantonPermissions: async (data: AssignCantonPermissionRequest) => {
    const response = await api.post('/permissions/canton/assign', data);
    return response.data;
  },

  updateCantonPermission: (permissionId: string, data: PermissionData) => {
    return api.put(`/permissions/canton/${permissionId}`, data);
  },

  revokeCantonPermission: (userId: string, cantonId: string) => {
    return api.delete(`/permissions/cantones/${cantonId}/usuarios/${userId}`);
  },

  // Permisos de Personas
  getPersonaPermissions: () => {
    return api.get('/permissions/persona');
  },

  assignPersonaPermission: (data: PermissionData) => {
    return api.post('/permissions/persona/assign', data);
  },

  updatePersonaPermission: (permissionId: string, data: PermissionData) => {
    return api.put(`/permissions/persona/${permissionId}`, data);
  },

  revokePersonaPermission: (permissionId: string) => {
    return api.delete(`/permissions/persona/${permissionId}`);
  },

  // Obtener usuarios y recursos
  getCollaborators: async () => {
    const response = await api.get('/users/collaborators');
    return response;
  },

  getCantones: async () => {
    try {
      const response = await api.get('/cantones');
      console.log('Respuesta completa de cantones:', response);
      
      // Extraer el array de cantones de la estructura de paginación
      const cantones = response.data?.data?.cantones || [];
      console.log('Array de cantones extraído:', cantones);
      
      // Mapear los cantones al formato esperado
      const formattedCantones = cantones.map((canton: any) => ({
        id: canton.id.toString(),
        nombre: canton.nombre,
        codigo: canton.codigo || '',
        imagenUrl: canton.imagenUrl || '',
        isActive: canton.isActive ?? true,
        createdAt: canton.createdAt || new Date().toISOString(),
        updatedAt: canton.updatedAt || new Date().toISOString(),
        totalJueces: canton.jueces?.length || 0,
        totalPersonas: canton.totalPersonas || 0
      }));
      
      console.log('Cantones formateados:', formattedCantones);
      return formattedCantones;
    } catch (error) {
      console.error('Error obteniendo cantones:', error);
      return [];
    }
  },

  getPersonas: () => {
    return api.get('/personas');
  },

  // Historial de actividades
  getPermissionActivities: (filters?: {
    userId?: string;
    cantonId?: string;
    personaId?: string;
    startDate?: string;
    endDate?: string;
    type?: 'canton' | 'persona';
    action?: 'assign' | 'update' | 'revoke';
  }) => {
    return api.get('/activities/permissions', { params: filters });
  },

  getPermissionActivityDetails: (activityId: string) => {
    return api.get(`/activities/permissions/${activityId}`);
  }
}; 
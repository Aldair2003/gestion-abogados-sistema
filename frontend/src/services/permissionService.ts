import api from './api';
import { User, Canton, Persona, PersonaPermission, CantonPermission, BasePermissionData } from '../types/permissions';

interface PermissionData extends BasePermissionData {
  userId: string;
  cantonId?: string;
  personaId?: string;
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

// Interfaz para la asignación de permisos de personas
interface AssignPersonaPermissionRequest {
  userId: number;
  personaIds: number[];
  cantonId: number;
  permissions: {
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
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
        totalPersonas: canton.totalPersonas || 0,
        totalDocumentos: canton.totalDocumentos || 0
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

  // Función para sincronizar permisos de personas cuando se eliminan o actualizan permisos de cantones
  syncPersonaPermissionsAfterCantonChange: async (userId: string, cantonIds: string[], action: 'update' | 'delete' | 'add', cantonPermissions?: { view: boolean, edit: boolean, delete: boolean, createExpedientes: boolean }) => {
    try {
      console.log(`Sincronizando permisos de personas después de ${action === 'update' ? 'actualizar' : action === 'delete' ? 'eliminar' : 'agregar'} permisos de cantón`, {
        userId,
        cantonIds,
        action,
        cantonPermissions
      });
      
      // Obtener todos los permisos de personas
      const personaPermissions = await permissionService.getPersonaPermissions(true);
      
      // Si la acción es eliminar, revocamos los permisos correspondientes
      if (action === 'delete') {
        // Filtrar los permisos que corresponden al usuario y cantones
        const permissionsToRevoke = personaPermissions.filter(permission => {
          // Verificar si el permiso pertenece al usuario
          if (permission.user.id !== userId) {
            return false;
          }
          
          // Verificar si la persona tiene un cantón que está en la lista de cantones a eliminar
          if (permission.persona?.canton && cantonIds.includes(permission.persona.canton.id)) {
            return true;
          }
          
          // Verificar si el permiso tiene cantones que están en la lista de cantones a eliminar
          if (permission.cantones && permission.cantones.some(c => cantonIds.includes(c.id))) {
            return true;
          }
          
          return false;
        });
        
        console.log('Permisos de personas a revocar:', permissionsToRevoke);
        
        // Revocar cada permiso
        for (const permission of permissionsToRevoke) {
          await permissionService.revokePersonaPermission(permission.id);
          console.log(`Permiso de persona ${permission.id} revocado`);
        }
        
        return {
          status: 'success',
          message: `${permissionsToRevoke.length} permisos de personas sincronizados correctamente`
        };
      } 
      // Si la acción es actualizar, actualizamos los permisos correspondientes
      else if (action === 'update' || action === 'add') {
        // Filtrar los permisos que corresponden al usuario y cantones
        const permissionsToUpdate = personaPermissions.filter(permission => {
          // Verificar si el permiso pertenece al usuario
          if (permission.user.id !== userId) {
            return false;
          }
          
          // Verificar si la persona tiene un cantón que está en la lista de cantones a actualizar
          if (permission.persona?.canton && cantonIds.includes(permission.persona.canton.id)) {
            return true;
          }
          
          // Verificar si el permiso tiene cantones que están en la lista de cantones a actualizar
          if (permission.cantones && permission.cantones.some(c => cantonIds.includes(c.id))) {
            return true;
          }
          
          return false;
        });
        
        console.log('Permisos de personas a actualizar:', permissionsToUpdate);
        
        // Si tenemos permisos de cantón, actualizamos los permisos de personas correspondientes
        if (cantonPermissions && permissionsToUpdate.length > 0) {
          for (const permission of permissionsToUpdate) {
            // Mapear los permisos de cantón a los permisos de personas
            const personaPermissionUpdate = {
              canView: cantonPermissions.view,
              canCreate: cantonPermissions.createExpedientes || cantonPermissions.edit,
              canEdit: cantonPermissions.edit
            };
            
            console.log(`Actualizando permiso de persona ${permission.id}:`, personaPermissionUpdate);
            
            // Actualizar el permiso
            await permissionService.updatePersonaPermission(permission.id, personaPermissionUpdate);
          }
          
          return {
            status: 'success',
            message: `${permissionsToUpdate.length} permisos de personas actualizados correctamente`
          };
        }
        
        // Si es un nuevo cantón, podríamos necesitar asignar permisos a las personas de ese cantón
        if (action === 'add' && cantonPermissions) {
          // Obtener las personas del cantón
          try {
            // Aquí podríamos implementar una lógica para asignar permisos automáticamente a las personas del cantón
            console.log(`Cantones ${cantonIds.join(', ')} agregados al usuario ${userId}. Se podrían asignar permisos automáticamente a las personas de estos cantones.`);
            
            // Disparar evento de sincronización para actualizar la vista
            return {
              status: 'success',
              message: `Cantones agregados correctamente. Los permisos de personas se actualizarán cuando se asignen específicamente.`
            };
          } catch (error) {
            console.error('Error al obtener personas de los cantones:', error);
          }
        }
        
        return {
          status: 'success',
          message: `${permissionsToUpdate.length} permisos de personas verificados correctamente`
        };
      }
      
      return {
        status: 'success',
        message: 'Sincronización completada'
      };
    } catch (error) {
      console.error('Error sincronizando permisos de personas:', error);
      throw error;
    }
  },

  // Permisos de Personas
  getPersonaPermissions: async (forceReload = false): Promise<PersonaPermission[]> => {
    try {
      // Agregar un parámetro de timestamp para evitar caché
      const timestamp = forceReload ? `?t=${new Date().getTime()}` : '';
      
      // Usar la ruta correcta para obtener permisos de personas
      const response = await api.get(`/permissions/persona${timestamp}`);
      console.log('Respuesta de permisos de personas:', response);
      console.log('Datos de respuesta:', response.data);
      
      // Transformar los datos para asegurarnos de que los cantones estén incluidos
      const permissions = response.data?.data || [];
      console.log('Permisos extraídos:', permissions);
      
      // Obtener los cantones asignados a cada usuario para complementar la información
      const cantonPermissionsResponse = await permissionService.getCantonPermissions();
      console.log('Permisos de cantones para complementar:', cantonPermissionsResponse);
      
      // Agrupar los permisos de cantones por usuario
      const cantonPermissionsByUser: Record<string, Canton[]> = {};
      cantonPermissionsResponse.forEach((cantonPerm: any) => {
        if (!cantonPermissionsByUser[cantonPerm.user.id]) {
          cantonPermissionsByUser[cantonPerm.user.id] = [];
        }
        cantonPermissionsByUser[cantonPerm.user.id].push({
          id: cantonPerm.canton.id.toString(),
          nombre: cantonPerm.canton.nombre || ''
        });
      });
      
      console.log('Cantones agrupados por usuario:', cantonPermissionsByUser);
      
      // Mapear los permisos para asegurarnos de que tienen el formato correcto
      const formattedPermissions = permissions.map((permission: any) => {
        const userId = permission.user.id.toString();
        const userCantones = cantonPermissionsByUser[userId] || [];
        
        return {
          id: permission.id.toString(),
          user: {
            id: userId,
            nombre: permission.user.nombre || '',
            email: permission.user.email || '',
            photoUrl: permission.user.photoUrl || undefined
          },
          persona: permission.persona ? {
            id: permission.persona.id.toString(),
            nombre: `${permission.persona.nombres} ${permission.persona.apellidos}`,
            cedula: permission.persona.cedula || '',
            cantonId: permission.persona.canton?.id.toString() || '',
            canton: permission.persona.canton ? {
              id: permission.persona.canton.id.toString(),
              nombre: permission.persona.canton.nombre || ''
            } : undefined
          } : undefined,
          // Incluir todos los cantones asignados al usuario
          cantones: userCantones.length > 0 ? userCantones : 
                   (Array.isArray(permission.cantones) ? permission.cantones.map((canton: any) => ({
                     id: canton.id.toString(),
                     nombre: canton.nombre || ''
                   })) : []),
          canView: permission.canView || false,
          canManage: permission.canCreate || permission.canEdit || false,
          updatedAt: permission.updatedAt || new Date().toISOString()
        };
      });
      
      console.log('Permisos de personas formateados con todos los cantones:', formattedPermissions);
      return formattedPermissions;
    } catch (error) {
      console.error('Error al obtener permisos de personas:', error);
      throw error;
    }
  },

  assignPersonaPermission: (data: AssignPersonaPermissionRequest) => {
    return api.post('/permissions/persona/assign', data);
  },

  updatePersonaPermission: (permissionId: string, data: { canView: boolean, canCreate: boolean, canEdit: boolean }) => {
    return api.put(`/permissions/persona/${permissionId}`, data);
  },

  revokePersonaPermission: (permissionIdOrUserId: string, personaId?: string) => {
    // Si se proporciona personaId, entonces el primer parámetro es userId
    if (personaId) {
      return api.delete(`/permissions/persona/user/${permissionIdOrUserId}/persona/${personaId}`);
    }
    // Caso original: el primer parámetro es permissionId
    return api.delete(`/permissions/persona/${permissionIdOrUserId}`);
  },

  // Obtener usuarios y recursos
  getCollaborators: async () => {
    try {
      const response = await api.get('/users/collaborators');
      console.log('Respuesta de colaboradores:', response.data);
      
      // Asegurarse de que los datos tengan el formato correcto
      if (response.data && response.data.data) {
        const collaborators = response.data.data.map((user: any) => ({
          id: user.id.toString(),
          nombre: user.nombre || '',
          email: user.email || '',
          cedula: user.cedula || '',
          telefono: user.telefono || '',
          rol: user.rol || '',
          isProfileCompleted: user.isProfileCompleted || false,
          photoUrl: user.photoUrl || undefined,
          cantones: Array.isArray(user.cantones) ? user.cantones.map((canton: any) => ({
            id: canton.id.toString(),
            nombre: canton.nombre || '',
            provincia: canton.provincia || ''
          })) : []
        }));
        
        console.log('Colaboradores procesados:', collaborators);
        return { data: collaborators };
      }
      
      return { data: [] };
    } catch (error) {
      console.error('Error al obtener colaboradores:', error);
      return { data: [] };
    }
  },

  getCantones: async () => {
    try {
      const response = await api.get('/cantones');
      console.log('Respuesta completa de cantones:', response);
      
      const cantones = response.data?.data?.cantones || [];
      console.log('Array de cantones extraído:', cantones);
      
      const formattedCantones = cantones.map((canton: any) => ({
        id: canton.id.toString(),
        nombre: canton.nombre,
        codigo: canton.codigo || '',
        imagenUrl: canton.imagenUrl || '',
        isActive: canton.isActive ?? true,
        createdAt: canton.createdAt || new Date().toISOString(),
        updatedAt: canton.updatedAt || new Date().toISOString(),
        totalJueces: canton.jueces?.length || 0,
        totalPersonas: canton.totalPersonas || 0,
        totalDocumentos: canton.totalDocumentos || 0
      }));
      
      console.log('Cantones formateados:', formattedCantones);
      return formattedCantones;
    } catch (error) {
      console.error('Error obteniendo cantones:', error);
      return [];
    }
  },

  getPersonas: async (): Promise<Persona[]> => {
    try {
      const response = await api.get('/personas/all');
      return response.data?.data?.personas || [];
    } catch (error) {
      console.error('\n            \n            \n           ', error);
      throw error;
    }
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
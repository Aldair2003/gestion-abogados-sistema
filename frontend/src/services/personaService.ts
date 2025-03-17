import api from './api';
import { toast } from 'react-hot-toast';
import { permissionService } from './permissionService';
import { PersonaPermission } from '../types/permissions';

export interface Persona {
  id: number;
  cedula: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  email?: string;
  domicilio?: string;
  contactoRef?: string;
  matriculasVehiculo?: string[];
  documentosCompletos: boolean;
  creadorId?: number;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: number;
  tipo: 'CEDULA' | 'VOTACION' | 'MATRICULA' | 'LICENCIA' | 'RUC' | 'RESIDENCIA';
  url: string;
  filename: string;
  mimetype: string;
  size: number;
  personaId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  estado: 'PENDIENTE' | 'VERIFICADO' | 'RECHAZADO';
  verificadorId?: string;
  motivoRechazo?: string;
}

export interface FilterParams {
  search?: string;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
  documentalFilter?: 'all' | 'complete' | 'incomplete';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  status: 'success' | 'error';
  message?: string;
  data: {
    personas: T[];
    stats: {
      totalDocumentos: number;
      promedioDocumentosPorPersona: number;
    };
    pagination: {
      total: number;
      pages: number;
      page: number;
      limit: number;
      hasMore: boolean;
    };
  };
}

interface CreatePersonaData {
  cedula: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  matriculasVehiculo: string[] | string;
  email?: string | null;
  domicilio: string;
  contactoRef?: string | null;
}

export interface PersonasResponse {
  status: string;
  data: {
    personas: Persona[];
    stats: {
      totalDocumentos: number;
      promedioDocumentosPorPersona: number;
    };
    pagination: {
      total: number;
      pages: number;
      page: number;
      limit: number;
      hasMore: boolean;
    };
  };
}

class PersonaService {
  async getPersonas(cantonId: string, params: FilterParams = {}): Promise<PaginatedResponse<Persona>> {
    try {
      if (!cantonId || isNaN(Number(cantonId))) {
        throw new Error('ID de cantón inválido');
      }

      console.log('=== Inicio getPersonas ===');
      console.log('Parámetros:', { cantonId, params });
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const url = `/personas/canton/${cantonId}/personas?${queryParams.toString()}`;
      console.log('=== URL Construida ===');
      console.log('URL base:', api.defaults.baseURL);
      console.log('URL relativa:', url);
      console.log('URL completa:', api.defaults.baseURL + url);
      
      console.log('Realizando petición GET...');
      const response = await api.get(url);
      console.log('Respuesta recibida:', response);
      
      if (!response.data) {
        console.error('No hay datos en la respuesta');
        throw new Error('No se recibieron datos del servidor');
      }
      
      console.log('Datos de la respuesta:', response.data);
      
      if (!response.data.data) {
        console.warn('No hay datos en response.data.data, retornando estructura vacía');
        return {
          status: 'success',
          data: {
            personas: [],
            stats: {
              totalDocumentos: 0,
              promedioDocumentosPorPersona: 0
            },
            pagination: {
              total: 0,
              pages: 1,
              page: 1,
              limit: 10,
              hasMore: false
            }
          }
        };
      }
      
      console.log('=== Fin getPersonas ===');
      return response.data;
    } catch (error: any) {
      console.error('=== Error en getPersonas ===');
      console.error('Detalles del error:', {
        mensaje: error.message,
        respuesta: error.response?.data,
        estado: error.response?.status,
        error: error
      });

      // Personalizar mensaje de error según el tipo
      let errorMessage = 'Error al obtener las personas';
      if (error.message === 'ID de cantón inválido') {
        errorMessage = error.message;
      } else if (error.response?.status === 404) {
        errorMessage = 'No se encontró el cantón especificado';
      } else if (error.response?.status === 403) {
        errorMessage = 'No tiene permisos para ver las personas de este cantón';
      }

      throw new Error(errorMessage);
    }
  }

  async createPersona(cantonId: string, data: CreatePersonaData): Promise<Persona> {
    try {
      console.log('Iniciando createPersona:', { cantonId, data });
      
      // Validar datos requeridos
      if (!cantonId) {
        throw new Error('El ID del cantón es requerido');
      }

      if (!data.cedula || !data.telefono || !data.domicilio) {
        throw new Error('Faltan campos requeridos');
      }

      // Asegurarnos de que los datos estén en el formato correcto
      const personaData = {
        ...data,
        matriculasVehiculo: Array.isArray(data.matriculasVehiculo) 
          ? data.matriculasVehiculo.map(m => m.trim()).filter(Boolean)
          : typeof data.matriculasVehiculo === 'string'
            ? data.matriculasVehiculo.split(',').map(m => m.trim()).filter(Boolean)
            : [],
        email: data.email?.trim() || null,
        contactoRef: data.contactoRef?.trim() || null,
        cantonId: Number(cantonId)
      };

      console.log('Datos procesados:', personaData);
      // Usar la ruta correcta que coincide con el backend
      const url = `/personas/canton/${cantonId}/personas`;
      console.log('URL completa:', api.defaults.baseURL + url);
      
      const response = await api.post(url, personaData);
      
      if (!response.data) {
        throw new Error('No se recibió respuesta del servidor');
      }

      console.log('Respuesta createPersona:', response.data);
      
      // Ajustar el manejo de la respuesta según el formato del backend
      if (response.data.status === 'success' && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Error al crear la persona');
      }
    } catch (error: any) {
      console.error('Error en createPersona:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      // Manejar errores específicos
      if (error.response?.status === 400) {
        toast.error(error.response.data.message || 'Datos inválidos');
      } else if (error.response?.status === 409) {
        toast.error('Ya existe una persona con esta cédula en este cantón');
      } else {
        toast.error('Error al crear la persona. Por favor, intenta nuevamente.');
      }
      
      throw error;
    }
  }

  async getPersonaById(id: string): Promise<Persona> {
    try {
      const response = await api.get(`/personas/${id}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error getting persona:', error.response || error);
      toast.error('Error al obtener los datos de la persona');
      throw error;
    }
  }

  async updatePersona(id: string, data: CreatePersonaData): Promise<Persona> {
    try {
      console.log('Iniciando updatePersona:', { id, data });
      
      if (!id) {
        throw new Error('El ID de la persona es requerido');
      }

      // Asegurarnos de que los datos estén en el formato correcto
      const personaData = {
        ...data,
        matriculasVehiculo: Array.isArray(data.matriculasVehiculo) 
          ? data.matriculasVehiculo.map(m => m.trim()).filter(Boolean)
          : typeof data.matriculasVehiculo === 'string'
            ? data.matriculasVehiculo.split(',').map(m => m.trim()).filter(Boolean)
            : [],
        email: data.email?.trim() || null,
        contactoRef: data.contactoRef?.trim() || null
      };

      console.log('Datos procesados para actualización:', personaData);
      const response = await api.put(`/personas/${id}`, personaData);
      
      if (!response.data) {
        throw new Error('No se recibió respuesta del servidor');
      }

      console.log('Respuesta updatePersona:', response.data);
      
      if (response.data.status === 'success' && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Error al actualizar la persona');
      }
    } catch (error: any) {
      console.error('Error en updatePersona:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      // Manejar errores específicos
      if (error.response?.status === 400) {
        toast.error(error.response.data.message || 'Datos inválidos');
      } else if (error.response?.status === 409) {
        toast.error('Ya existe una persona con esta cédula');
      } else {
        toast.error('Error al actualizar la persona. Por favor, intenta nuevamente.');
      }
      
      throw error;
    }
  }

  async deletePersona(id: string): Promise<void> {
    try {
      await api.delete(`/personas/${id}`);
    } catch (error: any) {
      console.error('Error deleting persona:', error.response || error);
      toast.error('Error al eliminar la persona');
      throw error;
    }
  }

  async uploadDocuments(personaId: string, files: File[], tipo: string): Promise<Document[]> {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('documento', file);
      });
      formData.append('tipo', tipo.toUpperCase());

      const response = await api.post(`/personas/${personaId}/documentos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.data;
    } catch (error: any) {
      console.error('Error subiendo documentos:', error.response || error);
      throw new Error(error.response?.data?.message || 'Error al subir los documentos');
    }
  }

  async getDocumentos(personaId: string): Promise<Document[]> {
    try {
      const response = await api.get(`/personas/${personaId}/documentos`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error obteniendo documentos:', error.response || error);
      throw new Error(error.response?.data?.message || 'Error al obtener los documentos');
    }
  }

  async verifyDocument(documentId: string): Promise<Document> {
    try {
      const response = await api.post(`/documentos/${documentId}/verify`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error verificando documento:', error.response || error);
      throw new Error(error.response?.data?.message || 'Error al verificar el documento');
    }
  }

  async rejectDocument(documentId: string, reason: string): Promise<Document> {
    try {
      const response = await api.post(`/documentos/${documentId}/reject`, { reason });
      return response.data.data;
    } catch (error: any) {
      console.error('Error rechazando documento:', error.response || error);
      throw new Error(error.response?.data?.message || 'Error al rechazar el documento');
    }
  }

  async deleteDocument(documentId: string, personaId: string): Promise<void> {
    try {
      console.log('=== Iniciando eliminación de documento ===');
      const url = `/personas/${personaId}/documentos/${documentId}`;
      console.log('Parámetros:', {
        documentId,
        personaId,
        url
      });
      
      console.log('Enviando petición DELETE a:', url);
      const response = await api.delete(url);
      console.log('Respuesta del servidor:', response.data);
      
      if (response.data?.status === 'error') {
        throw new Error(response.data.message || 'Error al eliminar el documento');
      }
    } catch (error: any) {
      console.error('Error eliminando documento:', {
        documentId,
        personaId,
        error: error.response?.data || error.message,
        status: error.response?.status,
        stack: error.stack
      });
      
      if (error.response?.status === 403) {
        throw new Error('No tienes permisos para eliminar este documento');
      } else if (error.response?.status === 404) {
        throw new Error('El documento no existe o ya fue eliminado');
      }
      
      throw new Error(error.response?.data?.message || 'Error al eliminar el documento');
    }
  }

  async getPersonasByCanton(cantonId: string, params: FilterParams = {}): Promise<PersonasResponse> {
    try {
      console.log('=== Inicio getPersonasByCanton ===');
      console.log('Obteniendo personas del cantón:', cantonId);
      console.log('Parámetros de filtro:', params);
      
      if (!cantonId || isNaN(Number(cantonId))) {
        throw new Error('ID de cantón inválido');
      }

      // Construir query params
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && key !== 'documentalFilter') {
          queryParams.append(key, value.toString());
        }
      });

      // Obtener información del usuario directamente desde la API
      try {
        console.log('Obteniendo información del usuario actual...');
        const userResponse = await api.get('/users/me');
        const userInfo = userResponse.data;
        const isAdmin = userInfo?.rol === 'ADMIN';
        
        console.log('=== INFO USUARIO ===');
        console.log('Usuario actual:', userInfo);
        console.log('¿Es administrador?:', isAdmin);
        console.log('Rol del usuario:', userInfo?.rol);

        // Si es administrador, obtener directamente todas las personas del cantón
        if (isAdmin) {
          console.log('Usuario es administrador, obteniendo todas las personas del cantón directamente');
          const url = `/personas/canton/${cantonId}/personas${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
          console.log('URL construida para admin:', url);
          
          try {
            console.log('Realizando petición directa para admin...');
            const response = await api.get(url);
            console.log('Respuesta del servidor para admin:', response.data);
            console.log('Status de la respuesta:', response.status);
            console.log('Personas obtenidas para admin:', response.data?.data?.personas?.length || 0);

            // Verificar si las personas tienen los campos creadorId y createdBy
            if (response.data?.data?.personas) {
              console.log('=== VERIFICACIÓN DE CAMPOS DE CREADOR ===');
              response.data.data.personas.forEach((persona: Persona) => {
                console.log(`Persona ${persona.id} - creadorId: ${persona.creadorId}, createdBy: ${persona.createdBy}`);
              });
            }

            // Aplicar filtro documental en el cliente
            if (response.data?.status === 'success' && response.data?.data?.personas && params.documentalFilter) {
              const personas = response.data.data.personas;
              console.log('Aplicando filtro documental:', params.documentalFilter);
              console.log('Personas antes del filtro:', personas.length);
              
              response.data.data.personas = personas.filter((persona: Persona) => {
                if (params.documentalFilter === 'complete') {
                  return persona.documentosCompletos === true;
                } else if (params.documentalFilter === 'incomplete') {
                  return persona.documentosCompletos === false;
                }
                return true;
              });
              
              console.log('Personas después del filtro:', response.data.data.personas.length);
            }
            
            console.log('=== Fin getPersonasByCanton (admin) ===');
            return response.data;
          } catch (directError: any) {
            console.error('Error al obtener personas directamente (admin):', directError);
            console.error('Detalles del error:', directError.response?.data || directError.message);
            console.error('Status del error:', directError.response?.status);
            throw directError;
          }
        }

        // Para usuarios no administradores, primero intentamos obtener las personas a través de los permisos
        try {
          console.log('Intentando obtener personas a través de permisos...');
          
          // Obtener los permisos de personas del usuario
          const personaPermissionsResponse = await permissionService.getPersonaPermissions();
          console.log('Permisos de personas obtenidos:', personaPermissionsResponse);
          console.log('Cantidad de permisos:', personaPermissionsResponse.length);
          
          // Filtrar las personas que pertenecen al cantón solicitado
          const personasInCanton = personaPermissionsResponse
            .filter((permission: PersonaPermission) => {
              const matchesCanton = permission.persona && permission.persona.cantonId === cantonId;
              console.log(`Permiso para persona ${permission.persona?.id} - ¿Pertenece al cantón ${cantonId}?:`, matchesCanton);
              return matchesCanton;
            })
            .map((permission: PersonaPermission) => {
              // Mapear la persona del permiso al formato esperado por PersonaService
              const persona = permission.persona;
              console.log(`Mapeando persona ${persona.id} del cantón ${persona.cantonId}`);
              return {
                id: Number(persona.id),
                cedula: persona.cedula || '',
                nombres: persona.nombre.split(' ')[0] || '',
                apellidos: persona.nombre.split(' ').slice(1).join(' ') || '',
                telefono: '',
                email: '',
                domicilio: '',
                matriculasVehiculo: [],
                documentosCompletos: false,
                createdAt: permission.updatedAt,
                updatedAt: permission.updatedAt,
                cantonId: Number(persona.cantonId),
                canton: {
                  id: Number(persona.canton.id),
                  nombre: persona.canton.nombre
                }
              };
            });
          
          console.log('Personas filtradas por cantón:', personasInCanton.length);
          
          // Obtener los datos completos de cada persona
          console.log('Obteniendo datos completos de cada persona...');
          const personasCompletas = await Promise.all(
            personasInCanton.map(async (persona) => {
              try {
                console.log(`Obteniendo datos completos para persona ${persona.id}...`);
                // Intentar obtener los datos completos de la persona
                const response = await api.get(`/personas/${persona.id}`);
                if (response.data?.status === 'success' && response.data?.data) {
                  console.log(`Datos completos obtenidos para persona ${persona.id}`);
                  // Verificar si la persona tiene los campos creadorId y createdBy
                  console.log(`Persona ${persona.id} - creadorId: ${response.data.data.creadorId}, createdBy: ${response.data.data.createdBy}`);
                  
                  // Si se obtienen los datos completos, usarlos
                  return {
                    ...response.data.data,
                    id: Number(response.data.data.id),
                    cantonId: Number(response.data.data.cantonId),
                    canton: {
                      id: Number(response.data.data.canton?.id || persona.canton.id),
                      nombre: response.data.data.canton?.nombre || persona.canton.nombre
                    }
                  };
                }
                console.log(`No se obtuvieron datos completos para persona ${persona.id}, usando datos básicos`);
                return persona;
              } catch (error) {
                console.error(`Error al obtener datos completos de persona ${persona.id}:`, error);
                return persona;
              }
            })
          );
          
          console.log('Personas completas obtenidas:', personasCompletas.length);
          console.log('Detalles de personas completas:', personasCompletas);
          
          // Verificar si las personas tienen los campos creadorId y createdBy
          console.log('=== VERIFICACIÓN DE CAMPOS DE CREADOR ===');
          personasCompletas.forEach((persona: Persona) => {
            console.log(`Persona ${persona.id} - creadorId: ${persona.creadorId}, createdBy: ${persona.createdBy}`);
          });
          
          // Crear una respuesta con el formato esperado
          const responseData = {
            status: 'success',
            data: {
              personas: personasCompletas || [],
              stats: {
                totalDocumentos: 0,
                promedioDocumentosPorPersona: 0
              },
              pagination: {
                total: personasCompletas.length,
                pages: 1,
                page: 1,
                limit: personasCompletas.length,
                hasMore: false
              }
            }
          };
          
          console.log('=== Fin getPersonasByCanton (permisos) ===');
          return responseData;
        } catch (permissionsError) {
          console.error('Error al obtener personas a través de permisos:', permissionsError);
          
          // Si falla el método de permisos, intentamos el método directo
          console.log('Intentando obtener personas directamente...');
          const url = `/personas/canton/${cantonId}/personas${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
          console.log('URL construida para método directo:', url);
          
          try {
            console.log('Realizando petición directa...');
            const response = await api.get(url);
            console.log('Respuesta del servidor (método directo):', response.data);
            console.log('Status de la respuesta:', response.status);
            console.log('Personas obtenidas (método directo):', response.data?.data?.personas?.length || 0);

            // Verificar si las personas tienen los campos creadorId y createdBy
            if (response.data?.data?.personas) {
              console.log('=== VERIFICACIÓN DE CAMPOS DE CREADOR ===');
              response.data.data.personas.forEach((persona: Persona) => {
                console.log(`Persona ${persona.id} - creadorId: ${persona.creadorId}, createdBy: ${persona.createdBy}`);
              });
            }

            // Aplicar filtro documental en el cliente
            if (response.data?.status === 'success' && response.data?.data?.personas && params.documentalFilter) {
              const personas = response.data.data.personas;
              console.log('Aplicando filtro documental:', params.documentalFilter);
              console.log('Personas antes del filtro:', personas.length);
              
              response.data.data.personas = personas.filter((persona: Persona) => {
                if (params.documentalFilter === 'complete') {
                  return persona.documentosCompletos === true;
                } else if (params.documentalFilter === 'incomplete') {
                  return persona.documentosCompletos === false;
                }
                return true;
              });
              
              console.log('Personas después del filtro:', response.data.data.personas.length);
            }
            
            console.log('=== Fin getPersonasByCanton (método directo) ===');
            return response.data;
          } catch (directError: any) {
            console.error('Error al obtener personas directamente:', directError);
            console.error('Detalles del error:', directError.response?.data || directError.message);
            console.error('Status del error:', directError.response?.status);
            throw directError;
          }
        }
      } catch (userError) {
        console.error('Error al obtener información del usuario:', userError);
        // Si falla la obtención del usuario, intentar el método directo como fallback
        console.log('Fallback: Intentando obtener personas directamente...');
        const url = `/personas/canton/${cantonId}/personas${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        
        try {
          const response = await api.get(url);
          return response.data;
        } catch (directError: any) {
          console.error('Error en fallback:', directError);
          throw directError;
        }
      }
    } catch (error: any) {
      console.error('Error general en getPersonasByCanton:', error);
      console.error('Mensaje de error:', error.message);
      console.error('Stack de error:', error.stack);
      
      let errorMessage = 'Error al obtener las personas';
      if (error.response?.status === 404) {
        errorMessage = 'No se encontró el cantón especificado';
      } else if (error.response?.status === 403) {
        errorMessage = 'No tiene permisos para ver las personas de este cantón';
      }
      throw new Error(errorMessage);
    }
  }
}

export const personaService = new PersonaService();
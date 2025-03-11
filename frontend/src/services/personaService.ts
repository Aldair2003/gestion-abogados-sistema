import api from './api';
import { toast } from 'react-hot-toast';

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
  hasDocuments?: boolean;
  sortBy?: 'createdAt' | 'cedula' | 'telefono' | 'email';
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

  async getPersonasByCanton(cantonId: string): Promise<PersonasResponse> {
    try {
      console.log('=== Inicio getPersonasByCanton ===');
      console.log('Obteniendo personas del cantón:', cantonId);
      
      if (!cantonId || isNaN(Number(cantonId))) {
        throw new Error('ID de cantón inválido');
      }

      const url = `/personas/canton/${cantonId}/personas`;
      console.log('URL construida:', url);
      console.log('URL completa:', api.defaults.baseURL + url);
      
      const response = await api.get(url);
      console.log('Respuesta del servidor:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('Error al obtener personas:', error);
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
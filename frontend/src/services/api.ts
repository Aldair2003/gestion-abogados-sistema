import axios from 'axios';
import { toast } from 'react-hot-toast';

interface ApiErrorResponse {
  status: string;
  message: string;
  errors?: Record<string, string>;
  code?: string;
}

// Crear instancia de axios con la configuración base
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Variable para controlar si ya se mostró el mensaje de sesión expirada
let isShowingSessionExpiredMessage = false;

// Interceptor para agregar el token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('Enviando petición:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data
    });
    return config;
  },
  (error) => {
    console.error('Error en la petición:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas
api.interceptors.response.use(
  (response) => {
    console.log('Respuesta exitosa:', {
      url: response.config.url,
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('Error en la respuesta:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    });

    // Manejar errores específicos
    if (error.response) {
      switch (error.response.status) {
        case 401:
          toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.');
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        case 403:
          toast.error('No tiene permisos para realizar esta acción');
          break;
        case 404:
          toast.error('Recurso no encontrado');
          break;
        case 422:
          const errors = error.response.data.errors;
          if (errors) {
            Object.values(errors).forEach((message: any) => {
              toast.error(message);
            });
          } else {
            toast.error('Error de validación');
          }
          break;
        case 500:
          toast.error('Error interno del servidor');
          break;
        default:
          toast.error('Error en la operación');
      }
    } else if (error.request) {
      toast.error('No se pudo conectar con el servidor');
    } else {
      toast.error('Error al procesar la solicitud');
    }

    return Promise.reject(error);
  }
);

// Función para manejar la expiración de sesión
const handleSessionExpired = () => {
  if (!isShowingSessionExpiredMessage) {
    isShowingSessionExpiredMessage = true;
    
    // Limpiar datos de sesión
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    toast.error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
    
    // Redirigir al login
    window.location.href = '/login';
    
    // Resetear el flag después de la redirección
    setTimeout(() => {
      isShowingSessionExpiredMessage = false;
    }, 1000);
  }
};

export default api; 
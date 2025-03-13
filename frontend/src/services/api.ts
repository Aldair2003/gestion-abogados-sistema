import axios from 'axios';

// Obtener la URL base de la API
const API_URL = process.env.REACT_APP_API_URL || 'https://gestion-abogados-sistema-production.up.railway.app';
console.log('API URL:', API_URL);

// Crear instancia de axios con la configuración base
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

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

// Interceptor para manejar respuestas y renovación de tokens
api.interceptors.response.use(
  (response) => {
    // Si hay un nuevo token en el header, actualizarlo
    const newToken = response.headers['authorization'];
    if (newToken) {
      console.log('[API] Recibido nuevo token en respuesta');
      const token = newToken.split(' ')[1];
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = newToken;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Si el error es 401 y no es una petición de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        console.log('[API] Intentando renovar token');
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          throw new Error('No hay refresh token disponible');
        }

        const response = await api.post('/users/refresh-token', { refreshToken });
        
        if (response.data?.token) {
          console.log('[API] Token renovado exitosamente');
          localStorage.setItem('token', response.data.token);
          api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
          
          // Reintentar la petición original con el nuevo token
          originalRequest.headers['Authorization'] = `Bearer ${response.data.token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('[API] Error al renovar token:', refreshError);
        // Limpiar tokens y recargar la página
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api; 
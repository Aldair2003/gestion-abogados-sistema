import axios from 'axios';

const getBaseUrl = () => {
  // En desarrollo, usa localhost
  if (process.env.REACT_APP_ENV === 'development') {
    return process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
  }
  // En producción, usa la URL de Railway
  return process.env.REACT_APP_API_URL || 'https://gestion-abogados-sistema-production.up.railway.app/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor para agregar el token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Limpiar cualquier doble barra en la URL
    if (config.url) {
      config.url = config.url.replace(/\/+/g, '/');
      if (!config.url.startsWith('/')) {
        config.url = '/' + config.url;
      }
    }

    console.log('Enviando petición:', {
      url: config.url,
      fullUrl: `${config.baseURL}${config.url}`,
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
    
    // No intentar renovar el token si:
    // 1. Es una petición de logout
    // 2. Ya se intentó renovar
    // 3. No hay token de refresco
    // 4. La respuesta no es 401
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url === '/auth/logout' ||
      !localStorage.getItem('refreshToken')
    ) {
      return Promise.reject(error);
    }

    try {
      console.log('[API] Intentando renovar token');
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refreshToken');
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
      // Limpiar tokens
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      delete api.defaults.headers.common['Authorization'];
      
      // Solo redirigir si no estamos ya en /login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api; 
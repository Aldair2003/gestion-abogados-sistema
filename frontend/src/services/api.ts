import axios from 'axios';
import { toast } from 'react-hot-toast';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(promise => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token!);
    }
  });
  failedQueue = [];
};

// Interceptor para agregar el token a las peticiones
api.interceptors.request.use(
  (config) => {
    console.log('Request:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data
    });
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores y refresh token
api.interceptors.response.use(
  (response) => {
    console.log('Response:', {
      status: response.status,
      data: response.data
    });
    return response;
  },
  async (error) => {
    console.error('Response Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    const originalRequest = error.config;

    // Si el error no es de autenticación o ya intentamos refrescar, rechazar
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Si es error de token expirado y tenemos refresh token
    if (error.response?.data?.error?.code === 'SESSION_EXPIRED' && localStorage.getItem('refreshToken')) {
      if (isRefreshing) {
        // Si ya estamos refrescando, agregar a la cola
        try {
          const token = await new Promise<string>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await api.post('/auth/refresh', { refreshToken });
        
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        
        localStorage.setItem('token', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
        
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        toast.error('Tu sesión ha expirado por inactividad', {
          duration: 5000,
          position: 'top-center',
          style: {
            background: '#fee2e2',
            color: '#991b1b',
            border: '1px solid #f87171'
          }
        });
        
        // Redirigir solo si no estamos ya en la página de login
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Si no hay refresh token o el error no es de token expirado
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      toast.error('Error de autenticación. Por favor, inicie sesión nuevamente.', {
        duration: 5000,
        position: 'top-center',
        style: {
          background: '#fee2e2',
          color: '#991b1b',
          border: '1px solid #f87171'
        }
      });
      
      // Redirigir solo si no estamos ya en la página de login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api; 
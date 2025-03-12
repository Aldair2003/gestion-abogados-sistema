import React, { createContext, useState, useCallback, useContext, useEffect, useMemo } from 'react';
import { User, UserRole } from '../types/user';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import axios from 'axios';

// Intervalo de keep-alive (15 minutos)
const KEEP_ALIVE_INTERVAL = 15 * 60 * 1000;
const KEEP_ALIVE_RETRY_DELAY = 60 * 1000; // 1 minuto
const INITIAL_KEEP_ALIVE_DELAY = 5 * 1000; // 5 segundos

interface AuthContextType {
  user: User | null;
  token: string | null;
  updateUser: (userData: User | null) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  completeOnboarding: () => void;
  login: (token: string, userData: User) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  updateUser: () => {},
  isAuthenticated: false,
  isLoading: false,
  isAdmin: false,
  completeOnboarding: () => {},
  login: async () => {},
  logout: async () => {}
});

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token');
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const updateUser = useCallback((userData: User | null) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    } else {
      localStorage.removeItem('user');
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      // Intentar hacer logout en el backend
      await api.post('/users/logout');
    } catch (error) {
      console.error('[Auth] Error al cerrar sesión en el servidor:', error);
    } finally {
      // Limpiar estado local independientemente del resultado
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setToken(null);
      updateUser(null);
      
      toast.success('Has cerrado sesión exitosamente', {
        duration: 3000,
        position: 'top-right',
        style: {
          background: '#f0f9ff',
          color: '#0369a1',
          border: '1px solid #7dd3fc'
        }
      });
      
      navigate('/login');
      setIsLoading(false);
    }
  }, [updateUser, navigate]);

  const verifyToken = useCallback(async (currentToken: string) => {
    try {
      console.log('[Auth] Verificando token almacenado');
      api.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;
      const response = await api.get('/users/me');
      
      if (response.status === 200) {
        console.log('[Auth] Token válido, actualizando datos del usuario');
        const userData = response.data;
        updateUser(userData);
        setToken(currentToken);
        
        // Asegurarnos de que el token esté configurado en axios
        api.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;
      }
    } catch (error) {
      console.error('[Auth] Error verificando token:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setToken(null);
      updateUser(null);
    }
  }, [updateUser]);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      console.log('[Auth] Token encontrado en localStorage, verificando...');
      verifyToken(storedToken);
    } else {
      console.log('[Auth] No hay token almacenado');
      setToken(null);
      updateUser(null);
    }
  }, [verifyToken]);

  const login = useCallback(async (newToken: string, userData: User) => {
    try {
      setIsLoading(true);
      console.log('[Auth] Iniciando proceso de login');
      
      // Limpiar cualquier token anterior
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      api.defaults.headers.common['Authorization'] = '';
      
      // Pequeña pausa para asegurar la limpieza
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Guardar nuevo token y configurar axios
      localStorage.setItem('token', newToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      setToken(newToken);
      
      // Actualizar datos del usuario
      console.log('[Auth] Actualizando datos del usuario');
      updateUser(userData);
      
      // Obtener datos completos del usuario
      try {
        const response = await api.get('/users/me');
        if (response.status === 200) {
          console.log('[Auth] Datos del usuario actualizados desde el servidor');
          updateUser(response.data);
        }
      } catch (error) {
        console.error('[Auth] Error al obtener datos completos del usuario:', error);
      }
      
      // Navegar al dashboard
      console.log('[Auth] Redirigiendo al dashboard');
      navigate('/dashboard');
      
      toast.success('¡Bienvenido!', {
        duration: 3000,
        position: 'top-right'
      });
    } catch (error) {
      console.error('[Auth] Error en proceso de login:', error);
      // Limpiar todo en caso de error
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      api.defaults.headers.common['Authorization'] = '';
      setToken(null);
      updateUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [updateUser, navigate]);

  // Keep-alive handler
  const handleKeepAlive = useCallback(async () => {
    if (!token) return;
    
    try {
      console.log('[Auth] Iniciando keep-alive');
      const response = await api.post('/users/keep-alive');
      
      if (response.data?.token) {
        console.log('[Auth] Token renovado exitosamente');
        localStorage.setItem('token', response.data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        setToken(response.data.token);
      }
    } catch (error) {
      console.error('[Auth] Error en keep-alive:', error);
      
      // Si el error es 401, intentar renovar el token
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        try {
          const refreshToken = localStorage.getItem('refreshToken');
          if (!refreshToken) {
            console.error('[Auth] No hay refresh token disponible');
            await logout();
            return;
          }

          const response = await api.post('/users/refresh-token', { refreshToken });
          if (response.data?.token) {
            console.log('[Auth] Token renovado exitosamente');
            localStorage.setItem('token', response.data.token);
            api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
            setToken(response.data.token);
          } else {
            console.error('[Auth] No se recibió nuevo token');
            await logout();
          }
        } catch (refreshError) {
          console.error('[Auth] Error al renovar token:', refreshError);
          await logout();
        }
      }
    }
  }, [token, logout]);

  // Configurar el intervalo de keep-alive
  useEffect(() => {
    let keepAliveTimer: NodeJS.Timeout;
    let retryTimer: NodeJS.Timeout;
    let initialTimer: NodeJS.Timeout;
    let isKeepAliveInProgress = false;

    const executeKeepAlive = async () => {
      if (isKeepAliveInProgress || !token) return;
      
      isKeepAliveInProgress = true;
      try {
        await handleKeepAlive();
      } catch (error) {
        console.error('[Auth] Error en keep-alive, reintentando en 1 minuto:', error);
        // Programar reintento
        retryTimer = setTimeout(executeKeepAlive, KEEP_ALIVE_RETRY_DELAY);
      } finally {
        isKeepAliveInProgress = false;
      }
    };

    if (token) {
      // Iniciar el keep-alive después de un retraso inicial
      initialTimer = setTimeout(() => {
        // Iniciar el intervalo regular de keep-alive
        keepAliveTimer = setInterval(executeKeepAlive, KEEP_ALIVE_INTERVAL);
        // Ejecutar el primer keep-alive
        executeKeepAlive();
      }, INITIAL_KEEP_ALIVE_DELAY);
    }

    return () => {
      if (keepAliveTimer) clearInterval(keepAliveTimer);
      if (retryTimer) clearTimeout(retryTimer);
      if (initialTimer) clearTimeout(initialTimer);
    };
  }, [token, handleKeepAlive]);

  const completeOnboarding = useCallback(async () => {
    if (!user) return;
    try {
      const response = await api.post('/users/complete-onboarding');
      if (response.status === 200) {
        updateUser({
          ...user,
          isTemporaryPassword: false,
          isProfileCompleted: true
        });
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error al completar onboarding:', error);
      throw error;
    }
  }, [user, updateUser, navigate]);

  const value = useMemo(() => ({
    user,
    token,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading,
    isAdmin: user?.rol === UserRole.ADMIN,
    updateUser,
    completeOnboarding
  }), [user, token, login, logout, isLoading, updateUser, completeOnboarding]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}; 
import React, { createContext, useState, useCallback, useContext, useEffect, useMemo } from 'react';
import { User, UserRole } from '../types/user';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { ScaleIcon, UserCircleIcon } from '@heroicons/react/24/outline';

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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token');
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const updateUser = useCallback((userData: User | null) => {
    setUser(userData);
    if (userData) {
      // Actualizar el estado del usuario
      setUser(userData);
      
      // Si hay un token en localStorage, mantenerlo
      const currentToken = localStorage.getItem('token');
      if (currentToken) {
        api.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;
      }
    } else {
      localStorage.removeItem('token');
      api.defaults.headers.common['Authorization'] = '';
    }
  }, []);

  const clearAuthState = useCallback(() => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    localStorage.removeItem('tokenVersion');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
  }, []);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      
      // Intentar registrar el logout incluso si el token está expirado
      try {
        await api.post('/auth/logout', {}, {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined
          }
        });
      } catch (error) {
        // Si falla el logout en el backend, solo lo registramos pero continuamos con el proceso
        console.warn('[Auth] No se pudo registrar el logout en el servidor:', error);
      }

      // Siempre limpiar el estado local independientemente de los errores
      clearAuthState();
      navigate('/login', { replace: true });
      toast.success('Sesión cerrada correctamente');
      
    } catch (error) {
      console.error('[Auth] Error durante el logout:', error);
      // Aún si hay error, limpiamos el estado local
      clearAuthState();
      navigate('/login', { replace: true });
    } finally {
      setLoading(false);
    }
  }, [navigate, clearAuthState, token]);

  const verifyToken = useCallback(async (currentToken: string) => {
    try {
      console.log('[Auth] Verificando token almacenado');
      api.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;
      const response = await api.get('/users/me');
      
      if (response.status === 200) {
        console.log('[Auth] Token válido, actualizando datos del usuario');
        const userData = response.data;
        const needsOnboarding = userData.isTemporaryPassword || !userData.isProfileCompleted;
        
        updateUser(userData);
        setToken(currentToken);
        setIsAuthenticated(true);
        
        if (location.pathname === '/login' && !needsOnboarding) {
          navigate('/dashboard');
        }
      }
    } catch (error) {
      console.error('[Auth] Error verificando token:', error);
      clearAuthState();
      if (location.pathname !== '/login') {
        navigate('/login');
      }
    }
  }, [updateUser, navigate, location.pathname, clearAuthState]);

  // Efecto para verificar el token al inicio
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      verifyToken(storedToken);
    } else {
      clearAuthState();
      if (location.pathname !== '/login' && !location.pathname.startsWith('/public')) {
        navigate('/login');
      }
    }
    setLoading(false);
  }, [verifyToken, navigate, location.pathname, clearAuthState]);

  const login = useCallback(async (token: string, userData: User) => {
    try {
      setLoading(true);
      
      // Configurar token
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Actualizar estado
      updateUser(userData);
      setIsAuthenticated(true);
      setToken(token);
      
      // Notificar y redirigir
      const needsOnboarding = userData.isTemporaryPassword || !userData.isProfileCompleted;
      toast.success(needsOnboarding ? 'Por favor complete la configuración inicial' : 'Inicio de sesión exitoso');
      navigate('/dashboard');
      
    } catch (error) {
      console.error('[Auth] Error en login:', error);
      toast.error('Error al iniciar sesión');
      clearAuthState();
    } finally {
      setLoading(false);
    }
  }, [navigate, updateUser, clearAuthState]);

  const handleKeepAlive = useCallback(async () => {
    try {
      const response = await api.post('/users/keep-alive');
      const { token, user: userData } = response.data;
      
      // Verificar si el token version ha cambiado
      const storedTokenVersion = localStorage.getItem('tokenVersion');
      if (userData.tokenVersion !== Number(storedTokenVersion)) {
        // Si el token version cambió, forzar logout
        await logout();
        return;
      }

      // Actualizar el token y el usuario
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      updateUser(userData);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        await logout();
      }
    }
  }, [logout, updateUser]);

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
    updateUser,
    isAuthenticated,
    isLoading: loading,
    isAdmin: user?.rol === UserRole.ADMIN,
    login,
    logout,
    completeOnboarding
  }), [user, token, updateUser, isAuthenticated, loading, login, logout, completeOnboarding]);

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
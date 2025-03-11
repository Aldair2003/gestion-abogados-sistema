import React, { createContext, useState, useCallback, useContext, useEffect, useMemo } from 'react';
import { User, UserRole } from '../types/user';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-hot-toast';

// Intervalo de keep-alive (15 minutos)
const KEEP_ALIVE_INTERVAL = 15 * 60 * 1000;

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

  // Keep-alive handler
  const handleKeepAlive = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await api.post('/auth/keep-alive');
      if (response.status !== 200) {
        throw new Error('Error en la respuesta del keep-alive');
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error en keep-alive:', error.message);
      }
    }
  }, [token]);

  // Configurar el intervalo de keep-alive
  useEffect(() => {
    let keepAliveTimer: NodeJS.Timeout;
    let isKeepAliveInProgress = false;

    const executeKeepAlive = async () => {
      if (isKeepAliveInProgress) return;
      
      isKeepAliveInProgress = true;
      await handleKeepAlive();
      isKeepAliveInProgress = false;
    };

    if (token) {
      // Iniciar el keep-alive
      keepAliveTimer = setInterval(executeKeepAlive, KEEP_ALIVE_INTERVAL);
      
      // Ejecutar keep-alive inicial después de un pequeño retraso
      setTimeout(executeKeepAlive, 1000);
    }

    return () => {
      if (keepAliveTimer) {
        clearInterval(keepAliveTimer);
      }
    };
  }, [token, handleKeepAlive]);

  const updateUser = useCallback((userData: User | null) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    } else {
      localStorage.removeItem('user');
    }
  }, []);

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

  const login = useCallback(async (newToken: string, userData: User) => {
    try {
      setIsLoading(true);
      localStorage.setItem('token', newToken);
      setToken(newToken);
      updateUser(userData);
      
      // Obtener datos actualizados del usuario
      const response = await api.get('/users/me');
      
      if (response.status === 200) {
        const updatedUserData = response.data;
        updateUser(updatedUserData);
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [updateUser, navigate]);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      // Intentar hacer logout en el backend
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Error al cerrar sesión en el servidor:', error);
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
      api.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;
      const response = await api.get('/users/me');
      
      if (response.status === 200) {
        const userData = response.data;
        updateUser(userData);
        setToken(currentToken);
      }
    } catch (error) {
      console.error('Error verificando token:', error);
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
      verifyToken(storedToken);
    }
  }, [verifyToken]);

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
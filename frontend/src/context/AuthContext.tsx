import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types/user';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';
import { ScaleIcon, UserCircleIcon } from '@heroicons/react/24/outline';

interface AuthContextType {
  user: User | null;
  login: (token: string, userData: User) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  updateUserData: (userData: User) => void;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isAdmin = (role?: string): boolean => {
  return role === 'ADMIN' || role === 'admin';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const updateUserData = (userData: User) => {
    setUser(userData);
  };

  const logout = useCallback(() => {
    const userName = user?.nombre;
    
    // Limpiar todo el almacenamiento local relacionado con la autenticación
    localStorage.removeItem('token');
    localStorage.removeItem('temporaryPassword');
    localStorage.removeItem('onboardingState');
    
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
    
    toast.info(
      <div className="flex items-center gap-3 max-w-[300px]">
        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-md flex items-center justify-center shadow-sm border border-blue-100">
          <ScaleIcon className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-medium text-sm text-gray-900 truncate">Sesión finalizada</span>
          <span className="text-xs text-gray-600 truncate">
            {userName ? 
              `Gracias, Abg. ${userName.split(' ')[0]}. Lo esperamos pronto.` : 
              'Ha cerrado sesión exitosamente'}
          </span>
        </div>
      </div>,
      {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'light',
        toastId: 'logout',
        style: { 
          background: 'white',
          padding: '12px',
          maxWidth: '320px',
          borderLeft: '3px solid #2563eb'
        }
      }
    );
    
    navigate('/login');
  }, [navigate, user?.nombre]);

  const verifyToken = useCallback(async (token: string) => {
    try {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await api.get('/users/me');
      
      // Determinar si el usuario necesita onboarding
      const needsOnboarding = response.data.isTemporaryPassword || !response.data.isProfileCompleted;
      setUser({
        ...response.data,
        needsOnboarding
      });
      setIsAuthenticated(true);
      
      // No redirigir automáticamente, dejar que el enrutador maneje la navegación
      setIsLoading(false);
    } catch (error) {
      console.error('Error verificando token:', error);
      logout();
    }
  }, [logout]);

  const completeOnboarding = async () => {
    if (!user) return;
    try {
      await api.post('/users/complete-onboarding');
      setUser({
        ...user,
        needsOnboarding: false,
        isTemporaryPassword: false,
        isProfileCompleted: true
      });
      toast.success('¡Bienvenido al sistema!');
      
      // Mantener al usuario en la página actual
      const currentPath = location.pathname;
      if (currentPath === '/login' || currentPath === '/') {
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error('Error al completar el proceso de onboarding');
      throw error;
    }
  };

  const login = async (token: string, userData: User) => {
    try {
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const needsOnboarding = userData.isTemporaryPassword || !userData.isProfileCompleted;
      setUser({
        ...userData,
        needsOnboarding
      });
      setIsAuthenticated(true);
      
      toast.info(
        <div className="flex items-center gap-3 max-w-[300px]">
          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-md flex items-center justify-center shadow-sm border border-blue-100">
            <UserCircleIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-sm text-gray-900 truncate">Acceso autorizado</span>
            <span className="text-xs text-gray-600 truncate">
              {userData.nombre ? 
                `Bienvenido, Abg. ${userData.nombre.split(' ')[0]}. Excelente jornada.` : 
                'Ha iniciado sesión exitosamente'}
            </span>
          </div>
        </div>,
        {
          position: "top-right",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: 'light',
          toastId: 'login',
          style: { 
            background: 'white',
            padding: '12px',
            maxWidth: '320px',
            borderLeft: '3px solid #2563eb'
          }
        }
      );
      
      if (location.pathname === '/login') {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error en login:', error);
      toast.error('Error al iniciar sesión');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      verifyToken(token);
    } else {
      setIsLoading(false);
    }
  }, [verifyToken]);

  const checkIsAdmin = () => {
    return isAdmin(user?.rol);
  };

  // Prevenir renderizado mientras se verifica el token
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
    </div>;
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isAuthenticated, 
      isLoading,
      isAdmin: checkIsAdmin(),
      updateUserData,
      completeOnboarding
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}; 
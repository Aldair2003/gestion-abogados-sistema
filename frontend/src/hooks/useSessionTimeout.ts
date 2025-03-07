import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import api from '../services/api';

// Configuración por defecto
const DEFAULT_CONFIG = {
  INACTIVITY_TIMEOUT: 30 * 60 * 1000,  // 30 minutos
  WARNING_TIME: 5 * 60 * 1000,         // 5 minutos antes
  CHECK_INTERVAL: 1000,                // Verificar cada segundo
  EXEMPT_ROUTES: ['/login', '/register', '/forgot-password']
};

export interface SessionConfig {
  inactivityTimeout: number;
  warningTime: number;
  checkInterval?: number;
  exemptRoutes?: string[];
}

export const useSessionTimeout = (config?: Partial<SessionConfig>) => {
  const [showWarning, setShowWarning] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Combinar configuración por defecto con la proporcionada
  const sessionConfig = useMemo(() => ({
    inactivityTimeout: DEFAULT_CONFIG.INACTIVITY_TIMEOUT,
    warningTime: DEFAULT_CONFIG.WARNING_TIME,
    checkInterval: DEFAULT_CONFIG.CHECK_INTERVAL,
    exemptRoutes: DEFAULT_CONFIG.EXEMPT_ROUTES,
    ...config
  }), [config]);

  // Función para actualizar la actividad
  const updateActivity = useCallback(async () => {
    const currentPath = window.location.pathname;
    if (sessionConfig.exemptRoutes?.includes(currentPath)) {
      return;
    }
    setLastActivity(Date.now());
    setShowWarning(false);

    try {
      const response = await api.post('/auth/keep-alive');
      if (response.data?.token) {
        localStorage.setItem('token', response.data.token);
      }
    } catch (error) {
      console.error('Error al actualizar la actividad:', error);
      if ((error as any)?.response?.status === 401) {
        logout();
        navigate('/login');
      }
    }
  }, [sessionConfig.exemptRoutes, logout, navigate]);

  // Monitor de inactividad
  useEffect(() => {
    // Verificar inactividad periódicamente
    const checkInactivity = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;
      
      if (timeSinceLastActivity >= sessionConfig.inactivityTimeout) {
        logout();
        navigate('/login');
      } else if (timeSinceLastActivity >= (sessionConfig.inactivityTimeout - sessionConfig.warningTime)) {
        setShowWarning(true);
        const remainingSeconds = Math.ceil((sessionConfig.inactivityTimeout - timeSinceLastActivity) / 1000);
        setTimeRemaining(remainingSeconds);
      }
    }, sessionConfig.checkInterval || DEFAULT_CONFIG.CHECK_INTERVAL);

    return () => {
      clearInterval(checkInactivity);
    };
  }, [lastActivity, sessionConfig, logout, navigate]);

  const extendSession = useCallback(() => {
    updateActivity();
  }, [updateActivity]);

  const closeSession = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  return { 
    showWarning, 
    timeRemaining, 
    extendSession,
    closeSession 
  };
}; 
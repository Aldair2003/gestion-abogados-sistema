import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { toast } from 'react-hot-toast';

// Configuración por defecto
const DEFAULT_CONFIG = {
  INACTIVITY_TIMEOUT: 60 * 60 * 1000,  // 1 hora
  WARNING_TIME: 20 * 60 * 1000,        // 20 minutos antes
  CHECK_INTERVAL: 5000,                // Verificar cada 5 segundos
  EXEMPT_ROUTES: ['/login', '/register', '/forgot-password', '/reset-password'],
  MIN_TIME_BETWEEN_CALLS: 30000,       // Tiempo mínimo entre llamadas keep-alive (30 segundos)
  TOKEN_REFRESH_THRESHOLD: 30 * 60 * 1000 // Renovar token 30 minutos antes de que expire
};

export interface SessionConfig {
  inactivityTimeout: number;
  warningTime: number;
  checkInterval?: number;
  exemptRoutes?: string[];
}

// Función de debounce para limitar las llamadas
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const useSessionTimeout = (config?: Partial<SessionConfig>) => {
  const [showWarning, setShowWarning] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [lastKeepAliveCall, setLastKeepAliveCall] = useState(0);
  const [isKeepAliveInProgress, setIsKeepAliveInProgress] = useState(false);
  const { logout } = useAuth();
  const location = useLocation();

  // Combinar configuración por defecto con la proporcionada
  const sessionConfig = useMemo(() => ({
    inactivityTimeout: DEFAULT_CONFIG.INACTIVITY_TIMEOUT,
    warningTime: DEFAULT_CONFIG.WARNING_TIME,
    checkInterval: DEFAULT_CONFIG.CHECK_INTERVAL,
    exemptRoutes: DEFAULT_CONFIG.EXEMPT_ROUTES,
    ...config
  }), [config]);

  const isExemptRoute = useCallback((path: string) => {
    return sessionConfig.exemptRoutes?.some(route => path.startsWith(route)) || false;
  }, [sessionConfig.exemptRoutes]);

  const handleSessionExpiration = useCallback(async () => {
    setShowWarning(false);
    setTimeRemaining(null);
    setLastActivity(Date.now());
    setLastKeepAliveCall(0);
    setIsKeepAliveInProgress(false);
    
    if (!isExemptRoute(location.pathname)) {
      toast.error('Tu sesión ha expirado por inactividad.');
      await logout();
    }
  }, [logout, location.pathname, isExemptRoute]);

  const updateActivity = useCallback(async () => {
    if (isExemptRoute(location.pathname)) {
      return;
    }

    const now = Date.now();
    const timeSinceLastCall = now - lastKeepAliveCall;

    if (timeSinceLastCall < DEFAULT_CONFIG.MIN_TIME_BETWEEN_CALLS || isKeepAliveInProgress) {
      return;
    }

    try {
      setIsKeepAliveInProgress(true);
      setLastKeepAliveCall(now);
      
      const response = await api.post('/users/keep-alive');
      if (response.data?.token) {
        localStorage.setItem('token', response.data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      }
      setLastActivity(now);
      setShowWarning(false);
      setTimeRemaining(null);
    } catch (error) {
      if (error instanceof Error && error.message.includes('401')) {
        await handleSessionExpiration();
      }
    } finally {
      setIsKeepAliveInProgress(false);
    }
  }, [location.pathname, handleSessionExpiration, isExemptRoute, lastKeepAliveCall, isKeepAliveInProgress]);

  useEffect(() => {
    let checkInactivityTimer: NodeJS.Timeout;
    let initialDelay: NodeJS.Timeout;
    
    if (isExemptRoute(location.pathname)) {
      return () => {
        if (checkInactivityTimer) clearInterval(checkInactivityTimer);
        if (initialDelay) clearTimeout(initialDelay);
      };
    }

    // Retrasar el inicio del monitor para evitar conflictos con la carga inicial
    initialDelay = setTimeout(() => {
      checkInactivityTimer = setInterval(() => {
        const now = Date.now();
        const timeSinceLastActivity = now - lastActivity;
        
        if (timeSinceLastActivity >= sessionConfig.inactivityTimeout) {
          handleSessionExpiration();
        } 
        else if (timeSinceLastActivity >= (sessionConfig.inactivityTimeout - sessionConfig.warningTime)) {
          setShowWarning(true);
          const remainingTime = Math.ceil((sessionConfig.inactivityTimeout - timeSinceLastActivity) / 1000);
          setTimeRemaining(remainingTime);
        }
        else if (timeSinceLastActivity >= (sessionConfig.inactivityTimeout - DEFAULT_CONFIG.TOKEN_REFRESH_THRESHOLD)) {
          updateActivity();
        }
      }, sessionConfig.checkInterval);
    }, 5000);

    const cleanup = () => {
      if (checkInactivityTimer) clearInterval(checkInactivityTimer);
      if (initialDelay) clearTimeout(initialDelay);
    };

    window.addEventListener('beforeunload', cleanup);
    return () => {
      cleanup();
      window.removeEventListener('beforeunload', cleanup);
    };
  }, [lastActivity, sessionConfig, handleSessionExpiration, location.pathname, isExemptRoute, updateActivity]);

  const extendSession = useCallback(() => {
    if (!isExemptRoute(location.pathname)) {
      updateActivity();
    }
  }, [updateActivity, location.pathname, isExemptRoute]);

  return { showWarning, timeRemaining, extendSession };
}; 
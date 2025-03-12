import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { toast } from 'react-hot-toast';

// Configuración por defecto
const DEFAULT_CONFIG = {
  INACTIVITY_TIMEOUT: 60 * 60 * 1000,  // 1 hora
  WARNING_TIME: 20 * 60 * 1000,        // 20 minutos antes
  CHECK_INTERVAL: 1000,                // Verificar cada segundo
  EXEMPT_ROUTES: ['/login', '/register', '/forgot-password', '/reset-password'],
  MIN_TIME_BETWEEN_CALLS: 5000,        // Tiempo mínimo entre llamadas keep-alive (5 segundos)
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
  const navigate = useNavigate();
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
    if (!isExemptRoute(location.pathname)) {
      setShowWarning(false);
      setTimeRemaining(null);
      toast.error('Tu sesión ha expirado por inactividad.');
      await logout();
      navigate('/login');
    }
  }, [logout, navigate, location.pathname, isExemptRoute]);

  // Función para actualizar la actividad y renovar el token
  const updateActivity = useCallback(async () => {
    if (isExemptRoute(location.pathname)) {
      console.log('[Session] Ruta exenta, no se actualiza actividad:', location.pathname);
      return;
    }

    const now = Date.now();
    const timeSinceLastCall = now - lastKeepAliveCall;

    console.log('[Session] Tiempo desde última llamada:', Math.round(timeSinceLastCall / 1000), 'segundos');

    if (timeSinceLastCall < DEFAULT_CONFIG.MIN_TIME_BETWEEN_CALLS) {
      console.log('[Session] Muy pronto para otra llamada keep-alive');
      return;
    }

    if (isKeepAliveInProgress) {
      console.log('[Session] Ya hay una llamada keep-alive en progreso');
      return;
    }

    try {
      console.log('[Session] Iniciando llamada keep-alive');
      setIsKeepAliveInProgress(true);
      setLastKeepAliveCall(now);
      
      const response = await api.post('/users/keep-alive');
      if (response.data?.token) {
        console.log('[Session] Token renovado exitosamente');
        localStorage.setItem('token', response.data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      }
      setLastActivity(now);
      setShowWarning(false);
      setTimeRemaining(null);
    } catch (error: any) {
      console.error('[Session] Error al actualizar actividad:', error);
      console.log('[Session] Código de estado:', error?.response?.status);
      console.log('[Session] Mensaje de error:', error?.response?.data);
      if (error?.response?.status === 401) {
        console.log('[Session] Token expirado o inválido, cerrando sesión');
        await handleSessionExpiration();
      }
    } finally {
      setIsKeepAliveInProgress(false);
    }
  }, [location.pathname, handleSessionExpiration, isExemptRoute, lastKeepAliveCall, isKeepAliveInProgress]);

  // Crear versión debounced de updateActivity
  const debouncedUpdateActivity = useMemo(
    () => debounce(updateActivity, DEFAULT_CONFIG.MIN_TIME_BETWEEN_CALLS),
    [updateActivity]
  );

  // Monitorear actividad del usuario
  useEffect(() => {
    if (isExemptRoute(location.pathname)) {
      setShowWarning(false);
      setTimeRemaining(null);
      return;
    }

    const events = [
      'mousedown',
      'keydown',
      'click',
      'touchstart',
      'mousemove',
      'scroll'
    ];

    const handleActivity = () => {
      if (!isExemptRoute(location.pathname)) {
        debouncedUpdateActivity();
      }
    };

    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [debouncedUpdateActivity, location.pathname, isExemptRoute]);

  // Monitor de inactividad y renovación de token
  useEffect(() => {
    if (isExemptRoute(location.pathname)) {
      console.log('[Session] Monitor no activo en ruta exenta:', location.pathname);
      return;
    }

    console.log('[Session] Iniciando monitor de inactividad');

    const checkInactivity = setInterval(() => {
      if (isExemptRoute(location.pathname)) {
        return;
      }

      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;
      console.log('[Session] Tiempo de inactividad:', Math.round(timeSinceLastActivity / 1000), 'segundos');
      
      if (timeSinceLastActivity >= sessionConfig.inactivityTimeout) {
        console.log('[Session] Tiempo de inactividad excedido, cerrando sesión');
        clearInterval(checkInactivity);
        handleSessionExpiration();
      } 
      else if (timeSinceLastActivity >= (sessionConfig.inactivityTimeout - sessionConfig.warningTime)) {
        console.log('[Session] Mostrando advertencia de sesión');
        setShowWarning(true);
        const remainingTime = Math.ceil((sessionConfig.inactivityTimeout - timeSinceLastActivity) / 1000);
        console.log('[Session] Tiempo restante:', remainingTime, 'segundos');
        setTimeRemaining(remainingTime);
      }
      else if (timeSinceLastActivity >= (sessionConfig.inactivityTimeout - DEFAULT_CONFIG.TOKEN_REFRESH_THRESHOLD)) {
        console.log('[Session] Iniciando renovación preventiva del token');
        updateActivity();
      }
    }, sessionConfig.checkInterval || DEFAULT_CONFIG.CHECK_INTERVAL);

    return () => {
      console.log('[Session] Limpiando monitor de inactividad');
      clearInterval(checkInactivity);
    };
  }, [lastActivity, sessionConfig, handleSessionExpiration, location.pathname, isExemptRoute, updateActivity]);

  const extendSession = useCallback(() => {
    if (!isExemptRoute(location.pathname)) {
      updateActivity();
    }
  }, [updateActivity, location.pathname, isExemptRoute]);

  return {
    showWarning,
    timeRemaining,
    extendSession,
    updateActivity
  };
}; 
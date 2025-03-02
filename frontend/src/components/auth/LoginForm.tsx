import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { LoginCredentials } from '../../types/auth';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle, FiInfo } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { IconWrapper } from '../common/IconWrapper';

export const LoginForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginCredentials>();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_TIME = 5;
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);

  const onSubmit = async (data: LoginCredentials) => {
    if (isLocked) return;
    
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', data);
      if (response.data.user.isTemporaryPassword) {
        localStorage.setItem(`temporaryPassword_${data.email}`, data.password);
      }
      localStorage.setItem('refreshToken', response.data.refreshToken);
      await login(response.data.token, response.data.user);
      toast.success('¡Bienvenido!');
    } catch (error: any) {
      const remainingAttempts = MAX_ATTEMPTS - (loginAttempts + 1);
      setLoginAttempts(prev => prev + 1);
      
      if (remainingAttempts <= 0) {
        setIsLocked(true);
        startLockoutTimer();
        toast.error(`Demasiados intentos fallidos. Por favor, espere ${LOCKOUT_TIME} minutos.`);
      } else {
        toast.error(error.response?.data?.message || 'Error al iniciar sesión');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(onSubmit)(e);
  };

  const startLockoutTimer = () => {
    let timeLeft = LOCKOUT_TIME * 60;
    setLockTimer(timeLeft);
    
    const interval = setInterval(() => {
      timeLeft -= 1;
      setLockTimer(timeLeft);
      
      if (timeLeft <= 0) {
        clearInterval(interval);
        setIsLocked(false);
        setLoginAttempts(0);
      }
    }, 1000);
  };

  // Mensajes de advertencia según el número de intentos
  const getWarningMessage = (attempts: number) => {
    const remaining = MAX_ATTEMPTS - attempts;
    if (attempts === 1) {
      return "Credenciales incorrectas. Por favor, verifique sus datos.";
    } else if (attempts >= 2) {
      return `Advertencia: Le quedan ${remaining} intentos antes del bloqueo temporal.`;
    }
    return "";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Advertencia de intentos */}
      <AnimatePresence>
        {loginAttempts > 0 && !isLocked && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mb-4 p-3 rounded-lg flex items-center ${
              loginAttempts === 1 
                ? 'bg-blue-50 border-l-4 border-blue-400 text-blue-700'
                : 'bg-amber-50 border-l-4 border-amber-400 text-amber-700'
            }`}
          >
            <IconWrapper 
              icon={loginAttempts === 1 ? FiInfo : FiAlertCircle}
              className={`w-5 h-5 mr-2 ${
                loginAttempts === 1 ? 'text-blue-400' : 'text-amber-400'
              }`}
              aria-hidden="true"
            />
            <p className="text-sm">
              {getWarningMessage(loginAttempts)}
            </p>
          </motion.div>
        )}
        {isLocked && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md"
          >
            <div className="flex items-center">
              <IconWrapper 
                icon={FiAlertCircle}
                className="text-red-400 w-5 h-5 mr-2"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm text-red-700 font-medium">
                  Cuenta temporalmente bloqueada
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Intente nuevamente en {lockTimer} minutos
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleFormSubmit} className="space-y-6">
        <div className="space-y-5">
          {/* Campo Email */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 tracking-wide pl-1">
              Correo Electrónico
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <IconWrapper 
                  icon={FiMail} 
                  className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-indigo-500 transition-colors" 
                  aria-hidden="true" 
                />
              </div>
              <input
                type="email"
                {...register('email', {
                  required: 'El correo es requerido',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Correo electrónico inválido'
                  }
                })}
                className="block w-full pl-12 pr-4 py-3 text-base 
                  border border-gray-200 dark:border-gray-700 
                  rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent 
                  transition-all bg-white/70 dark:bg-gray-900/70 
                  hover:bg-white dark:hover:bg-gray-900
                  text-gray-900 dark:text-gray-100
                  placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="ejemplo@email.com"
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-500 pl-1 mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Campo Contraseña */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 tracking-wide pl-1">
              Contraseña
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <IconWrapper 
                  icon={FiLock} 
                  className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-indigo-500 transition-colors" 
                  aria-hidden="true" 
                />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                {...register('password', {
                  required: 'La contraseña es requerida'
                })}
                className="block w-full pl-12 pr-12 py-3 text-base 
                  border border-gray-200 dark:border-gray-700 
                  rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent 
                  transition-all bg-white/70 dark:bg-gray-900/70 
                  hover:bg-white dark:hover:bg-gray-900
                  text-gray-900 dark:text-gray-100"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center"
              >
                <IconWrapper 
                  icon={showPassword ? FiEyeOff : FiEye}
                  className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600" 
                  aria-hidden="true"
                />
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-500 pl-1 mt-1">{errors.password.message}</p>
            )}
          </div>

          <motion.button
            type="submit"
            disabled={isLoading || isLocked}
            className={`
              w-full py-3.5 px-6
              flex items-center justify-center
              text-white text-base font-medium tracking-wide
              rounded-lg
              transition-all duration-200
              ${isLocked 
                ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 active:scale-[0.98] hover:shadow-lg'
              }
              disabled:opacity-50
            `}
          >
            {isLoading ? (
              <motion.div className="flex items-center gap-3">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Verificando...</span>
              </motion.div>
            ) : (
              'Iniciar Sesión'
            )}
          </motion.button>

          {/* Agregar enlace de recuperación */}
          <div className="text-center mt-4">
            <motion.a
              href="/forgot-password"
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ¿Olvidaste tu contraseña?
            </motion.a>
          </div>
        </div>
      </form>
    </motion.div>
  );
}; 
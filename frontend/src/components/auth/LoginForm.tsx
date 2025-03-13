import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { LoginCredentials } from '../../types/auth';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { IconWrapper } from '../common/IconWrapper';
import { toast } from 'react-hot-toast';

interface LoginFormProps {
  onAccountDisabled: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onAccountDisabled }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginCredentials>();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data: LoginCredentials) => {
    setIsLoading(true);
    try {
      console.log('[Login] Intentando iniciar sesión con:', {
        email: data.email,
        passwordLength: data.password.length
      });

      const response = await api.post('/api/users/login', {
        email: data.email,
        password: data.password
      });

      console.log('[Login] Respuesta del servidor:', {
        status: response.status,
        hasData: !!response.data,
        hasToken: !!response.data?.token,
        hasUser: !!response.data?.user
      });

      if (!response.data?.token || !response.data?.user) {
        throw new Error('Respuesta del servidor incompleta');
      }

      // Guardar refresh token si existe
      if (response.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }

      // Intentar login
      await login(response.data.token, response.data.user);
    } catch (error: any) {
      console.error('[Login] Error:', {
        name: error.name,
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });

      const errorMessage = error.response?.data?.error?.message || 
                         error.response?.data?.message || 
                         error.message || 
                         'Error al iniciar sesión';

      toast.error(errorMessage, {
        duration: 4000,
        position: 'top-right'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit(onSubmit)} 
      className="space-y-6"
      noValidate
    >
      {/* Campo Email */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Correo Electrónico
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <IconWrapper 
              icon={FiMail} 
              className="h-5 w-5 text-gray-400" 
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
              bg-white/70 dark:bg-gray-900/70
              text-gray-900 dark:text-white
              placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="ejemplo@email.com"
          />
        </div>
        {errors.email && (
          <p className="text-sm text-red-500 pl-1">{errors.email.message}</p>
        )}
      </div>

      {/* Campo Contraseña */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Contraseña
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <IconWrapper 
              icon={FiLock} 
              className="h-5 w-5 text-gray-400" 
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
              bg-white/70 dark:bg-gray-900/70
              text-gray-900 dark:text-white
              placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center"
          >
            <IconWrapper 
              icon={showPassword ? FiEyeOff : FiEye}
              className="h-5 w-5 text-gray-400 hover:text-gray-600" 
              aria-hidden="true"
            />
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-red-500 pl-1">{errors.password.message}</p>
        )}
      </div>

      <motion.button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 
          text-white font-medium rounded-lg transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Verificando...' : 'Iniciar Sesión'}
      </motion.button>

      <div className="text-center">
        <a
          href="/forgot-password"
          className="text-sm text-indigo-600 hover:text-indigo-500"
        >
          ¿Olvidaste tu contraseña?
        </a>
      </div>
    </form>
  );
}; 
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { FiMail } from 'react-icons/fi';
import { IconWrapper } from '../../components/common/IconWrapper';

interface ForgotPasswordForm {
  email: string;
}

export const ForgotPasswordPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordForm>();
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      setIsLoading(true);
      await api.post('/users/forgot-password', data);
      toast.success('Se ha enviado un enlace de recuperación a tu email');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al enviar el email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center">
          <h2 className="text-3xl font-light text-gray-900 dark:text-gray-100">
            Recuperar Contraseña
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Ingresa tu email para recibir instrucciones
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <IconWrapper 
                    icon={FiMail}
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </div>
                <input
                  {...register('email', {
                    required: 'El email es requerido',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email inválido'
                    }
                  })}
                  type="email"
                  className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="ejemplo@email.com"
                />
              </div>
            </div>
          </div>

          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isLoading ? 'Enviando...' : 'Enviar Instrucciones'}
            </button>
          </div>

          <div className="text-center">
            <a
              href="/login"
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Volver al login
            </a>
          </div>
        </form>
      </motion.div>
    </div>
  );
}; 
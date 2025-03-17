import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useOnboarding } from '../../hooks/useOnboarding';
import { toast } from 'react-hot-toast';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

interface ChangePasswordFormProps {
  onPasswordChanged?: () => void;
  isCompleted?: boolean;
  compact?: boolean;
}

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número')
    .regex(/[!@#$%^&*]/, 'Debe contener al menos un carácter especial (!@#$%^&*)'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof passwordSchema>;

export const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ 
  onPasswordChanged,
  isCompleted = false,
  compact = false
}) => {
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { user, updateUser } = useAuth();
  const { onboardingStatus, refreshStatus } = useOnboarding();
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: 'Temporal12345@'
    }
  });

  const onSubmit = async (data: FormValues) => {
    if (loading || isCompleted) return;

    try {
      setLoading(true);
      const response = await api.post('/users/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });

      // Actualizar el token en el localStorage y en el cliente API
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      }

      // Actualizar el estado del usuario
      if (user) {
        const updatedUser = {
          ...user,
          isTemporaryPassword: false,
          isFirstLogin: false
        };
        await updateUser(updatedUser);
      }

      // Actualizar el estado de onboarding
      await refreshStatus();

      reset();
      if (onPasswordChanged) {
        onPasswordChanged();
      }

      // Mostrar mensaje de éxito y continuar con el flujo
      toast.success('Contraseña actualizada exitosamente');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al cambiar la contraseña';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (isCompleted && !onboardingStatus?.pendingSteps.requiresPasswordChange) {
    return (
      <div className="flex flex-col items-center justify-center py-4">
        <div className={`${compact ? 'w-8 h-8' : 'w-12 h-12'} rounded-full bg-green-100 flex items-center justify-center mb-3`}>
          <CheckCircleIcon className={`${compact ? 'w-5 h-5' : 'w-8 h-8'} text-green-500`} />
        </div>
        <h3 className={`${compact ? 'text-base' : 'text-lg'} font-medium text-gray-900`}>
          Contraseña Actualizada
        </h3>
        <p className="text-xs text-gray-500 text-center mt-1">
          Su contraseña ha sido actualizada exitosamente
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="space-y-3">
        {/* Contraseña Temporal */}
        <div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
            </div>
            <input
              type={showCurrentPassword ? "text" : "password"}
              {...register('currentPassword')}
              defaultValue="Temporal12345@"
              className={`block w-full pl-10 pr-10 py-2 text-sm
                border ${errors.currentPassword ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} 
                rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent 
                bg-white/70 dark:bg-gray-900/70
                text-gray-900 dark:text-white
                placeholder-gray-500 dark:placeholder-gray-400`}
              placeholder="Contraseña Temporal"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              {showCurrentPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="mt-1 text-xs text-red-500">{errors.currentPassword.message}</p>
          )}
        </div>

        {/* Nueva Contraseña */}
        <div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <input
              type={showNewPassword ? "text" : "password"}
              {...register('newPassword')}
              className={`block w-full pl-10 pr-10 py-2 text-sm
                border ${errors.newPassword ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} 
                rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent 
                bg-white dark:bg-gray-900
                text-gray-900 dark:text-white
                placeholder-gray-500 dark:placeholder-gray-400`}
              placeholder="Nueva Contraseña"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              {showNewPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
          {errors.newPassword && (
            <p className="mt-1 text-xs text-red-500">{errors.newPassword.message}</p>
          )}
        </div>

        {/* Confirmar Nueva Contraseña */}
        <div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <input
              type={showConfirmPassword ? "text" : "password"}
              {...register('confirmPassword')}
              className={`block w-full pl-10 pr-10 py-2 text-sm
                border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} 
                rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent 
                bg-white dark:bg-gray-900
                text-gray-900 dark:text-white
                placeholder-gray-500 dark:placeholder-gray-400`}
              placeholder="Confirmar Nueva Contraseña"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Requisitos de contraseña */}
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-2.5">
          <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1.5">
            La contraseña debe tener:
          </p>
          <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
            <li>• Al menos 8 caracteres</li>
            <li>• Al menos una letra mayúscula</li>
            <li>• Al menos una letra minúscula</li>
            <li>• Al menos un número</li>
            <li>• Al menos un carácter especial (! @ # $ % ^ & * () , . ? " : { } | &lt; &gt;)</li>
          </ul>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg 
          hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed 
          flex items-center justify-center gap-2
          text-sm transition-colors duration-200"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <span>Cambiando contraseña...</span>
          </>
        ) : (
          'Cambiar Contraseña'
        )}
      </button>
    </form>
  );
};
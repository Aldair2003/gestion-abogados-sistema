import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TextField } from '../common/TextField';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { showToast } from '../../utils/toast';
import { motion } from 'framer-motion';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

interface ChangePasswordFormProps {
  onPasswordChanged: () => void;
  isCompleted?: boolean;
  compact?: boolean;
  initialPassword?: string;
}

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Debe contener al menos un carácter especial'),
  confirmPassword: z.string().min(1, 'Debe confirmar la contraseña')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof passwordSchema>;

export const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ 
  onPasswordChanged,
  isCompleted = false,
  compact = false,
  initialPassword = 'Temporal12345@'
}) => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<FormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: initialPassword
    }
  });

  useEffect(() => {
    setValue('currentPassword', initialPassword);
  }, [initialPassword, setValue]);

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      const response = await api.post('/users/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      
      showToast.success('¡Éxito!', 'Contraseña actualizada correctamente');
      if (user) {
        await updateUser({
          ...user,
          isTemporaryPassword: response.data.isTemporaryPassword
        });
      }
      reset();
      onPasswordChanged();
    } catch (error: any) {
      showToast.error('Error', error.response?.data?.message || 'Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (isCompleted) {
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
    <form onSubmit={handleSubmit(onSubmit)} className={`space-y-${compact ? '3' : '6'}`}>
      <div className={`grid grid-cols-1 gap-${compact ? '3' : '6'}`}>
        <div className="relative">
          <TextField
            label="Contraseña Temporal"
            type="password"
            {...register('currentPassword')}
            error={errors.currentPassword?.message}
            placeholder="Ingrese su contraseña temporal"
            compact={compact}
            defaultValue={initialPassword}
            showPasswordToggle={true}
            initialShowPassword={true}
          />
        </div>

        <TextField
          label="Nueva Contraseña"
          type="password"
          {...register('newPassword')}
          error={errors.newPassword?.message}
          placeholder="Ingrese su nueva contraseña"
          compact={compact}
          showPasswordToggle={true}
        />

        <TextField
          label="Confirmar Nueva Contraseña"
          type="password"
          {...register('confirmPassword')}
          error={errors.confirmPassword?.message}
          placeholder="Confirme su nueva contraseña"
          compact={compact}
          showPasswordToggle={true}
        />
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-md">
        <div className="text-xs text-blue-700">
          <p className="font-medium mb-1">La contraseña debe tener:</p>
          <ul className="list-disc list-inside space-y-0.5 ml-1">
            <li>Al menos 8 caracteres</li>
            <li>Al menos una letra mayúscula</li>
            <li>Al menos una letra minúscula</li>
            <li>Al menos un número</li>
            <li>Al menos un carácter especial (! @ # $ % ^ & * ( ) , . ? etc)</li>
          </ul>
        </div>
      </div>

      <motion.button
        type="submit"
        disabled={loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 
                   disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2
                   ${compact ? 'text-sm' : ''}`}
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <span>Guardando...</span>
          </>
        ) : (
          'Cambiar Contraseña'
        )}
      </motion.button>
    </form>
  );
};

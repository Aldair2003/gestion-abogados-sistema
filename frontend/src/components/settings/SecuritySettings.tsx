import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { KeyIcon, ClockIcon } from '@heroicons/react/24/outline';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { showToast } from '../../utils/toast';
import { useLanguage } from '../../context/LanguageContext';
import { LockClosedIcon } from '../icons/SettingsIcons';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Campo requerido'),
  newPassword: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string().min(1, 'Campo requerido')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"]
});

type FormValues = z.infer<typeof passwordSchema>;

interface Session {
  id: number;
  device: string;
  location: string;
  lastAccess: string;
  isCurrentSession: boolean;
}

interface SecuritySettingsProps {
  onPasswordChange: (currentPassword: string, newPassword: string) => Promise<void>;
  sessions: Session[];
  onSessionRevoke: (sessionId: number) => Promise<void>;
}

export const SecuritySettings: React.FC<SecuritySettingsProps> = ({
  onPasswordChange,
  sessions,
  onSessionRevoke
}) => {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(passwordSchema)
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      await onPasswordChange(data.currentPassword, data.newPassword);
      reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Cambio de contraseña */}
      <div>
        <h3 className="text-xl font-serif font-semibold text-gray-900 dark:text-white mb-2">
          {t('settings.security.password')}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {t('settings.security.passwordDescription')}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('settings.security.currentPassword')}
            </label>
            <input
              type="password"
              {...register('currentPassword')}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-white dark:bg-[#1e2330] text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500/50 
                       focus:border-transparent outline-none transition-all duration-200"
            />
            {errors.currentPassword && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.currentPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('settings.security.newPassword')}
            </label>
            <input
              type="password"
              {...register('newPassword')}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-white dark:bg-[#1e2330] text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500/50 
                       focus:border-transparent outline-none transition-all duration-200"
            />
            {errors.newPassword && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('settings.security.confirmPassword')}
            </label>
            <input
              type="password"
              {...register('confirmPassword')}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-white dark:bg-[#1e2330] text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500/50 
                       focus:border-transparent outline-none transition-all duration-200"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 
                     dark:bg-primary-500 dark:hover:bg-primary-600
                     text-white font-medium rounded-lg 
                     transition-colors duration-200 
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? t('message.updating') : t('settings.security.changePassword')}
          </button>
        </form>
      </div>

      {/* Sesiones activas */}
      <div>
        <h3 className="text-xl font-serif font-semibold text-gray-900 dark:text-white mb-2">
          {t('settings.security.sessions')}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {t('settings.security.sessionsDescription')}
        </p>

        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="p-4 rounded-lg bg-gray-100 dark:bg-[#1e2330] 
                       border border-gray-200 dark:border-gray-700/50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {session.device}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {session.location} • {session.lastAccess}
                  </p>
                </div>
                {!session.isCurrentSession && (
                  <button
                    onClick={() => onSessionRevoke(session.id)}
                    className="px-3 py-1 text-sm font-medium text-red-600 hover:text-red-700 
                             dark:text-red-500 dark:hover:text-red-400
                             transition-colors duration-200"
                  >
                    {t('settings.security.revokeAccess')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 
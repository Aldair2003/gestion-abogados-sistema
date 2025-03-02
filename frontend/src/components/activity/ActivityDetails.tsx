import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Activity } from '../../types/user';
import { ActivityIcon } from './ActivityIcon';
import { ClockIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { ComputerDesktopIcon, HashtagIcon, ArrowLeftOnRectangleIcon } from '../icons/CustomIcons';

interface ActivityDetailsProps {
  activity: Activity;
  onClose?: () => void;
}

export const ActivityDetails: React.FC<ActivityDetailsProps> = ({
  activity,
  onClose
}) => {
  const formatDate = (date: string) => {
    try {
      return format(new Date(date), "d 'de' MMMM, yyyy 'a las' HH:mm:ss", { locale: es });
    } catch {
      return 'Fecha no válida';
    }
  };

  const getActivityDescription = (activity: Activity) => {
    const descriptions: Record<string, (activity: Activity) => string> = {
      CREATE_USER: (act) => `Creó una cuenta para ${act.targetUser?.nombre || 'un usuario'}`,
      ACTIVATE_USER: (act) => `Activó la cuenta de ${act.targetUser?.nombre || 'un usuario'}`,
      DEACTIVATE_USER: (act) => `Desactivó la cuenta de ${act.targetUser?.nombre || 'un usuario'}`,
      LOGIN: () => 'Inició sesión en el sistema',
      LOGOUT: () => 'Cerró sesión en el sistema',
      UPDATE_PROFILE: () => 'Actualizó su perfil',
      PROFILE_COMPLETED: () => 'Completó su perfil',
      PASSWORD_CHANGED: () => 'Cambió su contraseña',
      UPDATE_USER: (act) => `Actualizó la información de ${act.targetUser?.nombre || 'un usuario'}`,
    };

    return descriptions[activity.action]?.(activity) || activity.action.replace(/_/g, ' ');
  };

  const getCategoryStyle = (category: string): { color: string; bgColor: string } => {
    const styles = {
      SESSION: { color: 'text-blue-700 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
      PROFILE: { color: 'text-purple-700 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-900/20' },
      ADMINISTRATIVE: { color: 'text-yellow-700 dark:text-yellow-400', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20' },
      ACCOUNT_STATUS: { color: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-900/20' }
    };
    return styles[category as keyof typeof styles] || { color: 'text-gray-700 dark:text-gray-400', bgColor: 'bg-gray-50 dark:bg-gray-900/20' };
  };

  const getCategoryLabel = (category: string): string => {
    const translations: Record<string, string> = {
      'SESSION': 'Sesión',
      'PROFILE': 'Perfil',
      'ADMINISTRATIVE': 'Administrativo',
      'ACCOUNT_STATUS': 'Estado de cuenta'
    };
    return translations[category] || category;
  };

  const categoryStyle = getCategoryStyle(activity.category);

  return (
    <div className="space-y-6">
      {/* Botón Volver con mejor visibilidad */}
      <div className="flex items-center justify-between">
        <button
          onClick={onClose}
          className="inline-flex items-center px-4 py-2 text-sm font-medium
                   text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800
                   border border-gray-300 dark:border-gray-600 rounded-lg
                   hover:bg-gray-50 dark:hover:bg-gray-700
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                   dark:focus:ring-offset-gray-800 transition-colors duration-150"
        >
          <ArrowLeftOnRectangleIcon className="w-4 h-4 mr-2" />
          Volver al listado
        </button>
      </div>

      {/* Encabezado de la actividad */}
      <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start space-x-4">
            <div className={`p-3 rounded-lg ${categoryStyle.bgColor}`}>
              <ActivityIcon 
                category={activity.category} 
                action={activity.action}
                className={`h-6 w-6 ${categoryStyle.color}`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {getActivityDescription(activity)}
              </h2>
              <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                <ClockIcon className="h-4 w-4 mr-1" />
                {formatDate(activity.createdAt)}
              </div>
            </div>
          </div>
        </div>

        {/* Detalles de la actividad */}
        <div className="border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-700">
            <div className="p-6 space-y-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Información general
              </h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                    <DocumentTextIcon className="h-4 w-4 mr-1" />
                    ID
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {activity.id}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                    <HashtagIcon className="h-4 w-4 mr-1" />
                    Categoría
                  </dt>
                  <dd className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryStyle.bgColor} ${categoryStyle.color}`}>
                      {getCategoryLabel(activity.category)}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                    <HashtagIcon className="h-4 w-4 mr-1" />
                    Acción
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {activity.action}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="p-6 space-y-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Metadatos
              </h3>
              <dl className="space-y-3">
                {activity.details?.metadata?.browser && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                      <ComputerDesktopIcon className="h-4 w-4 mr-1" />
                      Navegador
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {activity.details.metadata.browser}
                    </dd>
                  </div>
                )}
                {activity.details?.metadata?.ipAddress && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                      <ComputerDesktopIcon className="h-4 w-4 mr-1" />
                      Dirección IP
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {activity.details.metadata.ipAddress}
                    </dd>
                  </div>
                )}
                {activity.details?.metadata?.location && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                      <ComputerDesktopIcon className="h-4 w-4 mr-1" />
                      Ubicación
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {activity.details.metadata.location}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>

        {/* Cambios realizados (si existen) */}
        {activity.details?.metadata?.changes && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
              Cambios realizados
            </h3>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-700">
                <div className="p-4">
                  <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Antes
                  </h4>
                  <pre className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                    {JSON.stringify(activity.details.metadata.changes.before, null, 2)}
                  </pre>
                </div>
                <div className="p-4">
                  <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Después
                  </h4>
                  <pre className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                    {JSON.stringify(activity.details.metadata.changes.after, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 
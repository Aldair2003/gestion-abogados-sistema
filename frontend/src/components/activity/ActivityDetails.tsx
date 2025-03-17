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
      CREATE_USER: (act) => `Creó una cuenta para ${act.details?.userInfo?.target?.nombre || 'un usuario'}`,
      ACTIVATE_USER: (act) => `Activó la cuenta de ${act.details?.userInfo?.target?.nombre || 'un usuario'}`,
      DEACTIVATE_USER: (act) => `Desactivó la cuenta de ${act.details?.userInfo?.target?.nombre || 'un usuario'}`,
      LOGIN: () => 'Inició sesión en el sistema',
      LOGOUT: () => 'Cerró sesión en el sistema',
      UPDATE_PROFILE: () => 'Actualizó su perfil',
      PROFILE_COMPLETED: () => 'Completó su perfil',
      PASSWORD_CHANGED: () => 'Cambió su contraseña',
      UPDATE_USER: (act) => `Actualizó la información de ${act.details?.userInfo?.target?.nombre || 'un usuario'}`,
    };

    return descriptions[activity.action]?.(activity) || activity.action.replace(/_/g, ' ');
  };

  const getCategoryStyle = (category: string): { color: string; bgColor: string } => {
    const styles = {
      SESSION: { 
        color: 'text-blue-700 dark:text-blue-300', 
        bgColor: 'bg-blue-50 dark:bg-blue-900/40 dark:ring-1 dark:ring-blue-500/30' 
      },
      PROFILE: { 
        color: 'text-purple-700 dark:text-purple-300', 
        bgColor: 'bg-purple-50 dark:bg-purple-900/40 dark:ring-1 dark:ring-purple-500/30' 
      },
      ADMINISTRATIVE: { 
        color: 'text-yellow-700 dark:text-yellow-300', 
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/40 dark:ring-1 dark:ring-yellow-500/30' 
      },
      ACCOUNT_STATUS: { 
        color: 'text-red-700 dark:text-red-300', 
        bgColor: 'bg-red-50 dark:bg-red-900/40 dark:ring-1 dark:ring-red-500/30' 
      }
    };
    return styles[category as keyof typeof styles] || { 
      color: 'text-gray-700 dark:text-gray-300', 
      bgColor: 'bg-gray-50 dark:bg-gray-800/40 dark:ring-1 dark:ring-gray-500/30' 
    };
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
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
      {/* Botón Volver con mejor visibilidad */}
      <div className="flex items-center justify-between">
        <button
          onClick={onClose}
          className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium
                   text-gray-700 dark:text-white bg-white dark:bg-gray-800
                   border border-gray-200 dark:border-gray-700 rounded-lg
                   hover:bg-gray-50 dark:hover:bg-gray-700/80
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                   dark:focus:ring-offset-gray-900 dark:focus:ring-indigo-400
                   transition-all duration-150 shadow-sm dark:shadow-gray-900/20"
        >
          <ArrowLeftOnRectangleIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
          Volver al listado
        </button>
      </div>

      {/* Encabezado de la actividad con mejor contraste */}
      <div className="rounded-xl bg-white dark:bg-gray-800/95 border border-gray-200 dark:border-gray-700/80 
                    overflow-hidden shadow-sm dark:shadow-lg">
        <div className="p-4 sm:p-6">
          <div className="flex items-start space-x-3 sm:space-x-4">
            <div className={`p-2 sm:p-3 rounded-lg ${categoryStyle.bgColor} ring-1 ring-black/5 dark:ring-white/10`}>
              <ActivityIcon 
                category={activity.category} 
                action={activity.action}
                className={`h-5 w-5 sm:h-6 sm:w-6 ${categoryStyle.color}`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-xl font-semibold text-gray-900 dark:text-white">
                {getActivityDescription(activity)}
              </h2>
              <div className="mt-1 flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                <ClockIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                {formatDate(activity.createdAt)}
              </div>
            </div>
          </div>
        </div>

        {/* Detalles de la actividad con mejor contraste */}
        <div className="border-t border-gray-200 dark:border-gray-700/80">
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-200 dark:divide-gray-700/80">
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <h3 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                Información general
              </h3>
              <dl className="space-y-2 sm:space-y-3">
                <div>
                  <dt className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center">
                    <DocumentTextIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                    ID
                  </dt>
                  <dd className="mt-1 text-xs sm:text-sm text-gray-900 dark:text-white break-all">
                    {activity.id}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center">
                    <HashtagIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                    Categoría
                  </dt>
                  <dd className="mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium 
                                   ${categoryStyle.bgColor} ${categoryStyle.color}
                                   ring-1 ring-black/10 dark:ring-white/20`}>
                      {getCategoryLabel(activity.category)}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center">
                    <HashtagIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                    Acción
                  </dt>
                  <dd className="mt-1 text-xs sm:text-sm text-gray-900 dark:text-white">
                    {activity.action}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <h3 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                Metadatos
              </h3>
              <dl className="space-y-2 sm:space-y-3">
                {activity.details?.metadata?.browser && (
                  <div>
                    <dt className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center">
                      <ComputerDesktopIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                      Navegador
                    </dt>
                    <dd className="mt-1 text-xs sm:text-sm text-gray-900 dark:text-white">
                      {activity.details.metadata.browser}
                    </dd>
                  </div>
                )}
                {activity.details?.metadata?.ipAddress && (
                  <div>
                    <dt className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center">
                      <ComputerDesktopIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                      Dirección IP
                    </dt>
                    <dd className="mt-1 text-xs sm:text-sm text-gray-900 dark:text-white">
                      {activity.details.metadata.ipAddress}
                    </dd>
                  </div>
                )}
                {activity.details?.metadata?.location && (
                  <div>
                    <dt className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center">
                      <ComputerDesktopIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                      Ubicación
                    </dt>
                    <dd className="mt-1 text-xs sm:text-sm text-gray-900 dark:text-white">
                      {activity.details.metadata.location}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>

        {/* Cambios realizados con mejor contraste */}
        {activity.details?.metadata?.changes && (
          <div className="border-t border-gray-200 dark:border-gray-700/80 p-4 sm:p-6">
            <h3 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">
              Cambios realizados
            </h3>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700/80 overflow-hidden 
                          bg-gray-50 dark:bg-gray-900/50 shadow-sm dark:shadow-inner">
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-200 dark:divide-gray-700/80">
                <div className="p-3 sm:p-4">
                  <h4 className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">
                    Antes
                  </h4>
                  <pre className="text-xs sm:text-sm text-gray-900 dark:text-white font-mono bg-transparent overflow-x-auto">
                    {JSON.stringify(activity.details.metadata.changes.before, null, 2)}
                  </pre>
                </div>
                <div className="p-3 sm:p-4">
                  <h4 className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">
                    Después
                  </h4>
                  <pre className="text-xs sm:text-sm text-gray-900 dark:text-white font-mono bg-transparent overflow-x-auto">
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
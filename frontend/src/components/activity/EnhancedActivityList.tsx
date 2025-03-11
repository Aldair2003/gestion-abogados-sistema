import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Activity } from '../../types/user';
import { 
  KeyIcon, 
  DocumentTextIcon,
  UsersIcon,
  TrashIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

// Componentes de iconos personalizados
const UserCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

const ArrowUpIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
  </svg>
);

const ExclamationTriangleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
  </svg>
);

interface EnhancedActivityListProps {
  activities: Activity[];
  onActivityClick?: (activity: Activity) => void;
  className?: string;
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

const getActivityIcon = (action: string): React.ReactElement => {
  const icons: { [key: string]: React.ReactElement } = {
    LOGIN: <KeyIcon className="h-5 w-5 text-blue-500" />,
    LOGOUT: <KeyIcon className="h-5 w-5 text-gray-500" />,
    UPDATE_USER: <DocumentTextIcon className="h-5 w-5 text-yellow-500" />,
    CREATE_USER: <UserCircleIcon className="h-5 w-5 text-green-500" />,
    DELETE_USER: <TrashIcon className="h-5 w-5 text-red-500" />,
    BULK_DELETE_USERS: <UsersIcon className="h-5 w-5 text-red-500" />,
    BULK_ACTIVATE_USERS: <UsersIcon className="h-5 w-5 text-green-500" />,
    UPDATE_PROFILE: <ArrowUpIcon className="h-5 w-5 text-blue-500" />,
    ACTIVATE_USER: <UserCircleIcon className="h-5 w-5 text-green-500" />,
    DEACTIVATE_USER: <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
  };

  return icons[action] || <DocumentTextIcon className="h-5 w-5 text-gray-500" />;
};

const getActivityColor = (action: string) => {
  const colors: { [key: string]: string } = {
    LOGIN: 'bg-blue-500/10 dark:bg-blue-900/30 dark:ring-1 dark:ring-blue-500/20',
    LOGOUT: 'bg-gray-500/10 dark:bg-gray-800/40 dark:ring-1 dark:ring-gray-500/20',
    UPDATE_USER: 'bg-yellow-500/10 dark:bg-yellow-900/30 dark:ring-1 dark:ring-yellow-500/20',
    DELETE_USER: 'bg-red-500/10 dark:bg-red-900/30 dark:ring-1 dark:ring-red-500/20',
    CREATE_USER: 'bg-green-500/10 dark:bg-green-900/30 dark:ring-1 dark:ring-green-500/20',
    BULK_DELETE_USERS: 'bg-red-500/10 dark:bg-red-900/30 dark:ring-1 dark:ring-red-500/20',
    BULK_ACTIVATE_USERS: 'bg-green-500/10 dark:bg-green-900/30 dark:ring-1 dark:ring-green-500/20',
    UPDATE_PROFILE: 'bg-blue-500/10 dark:bg-blue-900/30 dark:ring-1 dark:ring-blue-500/20',
    ACTIVATE_USER: 'bg-green-500/10 dark:bg-green-900/30 dark:ring-1 dark:ring-green-500/20',
    DEACTIVATE_USER: 'bg-red-500/10 dark:bg-red-900/30 dark:ring-1 dark:ring-red-500/20'
  };

  return colors[action] || 'bg-gray-500/10 dark:bg-gray-800/40 dark:ring-1 dark:ring-gray-500/20';
};

const getActivityDescription = (activity: Activity) => {
  // Si hay una descripción personalizada, usarla
  if (activity.details?.description) {
    return activity.details.description;
  }

  // Si no hay acción, mostrar mensaje por defecto
  if (!activity.action) {
    return 'Actividad no especificada';
  }

  const performer = activity.details?.userInfo?.performer?.nombre || 'Usuario';
  const target = activity.details?.userInfo?.target?.nombre || 'otro usuario';

  const descriptions: { [key: string]: string } = {
    CREATE_USER: `${performer} creó una cuenta para ${target}`,
    UPDATE_USER: `${performer} actualizó la información de ${target}`,
    DELETE_USER: `${performer} eliminó la cuenta de ${target}`,
    ACTIVATE_USER: `${performer} activó la cuenta de ${target}`,
    DEACTIVATE_USER: `${performer} desactivó la cuenta de ${target}`,
    LOGIN: `${performer} inició sesión`,
    LOGOUT: `${performer} cerró sesión`,
    UPDATE_PROFILE: `${performer} actualizó su perfil`,
    BULK_DELETE_USERS: `${performer} eliminó múltiples usuarios`,
    BULK_ACTIVATE_USERS: `${performer} activó múltiples usuarios`,
    CREATE_PERSONA: `${performer} creó una nueva persona`,
    UPDATE_PERSONA: `${performer} actualizó una persona`,
    DELETE_PERSONA: `${performer} eliminó una persona`,
    CREATE_DOCUMENTO: `${performer} subió un documento`,
    VERIFY_DOCUMENTO: `${performer} verificó un documento`,
    REJECT_DOCUMENTO: `${performer} rechazó un documento`
  };

  // Si hay una descripción predefinida, usarla
  if (descriptions[activity.action]) {
    return descriptions[activity.action];
  }

  // Si no hay descripción predefinida, formatear la acción
  return activity.action
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
};

export const EnhancedActivityList = ({ activities, onActivityClick, className = '', loading, onLoadMore, hasMore }: EnhancedActivityListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const categories = useMemo(() => {
    const cats = activities.reduce((acc, activity) => {
      const category = activity.category || 'UNKNOWN';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(cats).sort((a, b) => b[1] - a[1]);
  }, [activities]);

  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      const matchesSearch = searchTerm === '' || 
        activity.details?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.action.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === '' || activity.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [activities, searchTerm, selectedCategory]);

  const getCategoryLabel = (category: string) => {
    const translations: Record<string, string> = {
      'SESSION': 'Sesión',
      'PROFILE': 'Perfil',
      'ADMINISTRATIVE': 'Administrativo',
      'ACCOUNT_STATUS': 'Estado de cuenta'
    };
    return translations[category] || category;
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-500 dark:text-gray-400">No hay actividades registradas</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Barra de búsqueda mejorada */}
      <div className="mb-4">
        <div className="relative w-full">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Buscar actividades..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg 
                     border border-gray-200 dark:border-gray-700 
                     bg-white dark:bg-gray-800
                     focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 
                     focus:border-transparent 
                     text-gray-900 dark:text-gray-100
                     placeholder-gray-500 dark:placeholder-gray-400
                     shadow-sm dark:shadow-gray-900/10"
          />
        </div>
      </div>

      {/* Filtros por categoría mejorados */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setSelectedCategory('')}
          className={`px-3 py-1 text-xs rounded-full transition-colors shadow-sm
                     ${selectedCategory === '' 
                       ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/70 dark:text-indigo-200 dark:ring-1 dark:ring-indigo-500/30' 
                       : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800/70 dark:text-gray-300 dark:hover:bg-gray-700/70 dark:ring-1 dark:ring-gray-700'}`}
        >
          Todas ({activities.length})
        </button>
        {categories.map(([category, count]) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1 text-xs rounded-full transition-colors shadow-sm
                       ${selectedCategory === category 
                         ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/70 dark:text-indigo-200 dark:ring-1 dark:ring-indigo-500/30' 
                         : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800/70 dark:text-gray-300 dark:hover:bg-gray-700/70 dark:ring-1 dark:ring-gray-700'}`}
          >
            {getCategoryLabel(category)} ({count})
          </button>
        ))}
      </div>

      {/* Lista de actividades mejorada */}
      <div className="space-y-4">
        {filteredActivities.map((activity) => (
          <div
            key={activity.id}
            className={`p-4 rounded-lg ${getActivityColor(activity.action)} 
                       flex items-start gap-4 transition-colors duration-150
                       hover:bg-opacity-20 dark:hover:bg-opacity-40`}
          >
            <div className="flex-shrink-0">
              {getActivityIcon(activity.action)}
            </div>
            <div className="flex-grow">
              <p className="text-sm text-gray-800 dark:text-gray-100">
                {getActivityDescription(activity)}
              </p>
              <div className="mt-1 flex items-center gap-2 text-xs">
                <span className="text-gray-500 dark:text-gray-400">
                  {format(new Date(activity.createdAt), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                </span>
                {activity.details?.metadata && (
                  <span className="text-gray-400 dark:text-gray-500">•</span>
                )}
                {activity.details?.metadata && (
                  <span className="text-gray-500 dark:text-gray-400">
                    {Object.entries(activity.details.metadata)
                      .filter(([key]) => !['userInfo', 'timestamp'].includes(key))
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(', ')}
                  </span>
                )}
              </div>
              {activity.details?.userInfo?.target && (
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-medium text-gray-600 dark:text-gray-300">Usuario afectado: </span>
                  {activity.details.userInfo.target.nombre} ({activity.details.userInfo.target.email})
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-center py-4">
            <div className="inline-block h-6 w-6 animate-spin rounded-full 
                          border-2 border-gray-300 dark:border-gray-600 
                          border-t-primary-600 dark:border-t-primary-400"></div>
          </div>
        )}
        {hasMore && !loading && (
          <button
            onClick={onLoadMore}
            className="w-full py-2 text-sm text-gray-600 dark:text-gray-400 
                     hover:text-gray-800 dark:hover:text-gray-200
                     transition-colors duration-150"
          >
            Cargar más actividades
          </button>
        )}
      </div>
    </div>
  );
}; 
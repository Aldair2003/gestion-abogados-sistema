import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Activity } from '../../types/user';
import { ActivityIcon } from './ActivityIcon';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface EnhancedActivityListProps {
  activities: Activity[];
  onActivityClick?: (activity: Activity) => void;
  className?: string;
}

const formatDateTime = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Fecha no válida';
    return format(date, "d 'de' MMMM, yyyy", { locale: es });
  } catch {
    return 'Fecha no válida';
  }
};

const formatTime = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '--:--';
    return format(date, 'HH:mm');
  } catch {
    return '--:--';
  }
};

const groupActivitiesByDate = (activities: Activity[]) => {
  const groups: { [key: string]: Activity[] } = {};
  
  activities.forEach(activity => {
    if (!activity.createdAt) return;
    const date = new Date(activity.createdAt);
    if (isNaN(date.getTime())) return;
    
    const dateKey = format(date, 'yyyy-MM-dd');
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(activity);
  });
  
  return groups;
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

export const EnhancedActivityList = ({ activities, onActivityClick, className = '' }: EnhancedActivityListProps) => {
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

  const groupedActivities = useMemo(() => {
    return groupActivitiesByDate(filteredActivities);
  }, [filteredActivities]);

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
      {/* Barra de búsqueda */}
      <div className="mb-4">
        <div className="relative w-full">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar actividades..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 
                     dark:border-gray-700 bg-gray-50 dark:bg-gray-900
                     focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 
                     focus:border-transparent dark:text-gray-200"
          />
        </div>
      </div>

      {/* Filtros por categoría */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setSelectedCategory('')}
          className={`px-3 py-1 text-xs rounded-full transition-colors
                     ${selectedCategory === '' 
                       ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' 
                       : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'}`}
        >
          Todas ({activities.length})
        </button>
        {categories.map(([category, count]) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1 text-xs rounded-full transition-colors
                       ${selectedCategory === category 
                         ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' 
                         : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'}`}
          >
            {getCategoryLabel(category)} ({count})
          </button>
        ))}
      </div>

      {/* Lista de actividades */}
      <div className="space-y-2 w-full">
        {Object.entries(groupedActivities).map(([date, dateActivities]) => (
          <div key={date} className="w-full">
            <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-800/95 py-2 backdrop-blur">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {formatDateTime(date)}
              </h3>
            </div>
            <div className="space-y-1">
              {dateActivities.map((activity) => (
                <button
                  key={activity.id}
                  onClick={() => {
                    console.log('Actividad clickeada:', activity);
                    onActivityClick?.(activity);
                  }}
                  className="w-full text-left p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50
                           transition-colors duration-150 group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <ActivityIcon 
                      category={activity.category || 'ADMINISTRATIVE'} 
                      action={activity.action}
                      className="h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-600
                               dark:text-gray-500 dark:group-hover:text-gray-300" 
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {activity.details?.description || getActivityDescription(activity)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {formatTime(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 
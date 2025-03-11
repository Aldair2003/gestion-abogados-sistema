import React from 'react';
import { Activity, ActivityFilters } from '../../types/activity';
import { formatDate } from '../../utils/dateUtils';

export interface ActivityListProps {
  activities: Activity[];
  compact?: boolean;
  loading?: boolean;
  filters?: ActivityFilters;
}

export const ActivityList: React.FC<ActivityListProps> = ({ activities, compact = false, loading = false }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-500">No hay actividad registrada</p>
      </div>
    );
  }

  return (
    <div className={`space-y-${compact ? '1.5' : '3'}`}>
      {activities.map((activity) => (
        <div 
          key={activity.id}
          className={`bg-white rounded-lg shadow-sm border border-gray-100 
                     ${compact ? 'p-2' : 'p-3'} mb-2`}
        >
          <div className="flex items-center gap-3">
            <span className={`rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0
                            ${compact ? 'h-6 w-6' : 'h-7 w-7'}`}>
              <span className={`font-medium text-white
                              ${compact ? 'text-[10px]' : 'text-xs'}`}>
                {activity.action.charAt(0)}
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <p className={`font-medium text-gray-900 truncate
                           ${compact ? 'text-xs' : 'text-sm'}`}>
                {activity.action.replace(/_/g, ' ')}
              </p>
              <div className={`text-gray-400
                             ${compact ? 'text-[10px]' : 'text-xs'}`}>
                <time dateTime={activity.createdAt}>
                  {new Date(activity.createdAt).toLocaleString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </time>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}; 
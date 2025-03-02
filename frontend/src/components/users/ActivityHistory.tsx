import React, { useState } from 'react';
import { 
  ClockIcon, 
  UserCircleIcon, 
  DocumentTextIcon,
  KeyIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import DatePicker from 'react-datepicker';

interface Activity {
  id: number;
  action: string;
  description: string;
  createdAt: Date;
  ipAddress: string;
  userAgent: string;
}

interface ActivityHistoryProps {
  activities: Activity[];
  onLoadMore: () => void;
  loading: boolean;
  hasMore: boolean;
}

export const ActivityHistory = ({ activities, onLoadMore, loading, hasMore }: ActivityHistoryProps) => {
  const [actionFilter, setActionFilter] = useState('');
  const [dateRange, setDateRange] = useState<{start: Date | undefined, end: Date | undefined}>({
    start: undefined,
    end: undefined
  });

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'LOGIN':
        return <KeyIcon className="h-5 w-5 text-blue-500" />;
      case 'UPDATE':
        return <DocumentTextIcon className="h-5 w-5 text-yellow-500" />;
      case 'DEACTIVATE':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'LOGIN':
        return 'bg-blue-500/10';
      case 'UPDATE':
        return 'bg-yellow-500/10';
      case 'DEACTIVATE':
        return 'bg-red-500/10';
      default:
        return 'bg-gray-500/10';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-4 mb-4">
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 bg-dark-600 border border-dark-500 rounded-lg text-white"
        >
          <option value="">Todos los tipos</option>
          <option value="LOGIN">Inicio de sesión</option>
          <option value="UPDATE">Actualización</option>
          <option value="DEACTIVATE">Desactivación</option>
        </select>

        <div className="flex gap-2">
          <DatePicker
            selected={dateRange.start}
            onChange={(date: Date | null) => setDateRange(prev => ({ 
              ...prev, 
              start: date || undefined 
            }))}
            className="px-3 py-2 bg-dark-600 border border-dark-500 rounded-lg text-white"
            placeholderText="Fecha inicio"
            maxDate={dateRange.end || new Date()}
            isClearable
          />
          <DatePicker
            selected={dateRange.end}
            onChange={(date: Date | null) => setDateRange(prev => ({ 
              ...prev, 
              end: date || undefined 
            }))}
            className="px-3 py-2 bg-dark-600 border border-dark-500 rounded-lg text-white"
            placeholderText="Fecha fin"
            minDate={dateRange.start}
            maxDate={new Date()}
            isClearable
          />
        </div>
      </div>

      {/* Lista de actividades */}
      <div className="space-y-4 max-h-[400px] overflow-y-auto">
        {activities.map((activity) => (
          <div 
            key={activity.id} 
            className={`flex items-start gap-3 p-3 rounded-lg ${getActivityColor(activity.action)}`}
          >
            <div className="flex-shrink-0">
              {getActivityIcon(activity.action)}
            </div>
            <div>
              <p className="text-sm text-white">{activity.description}</p>
              <p className="text-xs text-gray-400">
                {new Date(activity.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Botón cargar más */}
      {hasMore && (
        <div className="text-center mt-4">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="px-4 py-2 bg-dark-600 text-white rounded-lg hover:bg-dark-500
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Cargando...' : 'Cargar más'}
          </button>
        </div>
      )}
    </div>
  );
}; 
import React, { useState } from 'react';
import { useActivityLogs } from '../../hooks/useActivityLogs';
import { ActivityList } from '../../components/activity/ActivityList';
import { TextField } from '../../components/common/TextField';
import { motion } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';

// Componente de ícono personalizado
const FunnelIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth="1.5" 
    stroke="currentColor" 
    className={className}
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" 
    />
  </svg>
);

export const ActivityLogs = () => {
  const { 
    logs, 
    loading, 
    error, 
    filters,
    pagination,
    hasMore,
    loadMore,
    updateFilters,
    clearFilters 
  } = useActivityLogs();

  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (field: string, value: string | number | undefined) => {
    updateFilters({ [field]: value });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Registro de Actividad
        </h2>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 
            bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg 
            hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
        >
          <FunnelIcon className="w-4 h-4" />
          Filtros
        </button>
      </div>

      {/* Panel de Filtros */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Filtros</h3>
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <XMarkIcon className="w-4 h-4" />
              Limpiar filtros
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TextField
              label="Usuario ID"
              type="number"
              value={filters.userId || ''}
              onChange={(e) => handleFilterChange('userId', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Filtrar por ID de usuario"
            />
            <TextField
              label="Acción"
              type="text"
              value={filters.action || ''}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              placeholder="Tipo de acción"
            />
            <TextField
              label="Fecha Inicio"
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>
        </motion.div>
      )}

      {/* Lista de Actividades */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <ActivityList 
          activities={logs}
          loading={loading}
        />
        
        {/* Paginación */}
        {!loading && logs.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>
                Mostrando {logs.length} de {pagination.totalItems} registros
              </span>
              {hasMore && (
                <button
                  onClick={loadMore}
                  className="px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 
                    hover:text-primary-700 dark:hover:text-primary-300"
                >
                  Cargar más
                </button>
              )}
            </div>
          </div>
        )}

        {/* Mensaje de Error */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Sin Resultados */}
        {!loading && !error && logs.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">No se encontraron registros de actividad</p>
          </div>
        )}
      </div>
    </div>
  );
}; 
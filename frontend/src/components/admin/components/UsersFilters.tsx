import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MagnifyingGlassIcon, XMarkIcon, UsersIcon } from '@heroicons/react/24/outline';
import { UserRole } from '../../../types/user';

interface FiltersState {
  search: string;
  rol: UserRole | '';
  isActive: string;
}

const UsersFilters: React.FC = () => {
  const [filters, setFilters] = useState<FiltersState>({
    search: '',
    rol: '',
    isActive: '',
  });

  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  const handleClearFilters = () => {
    setFilters({
      search: '',
      rol: '',
      isActive: '',
    });
    setHasActiveFilters(false);
  };

  const onFilterChange = (newFilter: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilter }));
    setHasActiveFilters(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-white dark:bg-[#172133] rounded-2xl shadow-lg 
                 border border-gray-200 dark:border-gray-700/30 mb-4"
    >
      <div className="p-4 space-y-4">
        {/* Encabezado y barra de búsqueda */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary-50 dark:bg-gradient-to-br dark:from-primary-500/10 dark:to-primary-600/10 
                            rounded-xl shadow-sm">
                <MagnifyingGlassIcon className="h-5 w-5 text-primary-600 dark:text-primary-500" />
              </div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Filtros de búsqueda
              </h2>
            </div>
            {hasActiveFilters && (
              <motion.button
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClearFilters}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium
                         bg-red-50 dark:bg-red-500/10
                         border border-red-200 dark:border-red-500/30
                         text-red-700 dark:text-red-400
                         hover:bg-red-100 dark:hover:bg-red-500/20
                         transition-all duration-200"
              >
                <XMarkIcon className="h-4 w-4" />
                <span>Limpiar filtros</span>
              </motion.button>
            )}
          </div>

          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 
                                          h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={filters.search}
              onChange={(e) => onFilterChange({ search: e.target.value })}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm
                       bg-white dark:bg-[#1d2842]/80
                       border border-gray-300 dark:border-gray-700/50
                       text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-primary-500/20
                       focus:border-primary-500
                       placeholder-gray-500
                       shadow-sm
                       transition-all duration-300"
            />
          </div>
        </div>

        {/* Filtros principales en grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Columna izquierda: Rol y Estado */}
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium 
                              text-gray-700 dark:text-gray-400 mb-1.5">
                <UsersIcon className="h-3.5 w-3.5" />
                Rol
              </label>
              <select
                value={filters.rol}
                onChange={(e) => onFilterChange({ rol: e.target.value as UserRole | '' })}
                className="w-full px-3 py-2 rounded-xl text-sm
                         bg-white dark:bg-[#1d2842]/80
                         border border-gray-300 dark:border-gray-700/50
                         text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-primary-500/20
                         focus:border-primary-500
                         shadow-sm
                         transition-all duration-300"
              >
                <option value="">Todos los roles</option>
                <option value="ADMIN">Administrador</option>
                <option value="COLABORADOR">Colaborador</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium 
                              text-gray-700 dark:text-gray-400 mb-1.5">
                Estado
              </label>
              <select
                value={filters.isActive}
                onChange={(e) => onFilterChange({ isActive: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-sm
                         bg-white dark:bg-[#1d2842]/80
                         border border-gray-300 dark:border-gray-700/50
                         text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-primary-500/20
                         focus:border-primary-500
                         shadow-sm
                         transition-all duration-300"
              >
                <option value="">Todos los estados</option>
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default UsersFilters; 
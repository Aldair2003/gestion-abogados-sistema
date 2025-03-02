import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface FiltersProps {
  filters: {
    search: string;
    rol: string;
    isActive: string;
    createdAtStart: Date | null;
    createdAtEnd: Date | null;
    lastLoginStart: Date | null;
    lastLoginEnd: Date | null;
  };
  onFilterChange: (filters: any) => void;
}

export const UsersFilters = ({ filters, onFilterChange }: FiltersProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/90 dark:bg-dark-800/90 rounded-xl shadow-lg relative z-20"
    >
      {/* Barra de búsqueda */}
      <div className="p-4 border-b border-gray-200/30 dark:border-dark-700/30">
        <div className="relative">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 
                                        text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg
                     bg-gray-50/50 dark:bg-dark-700/50
                     border border-gray-200/50 dark:border-dark-600/50
                     text-gray-900 dark:text-white
                     placeholder-gray-500 dark:placeholder-gray-400
                     focus:ring-2 focus:ring-primary-500/20
                     focus:border-primary-500
                     transition-all duration-200"
          />
        </div>
      </div>

      {/* Filtros avanzados */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Fecha de registro */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Fecha de registro
          </label>
          <div className="flex gap-2">
            <DatePicker
              selected={filters.createdAtStart}
              onChange={(date: Date | null) => onFilterChange({ ...filters, createdAtStart: date })}
              placeholderText="Desde"
              className="w-full rounded-lg bg-gray-50/50 dark:bg-dark-700/50
                       border border-gray-200/50 dark:border-dark-600/50
                       text-gray-900 dark:text-white py-2 px-3
                       focus:ring-2 focus:ring-primary-500/20
                       focus:border-primary-500"
              dateFormat="dd/MM/yyyy"
              isClearable
              showPopperArrow={false}
            />
            <DatePicker
              selected={filters.createdAtEnd}
              onChange={(date: Date | null) => onFilterChange({ ...filters, createdAtEnd: date })}
              placeholderText="Hasta"
              className="w-full rounded-lg bg-gray-50/50 dark:bg-dark-700/50
                       border border-gray-200/50 dark:border-dark-600/50
                       text-gray-900 dark:text-white py-2 px-3
                       focus:ring-2 focus:ring-primary-500/20
                       focus:border-primary-500"
              dateFormat="dd/MM/yyyy"
              isClearable
              showPopperArrow={false}
            />
          </div>
        </div>

        {/* Último acceso */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Último acceso
          </label>
          <div className="flex gap-2">
            <DatePicker
              selected={filters.lastLoginStart}
              onChange={(date: Date | null) => onFilterChange({ ...filters, lastLoginStart: date })}
              placeholderText="Desde"
              className="w-full rounded-lg bg-gray-50/50 dark:bg-dark-700/50
                       border border-gray-200/50 dark:border-dark-600/50
                       text-gray-900 dark:text-white py-2 px-3
                       focus:ring-2 focus:ring-primary-500/20
                       focus:border-primary-500"
              dateFormat="dd/MM/yyyy"
              isClearable
              showPopperArrow={false}
            />
            <DatePicker
              selected={filters.lastLoginEnd}
              onChange={(date: Date | null) => onFilterChange({ ...filters, lastLoginEnd: date })}
              placeholderText="Hasta"
              className="w-full rounded-lg bg-gray-50/50 dark:bg-dark-700/50
                       border border-gray-200/50 dark:border-dark-600/50
                       text-gray-900 dark:text-white py-2 px-3
                       focus:ring-2 focus:ring-primary-500/20
                       focus:border-primary-500"
              dateFormat="dd/MM/yyyy"
              isClearable
              showPopperArrow={false}
            />
          </div>
        </div>

        {/* Selector de Rol */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Rol
          </label>
          <select
            value={filters.rol}
            onChange={(e) => onFilterChange({ ...filters, rol: e.target.value })}
            className="w-full rounded-lg bg-gray-50/50 dark:bg-dark-700/50
                     border border-gray-200/50 dark:border-dark-600/50
                     text-gray-900 dark:text-white py-2 px-3
                     focus:ring-2 focus:ring-primary-500/20
                     focus:border-primary-500
                     transition-all duration-200"
          >
            <option value="">Todos los roles</option>
            <option value="admin">Administrador</option>
            <option value="colaborador">Colaborador</option>
          </select>
        </div>

        {/* Estado */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Estado
          </label>
          <select
            value={filters.isActive}
            onChange={(e) => onFilterChange({ ...filters, isActive: e.target.value })}
            className="w-full rounded-lg bg-gray-50/50 dark:bg-dark-700/50
                     border border-gray-200/50 dark:border-dark-600/50
                     text-gray-900 dark:text-white py-2 px-3
                     focus:ring-2 focus:ring-primary-500/20
                     focus:border-primary-500
                     transition-all duration-200"
          >
            <option value="">Todos los estados</option>
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </select>
        </div>
      </div>
    </motion.div>
  );
}; 
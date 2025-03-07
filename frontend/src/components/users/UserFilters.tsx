import React from 'react';
import { motion } from 'framer-motion';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface UserFiltersProps {
  filters: {
    search?: string;
    rol?: string;
    estado?: string;
    fechaRegistroDesde?: Date | null;
    fechaRegistroHasta?: Date | null;
    ultimoAccesoDesde?: Date | null;
    ultimoAccesoHasta?: Date | null;
  };
  onChange: (filters: any) => void;
}

export const UserFilters: React.FC<UserFiltersProps> = ({ filters, onChange }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const handleClearFilters = () => {
    onChange({
      search: '',
      rol: '',
      estado: '',
      fechaRegistroDesde: null,
      fechaRegistroHasta: null,
      ultimoAccesoDesde: null,
      ultimoAccesoHasta: null
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
    >
      {/* Barra de búsqueda principal */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={filters.search || ''}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg
                      bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                      focus:ring-2 focus:ring-primary-500 focus:border-transparent
                      placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>
      </div>

      {/* Botón para expandir/colapsar filtros adicionales */}
      <div className="px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300
                     hover:text-primary-600 dark:hover:text-primary-400"
        >
          <span className="text-gray-500">Filtros avanzados</span>
        </button>
        {Object.values(filters).some(value => value !== '' && value !== null) && (
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-1 text-sm font-medium text-gray-500 dark:text-gray-400
                       hover:text-red-600 dark:hover:text-red-400"
          >
            <XMarkIcon className="h-4 w-4" />
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Filtros expandibles */}
      <motion.div
        initial={false}
        animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <div className="p-4 space-y-4 border-t border-gray-200 dark:border-gray-700">
          {/* Filtros de rol y estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Rol
              </label>
              <select
                value={filters.rol || ''}
                onChange={(e) => onChange({ ...filters, rol: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg
                          bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                          focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Todos los roles</option>
                <option value="ADMIN">Administrador</option>
                <option value="USER">Usuario</option>
                <option value="COLABORADOR">Colaborador</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Estado
              </label>
              <select
                value={filters.estado || ''}
                onChange={(e) => onChange({ ...filters, estado: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg
                          bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                          focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Todos los estados</option>
                <option value="ACTIVO">Activo</option>
                <option value="INACTIVO">Inactivo</option>
              </select>
            </div>
          </div>

          {/* Filtros de fecha */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Fecha de registro
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DatePicker
                  selected={filters.fechaRegistroDesde}
                  onChange={(date) => onChange({ ...filters, fechaRegistroDesde: date })}
                  placeholderText="Desde"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg
                            bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                            focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  dateFormat="dd/MM/yyyy"
                />
                <DatePicker
                  selected={filters.fechaRegistroHasta}
                  onChange={(date) => onChange({ ...filters, fechaRegistroHasta: date })}
                  placeholderText="Hasta"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg
                            bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                            focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  dateFormat="dd/MM/yyyy"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Último acceso
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DatePicker
                  selected={filters.ultimoAccesoDesde}
                  onChange={(date) => onChange({ ...filters, ultimoAccesoDesde: date })}
                  placeholderText="Desde"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg
                            bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                            focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  dateFormat="dd/MM/yyyy"
                />
                <DatePicker
                  selected={filters.ultimoAccesoHasta}
                  onChange={(date) => onChange({ ...filters, ultimoAccesoHasta: date })}
                  placeholderText="Hasta"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg
                            bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                            focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  dateFormat="dd/MM/yyyy"
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}; 
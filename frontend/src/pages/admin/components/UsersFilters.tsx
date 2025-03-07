import React from 'react';
import { motion } from 'framer-motion';
import { 
  MagnifyingGlassIcon,
  CalendarIcon, 
  ClockIcon,
  XMarkIcon,
  UsersIcon,
  ChevronLeftIcon,
  ChevronRightIcon,

} from '@heroicons/react/24/outline';

import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale';
import "react-datepicker/dist/react-datepicker.css";
import { UserRole } from '../../../types/user';

registerLocale('es', es);

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

interface DatePickerHeaderProps {
  date: Date;
  decreaseMonth: () => void;
  increaseMonth: () => void;
  prevMonthButtonDisabled: boolean;
  nextMonthButtonDisabled: boolean;
}

interface FiltersState {
  search: string;
  rol: UserRole | '';
  isActive: string;
  createdAtStart: Date | null;
  createdAtEnd: Date | null;
  lastLoginStart: Date | null;
  lastLoginEnd: Date | null;
}

interface UsersFiltersProps {
  filters: FiltersState;
  onFilterChange: (filters: Partial<FiltersState>) => void;
}

export const UsersFilters = ({ filters, onFilterChange }: UsersFiltersProps) => {
  const handleClearFilters = () => {
      onFilterChange({
      search: '',
      rol: '',
      isActive: '',
      createdAtStart: null,
      createdAtEnd: null,
      lastLoginStart: null,
      lastLoginEnd: null
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== null
  );

  const commonDatePickerProps = {
    dateFormat: "dd/MM/yyyy",
    isClearable: true,
    showTimeSelect: false,
    locale: "es",
    monthsShown: 1,
    showPopperArrow: false,
    formatWeekDay: (nameOfDay: string) => nameOfDay.substring(0, 2),
    renderCustomHeader: ({
    date,
    decreaseMonth,
    increaseMonth,
    prevMonthButtonDisabled,
    nextMonthButtonDisabled
    }: DatePickerHeaderProps) => (
      <div className="flex items-center justify-between px-2">
        <button
          onClick={decreaseMonth}
          disabled={prevMonthButtonDisabled}
          type="button"
          className={`p-1 ${prevMonthButtonDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-[#1d2842]'} rounded-md`}
        >
          <ChevronLeftIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {MONTHS[date.getMonth()]} {date.getFullYear()}
        </span>
        <button
          onClick={increaseMonth}
          disabled={nextMonthButtonDisabled}
          type="button"
          className={`p-1 ${nextMonthButtonDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-[#1d2842]'} rounded-md`}
        >
          <ChevronRightIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>
    )
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-white dark:bg-[#172133] rounded-2xl shadow-lg 
                 border border-gray-200 dark:border-gray-700/30 mb-6 relative z-10"
    >
      <div className="p-6 space-y-6">
        {/* Encabezado y barra de búsqueda */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-primary-500/10 to-primary-600/10 
                            rounded-xl shadow-inner shadow-primary-500/10">
                <MagnifyingGlassIcon className="h-5 w-5 text-primary-500" />
        </div>
              <h2 className="text-base font-semibold bg-gradient-to-r from-gray-900 to-gray-600 
                           dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
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
                         bg-gradient-to-r from-red-500/10 to-red-600/10
                         dark:from-red-500/20 dark:to-red-600/20
                         border border-red-200/50 dark:border-red-500/30
                         text-red-700 dark:text-red-400
                         hover:bg-gradient-to-r hover:from-red-500/20 hover:to-red-600/20
                         dark:hover:from-red-500/30 dark:hover:to-red-600/30
                         hover:border-red-500/50 dark:hover:border-red-500/50
                         hover:text-red-800 dark:hover:text-red-300
                         shadow-sm hover:shadow-md hover:shadow-red-500/10
                         transition-all duration-300"
              >
                <XMarkIcon className="h-4 w-4" />
                <span>Limpiar filtros</span>
              </motion.button>
            )}
          </div>

          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 
                                          h-4 w-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={filters.search}
              onChange={(e) => onFilterChange({ search: e.target.value })}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm
                       bg-white dark:bg-[#1d2842]/80
                       border border-gray-200 dark:border-gray-700/50
                       text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-primary-500/20
                       focus:border-primary-500
                       placeholder-gray-400 dark:placeholder-gray-500
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
                              text-gray-600 dark:text-gray-400 mb-1.5">
                <UsersIcon className="h-3.5 w-3.5" />
                Rol
              </label>
              <select
                value={filters.rol}
                onChange={(e) => onFilterChange({ rol: e.target.value as UserRole | '' })}
                className="w-full px-3 py-2 rounded-xl text-sm
                         bg-white dark:bg-[#1d2842]/80
                         border border-gray-200 dark:border-gray-700/50
                         text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-primary-500/20
                         focus:border-primary-500
                         transition-all duration-300"
              >
                <option value="">Todos los roles</option>
                <option value="ADMIN">Administrador</option>
                <option value="COLABORADOR">Colaborador</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium 
                              text-gray-600 dark:text-gray-400 mb-1.5">
                Estado
              </label>
              <select
                value={filters.isActive}
                onChange={(e) => onFilterChange({ isActive: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-sm
                         bg-white dark:bg-[#1d2842]/80
                         border border-gray-200 dark:border-gray-700/50
                         text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-primary-500/20
                         focus:border-primary-500
                         transition-all duration-300"
              >
                <option value="">Todos los estados</option>
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>
          </div>

          {/* Columna derecha: Filtros de fecha */}
          <div className="space-y-4">
            {/* Fecha de registro */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-medium 
                              text-gray-600 dark:text-gray-400 mb-1.5">
                <CalendarIcon className="h-3.5 w-3.5" />
                Fecha de registro
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <DatePicker
                    selected={filters.createdAtStart}
                    onChange={(date: Date | null) => onFilterChange({ createdAtStart: date })}
                    selectsStart
                    startDate={filters.createdAtStart || undefined}
                    endDate={filters.createdAtEnd || undefined}
                    maxDate={filters.createdAtEnd || new Date()}
                    placeholderText="Desde"
                    className="w-full px-3 py-2 rounded-xl text-sm
                             bg-white dark:bg-[#1d2842]/80
                             border border-gray-200 dark:border-gray-700/50
                             text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-primary-500/20
                             focus:border-primary-500
                             transition-all duration-300"
                    {...commonDatePickerProps}
                  />
                </div>
                <div className="flex-1">
                  <DatePicker
                    selected={filters.createdAtEnd}
                    onChange={(date: Date | null) => onFilterChange({ createdAtEnd: date })}
                    selectsEnd
                    startDate={filters.createdAtStart || undefined}
                    endDate={filters.createdAtEnd || undefined}
                    minDate={filters.createdAtStart || undefined}
                    maxDate={new Date()}
                    placeholderText="Hasta"
                    className="w-full px-3 py-2 rounded-xl text-sm
                             bg-white dark:bg-[#1d2842]/80
                             border border-gray-200 dark:border-gray-700/50
                             text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-primary-500/20
                             focus:border-primary-500
                             transition-all duration-300"
                    {...commonDatePickerProps}
                  />
          </div>
        </div>
      </div>

      {/* Último acceso */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-medium 
                              text-gray-600 dark:text-gray-400 mb-1.5">
                <ClockIcon className="h-3.5 w-3.5" />
          Último acceso
        </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <DatePicker
              selected={filters.lastLoginStart}
                    onChange={(date: Date | null) => onFilterChange({ lastLoginStart: date })}
                    selectsStart
                    startDate={filters.lastLoginStart || undefined}
                    endDate={filters.lastLoginEnd || undefined}
                    maxDate={filters.lastLoginEnd || new Date()}
                    placeholderText="Desde"
                    className="w-full px-3 py-2 rounded-xl text-sm
                             bg-white dark:bg-[#1d2842]/80
                             border border-gray-200 dark:border-gray-700/50
                             text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-primary-500/20
                             focus:border-primary-500
                             transition-all duration-300"
                    {...commonDatePickerProps}
                  />
          </div>
                <div className="flex-1">
                  <DatePicker
              selected={filters.lastLoginEnd}
                    onChange={(date: Date | null) => onFilterChange({ lastLoginEnd: date })}
                    selectsEnd
                    startDate={filters.lastLoginStart || undefined}
                    endDate={filters.lastLoginEnd || undefined}
                    minDate={filters.lastLoginStart || undefined}
                    maxDate={new Date()}
                    placeholderText="Hasta"
                    className="w-full px-3 py-2 rounded-xl text-sm
                             bg-white dark:bg-[#1d2842]/80
                             border border-gray-200 dark:border-gray-700/50
                             text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-primary-500/20
                             focus:border-primary-500
                             transition-all duration-300"
                    {...commonDatePickerProps}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}; 
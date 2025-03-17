import React from 'react';
import { FilterParams } from '../../services/personaService';
import ReactDatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface PersonaFiltersProps {
  filters: FilterParams;
  onFilterChange: (filters: FilterParams) => void;
}

export const PersonaFilters: React.FC<PersonaFiltersProps> = ({
  filters,
  onFilterChange
}) => {
  const handleDateChange = (date: Date | null) => {
    onFilterChange({
      ...filters,
      startDate: date ? date.toISOString() : undefined,
      endDate: undefined
    });
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      {/* Estado documental */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Estado Documental
          </label>
          <select
            value={filters.documentalFilter || 'all'}
            onChange={(e) => onFilterChange({
              ...filters,
              documentalFilter: e.target.value as 'all' | 'complete' | 'incomplete'
            })}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="all">Todos</option>
            <option value="complete">Documentos Completos</option>
            <option value="incomplete">Documentos Incompletos</option>
          </select>
        </div>

        {/* Estado de actividad */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Estado
          </label>
          <select
            value={filters.isActive?.toString() || ''}
            onChange={(e) => onFilterChange({
              ...filters,
              isActive: e.target.value === '' ? undefined : e.target.value === 'true'
            })}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>

        {/* Rango de fechas */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Fecha de Registro
          </label>
          <ReactDatePicker
            selected={filters.startDate ? new Date(filters.startDate) : null}
            onChange={handleDateChange}
            dateFormat="dd/MM/yyyy"
            placeholderText="Seleccionar fecha"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        {/* Ordenamiento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Ordenar Por
          </label>
          <select
            value={filters.sortBy || 'createdAt'}
            onChange={(e) => onFilterChange({
              ...filters,
              sortBy: e.target.value as FilterParams['sortBy']
            })}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="createdAt">Fecha de Registro</option>
            <option value="cedula">Cédula</option>
            <option value="telefono">Teléfono</option>
            <option value="email">Email</option>
          </select>
        </div>

        {/* Dirección del ordenamiento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Orden
          </label>
          <select
            value={filters.sortOrder || 'desc'}
            onChange={(e) => onFilterChange({
              ...filters,
              sortOrder: e.target.value as 'asc' | 'desc'
            })}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="desc">Descendente</option>
            <option value="asc">Ascendente</option>
          </select>
        </div>

        {/* Botón de limpiar filtros */}
        <div className="sm:col-span-2 flex items-end">
          <button
            onClick={() => onFilterChange({})}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
          >
            Limpiar Filtros
          </button>
        </div>
      </div>
    </div>
  );
}; 
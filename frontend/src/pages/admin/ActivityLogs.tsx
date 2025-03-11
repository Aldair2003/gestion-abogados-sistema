import React, { useState } from 'react';
import { useActivityLogs } from '../../hooks/useActivityLogs';
import { ActivityList } from '../../components/activity/ActivityList';
import { TextField } from '../../components/common/TextField';
import { motion } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Tab } from '@headlessui/react';
import { PermissionActivityList } from '../../components/activity/PermissionActivityList';
import { ActivityFilters } from '../../types/activity';

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

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const convertToPermissionFilters = (filters: ActivityFilters) => {
  return {
    userId: filters.userId,
    cantonId: filters.cantonId,
    personaId: filters.personaId,
    startDate: filters.startDate,
    endDate: filters.endDate,
    type: filters.type as 'canton' | 'persona' | undefined,
    action: filters.action as 'assign' | 'update' | 'revoke' | undefined
  };
};

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

  const categories = [
    {
      id: 'all',
      name: 'Todas las Actividades',
      description: 'Ver todas las actividades del sistema'
    },
    {
      id: 'permissions',
      name: 'Permisos',
      description: 'Ver cambios en permisos de cantones y personas'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Historial de Actividades
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Revise todas las actividades y cambios realizados en el sistema
        </p>
      </div>

      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
          {categories.map((category) => (
            <Tab
              key={category.id}
              className={({ selected }) =>
                classNames(
                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                  'ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                  selected
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-white/[0.12] hover:text-blue-600 dark:hover:text-blue-400'
                )
              }
            >
              {category.name}
            </Tab>
          ))}
        </Tab.List>

        <Tab.Panels className="mt-4">
          <Tab.Panel
            className={classNames(
              'rounded-xl bg-white dark:bg-gray-800 p-6',
              'ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2'
            )}
          >
            <ActivityList 
              activities={logs} 
              loading={loading} 
              filters={filters} 
            />
          </Tab.Panel>

          <Tab.Panel
            className={classNames(
              'rounded-xl bg-white dark:bg-gray-800 p-6',
              'ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2'
            )}
          >
            <PermissionActivityList filters={convertToPermissionFilters(filters)} />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}; 
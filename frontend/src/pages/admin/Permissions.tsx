import { useState } from 'react';
import { Tab } from '@headlessui/react';
import { MapPinIcon, UserGroupIcon } from '../../components/icons/CustomIcons';
import { CantonPermissionsPanel } from '../../components/admin/permissions/CantonPermissionsPanel';
import { PersonaPermissionsPanel } from '../../components/admin/permissions/PersonaPermissionsPanel';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const PermissionsPage = () => {
  const categories = [
    {
      id: 'cantones',
      name: 'Cantones',
      icon: MapPinIcon,
      description: 'Gestionar permisos de acceso a cantones'
    },
    {
      id: 'personas',
      name: 'Personas',
      icon: UserGroupIcon,
      description: 'Gestionar permisos de acceso a personas'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Gestión de Permisos
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Administre los permisos de acceso para colaboradores
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
              <div className="flex items-center justify-center space-x-2">
                <category.icon className="w-5 h-5" />
                <span>{category.name}</span>
              </div>
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
            <CantonPermissionsPanel />
          </Tab.Panel>

          <Tab.Panel
            className={classNames(
              'rounded-xl bg-white dark:bg-gray-800 p-6',
              'ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2'
            )}
          >
            <PersonaPermissionsPanel />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default PermissionsPage; 
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  UsersIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { EnvelopeIcon } from '@heroicons/react/24/solid';
import { User, UserRole } from '../../../types/user';

interface UsersTableProps {
  users: User[];
  loading: boolean;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onView: (id: number) => void;
  onToggleActive: (id: number, currentStatus: boolean) => void;
  onSort: (sortConfig: { field: string; direction: 'asc' | 'desc' }) => void;
  currentSort: { field: string; direction: 'asc' | 'desc' };
}

const getRoleBadgeColor = (rol: UserRole) => {
  switch (rol) {
    case UserRole.ADMIN:
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    case UserRole.COLABORADOR:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

const getRoleLabel = (rol: UserRole) => {
  switch (rol) {
    case UserRole.ADMIN:
      return 'Administrador';
    case UserRole.COLABORADOR:
      return 'Colaborador';
    default:
      return rol;
  }
};

export const UsersTable = ({
  users,
  loading,
  onEdit,
  onDelete,
  onView,
  onToggleActive,
  onSort,
  currentSort,
}: UsersTableProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative -z-10 w-full overflow-x-hidden"
    >
      <div className="w-full rounded-xl bg-white/80 dark:bg-[#1a2234]/80 
                    border border-gray-200/20 dark:border-[#2a3441]/50
                    shadow-lg backdrop-blur-sm">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-[25%]" />
            <col className="w-[20%]" />
            <col className="w-[15%]" />
            <col className="w-[12%]" />
            <col className="w-[18%]" />
            <col className="w-[10%]" />
          </colgroup>
          <thead className="bg-gray-50/50 dark:bg-[#151b2b]/50">
            <tr className="border-b border-gray-200 dark:border-[#2a3441]">
              <th className="px-4 py-3">
                <button 
                  onClick={() => onSort({ 
                    field: 'nombre', 
                    direction: currentSort.direction === 'asc' ? 'desc' : 'asc' 
                  })}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300 
                           uppercase tracking-wider hover:text-primary-500 dark:hover:text-primary-400
                           transition-colors duration-200"
                >
                  <UsersIcon className="h-4 w-4" />
                  Nombre
                  <ChevronDownIcon className="h-4 w-4" />
                </button>
              </th>
              
              <th className="px-4 py-3">
                <button 
                  onClick={() => onSort({ 
                    field: 'email', 
                    direction: currentSort.direction === 'asc' ? 'desc' : 'asc' 
                  })}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300 
                           uppercase tracking-wider hover:text-primary-500 dark:hover:text-primary-400
                           transition-colors duration-200"
                >
                  <EnvelopeIcon className="h-4 w-4" />
                  Email
                  <ChevronDownIcon className="h-4 w-4" />
                </button>
              </th>

              <th className="px-4 py-3">
                <button 
                  onClick={() => onSort({ 
                    field: 'rol', 
                    direction: currentSort.direction === 'asc' ? 'desc' : 'asc' 
                  })}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300 
                           uppercase tracking-wider hover:text-primary-500 dark:hover:text-primary-400
                           transition-colors duration-200"
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  Rol
                  <ChevronDownIcon className="h-4 w-4" />
                </button>
              </th>

              <th className="px-4 py-3">
                <button 
                  onClick={() => onSort({ 
                    field: 'isActive', 
                    direction: currentSort.direction === 'asc' ? 'desc' : 'asc' 
                  })}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300 
                           uppercase tracking-wider hover:text-primary-500 dark:hover:text-primary-400
                           transition-colors duration-200"
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  Estado
                  <ChevronDownIcon className="h-4 w-4" />
                </button>
              </th>

              <th className="px-4 py-3">
                <button 
                  onClick={() => onSort({ 
                    field: 'lastLogin', 
                    direction: currentSort.direction === 'asc' ? 'desc' : 'asc' 
                  })}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300 
                           uppercase tracking-wider hover:text-primary-500 dark:hover:text-primary-400
                           transition-colors duration-200"
                >
                  <ClockIcon className="h-4 w-4" />
                  Último acceso
                  <ChevronDownIcon className="h-4 w-4" />
                </button>
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold 
                           text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Accionesss
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 dark:divide-[#2a3441]">
            <AnimatePresence>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-3 text-center">
                    Cargando...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-3 text-center">
                    No hay usuarios para mostrar
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-b border-gray-200 dark:border-[#2a3441] hover:bg-gray-50/50 
                             dark:hover:bg-[#151b2b]/50 transition-colors duration-150"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <UserCircleIcon className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.nombre || 'Sin nombre'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.cedula || 'Sin cédula'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 dark:text-white">{user.email}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.telefono || 'Sin teléfono'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getRoleBadgeColor(user.rol)}`}>
                        {getRoleLabel(user.rol)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 
                        ${user.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>
                        {user.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Nunca'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => onView(user.id)}
                          className="text-gray-400 hover:text-primary-500 dark:hover:text-primary-400"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => onEdit(user.id)}
                          className="text-gray-400 hover:text-primary-500 dark:hover:text-primary-400"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => onToggleActive(user.id, user.isActive)}
                          className="text-gray-400 hover:text-primary-500 dark:hover:text-primary-400"
                        >
                          {user.isActive ? (
                            <TrashIcon className="h-5 w-5" />
                          ) : (
                            <CheckCircleIcon className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}; 
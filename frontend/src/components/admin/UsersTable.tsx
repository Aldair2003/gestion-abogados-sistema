import { motion } from 'framer-motion';
import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  EyeIcon, 
  PencilIcon,
  XMarkIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { User } from '../../types/user';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { useState } from 'react';
import { getPhotoUrl } from '../../utils/urls';

interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

interface UsersTableProps {
  users: User[];
  loading: boolean;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onView: (id: number) => void;
  onSort: (sortConfig: SortConfig) => void;
  onToggleActive: (id: number, currentStatus: boolean) => void;
  currentSort: SortConfig;
}

export const UsersTable = ({ 
  users, 
  loading, 
  onEdit, 
  onDelete, 
  onView, 
  onSort, 
  onToggleActive,
  currentSort 
}: UsersTableProps) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: number; isActive: boolean } | null>(null);
  const [imageErrors, setImageErrors] = useState<{[key: number]: boolean}>({});

  const handleDeleteClick = (id: number) => {
    setSelectedUser({ id, isActive: false });
    setShowDeleteModal(true);
  };

  const handleToggleClick = (id: number, currentStatus: boolean) => {
    setSelectedUser({ id, isActive: currentStatus });
    setShowToggleModal(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedUser) {
      onDelete(selectedUser.id);
    }
    setShowDeleteModal(false);
  };

  const handleToggleConfirm = () => {
    if (selectedUser) {
      onToggleActive(selectedUser.id, selectedUser.isActive);
    }
    setShowToggleModal(false);
  };

  const handleImageError = (userId: number) => {
    setImageErrors(prev => ({ ...prev, [userId]: true }));
  };

  const SortableHeader = ({ field, children }: { field: string, children: React.ReactNode }) => (
    <div 
      className="flex items-center gap-2 text-xs font-medium 
                 text-gray-400 dark:text-gray-300 
                 hover:text-primary-500 dark:hover:text-primary-400
                 group cursor-pointer transition-all duration-200"
      onClick={() => {
        const direction = currentSort.field === field 
          ? (currentSort.direction === 'asc' ? 'desc' : 'asc')
          : 'asc';
        onSort({ field, direction });
      }}
    >
      {children}
      <div className={`transition-all duration-200 
                    ${currentSort.field === field ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        {currentSort.field === field ? (
          currentSort.direction === 'asc' ? 
            <ArrowUpIcon className="h-4 w-4" /> : 
            <ArrowDownIcon className="h-4 w-4" />
        ) : (
          <ArrowUpIcon className="h-4 w-4 opacity-50" />
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full bg-white dark:bg-[#172133] rounded-2xl shadow-md
                    border border-gray-200/50 dark:border-gray-700/30 relative z-0">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200/50 dark:divide-gray-700/30">
          <thead className="bg-gray-50/50 dark:bg-[#1d2842]/80">
            <tr>
              <th scope="col" className="px-6 py-4 text-left">
                <SortableHeader field="nombre">Nombre</SortableHeader>
              </th>
              <th scope="col" className="px-6 py-4 text-left">
                <SortableHeader field="email">Email</SortableHeader>
              </th>
              <th scope="col" className="px-6 py-4 text-left">
                <SortableHeader field="rol">Rol</SortableHeader>
              </th>
              <th scope="col" className="px-6 py-4 text-left">
                <SortableHeader field="estado">Estado</SortableHeader>
              </th>
              <th scope="col" className="px-6 py-4 text-left">
                <SortableHeader field="lastLogin">Último Acceso</SortableHeader>
              </th>
              <th scope="col" className="px-6 py-4 text-right">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-[#172133] divide-y divide-gray-200/50 dark:divide-gray-700/30">
            {users.map((user) => (
              <tr key={user.id} 
                  className="hover:bg-gray-50/50 dark:hover:bg-[#1d2842]/50 transition-colors duration-200">
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="flex items-center min-w-0">
                    <div className="relative h-9 w-9 rounded-full overflow-hidden bg-primary-100 dark:bg-primary-500/10
                                    ring-2 ring-primary-500/20 dark:ring-primary-500/30">
                      {(() => {
                        console.log('User photo data:', {
                          userId: user.id,
                          photoUrl: user.photoUrl,
                          hasError: imageErrors[user.id],
                          fullUrl: user.photoUrl ? getPhotoUrl(user.photoUrl) : null
                        });
                        
                        return user.photoUrl && !imageErrors[user.id] ? (
                          <img
                            src={getPhotoUrl(user.photoUrl)}
                            alt={user.nombre || 'Usuario'}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              const fullUrl = getPhotoUrl(user.photoUrl);
                              console.log('Error loading image:', {
                                userId: user.id,
                                originalUrl: user.photoUrl,
                                fullUrl,
                                error: e
                              });
                              const target = e.target as HTMLImageElement;
                              target.src = `https://ui-avatars.com/api/?name=${user.nombre || 'U'}&background=6366f1&color=fff`;
                              handleImageError(user.id);
                            }}
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-[#4F46E5] text-white font-medium">
                            {(user.nombre?.[0] || user.email?.[0] || 'U').toUpperCase()}
                          </div>
                        );
                      })()}
                    </div>
                    <div className="ml-4 truncate">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {user.nombre || user.email}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium
                    ${user.rol === 'ADMIN' ? 
                      'bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 ring-1 ring-purple-400/30 dark:ring-purple-400/20' : 
                      'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 ring-1 ring-blue-400/30 dark:ring-blue-400/20'}`}>
                    {user.rol === 'ADMIN' ? 'Administrador' : 'Colaborador'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleClick(user.id, user.isActive)}
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium
                      transition-all duration-200 shadow-sm
                      ${user.isActive ? 
                        'bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-300 ring-1 ring-green-400/30 dark:ring-green-400/20 hover:bg-green-200 dark:hover:bg-green-500/30' : 
                        'bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300 ring-1 ring-red-400/30 dark:ring-red-400/20 hover:bg-red-200 dark:hover:bg-red-500/30'}`}>
                    <span className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500 dark:bg-green-400' : 'bg-red-500 dark:bg-red-400'}`} />
                    {user.isActive ? 'Activo' : 'Inactivo'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-300">
                    <ClockIcon className="h-4 w-4 text-gray-400 dark:text-gray-400" />
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Nunca'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onView(user.id)}
                      className="relative p-2.5 rounded-xl
                               bg-gradient-to-br from-blue-50 to-blue-100/80 
                               dark:from-blue-500/10 dark:to-blue-600/10
                               border border-blue-200/50 dark:border-blue-500/20
                               hover:border-blue-300 dark:hover:border-blue-400/30
                               shadow-sm hover:shadow-md hover:shadow-blue-500/10
                               group transition-all duration-200"
                    >
                      <EyeIcon className="h-4 w-4 text-blue-600/80 dark:text-blue-400
                                        group-hover:text-blue-700 dark:group-hover:text-blue-300
                                        transition-colors duration-200" />
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 
                                     px-2 py-1 rounded-lg text-xs font-medium
                                     bg-gray-900/90 text-white dark:bg-white/90 dark:text-gray-900
                                     opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        Ver
                      </span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onEdit(user.id)}
                      className="relative p-2.5 rounded-xl
                               bg-gradient-to-br from-amber-50 to-amber-100/80
                               dark:from-amber-500/10 dark:to-amber-600/10
                               border border-amber-200/50 dark:border-amber-500/20
                               hover:border-amber-300 dark:hover:border-amber-400/30
                               shadow-sm hover:shadow-md hover:shadow-amber-500/10
                               group transition-all duration-200"
                    >
                      <PencilIcon className="h-4 w-4 text-amber-600/80 dark:text-amber-400
                                           group-hover:text-amber-700 dark:group-hover:text-amber-300
                                           transition-colors duration-200" />
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 
                                     px-2 py-1 rounded-lg text-xs font-medium
                                     bg-gray-900/90 text-white dark:bg-white/90 dark:text-gray-900
                                     opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        Editar
                      </span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDeleteClick(user.id)}
                      className="relative p-2.5 rounded-xl
                               bg-gradient-to-br from-red-50 to-red-100/80
                               dark:from-red-500/10 dark:to-red-600/10
                               border border-red-200/50 dark:border-red-500/20
                               hover:border-red-300 dark:hover:border-red-400/30
                               shadow-sm hover:shadow-md hover:shadow-red-500/10
                               group transition-all duration-200"
                    >
                      <XMarkIcon className="h-4 w-4 text-red-600/80 dark:text-red-400
                                          group-hover:text-red-700 dark:group-hover:text-red-300
                                          transition-colors duration-200" />
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 
                                     px-2 py-1 rounded-lg text-xs font-medium
                                     bg-gray-900/90 text-white dark:bg-white/90 dark:text-gray-900
                                     opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        Eliminar
                      </span>
                    </motion.button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Usuario"
        message={
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-500/20">
                <XMarkIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <p className="text-center">
              ¿Está seguro que desea eliminar este usuario?<br/>
              <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                Esta acción no se puede deshacer.
              </span>
            </p>
          </div>
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />

      <ConfirmationModal
        isOpen={showToggleModal}
        onClose={() => setShowToggleModal(false)}
        onConfirm={handleToggleConfirm}
        title={selectedUser?.isActive ? "Desactivar Usuario" : "Activar Usuario"}
        message={
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <div className={`p-3 rounded-full 
                ${selectedUser?.isActive ? 
                  'bg-yellow-100 dark:bg-yellow-500/20' : 
                  'bg-green-100 dark:bg-green-500/20'
                }`}>
                {selectedUser?.isActive ? (
                  <XMarkIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                ) : (
                  <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                )}
              </div>
            </div>
            <p className="text-center">
              {selectedUser?.isActive 
                ? "¿Está seguro que desea desactivar este usuario?"
                : "¿Está seguro que desea activar este usuario?"}
              <br/>
              <span className={`text-sm font-medium
                ${selectedUser?.isActive ? 
                  'text-yellow-600 dark:text-yellow-400' : 
                  'text-green-600 dark:text-green-400'
                }`}>
                {selectedUser?.isActive 
                  ? "No podrá acceder al sistema hasta que sea reactivado."
                  : "Podrá acceder nuevamente al sistema."}
              </span>
            </p>
          </div>
        }
        confirmText={selectedUser?.isActive ? "Desactivar" : "Activar"}
        cancelText="Cancelar"
        type={selectedUser?.isActive ? "warning" : "success"}
      />
    </div>
  );
}; 
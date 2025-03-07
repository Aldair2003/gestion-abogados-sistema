import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { motion } from 'framer-motion';
import { 
  XMarkIcon, 
  UserCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  UsersIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { User } from '../../types/user';

interface ActivityLog {
  id: number;
  action: string;
  description?: string;
  ipAddress?: string;
  createdAt: string;
}

interface UserWithActivity extends User {
  activityLogs?: ActivityLog[];
}

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserWithActivity | null;
  loading: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getInitials = (name: string | null | undefined): string => {
  if (!name || typeof name !== 'string') return '?';
  const trimmedName = name.trim();
  return trimmedName ? trimmedName.charAt(0).toUpperCase() : '?';
};

export const UserDetailModal = ({ isOpen, onClose, user, loading }: UserDetailModalProps) => {
  if (!isOpen) return null;

  const DetailItem = ({ icon: Icon, label, value }: { icon: any, label: string, value: string | null | undefined }) => (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-white/50 dark:bg-dark-800/50 
                    border border-gray-200/50 dark:border-gray-700/30">
      <div className="p-2 rounded-lg bg-gradient-to-br from-primary-500/10 to-primary-600/10 
                     shadow-inner shadow-primary-500/10">
        <Icon className="h-5 w-5 text-primary-500" />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">
          {value || 'No especificado'}
        </p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Dialog as="div" className="relative z-50" onClose={onClose} open={isOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 dark:bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-10 w-10 border-4 border-primary-500/30 border-t-primary-500 
                            rounded-full animate-spin" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                Cargando detalles...
              </p>
            </div>
          </div>
        </div>
      </Dialog>
    );
  }

  if (!user) {
    return (
      <Dialog as="div" className="relative z-50" onClose={onClose} open={isOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 dark:bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <div className="flex flex-col items-center justify-center py-12">
              <UserCircleIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                No se encontraron detalles del usuario
              </p>
            </div>
          </div>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog as="div" className="relative z-50" onClose={onClose} open={isOpen}>
      <Transition.Child
        as={Fragment}
        enter="ease-out duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 bg-black/25 dark:bg-black/40 backdrop-blur-sm" />
      </Transition.Child>

      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl 
                                   bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl p-6 
                                   text-left align-middle shadow-xl transition-all
                                   border border-gray-200/50 dark:border-gray-700/30">
              <Dialog.Title
                as="div"
                className="flex items-center justify-between mb-6"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-primary-500/10 to-primary-600/10 
                                shadow-inner shadow-primary-500/10">
                    <UserCircleIcon className="h-6 w-6 text-primary-500" />
                  </div>
                  <h3 className="text-lg font-medium leading-6 
                               bg-gradient-to-r from-gray-900 to-gray-600 
                               dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    {user && user.nombre ? `Detalles de ${user.nombre}` : 'Detalles del Usuario'}
                  </h3>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-500 
                           dark:text-gray-500 dark:hover:text-gray-400
                           hover:bg-gray-100 dark:hover:bg-dark-700
                           transition-all duration-200"
                >
                  <XMarkIcon className="h-5 w-5" />
                </motion.button>
              </Dialog.Title>

              <div className="space-y-6">
                {/* Información Personal */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                    Información Personal
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <DetailItem 
                      icon={UserCircleIcon} 
                      label="Nombre Completo" 
                      value={user?.nombre} 
                    />
                    <DetailItem 
                      icon={UsersIcon} 
                      label="Cédula" 
                      value={user?.cedula} 
                    />
                    <DetailItem 
                      icon={EyeIcon} 
                      label="Teléfono" 
                      value={user?.telefono} 
                    />
                    <DetailItem 
                      icon={UserCircleIcon} 
                      label="Domicilio" 
                      value={user?.domicilio} 
                    />
                  </div>
                </div>

                {/* Información de Cuenta */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                    Información de Cuenta
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <DetailItem 
                      icon={UserCircleIcon} 
                      label="Rol" 
                      value={user?.rol === 'ADMIN' ? 'Administrador' : 'Colaborador'} 
                    />
                    <DetailItem 
                      icon={UserCircleIcon} 
                      label="Estado" 
                      value={user?.isActive ? 'Activo' : 'Inactivo'} 
                    />
                    <DetailItem 
                      icon={ClockIcon} 
                      label="Último Acceso" 
                      value={user?.lastLogin 
                        ? new Date(user.lastLogin).toLocaleString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Nunca'} 
                    />
                    <DetailItem 
                      icon={DocumentTextIcon} 
                      label="Perfil Completado" 
                      value={user?.isProfileCompleted ? 'Sí' : 'No'} 
                    />
                  </div>
                </div>

                {/* Información Profesional */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                    Información Profesional
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <DetailItem 
                      icon={UserCircleIcon} 
                      label="Universidad" 
                      value={user?.universidad} 
                    />
                    <DetailItem 
                      icon={DocumentTextIcon} 
                      label="Estado Profesional" 
                      value={user?.estadoProfesional} 
                    />
                    <DetailItem 
                      icon={DocumentTextIcon} 
                      label="Número de Matrícula" 
                      value={user?.numeroMatricula} 
                    />
                  </div>
                </div>

                {/* Actividad Reciente */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                    Actividad Reciente
                  </h4>
                  <div className="space-y-3">
                    {user?.activityLogs && user.activityLogs.length > 0 ? (
                      user.activityLogs.map((activity, index) => (
                        <motion.div 
                          key={activity.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start gap-3 p-4 rounded-xl 
                                   bg-white/50 dark:bg-dark-800/50 
                                   border border-gray-200/50 dark:border-gray-700/30"
                        >
                          <div className="p-2 rounded-lg bg-gradient-to-br 
                                        from-primary-500/10 to-primary-600/10">
                            <ClockIcon className="h-5 w-5 text-primary-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 dark:text-white">
                              {activity.description || activity.action}
                            </p>
                            <div className="mt-1 flex items-center gap-4">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(activity.createdAt).toLocaleString('es-ES', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                              {activity.ipAddress && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  IP: {activity.ipAddress}
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <ClockIcon className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600" />
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                          No hay actividad registrada
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </div>
    </Dialog>
  );
}; 
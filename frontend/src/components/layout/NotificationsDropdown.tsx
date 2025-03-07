import { Menu, Transition } from '@headlessui/react';
import { BellIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { Fragment } from 'react';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
}

export const NotificationsDropdown = () => {
  // Ejemplo de notificaciones (después se integrarán con el backend)
  const notifications: Notification[] = [
    {
      id: '1',
      title: 'Nuevo caso asignado',
      message: 'Se te ha asignado el caso #123',
      time: 'Hace 5 minutos',
      type: 'info',
      read: false
    },
    {
      id: '2',
      title: 'Audiencia próxima',
      message: 'Tienes una audiencia mañana a las 10:00',
      time: 'Hace 1 hora',
      type: 'warning',
      read: false
    }
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600 transition-colors">
        <BellIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1 right-1 h-5 w-5 flex items-center justify-center
                     text-xs font-medium text-white bg-primary-500 rounded-full"
          >
            {unreadCount}
          </motion.span>
        )}
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-100"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-80 rounded-lg bg-white dark:bg-dark-700 
                           shadow-lg border border-gray-200 dark:border-dark-600 focus:outline-none">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Notificaciones
              </h3>
              {unreadCount > 0 && (
                <button className="text-sm text-primary-500 hover:text-primary-600 font-medium">
                  Marcar todas como leídas
                </button>
              )}
            </div>

            <div className="space-y-3">
              {notifications.map((notification) => (
                <Menu.Item key={notification.id}>
                  {({ active }) => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`
                        p-3 rounded-lg cursor-pointer
                        ${active ? 'bg-gray-50 dark:bg-dark-600' : ''}
                        ${!notification.read ? 'bg-blue-50 dark:bg-dark-600' : ''}
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`
                          w-2 h-2 mt-2 rounded-full flex-shrink-0
                          ${notification.type === 'info' ? 'bg-blue-500' : ''}
                          ${notification.type === 'warning' ? 'bg-yellow-500' : ''}
                          ${notification.type === 'success' ? 'bg-green-500' : ''}
                          ${notification.type === 'error' ? 'bg-red-500' : ''}
                        `} />
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {notification.message}
                          </p>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {notification.time}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </Menu.Item>
              ))}
            </div>

            {notifications.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500 dark:text-gray-400">
                  No hay notificaciones
                </p>
              </div>
            ) : (
              <button className="mt-4 w-full text-center text-sm text-primary-500 hover:text-primary-600 font-medium">
                Ver todas las notificaciones
              </button>
            )}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}; 
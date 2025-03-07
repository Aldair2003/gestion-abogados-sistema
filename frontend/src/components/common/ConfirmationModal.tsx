import { Dialog, Transition } from '@headlessui/react';
import { Fragment, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
}

export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'info'
}: ConfirmationModalProps) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          text: 'text-red-800 dark:text-red-200',
          border: 'border-red-200 dark:border-red-800',
          button: 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600',
          icon: 'text-red-500'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          text: 'text-yellow-800 dark:text-yellow-200',
          border: 'border-yellow-200 dark:border-yellow-800',
          button: 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600',
          icon: 'text-yellow-500'
        };
      case 'success':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          text: 'text-green-800 dark:text-green-200',
          border: 'border-green-200 dark:border-green-800',
          button: 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600',
          icon: 'text-green-500'
        };
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          text: 'text-blue-800 dark:text-blue-200',
          border: 'border-blue-200 dark:border-blue-800',
          button: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600',
          icon: 'text-blue-500'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
              <Dialog.Panel className={`w-full max-w-md transform overflow-hidden rounded-2xl 
                                     ${styles.bg} p-6 text-left align-middle shadow-xl transition-all
                                     border ${styles.border}`}>
                <Dialog.Title
                  as="div"
                  className="flex items-center justify-between mb-4"
                >
                  <h3 className={`text-lg font-medium leading-6 ${styles.text}`}>
                    {title}
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className={`p-2 rounded-lg ${styles.text} opacity-70 hover:opacity-100
                             hover:bg-gray-100 dark:hover:bg-dark-700
                             transition-all duration-200`}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </motion.button>
                </Dialog.Title>

                <div className={`text-sm ${styles.text} opacity-90 mb-6`}>
                  {message}
                </div>

                <div className="flex justify-end gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium rounded-lg
                             text-gray-700 dark:text-gray-200
                             bg-white dark:bg-dark-700
                             hover:bg-gray-50 dark:hover:bg-dark-600
                             border border-gray-300 dark:border-dark-500
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500
                             transition-all duration-200"
                  >
                    {cancelText}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onConfirm();
                      onClose();
                    }}
                    className={`px-4 py-2 text-sm font-medium rounded-lg
                             text-white
                             ${styles.button}
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-white
                             focus-visible:ring-opacity-75
                             transition-all duration-200`}
                  >
                    {confirmText}
                  </motion.button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}; 
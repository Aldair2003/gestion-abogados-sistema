import React from 'react';
import { Modal } from './Modal';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: (e?: React.MouseEvent) => void;
  onConfirm: (e?: React.MouseEvent) => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  preventClose?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'info',
  preventClose = false
}) => {
  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!preventClose) {
      onClose(e);
    }
  };

  const handleConfirm = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onConfirm(e);
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          bg: 'bg-red-50/80 dark:bg-red-900/20',
          text: 'text-red-800 dark:text-red-200',
          border: 'border-red-200/50 dark:border-red-800/50',
          button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          icon: 'text-red-500'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50/80 dark:bg-yellow-900/20',
          text: 'text-yellow-800 dark:text-yellow-200',
          border: 'border-yellow-200/50 dark:border-yellow-800/50',
          button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
          icon: 'text-yellow-500'
        };
      case 'success':
        return {
          bg: 'bg-green-50/80 dark:bg-green-900/20',
          text: 'text-green-800 dark:text-green-200',
          border: 'border-green-200/50 dark:border-green-800/50',
          button: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
          icon: 'text-green-500'
        };
      default:
        return {
          bg: 'bg-blue-50/80 dark:bg-blue-900/20',
          text: 'text-blue-800 dark:text-blue-200',
          border: 'border-blue-200/50 dark:border-blue-800/50',
          button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
          icon: 'text-blue-500'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      size="sm"
      preventClose={preventClose}
    >
      <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className={`text-lg font-medium leading-6 ${styles.text}`}>
            {title}
          </h3>
          <button
            onClick={handleClose}
            className={`rounded-lg p-2 ${styles.text} opacity-70 hover:opacity-100
                     hover:bg-gray-100 dark:hover:bg-gray-800/50
                     transition-all duration-200 focus:outline-none`}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        <div className={`text-sm ${styles.text} opacity-90 mb-6`}>
          {message}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800 ${
              type === 'danger'
                ? 'bg-red-600 hover:bg-red-700'
                : type === 'warning'
                ? 'bg-yellow-600 hover:bg-yellow-700'
                : 'bg-primary-600 hover:bg-primary-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}; 
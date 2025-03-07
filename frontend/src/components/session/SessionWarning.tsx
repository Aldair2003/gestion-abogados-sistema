import React from 'react';
import { Dialog } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface SessionWarningProps {
  showWarning: boolean;
  timeRemaining: number | null;
  onExtendSession: () => void;
  onCloseSession: () => void;
}

export const SessionWarning: React.FC<SessionWarningProps> = ({
  showWarning,
  timeRemaining,
  onExtendSession,
  onCloseSession
}) => {
  if (!showWarning) return null;

  const formatTime = (seconds: number | null) => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog
      open={showWarning}
      onClose={() => {}}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex min-h-screen items-center justify-center">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
        
        <div className="relative mx-auto max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500" />
          </div>
          
          <Dialog.Title className="mb-2 text-center text-lg font-medium text-gray-900 dark:text-white">
            Tu sesión expirará pronto
          </Dialog.Title>
          
          <div className="mb-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tu sesión expirará por inactividad en:
            </p>
            <p className="mt-2 text-2xl font-bold text-red-600">
              {formatTime(timeRemaining)}
            </p>
          </div>
          
          <div className="mt-6 flex justify-center space-x-3">
            <button
              onClick={onCloseSession}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Cerrar Sesión
            </button>
            <button
              onClick={onExtendSession}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Mantener Sesión Activa
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}; 
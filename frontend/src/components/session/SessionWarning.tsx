import React, { useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../contexts/ThemeContext';

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
  const { isDarkMode } = useTheme();

  // Cerrar automáticamente cuando el tiempo llegue a 0
  useEffect(() => {
    if (timeRemaining === 0) {
      onCloseSession();
    }
  }, [timeRemaining, onCloseSession]);

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
      className="fixed inset-0 z-[99999] overflow-y-auto"
    >
      <div className="flex min-h-screen items-center justify-center p-4">
        <Dialog.Overlay 
          className={`fixed inset-0 ${
            isDarkMode ? 'bg-black/50' : 'bg-black/30'
          } transition-opacity`} 
        />
        
        <div className={`relative mx-auto w-full max-w-md rounded-xl ${
          isDarkMode 
            ? 'bg-[#1a2234] border border-gray-700/50' 
            : 'bg-white border border-gray-200'
        } p-6 shadow-xl transition-all`}>
          <div className="mb-6 flex items-center justify-center">
            <div className={`rounded-full p-3 ${
              isDarkMode 
                ? 'bg-yellow-500/10' 
                : 'bg-yellow-50'
            }`}>
              <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          
          <Dialog.Title className={`mb-2 text-center text-xl font-semibold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Tu sesión expirará pronto
          </Dialog.Title>
          
          <div className="mb-6 text-center">
            <p className={`mb-3 text-sm ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Por seguridad, tu sesión expirará por inactividad en:
            </p>
            <p className={`text-3xl font-bold ${timeRemaining && timeRemaining <= 10 ? 'text-red-500 animate-pulse' : 'text-red-500'}`}>
              {formatTime(timeRemaining)}
            </p>
          </div>
          
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={onCloseSession}
              className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors sm:w-auto ${
                isDarkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cerrar Sesión
            </button>
            <button
              onClick={onExtendSession}
              className="w-full rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-600 sm:w-auto"
            >
              Mantener Sesión Activa
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}; 
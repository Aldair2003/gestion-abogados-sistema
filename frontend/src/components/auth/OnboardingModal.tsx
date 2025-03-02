import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { ChangePasswordForm } from './ChangePasswordForm';
import { CompleteProfileForm } from './CompleteProfileForm';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

interface OnboardingState {
  passwordChanged: boolean;
  profileCompleted: boolean;
  temporaryPassword?: string;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [onboardingState, setOnboardingState] = useState<OnboardingState>(() => {
    const savedState = localStorage.getItem(`onboardingState_${user?.email}`);
    return savedState ? JSON.parse(savedState) : {
      passwordChanged: false,
      profileCompleted: false,
      temporaryPassword: localStorage.getItem(`temporaryPassword_${user?.email}`) || ''
    };
  });

  useEffect(() => {
    if (user?.email) {
      localStorage.setItem(`onboardingState_${user.email}`, JSON.stringify(onboardingState));
    }
  }, [onboardingState, user?.email]);

  useEffect(() => {
    if (isOpen) {
      toast((t) => (
        <div className="flex items-center gap-3 p-4 backdrop-blur-none relative">
          <div className="absolute inset-0 bg-white dark:bg-gray-800 opacity-95 rounded-lg" />
          <CheckCircleIcon className="w-6 h-6 text-green-500 dark:text-green-400 flex-shrink-0 relative z-10" />
          <div className="flex flex-col relative z-10">
            <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
              ¡Bienvenido al Sistema!
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Sesión iniciada correctamente. Por favor, complete su configuración inicial.
            </span>
          </div>
        </div>
      ), {
        duration: 6000,
        position: 'top-center',
        className: 'bg-transparent border-2 border-green-500 dark:border-green-400 shadow-2xl max-w-md rounded-lg',
        style: {
          zIndex: 100000,
          backdropFilter: 'none'
        },
      });
    }
  }, [isOpen]);

  const handleClose = async () => {
    if (user?.isTemporaryPassword && !onboardingState.passwordChanged) {
      setShowConfirmModal(true);
      return;
    }
    
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      navigate('/login', { replace: true });
    }
  };

  const handleConfirmExit = async () => {
    setShowConfirmModal(false);
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      navigate('/login', { replace: true });
    }
  };

  const handleCancelExit = () => {
    setShowConfirmModal(false);
  };

  const handlePasswordChanged = () => {
    setOnboardingState(prev => ({
      ...prev,
      passwordChanged: true
    }));
    if (user?.email) {
      localStorage.removeItem(`temporaryPassword_${user.email}`);
    }
    toast.success('Contraseña actualizada correctamente', {
      duration: 3000,
      position: 'top-center',
    });
  };

  const handleProfileCompleted = () => {
    if (user?.isTemporaryPassword && !onboardingState.passwordChanged) {
      toast.error('Debe cambiar su contraseña temporal antes de continuar');
      return;
    }
    setOnboardingState(prev => ({
      ...prev,
      profileCompleted: true
    }));
    onComplete();
    // Limpiamos el estado de onboarding al completar
    if (user?.email) {
      localStorage.removeItem(`onboardingState_${user.email}`);
    }
    toast.success('¡Configuración completada exitosamente!');
  };

  return (
    <>
      <Modal 
        isOpen={isOpen} 
        onClose={handleClose}
        title="Configuración Inicial"
        size="2xl"
      >
        <div className="space-y-3">
          <div className="text-center mb-1">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Complete su información inicial
            </h3>
            <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-300">
              Para comenzar, necesitamos que actualice su contraseña y complete su información personal
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Formulario de Cambio de Contraseña */}
            <div className="bg-white dark:bg-gray-800 p-2.5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="mb-1.5">
                <h4 className="text-sm font-medium text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center text-xs font-semibold">
                    1
                  </span>
                  Cambiar Contraseña Temporal
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                  Por seguridad, actualice su contraseña temporal
                </p>
              </div>
              {onboardingState.passwordChanged ? (
                <div className="flex flex-col items-center justify-center p-4 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <CheckCircleIcon className="w-8 h-8 text-green-500 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-medium text-green-600 dark:text-green-400">
                    Contraseña Actualizada
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
                    Su contraseña ha sido actualizada exitosamente
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <ChangePasswordForm 
                    onPasswordChanged={handlePasswordChanged} 
                    isCompleted={onboardingState.passwordChanged}
                    compact={true}
                    initialPassword={onboardingState.temporaryPassword || 'Temporal12345@'}
                  />
                </div>
              )}
            </div>

            {/* Formulario de Perfil */}
            <div className="bg-white dark:bg-gray-800 p-2.5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="mb-1.5">
                <h4 className="text-sm font-medium text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center text-xs font-semibold">
                    2
                  </span>
                  Completar Información
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                  Complete su información personal
                </p>
              </div>
              <div className="space-y-1.5">
                <CompleteProfileForm 
                  onProfileCompleted={handleProfileCompleted}
                  compact={true}
                  disabled={!onboardingState.passwordChanged}
                />
              </div>
            </div>
          </div>

          {/* Indicador de Progreso */}
          <div className="flex items-center justify-center gap-2 mt-1">
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${onboardingState.passwordChanged ? 'bg-green-500 dark:bg-green-400' : 'bg-gray-300 dark:bg-gray-600'}`} />
              <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">Contraseña</span>
            </div>
            <div className="h-0.5 w-6 bg-gray-200 dark:bg-gray-700" />
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${onboardingState.profileCompleted ? 'bg-green-500 dark:bg-green-400' : 'bg-gray-300 dark:bg-gray-600'}`} />
              <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">Perfil</span>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showConfirmModal}
        onClose={handleCancelExit}
        title="Confirmar Salida"
        size="sm"
      >
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                ¿Está seguro que desea salir?
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Deberá cambiar su contraseña temporal la próxima vez que inicie sesión.
              </p>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCancelExit}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 
                rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 
                dark:focus:ring-offset-gray-800 transition-colors duration-200"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmExit}
              className="px-4 py-2 text-sm font-medium text-white 
                bg-red-600 dark:bg-red-500 border border-transparent 
                rounded-md hover:bg-red-700 dark:hover:bg-red-600 
                focus:outline-none focus:ring-2 focus:ring-offset-2 
                focus:ring-red-500 dark:focus:ring-offset-gray-800 
                transition-colors duration-200"
            >
              Sí, salir
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}; 
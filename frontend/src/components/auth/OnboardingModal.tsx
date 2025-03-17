import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { ChangePasswordForm } from './ChangePasswordForm';
import { CompleteProfileForm } from './CompleteProfileForm';
import { useAuth } from '../../contexts/AuthContext';
import { useOnboarding } from '../../hooks/useOnboarding';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

// Estilos personalizados para la animación de ping
const customStyles = `
  @keyframes ping-slow {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    75%, 100% {
      transform: scale(1.2);
      opacity: 0;
    }
  }
  .animate-ping-slow {
    animation: ping-slow 3s cubic-bezier(0, 0, 0.2, 1) infinite;
  }
`;

interface OnboardingModalProps {
  isOpen: boolean;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen }) => {
  const { logout } = useAuth();
  const { onboardingStatus, loading, error, refreshStatus } = useOnboarding();
  const navigate = useNavigate();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [shouldShowModal, setShouldShowModal] = useState(true);
  const hasRedirected = React.useRef(false);

  // Efecto para el contador regresivo
  useEffect(() => {
    if (showSuccessScreen && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          const newCount = prev - 1;
          if (newCount <= 0) {
            // Al llegar a 0, ocultamos todo el modal
            setShowSuccessScreen(false);
            setShouldShowModal(false);
            clearInterval(timer);
          }
          return newCount;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [showSuccessScreen, countdown]);

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
              Por favor, complete su configuración inicial.
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

  useEffect(() => {
    // Agregar estilos personalizados al documento
    const styleSheet = document.createElement("style");
    styleSheet.innerText = customStyles;
    document.head.appendChild(styleSheet);

    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  const handleClose = async () => {
      setShowConfirmModal(true);
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
    refreshStatus();
    toast.success('Contraseña actualizada exitosamente. Ahora puede completar su información personal.');
  };

  const handleProfileCompleted = async () => {
    if (onboardingStatus?.pendingSteps.requiresPasswordChange) {
      toast.error('Debe cambiar su contraseña temporal antes de continuar');
      return;
    }

    try {
      await refreshStatus();
      setShowSuccessScreen(true);
      setCountdown(3);

      try {
        await api.post('/users/send-welcome-email');
      } catch (emailError) {
        console.error('Error al enviar correo de bienvenida:', emailError);
      }

    } catch (error) {
      console.error('Error al completar el perfil:', error);
      toast.error('Error al completar la configuración');
    }
  };

  // Verificar si todo está completo y redirigir
  useEffect(() => {
    if (!loading && 
        onboardingStatus && 
        !onboardingStatus.pendingSteps.requiresPasswordChange && 
        !onboardingStatus.pendingSteps.requiresProfileCompletion &&
        !hasRedirected.current) {
      
      setShowSuccessScreen(true);
      hasRedirected.current = true;
    }
  }, [onboardingStatus, loading]);

  // Si no debemos mostrar el modal, no renderizamos nada
  if (!shouldShowModal) {
    return null;
  }

  if (loading) {
    return (
      <Modal 
        isOpen={isOpen} 
        onClose={() => {}}
        title="Configuración Inicial"
        size="2xl"
        preventClose={true}
      >
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
      </Modal>
    );
  }

  if (error) {
    return (
      <Modal 
        isOpen={isOpen} 
        onClose={handleClose}
        title="Error"
        size="md"
      >
        <div className="p-4 text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Error al cargar el estado
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            {error}
          </p>
        </div>
      </Modal>
    );
  }

  if (showSuccessScreen) {
    return (
      <Modal
        isOpen={isOpen && shouldShowModal}
        onClose={() => {}}
        title=""
        size="md"
        preventClose={true}
      >
        <motion.div 
          className="flex flex-col items-center justify-center p-4 sm:p-8 space-y-4 sm:space-y-6"
          initial={{ scale: 1, y: 0, opacity: 1 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ 
            scale: 0.95,
            y: 25,
            opacity: 0,
            transition: {
              duration: 0.35,
              ease: [0.32, 0, 0.67, 0]
            }
          }}
        >
          {/* Icono de éxito animado con efecto de brillo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="relative"
          >
            <div className="relative w-16 h-16 sm:w-24 sm:h-24">
              {/* Fondo con gradiente y efecto de brillo */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-green-100 to-emerald-50 dark:from-green-900 dark:via-green-800 dark:to-emerald-900 rounded-full shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white to-transparent opacity-30 rounded-full animate-pulse" />
              </div>
              
              {/* Icono central */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <CheckCircleIcon className="w-12 h-12 sm:w-16 sm:h-16 text-green-600 dark:text-green-400 drop-shadow-md" />
              </motion.div>
            </div>

            {/* Anillos decorativos con animación suave */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="absolute inset-0"
            >
              <div className="absolute inset-0 rounded-full border-4 border-green-200/50 dark:border-green-700/50 animate-ping-slow" />
              <div className="absolute inset-0 rounded-full border-2 border-green-300/30 dark:border-green-600/30 animate-ping-slow" style={{ animationDelay: "0.5s" }} />
            </motion.div>
          </motion.div>
          
          {/* Texto animado con tipografía mejorada */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center space-y-2 sm:space-y-4"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 font-serif tracking-tight">
              ¡Todo Listo!
            </h2>
            <div className="space-y-1 sm:space-y-2">
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 font-light">
                Bienvenido al Sistema de Gestión Legal
              </p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Su perfil ha sido configurado exitosamente
              </p>
              <div className="flex flex-col items-center space-y-1 mt-2">
                <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                  Accediendo al dashboard en
                </p>
                <motion.div
                  key={countdown}
                  initial={{ scale: 1.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  className="text-xl sm:text-2xl font-light text-primary-600 dark:text-primary-400 font-mono"
                >
                  {countdown}
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Barra de progreso con animación suave */}
          <motion.div
            className="w-full max-w-[150px] sm:max-w-[200px] h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <motion.div
              className="h-full bg-primary-600 dark:bg-primary-400"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 3, ease: "linear" }}
            />
          </motion.div>

          {/* Mensaje de cierre con animación */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: countdown === 1 ? 1 : 0 }}
            className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 italic"
          >
            Cerrando configuración inicial...
          </motion.p>
        </motion.div>
      </Modal>
    );
  }

  return (
    <>
      <Modal 
        isOpen={isOpen && shouldShowModal}
        onClose={handleClose}
        title="Configuración Inicial"
        size="2xl"
        preventClose={false}
      >
        <div className="space-y-3 max-w-full">
          <div className="text-center mb-1">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Complete su información inicial
            </h3>
            <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-300">
              Para comenzar, necesitamos que actualice su contraseña y complete su información personal
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Formulario de Cambio de Contraseña */}
            <div className={`bg-white dark:bg-gray-800 p-2.5 sm:p-4 rounded-lg shadow-sm border ${!onboardingStatus?.pendingSteps.requiresPasswordChange ? 'border-green-200 dark:border-green-800' : 'border-gray-200 dark:border-gray-700'}`}>
              <div className="mb-1.5">
                <h4 className="text-sm font-medium text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
                  <span className={`flex-shrink-0 w-4 h-4 rounded-full ${!onboardingStatus?.pendingSteps.requiresPasswordChange ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400' : 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'} flex items-center justify-center text-xs font-semibold`}>
                    1
                  </span>
                  <span className="truncate">Cambiar Contraseña Temporal</span>
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                  Por seguridad, actualice su contraseña temporal
                </p>
              </div>
              
              {!onboardingStatus?.pendingSteps.requiresPasswordChange ? (
                <div className="flex flex-col items-center justify-center p-2 sm:p-4 space-y-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <CheckCircleIcon className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 dark:text-green-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-medium text-green-600 dark:text-green-400">
                    Contraseña Actualizada
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 text-center">
                    Su contraseña ha sido actualizada exitosamente
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <ChangePasswordForm 
                    onPasswordChanged={handlePasswordChanged} 
                    isCompleted={!onboardingStatus?.pendingSteps.requiresPasswordChange}
                    compact={true}
                  />
                </div>
              )}
            </div>

            {/* Formulario de Perfil */}
            <div className={`bg-white dark:bg-gray-800 p-2.5 sm:p-4 rounded-lg shadow-sm border ${onboardingStatus?.pendingSteps.requiresPasswordChange ? 'opacity-50' : !onboardingStatus?.pendingSteps.requiresProfileCompletion ? 'border-green-200 dark:border-green-800' : 'border-gray-200 dark:border-gray-700'}`}>
              <div className="mb-1.5">
                <h4 className="text-sm font-medium text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
                  <span className={`flex-shrink-0 w-4 h-4 rounded-full ${!onboardingStatus?.pendingSteps.requiresProfileCompletion ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400' : 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'} flex items-center justify-center text-xs font-semibold`}>
                    2
                  </span>
                  <span className="truncate">Completar Información</span>
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                  Complete su información personal
                </p>
              </div>

              {!onboardingStatus?.pendingSteps.requiresProfileCompletion ? (
                <div className="flex flex-col items-center justify-center p-2 sm:p-4 space-y-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <CheckCircleIcon className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 dark:text-green-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-medium text-green-600 dark:text-green-400">
                    Perfil Completado
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 text-center">
                    Su información personal ha sido guardada exitosamente
                  </p>
                </div>
              ) : (
              <div className="space-y-1.5">
                <CompleteProfileForm 
                  onProfileCompleted={handleProfileCompleted}
                  disabled={onboardingStatus?.pendingSteps.requiresPasswordChange}
                  compact={true}
                />
              </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={handleCancelExit}
        onConfirm={handleConfirmExit}
        title="¿Está seguro?"
        message={
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-500/20">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <p className="text-center text-sm sm:text-base">
              ¿Está seguro que desea salir de la configuración inicial?<br/>
              <span className="text-xs sm:text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                Deberá completar la configuración en su próximo inicio de sesión.
              </span>
            </p>
          </div>
        }
        confirmText="Salir"
        cancelText="Cancelar"
        type="warning"
        preventClose={false}
      />
    </>
  );
}; 
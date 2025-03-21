import React, { useState } from 'react';
import { UserWithActivity } from '../../types/user';
import { EnhancedActivityList } from '../activity/EnhancedActivityList';
import { ActivityDetails } from '../activity/ActivityDetails';
import { getPhotoUrl } from '../../utils/urls';
import {
  UserIcon, 
  ClockIcon,
  AcademicCapIcon,
  BookOpenIcon,
  BuildingIcon,
  XMarkIcon,
  HashtagIcon,
  PhoneIcon,
  EmailIcon
} from '../icons/CustomIcons';
import { Dialog } from '@headlessui/react';

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserWithActivity | null;
  loading: boolean;
}

const DetailItem = ({ icon: Icon, label, value, className = '' }: { 
  icon: any; 
  label: string; 
  value: string | null | undefined;
  className?: string;
}) => (
  <div className={`flex items-center p-3 sm:p-4 rounded-lg transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${className}`}>
    <div className="flex-shrink-0">
      <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500" />
    </div>
    <div className="min-w-0 flex-1 ml-3 sm:ml-4">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 truncate mt-1">
        {value || 'No especificado'}
      </p>
    </div>
  </div>
);

const StatCard = ({ title, value, color }: { title: string; value: string | number; color: string }) => (
  <div className={`relative overflow-hidden rounded-lg bg-gradient-to-br ${color} p-3 sm:p-5 shadow-sm`}>
    <div className="relative z-10">
      <div className="text-xs sm:text-sm font-medium text-white/90 mb-1">{title}</div>
      <div className="text-lg sm:text-2xl font-bold text-white">{value}</div>
    </div>
    <div className="absolute inset-0 bg-white/5 rounded-lg backdrop-blur-[1px]" />
  </div>
);

export const UserDetailModal = ({ isOpen, onClose, user, loading }: UserDetailModalProps) => {
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [imageError, setImageError] = useState(false);

  if (!isOpen || !user) return null;

  const handleImageError = () => {
    setImageError(true);
  };

  const handleActivityClick = (activity: any) => {
    console.log('Actividad seleccionada:', activity);
    setSelectedActivity(activity);
  };

  const handleCloseActivityDetails = () => {
    setSelectedActivity(null);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-[9999]"
    >
      <div className="flex items-start justify-center min-h-screen p-2 sm:p-4 overflow-y-auto">
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        
        {selectedActivity ? (
          <div className="relative bg-white dark:bg-gray-900 w-full max-w-4xl rounded-xl shadow-2xl">
            <ActivityDetails 
              activity={selectedActivity}
              onClose={handleCloseActivityDetails}
            />
          </div>
        ) : (
          <div className="relative bg-white dark:bg-gray-900 w-full max-w-7xl rounded-xl shadow-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center px-4 sm:px-8 py-3 sm:py-5 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
              <div className="flex items-center gap-3 sm:gap-5">
                <div className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-full overflow-hidden bg-primary-100 dark:bg-primary-500/10
                              ring-2 ring-primary-500/20 dark:ring-primary-500/30">
                  {(() => {
                    return user.photoUrl && !imageError ? (
                      <img 
                        src={getPhotoUrl(user.photoUrl)}
                        alt={`Foto de ${user.nombre || 'usuario'}`}
                        className="h-full w-full object-cover"
                        onError={handleImageError}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-[#4F46E5] text-white font-medium">
                        <span className="text-base sm:text-lg">
                          {(user.nombre?.trim() || user.email?.trim() || '?').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    );
                  })()}
                </div>
                <div>
                  <Dialog.Title className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                    {user.nombre || 'Usuario'}
                  </Dialog.Title>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">
                    {user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 sm:p-2.5 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
                </div>
              ) : !user ? (
                <div className="flex justify-center items-center h-full">
                  <p className="text-gray-500 dark:text-gray-400">No se encontró información del usuario</p>
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8 p-4 sm:p-6 lg:p-8 h-full">
                  {/* Left panel */}
                  <div className="w-full lg:w-[380px] flex-shrink-0 flex flex-col min-h-0">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-5 mb-4 sm:mb-6">
                      <StatCard 
                        title="Actividades"
                        value={user.activityLogs?.length || 0}
                        color="from-blue-500 to-blue-600"
                      />
                      <StatCard 
                        title="Estado"
                        value={user.isActive ? 'Activo' : 'Inactivo'}
                        color={user.isActive ? "from-emerald-500 to-emerald-600" : "from-red-500 to-red-600"}
                      />
                    </div>

                    {/* Scrollable section */}
                    <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide">
                      <div className="flex flex-col gap-4 sm:gap-6">
                        {/* Personal Info */}
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg overflow-hidden">
                          <div className="px-3 sm:px-5 py-3 sm:py-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 sm:gap-3">
                              <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                              Información Personal
                            </h3>
                          </div>
                          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                            <DetailItem
                              icon={UserIcon}
                              label="Nombre"
                              value={user.nombre}
                            />
                            <DetailItem
                              icon={HashtagIcon}
                              label="Cédula"
                              value={user.cedula}
                            />
                            <DetailItem
                              icon={PhoneIcon}
                              label="Teléfono"
                              value={user.telefono}
                            />
                            <DetailItem
                              icon={EmailIcon}
                              label="Email"
                              value={user.email}
                            />
                          </div>
                        </div>

                        {/* Professional Info */}
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg overflow-hidden">
                          <div className="px-3 sm:px-5 py-3 sm:py-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 sm:gap-3">
                              <AcademicCapIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                              Información Profesional
                            </h3>
                          </div>
                          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                            <DetailItem
                              icon={AcademicCapIcon}
                              label="Estado Profesional"
                              value={user.estadoProfesional}
                            />
                            <DetailItem
                              icon={BookOpenIcon}
                              label="Número de Matrícula"
                              value={user.numeroMatricula}
                            />
                            <DetailItem
                              icon={BuildingIcon}
                              label="Universidad"
                              value={user.universidad}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right panel - Activities */}
                  <div className="flex-1 bg-gray-50 dark:bg-gray-800/50 rounded-lg flex flex-col min-h-0">
                    <div className="px-3 sm:px-5 py-3 sm:py-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                      <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 sm:gap-3">
                        <ClockIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                        Actividades Recientes
                      </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide">
                      <div className="p-3 sm:p-5">
                        {user.activityLogs && user.activityLogs.length > 0 ? (
                          <EnhancedActivityList
                            activities={user.activityLogs}
                            onActivityClick={handleActivityClick}
                            className="w-full"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-center py-6 sm:py-8">
                            <ClockIcon className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 dark:text-gray-600 mb-2 sm:mb-3" />
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                              No hay actividades registradas
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}; 
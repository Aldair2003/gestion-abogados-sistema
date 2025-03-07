import React from 'react';
import {
  KeyIcon,
  UserCircleIcon,
  DocumentTextIcon,
  XCircleIcon,
  CheckCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { 
  ArrowLeftOnRectangleIcon,
  UserPlusIcon,
  LockClosedIcon 
} from '../icons/CustomIcons';

interface IconProps {
  className?: string;
}

type IconMapType = {
  [key: string]: {
    [key: string]: React.ForwardRefExoticComponent<any> | React.FC<IconProps>;
  };
};

const iconMap: IconMapType = {
  // Sesión y Autenticación
  SESSION: {
    LOGIN: KeyIcon,
    LOGOUT: ArrowLeftOnRectangleIcon,
    PASSWORD_CHANGE: LockClosedIcon,
    PASSWORD_RESET: KeyIcon,
    UNAUTHORIZED_ACCESS: ExclamationTriangleIcon,
    DEFAULT: KeyIcon
  },

  // Perfil y Usuario
  PROFILE: {
    UPDATE_PROFILE: UserCircleIcon,
    PROFILE_COMPLETED: CheckCircleIcon,
    PROFILE_INCOMPLETE: XCircleIcon,
    CHANGE_PASSWORD: LockClosedIcon,
    UPDATE_PROFILE_PHOTO: UserCircleIcon,
    DEFAULT: UserCircleIcon
  },

  // Administración
  ADMINISTRATIVE: {
    CREATE_USER: UserPlusIcon,
    DELETE_USER: XCircleIcon,
    UPDATE_USER: UserCircleIcon,
    EXPORT_DATA: DocumentTextIcon,
    SETTINGS_UPDATE: KeyIcon,
    VIEW_USER: UserCircleIcon,
    DEFAULT: DocumentTextIcon
  },

  // Estado de Cuenta
  ACCOUNT_STATUS: {
    DEACTIVATE_USER: XCircleIcon,
    ACTIVATE_USER: CheckCircleIcon,
    BLOCK_USER: XCircleIcon,
    DEFAULT: InformationCircleIcon
  }
};

export const ActivityIcon: React.FC<{ 
  category: string; 
  action: string; 
  className?: string;
}> = ({ category, action, className = 'h-5 w-5' }) => {
  // Obtener el mapa de iconos para la categoría
  const categoryIcons = iconMap[category] || {};
  
  // Obtener el componente de icono específico para la acción o el icono por defecto de la categoría
  const IconComponent = categoryIcons[action] || categoryIcons.DEFAULT || InformationCircleIcon;

  return <IconComponent className={className} />;
};

export const CloseIcon: React.FC<IconProps> = ({ className = 'h-5 w-5' }) => (
  <XMarkIcon className={className} />
);

export const NoDataIcon: React.FC<IconProps> = ({ className = 'h-6 w-6' }) => (
  <XCircleIcon className={className} />
);

export const WarningIcon: React.FC<IconProps> = ({ className = 'h-5 w-5' }) => (
  <ExclamationTriangleIcon className={className} />
); 
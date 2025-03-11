import React from 'react';
import {
  KeyIcon,
  UserCircleIcon,
  DocumentTextIcon,
  XCircleIcon,
  CheckCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { 
  ArrowLeftOnRectangleIcon,
  UserPlusIcon,
  LockClosedIcon,
  MapPinIcon,
  UserGroupIcon
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

interface ActivityIconProps {
  category?: string;
  type?: 'canton' | 'persona';
  action: string;
  className?: string;
}

export const ActivityIcon = ({ category, type, action, className = 'h-8 w-8' }: ActivityIconProps) => {
  const getIconClass = () => {
    switch (action) {
      case 'assign':
        return 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400';
      case 'update':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400';
      case 'revoke':
        return 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400';
    }
  };

  const getIcon = () => {
    // Si es una actividad de permisos
    if (type) {
      switch (action) {
        case 'assign':
          return <KeyIcon className={className} />;
        case 'update':
          return <PencilIcon className={className} />;
        case 'revoke':
          return <TrashIcon className={className} />;
      }

      // Iconos por tipo de recurso
      return type === 'canton' ? (
        <MapPinIcon className={className} />
      ) : (
        <UserGroupIcon className={className} />
      );
    }

    // Para otros tipos de actividades, usar el mapa de iconos
    if (category && iconMap[category]) {
      const CategoryIcon = iconMap[category][action] || iconMap[category].DEFAULT;
      return <CategoryIcon className={className} />;
    }

    // Icono por defecto
    return <PencilIcon className={className} />;
  };

  return (
    <div
      className={`relative flex h-10 w-10 items-center justify-center rounded-full ${getIconClass()}`}
    >
      {getIcon()}
    </div>
  );
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
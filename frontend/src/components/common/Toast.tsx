import React from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface ToastProps {
  type: 'success' | 'error' | 'warning';
  title: string;
  message: string;
}

export const Toast: React.FC<ToastProps> = ({ type, title, message }) => {
  const icons = {
    success: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
    error: <XCircleIcon className="h-5 w-5 text-red-500" />,
    warning: <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
  };

  const colors = {
    success: {
      title: 'text-green-600 dark:text-green-400',
      border: 'border-green-500/50 dark:border-green-600/50'
    },
    error: {
      title: 'text-red-600 dark:text-red-400',
      border: 'border-red-500/50 dark:border-red-600/50'
    },
    warning: {
      title: 'text-yellow-600 dark:text-yellow-400',
      border: 'border-yellow-500/50 dark:border-yellow-600/50'
    }
  };

  return (
    <div className="flex items-start gap-3 w-full max-w-sm">
      <div className="flex-shrink-0 mt-1">
        {icons[type]}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className={`font-medium text-sm truncate ${colors[type].title}`}>
          {title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5 break-words">
          {message}
        </p>
      </div>
    </div>
  );
}; 
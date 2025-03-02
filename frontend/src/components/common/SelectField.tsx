import React, { forwardRef } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  compact?: boolean;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, className = '', compact = false, children, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className={`block ${compact ? 'text-sm' : 'text-base'} font-medium text-gray-700 dark:text-gray-300 tracking-wide mb-1`}>
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={`
              block w-full px-3 
              ${compact ? 'py-1.5 text-sm' : 'py-2 text-base'}
              border border-gray-300 dark:border-gray-700 
              rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent 
              transition-all bg-white dark:bg-gray-800 
              text-gray-900 dark:text-gray-100
              placeholder-gray-400 dark:placeholder-gray-500
              disabled:opacity-50 disabled:cursor-not-allowed
              appearance-none
              ${error ? 'border-red-500 focus:ring-red-500' : ''}
              ${className}
            `}
            {...props}
          >
            {children}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <ChevronDownIcon className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-gray-400`} />
          </div>
        </div>
        {error && (
          <p className={`mt-1 ${compact ? 'text-xs' : 'text-sm'} text-red-500`}>
            {error}
          </p>
        )}
      </div>
    );
  }
); 
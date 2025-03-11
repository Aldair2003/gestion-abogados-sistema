import React, { forwardRef, useState, useEffect } from 'react';

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

const EyeSlashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  compact?: boolean;
  showPasswordToggle?: boolean;
  initialShowPassword?: boolean;
  icon?: React.ReactNode;
  helperText?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ 
    label, 
    error, 
    className = '', 
    compact = false, 
    type = 'text',
    showPasswordToggle = false,
    initialShowPassword = false,
    icon,
    helperText,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = useState(initialShowPassword);
    const isPassword = type === 'password';

    useEffect(() => {
      setShowPassword(initialShowPassword);
    }, [initialShowPassword]);

    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={isPassword && showPassword ? 'text' : type}
            className={`
              block w-full rounded-lg border border-gray-300 shadow-sm 
              focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 
              sm:text-sm transition-all duration-200
              dark:bg-gray-800 dark:border-gray-600 dark:text-white 
              dark:focus:border-primary-500 dark:focus:ring-primary-500/20
              ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
              ${icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5
              ${className}
            `}
            {...props}
          />
          {(isPassword || showPasswordToggle) && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={`absolute inset-y-0 right-0 flex items-center pr-3 
                ${showPassword 
                  ? 'text-primary-500 hover:text-primary-600' 
                  : 'text-gray-400 hover:text-gray-600'
                } transition-colors duration-200`}
            >
              {showPassword ? (
                <EyeSlashIcon />
              ) : (
                <EyeIcon />
              )}
            </button>
          )}
        </div>
        {helperText && !error && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
        )}
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

TextField.displayName = 'TextField'; 
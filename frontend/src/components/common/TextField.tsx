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
  label?: string;
  error?: string;
  compact?: boolean;
  showPasswordToggle?: boolean;
  initialShowPassword?: boolean;
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
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = useState(initialShowPassword);
    const isPassword = type === 'password';

    useEffect(() => {
      setShowPassword(initialShowPassword);
    }, [initialShowPassword]);

    return (
      <div className="w-full">
        {label && (
          <label className={`block ${compact ? 'text-sm' : 'text-base'} font-medium text-gray-700 dark:text-gray-300 tracking-wide mb-1`}>
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type={isPassword && showPassword ? 'text' : type}
            className={`
              block w-full px-3
              ${compact ? 'py-1.5 text-sm' : 'py-2 text-base'}
              border border-gray-300 dark:border-gray-700 
              rounded-md focus:ring-1 focus:ring-primary-500 focus:border-transparent 
              transition-all bg-white dark:bg-gray-800 
              text-gray-800 dark:text-gray-100 font-normal
              placeholder-gray-500 dark:placeholder-gray-400
              disabled:opacity-50 disabled:cursor-not-allowed
              ${isPassword ? 'pr-10' : ''}
              ${error ? 'border-red-500 focus:ring-red-500' : ''}
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
                  ? 'text-blue-500 hover:text-blue-600' 
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
        {error && (
          <p className={`mt-1 ${compact ? 'text-sm' : 'text-base'} text-red-500 font-medium`}>
            {error}
          </p>
        )}
      </div>
    );
  }
); 
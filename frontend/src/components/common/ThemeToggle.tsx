import React from 'react';
import { motion } from 'framer-motion';
import { FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import { IconType } from 'react-icons';

interface IconWrapperProps {
  icon: IconType;
  className?: string;
  'aria-hidden'?: boolean | string;
}

const IconWrapper: React.FC<IconWrapperProps> = ({ icon: Icon, ...props }) => {
  const Component = Icon as React.ElementType;
  return <Component {...props} />;
};

export const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      className={`
        p-2 rounded-lg
        transition-colors duration-200
        ${isDarkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        initial={false}
        animate={{ rotate: isDarkMode ? 180 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <IconWrapper 
          icon={isDarkMode ? FiSun : FiMoon}
          className="w-5 h-5"
          aria-hidden="true"
        />
      </motion.div>
    </motion.button>
  );
}; 
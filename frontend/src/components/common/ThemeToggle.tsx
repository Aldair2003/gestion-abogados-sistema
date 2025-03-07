import React from 'react';
import { motion } from 'framer-motion';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '../../components/icons/SettingsIcons';
import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle = () => {
  const { isDarkMode, themeMode, setThemeMode } = useTheme();

  const handleClick = () => {
    // Ciclo entre los modos: light -> dark -> system -> light
    if (themeMode === 'light') {
      setThemeMode('dark');
    } else if (themeMode === 'dark') {
      setThemeMode('system');
    } else {
      setThemeMode('light');
    }
  };

  // Renderizar el icono correcto basado en el modo actual
  const renderIcon = () => {
    if (themeMode === 'system') {
      return <ComputerDesktopIcon className="w-5 h-5" />;
    }
    return isDarkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />;
  };

  return (
    <motion.button
      onClick={handleClick}
      className={`
        p-2 rounded-lg
        transition-colors duration-200
        ${isDarkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={
        themeMode === 'light' 
          ? 'Cambiar a modo oscuro' 
          : themeMode === 'dark' 
            ? 'Cambiar a modo automático' 
            : 'Cambiar a modo claro'
      }
    >
      <motion.div
        initial={false}
        animate={{ rotate: isDarkMode ? 180 : 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderIcon()}
      </motion.div>
    </motion.button>
  );
}; 
import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '../../components/icons/SettingsIcons';

interface AppearanceSettingsProps {
  isDarkMode: boolean;
  themeMode: 'light' | 'dark' | 'system';
  onThemeChange: (mode: 'light' | 'dark' | 'system') => void;
  fontSize: string;
  onFontSizeChange: (size: string) => void;
}

export const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({
  isDarkMode,
  themeMode,
  onThemeChange,
  fontSize,
  onFontSizeChange,
}) => {
  const { t } = useLanguage();

  const fontSizes = [
    { value: 'sm', label: t('settings.fontSize.small') },
    { value: 'md', label: t('settings.fontSize.medium') },
    { value: 'lg', label: t('settings.fontSize.large') },
  ];

  return (
    <div className="space-y-10">
      {/* Tema */}
      <section className="relative">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('settings.theme.title')}
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {t('settings.theme.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onThemeChange('light')}
            className={`relative flex items-center gap-3 p-4 rounded-xl transition-all duration-200
              ${themeMode === 'light' 
                ? 'bg-white text-primary-700 ring-2 ring-primary-500 shadow-lg shadow-primary-500/10 dark:bg-primary-500/10 dark:text-primary-300 dark:ring-primary-400' 
                : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'}`}
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-500/20">
              <SunIcon className="h-6 w-6" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium">{t('settings.theme.light')}</div>
              <div className="text-xs text-gray-500 dark:text-gray-300">Tema claro para el día</div>
            </div>
            {themeMode === 'light' && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary-500 dark:bg-primary-400" />
            )}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onThemeChange('dark')}
            className={`relative flex items-center gap-3 p-4 rounded-xl transition-all duration-200
              ${themeMode === 'dark' 
                ? 'bg-white text-primary-700 ring-2 ring-primary-500 shadow-lg shadow-primary-500/10 dark:bg-primary-500/10 dark:text-primary-300 dark:ring-primary-400' 
                : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'}`}
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-500/20">
              <MoonIcon className="h-6 w-6" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium">{t('settings.theme.dark')}</div>
              <div className="text-xs text-gray-500 dark:text-gray-300">Tema oscuro para la noche</div>
            </div>
            {themeMode === 'dark' && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary-500 dark:bg-primary-400" />
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onThemeChange('system')}
            className={`relative flex items-center gap-3 p-4 rounded-xl transition-all duration-200
              ${themeMode === 'system' 
                ? 'bg-white text-primary-700 ring-2 ring-primary-500 shadow-lg shadow-primary-500/10 dark:bg-primary-500/10 dark:text-primary-300 dark:ring-primary-400' 
                : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'}`}
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-500/20">
              <ComputerDesktopIcon className="h-6 w-6" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium">Sistema</div>
              <div className="text-xs text-gray-500 dark:text-gray-300">Seguir preferencia del sistema</div>
            </div>
            {themeMode === 'system' && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary-500 dark:bg-primary-400" />
            )}
          </motion.button>
        </div>
      </section>

      {/* Tamaño de fuente */}
      <section className="relative">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('settings.fontSize.title')}
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {t('settings.fontSize.description')}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {fontSizes.map(({ value, label }) => (
            <motion.button
              key={value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onFontSizeChange(value)}
              className={`relative p-4 rounded-xl transition-all duration-200
                ${fontSize === value 
                  ? 'bg-white text-primary-700 ring-2 ring-primary-500 shadow-lg shadow-primary-500/10 dark:bg-primary-500/10 dark:text-primary-300 dark:ring-primary-400' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'}`}
            >
              <div className="font-medium">{label}</div>
              {fontSize === value && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary-500 dark:bg-primary-400" />
              )}
            </motion.button>
          ))}
        </div>
      </section>
    </div>
  );
}; 
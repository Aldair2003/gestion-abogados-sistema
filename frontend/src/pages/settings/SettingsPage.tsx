import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppearanceSettings } from '../../components/settings/AppearanceSettings';
import { LanguageSettings } from '../../components/settings/LanguageSettings';
import { SecuritySettings } from '../../components/settings/SecuritySettings';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Cog6ToothIcon, LanguageIcon, LockClosedIcon } from '../../components/icons/SettingsIcons';
import type { TranslationKey } from '../../context/LanguageContext';

interface Tab {
  id: TabId;
  icon: React.FC<{ className?: string }>;
  translationKey: TranslationKey;
}

type TabId = 'appearance' | 'language' | 'security';

const tabs: Tab[] = [
  { id: 'appearance', icon: Cog6ToothIcon, translationKey: 'settings.appearance' },
  { id: 'language', icon: LanguageIcon, translationKey: 'settings.language' },
  { id: 'security', icon: LockClosedIcon, translationKey: 'settings.security' }
];

export const SettingsPage: React.FC = () => {
  const { t } = useLanguage();
  const { isDarkMode, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabId>('appearance');
  const [fontSize, setFontSize] = useState('md');
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(() => {
    const savedTheme = localStorage.getItem('themeMode') as 'light' | 'dark' | 'system' | null;
    return savedTheme || (isDarkMode ? 'dark' : 'light');
  });

  const handleThemeChange = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    if (mode === 'dark') {
      toggleTheme();
    } else if (mode === 'light') {
      toggleTheme();
    } else {
      // Modo sistema - detectar preferencia del sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark !== isDarkMode) {
        toggleTheme();
      }
    }
    localStorage.setItem('themeMode', mode);
  };

  const handleFontSizeChange = (size: string) => {
    setFontSize(size);
    localStorage.setItem('fontSize', size);
    document.documentElement.classList.remove('text-sm', 'text-md', 'text-lg');
    document.documentElement.classList.add(`text-${size}`);
  };

  // Efecto para cargar las preferencias guardadas
  useEffect(() => {
    const savedFontSize = localStorage.getItem('fontSize');
    if (savedFontSize) {
      handleFontSizeChange(savedFontSize);
    }
  }, []);

  const handlePasswordChange = async (currentPassword: string, newPassword: string) => {
    // Implementar la lógica para cambiar la contraseña
  };

  return (
    <div className="h-full w-full bg-gray-50 dark:bg-[#0f1729] flex items-center justify-center">
      <div className="w-full max-w-4xl px-4 py-6 sm:py-8 md:px-6">
        <div className="flex flex-col gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-2"
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {t('settings.title')}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Personaliza tu experiencia ajustando estas configuraciones
            </p>
          </motion.div>

          <motion.div 
            className="bg-white dark:bg-[#1a2234] shadow-xl rounded-xl sm:rounded-2xl overflow-hidden 
                     border border-gray-200 dark:border-gray-700/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Tabs de navegación */}
            <nav className="flex flex-col sm:flex-row">
              {tabs.map(({ id, icon: Icon, translationKey }, index) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`
                    relative px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium text-center 
                    transition-all duration-200 flex items-center justify-center gap-2
                    ${index !== 0 ? 'sm:border-l border-t sm:border-t-0 border-gray-200 dark:border-gray-700/50' : ''}
                    ${activeTab === id
                      ? 'text-primary-600 dark:text-primary-300 bg-primary-50/50 dark:bg-primary-500/10'
                      : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }
                  `}
                >
                  <Icon className={`h-5 w-5 ${
                    activeTab === id 
                      ? 'text-primary-600 dark:text-primary-300' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`} />
                  <span className="font-medium">{t(translationKey)}</span>
                  {activeTab === id && (
                    <motion.div
                      className="absolute bottom-0 sm:left-0 left-0 right-0 sm:right-auto sm:h-full sm:w-0.5 h-0.5 sm:top-0 
                               bg-primary-500 dark:bg-primary-400"
                      layoutId="activeTab"
                      initial={false}
                    />
                  )}
                </button>
              ))}
            </nav>

            {/* Contenido de las pestañas */}
            <div className="p-4 sm:p-6 md:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'appearance' && (
                    <AppearanceSettings
                      isDarkMode={isDarkMode}
                      themeMode={themeMode}
                      onThemeChange={handleThemeChange}
                      fontSize={fontSize}
                      onFontSizeChange={handleFontSizeChange}
                    />
                  )}
                  {activeTab === 'language' && (
                    <LanguageSettings />
                  )}
                  {activeTab === 'security' && (
                    <SecuritySettings
                      onPasswordChange={handlePasswordChange}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}; 
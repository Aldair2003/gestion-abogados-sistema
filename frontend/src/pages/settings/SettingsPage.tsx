import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AppearanceSettings } from '../../components/settings/AppearanceSettings';
import { LanguageSettings } from '../../components/settings/LanguageSettings';
import { SecuritySettings } from '../../components/settings/SecuritySettings';
import { useLanguage } from '../../context/LanguageContext';
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
  const [activeTab, setActiveTab] = useState<TabId>('appearance');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });
  const [fontSize, setFontSize] = useState('md');
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(() => {
    const savedTheme = localStorage.getItem('themeMode') as 'light' | 'dark' | 'system' | null;
    return savedTheme || (isDarkMode ? 'dark' : 'light');
  });

  const handleThemeChange = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    } else if (mode === 'light') {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    } else {
      // Modo sistema - detectar preferencia del sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
        setIsDarkMode(true);
      } else {
        document.documentElement.classList.remove('dark');
        setIsDarkMode(false);
      }
    }
    localStorage.setItem('themeMode', mode);
  };

  const handleFontSizeChange = (size: string) => {
    setFontSize(size);
    document.documentElement.setAttribute('data-font-size', size);
    localStorage.setItem('fontSize', size);
  };

  // Efecto para cargar las preferencias guardadas
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const savedFontSize = localStorage.getItem('fontSize');

    if (savedTheme === 'dark') {
      handleThemeChange('dark');
    }

    if (savedFontSize) {
      handleFontSizeChange(savedFontSize);
    }
  }, []);

  const mockSessions = [
    {
      id: 1,
      device: 'Microsoft Edge en Windows 10',
      location: 'Portoviejo, Ecuador',
      lastAccess: 'Hace 2 minutos',
      isCurrentSession: true
    },
    {
      id: 2,
      device: 'Brave Browser en Windows 10',
      location: 'Portoviejo, Ecuador',
      lastAccess: 'Hace 2 días',
      isCurrentSession: false
    }
  ];

  const handlePasswordChange = async (currentPassword: string, newPassword: string) => {
    // Implementar la lógica para cambiar la contraseña
  };

  const handleSessionRevoke = async (sessionId: number) => {
    // Implementar la lógica para revocar la sesión
  };

  return (
    <div className="h-full w-full bg-gray-50 dark:bg-[#0f1729] flex items-center justify-center">
      <div className="w-full max-w-4xl px-4 py-8">
        <div className="w-full">
          <div className="flex items-center justify-between mb-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {t('settings.title')}
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Personaliza tu experiencia ajustando estas configuraciones
              </p>
            </motion.div>
          </div>

          <motion.div 
            className="bg-white dark:bg-[#1a2234] shadow-xl rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="border-b border-gray-200 dark:border-gray-700/50">
              <nav className="flex">
                {tabs.map(({ id, icon: Icon, translationKey }, index) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex-1 relative px-6 py-4 text-sm font-medium text-center transition-all duration-200
                      ${index !== 0 ? 'border-l border-gray-200 dark:border-gray-700/50' : ''}
                      ${
                        activeTab === id
                          ? 'text-primary-600 dark:text-primary-300 bg-primary-50/50 dark:bg-primary-500/10'
                          : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }
                    `}
                  >
                    <span className="flex items-center justify-center gap-3">
                      <Icon className={`h-5 w-5 ${
                        activeTab === id 
                          ? 'text-primary-600 dark:text-primary-300' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`} />
                      <span className="font-medium">{t(translationKey)}</span>
                    </span>
                    {activeTab === id && (
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 dark:bg-primary-400"
                        layoutId="activeTab"
                        initial={false}
                      />
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6 md:p-8">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
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
                    sessions={mockSessions}
                    onSessionRevoke={handleSessionRevoke}
                  />
                )}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}; 
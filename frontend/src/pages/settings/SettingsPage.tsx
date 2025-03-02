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
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));
  const [fontSize, setFontSize] = useState('md');

  const handleThemeChange = (isDark: boolean) => {
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
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
      handleThemeChange(true);
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
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-900 dark:to-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {t('settings.title')}
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Personaliza tu experiencia ajustando estas configuraciones
              </p>
            </motion.div>
          </div>

          <motion.div 
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden border border-gray-200/50 dark:border-gray-700/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="border-b border-gray-200/50 dark:border-gray-700/50">
              <nav className="flex">
                {tabs.map(({ id, icon: Icon, translationKey }, index) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex-1 relative px-6 py-4 text-sm font-medium text-center transition-all duration-200
                      ${index !== 0 ? 'border-l border-gray-200/50 dark:border-gray-700/50' : ''}
                      ${
                        activeTab === id
                          ? 'text-primary-600 dark:text-primary-400 bg-primary-50/30 dark:bg-primary-500/5'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/30'
                      }
                    `}
                  >
                    <span className="flex items-center justify-center gap-3">
                      <Icon className={`h-5 w-5 ${
                        activeTab === id 
                          ? 'text-primary-600 dark:text-primary-400' 
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

            <div className="p-8">
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
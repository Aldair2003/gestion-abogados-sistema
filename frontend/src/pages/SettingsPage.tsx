import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AppearanceSettings } from '../components/settings/AppearanceSettings';
import { LanguageSettings } from '../components/settings/LanguageSettings';
import { SecuritySettings } from '../components/settings/SecuritySettings';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import type { TranslationKey } from '../context/LanguageContext';

type TabId = 'appearance' | 'language' | 'security';

interface Tab {
  id: TabId;
  icon: string;
  translationKey: TranslationKey;
}

const tabs: Tab[] = [
  { id: 'appearance', icon: '🎨', translationKey: 'settings.appearance' },
  { id: 'language', icon: '🌐', translationKey: 'settings.language' },
  { id: 'security', icon: '🔒', translationKey: 'settings.security' }
];

export const SettingsPage: React.FC = () => {
  const { t } = useLanguage();
  const { isDarkMode, themeMode, setThemeMode } = useTheme();
  const [activeTab, setActiveTab] = useState<TabId>('appearance');
  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('fontSize') || 'md';
  });

  useEffect(() => {
    // Aplicar el tamaño de fuente al cargar
    document.documentElement.classList.remove('text-sm', 'text-md', 'text-lg');
    document.documentElement.classList.add(`text-${fontSize}`);
  }, [fontSize]);

  const handleThemeChange = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
  };

  const handleFontSizeChange = (size: string) => {
    setFontSize(size);
    localStorage.setItem('fontSize', size);
    document.documentElement.classList.remove('text-sm', 'text-md', 'text-lg');
    document.documentElement.classList.add(`text-${size}`);
  };

  const handlePasswordChange = async (currentPassword: string, newPassword: string) => {
    // Implementar la lógica para cambiar la contraseña
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#1a1f2c] dark:to-[#171f2b]">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.h1 
            className="text-3xl font-serif font-bold text-gray-900 dark:text-white mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {t('settings.title')}
          </motion.h1>

          <motion.div 
            className="bg-white dark:bg-[#1e2330] shadow-xl rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="border-b border-gray-200 dark:border-gray-700/50">
              <nav className="flex divide-x divide-gray-200 dark:divide-gray-700/50">
                {tabs.map(({ id, icon, translationKey }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex-1 px-6 py-5 text-sm font-medium text-center transition-all duration-200
                      ${
                        activeTab === id
                          ? 'text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-500/5 shadow-inner'
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/30'
                      }
                    `}
                  >
                    <span className="flex items-center justify-center gap-3">
                      <span className="text-xl">{icon}</span>
                      <span className="font-semibold">{t(translationKey)}</span>
                    </span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-8">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
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
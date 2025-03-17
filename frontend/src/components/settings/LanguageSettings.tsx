import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { GlobeAltIcon } from '../icons/SettingsIcons';
import { motion } from 'framer-motion';

export const LanguageSettings: React.FC = () => {
  const { currentLanguage, changeLanguage, t } = useLanguage();

  const languages = [
    { code: 'es', label: t('settings.language.spanish'), flag: 'EC' },
    { code: 'en', label: t('settings.language.english'), flag: 'US' }
  ] as const;

  const handleLanguageChange = (lang: 'es' | 'en') => {
    changeLanguage(lang);
    // La página se recargará automáticamente
  };

  return (
    <div className="space-y-8 sm:space-y-10">
      <section>
        <div className="mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            {t('settings.language.title')}
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {t('settings.language.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {languages.map(({ code, label, flag }) => (
            <motion.button
              key={code}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleLanguageChange(code)}
              className={`relative flex items-center gap-3 p-3 sm:p-4 rounded-xl transition-all duration-200
                ${currentLanguage === code 
                  ? 'bg-white text-primary-700 ring-2 ring-primary-500 shadow-lg shadow-primary-500/10 dark:bg-primary-500/10 dark:text-primary-300 dark:ring-primary-400' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'}`}
            >
              <div className="flex items-center justify-center w-8 sm:w-10 h-8 sm:h-10 rounded-lg bg-primary-50 dark:bg-primary-500/20">
                <span className="text-lg sm:text-xl">{flag}</span>
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm sm:text-base font-medium">{label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-300">{code.toUpperCase()}</div>
              </div>
              {currentLanguage === code && (
                <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary-500 dark:bg-primary-400" />
              )}
            </motion.button>
          ))}
        </div>
      </section>

      <p className="text-sm text-gray-500 dark:text-gray-400 italic mt-4">
        {t('settings.language.note')}
      </p>
    </div>
  );
}; 
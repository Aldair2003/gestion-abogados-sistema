import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { GlobeAltIcon } from '../icons/SettingsIcons';

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
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-serif font-semibold text-gray-900 dark:text-white mb-2">
          {t('settings.language.title')}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {t('settings.language.description')}
        </p>
      </div>

      <div className="space-y-3">
        {languages.map(({ code, label, flag }) => (
          <button
            key={code}
            onClick={() => handleLanguageChange(code)}
            className={`w-full flex items-center justify-between p-4 rounded-lg transition-all duration-200
              ${currentLanguage === code 
                ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-500 dark:bg-primary-500/20 dark:text-primary-400 dark:ring-primary-500/50' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-[#1e2330] dark:text-gray-400 dark:hover:bg-[#252b3b]'}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{flag}</span>
              <span className="font-medium">{label}</span>
              {currentLanguage === code && (
                <span className="text-xs px-2 py-1 rounded-full bg-primary-500/10 text-primary-600 dark:bg-primary-400/10 dark:text-primary-400">
                  {t('settings.language.active')}
                </span>
              )}
            </div>
            <GlobeAltIcon className="h-5 w-5" />
          </button>
        ))}
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 italic mt-4">
        {t('settings.language.note')}
      </p>
    </div>
  );
}; 
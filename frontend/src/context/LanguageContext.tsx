import React, { createContext, useContext, useState, useEffect } from 'react';

export type TranslationKey = 
  | 'menu.dashboard'
  | 'menu.profile'
  | 'menu.settings'
  | 'menu.users'
  | 'menu.calendar'
  | 'menu.logout'
  | 'settings.title'
  | 'settings.appearance'
  | 'settings.language'
  | 'settings.security'
  | 'settings.theme.title'
  | 'settings.theme.description'
  | 'settings.theme.dark'
  | 'settings.theme.light'
  | 'settings.theme.toggle'
  | 'settings.fontSize.title'
  | 'settings.fontSize.description'
  | 'settings.fontSize.small'
  | 'settings.fontSize.medium'
  | 'settings.fontSize.large'
  | 'settings.language.title'
  | 'settings.language.description'
  | 'settings.language.spanish'
  | 'settings.language.english'
  | 'settings.language.active'
  | 'settings.language.note'
  | 'settings.security.title'
  | 'settings.security.description'
  | 'settings.security.password'
  | 'settings.security.sessions'
  | 'settings.security.revokeAccess'
  | 'settings.security.passwordDescription'
  | 'settings.security.sessionsDescription'
  | 'settings.security.currentPassword'
  | 'settings.security.newPassword'
  | 'settings.security.confirmPassword'
  | 'settings.security.changePassword'
  | 'message.error'
  | 'message.passwordUpdated'
  | 'message.passwordError'
  | 'message.updating'
  | 'message.loading'
  | 'button.update'
  | 'button.cancel'
  | 'button.save'
  | 'button.confirm';

type Language = 'es' | 'en';

type Translations = {
  [key in TranslationKey]: string;
};

const translations: Record<Language, Translations> = {
  es: {
    'menu.dashboard': 'Panel',
    'menu.profile': 'Perfil',
    'menu.settings': 'Configuración',
    'menu.users': 'Usuarios',
    'menu.calendar': 'Calendario',
    'menu.logout': 'Cerrar Sesión',
    'settings.title': 'Configuración',
    'settings.appearance': 'Apariencia',
    'settings.language': 'Idioma',
    'settings.security': 'Seguridad',
    'settings.theme.title': 'Tema',
    'settings.theme.description': 'Elige entre modo claro y oscuro',
    'settings.theme.dark': 'Oscuro',
    'settings.theme.light': 'Claro',
    'settings.theme.toggle': 'Cambiar tema',
    'settings.fontSize.title': 'Tamaño de fuente',
    'settings.fontSize.description': 'Ajusta el tamaño del texto',
    'settings.fontSize.small': 'Pequeño',
    'settings.fontSize.medium': 'Mediano',
    'settings.fontSize.large': 'Grande',
    'settings.language.title': 'Idioma',
    'settings.language.description': 'Selecciona el idioma de la aplicación',
    'settings.language.spanish': 'Español',
    'settings.language.english': 'Inglés',
    'settings.language.active': 'Activo',
    'settings.language.note': 'Nota: Cambiar el idioma recargará la aplicación',
    'settings.security.title': 'Seguridad',
    'settings.security.description': 'Gestiona la seguridad de tu cuenta',
    'settings.security.password': 'Contraseña',
    'settings.security.sessions': 'Sesiones activas',
    'settings.security.revokeAccess': 'Revocar acceso',
    'settings.security.passwordDescription': 'Actualiza tu contraseña',
    'settings.security.sessionsDescription': 'Gestiona tus sesiones activas',
    'settings.security.currentPassword': 'Contraseña actual',
    'settings.security.newPassword': 'Nueva contraseña',
    'settings.security.confirmPassword': 'Confirmar contraseña',
    'settings.security.changePassword': 'Cambiar contraseña',
    'message.error': 'Error',
    'message.passwordUpdated': 'Contraseña actualizada correctamente',
    'message.passwordError': 'Error al actualizar la contraseña',
    'message.updating': 'Actualizando...',
    'message.loading': 'Cargando...',
    'button.update': 'Actualizar',
    'button.cancel': 'Cancelar',
    'button.save': 'Guardar',
    'button.confirm': 'Confirmar'
  },
  en: {
    'menu.dashboard': 'Dashboard',
    'menu.profile': 'Profile',
    'menu.settings': 'Settings',
    'menu.users': 'Users',
    'menu.calendar': 'Calendar',
    'menu.logout': 'Logout',
    'settings.title': 'Settings',
    'settings.appearance': 'Appearance',
    'settings.language': 'Language',
    'settings.security': 'Security',
    'settings.theme.title': 'Theme',
    'settings.theme.description': 'Choose between light and dark mode',
    'settings.theme.dark': 'Dark',
    'settings.theme.light': 'Light',
    'settings.theme.toggle': 'Toggle theme',
    'settings.fontSize.title': 'Font Size',
    'settings.fontSize.description': 'Adjust the text size',
    'settings.fontSize.small': 'Small',
    'settings.fontSize.medium': 'Medium',
    'settings.fontSize.large': 'Large',
    'settings.language.title': 'Language',
    'settings.language.description': 'Select application language',
    'settings.language.spanish': 'Spanish',
    'settings.language.english': 'English',
    'settings.language.active': 'Active',
    'settings.language.note': 'Note: Changing the language will reload the application',
    'settings.security.title': 'Security',
    'settings.security.description': 'Manage your account security',
    'settings.security.password': 'Password',
    'settings.security.sessions': 'Active Sessions',
    'settings.security.revokeAccess': 'Revoke access',
    'settings.security.passwordDescription': 'Update your password',
    'settings.security.sessionsDescription': 'Manage your active sessions',
    'settings.security.currentPassword': 'Current password',
    'settings.security.newPassword': 'New password',
    'settings.security.confirmPassword': 'Confirm password',
    'settings.security.changePassword': 'Change password',
    'message.error': 'Error',
    'message.passwordUpdated': 'Password updated successfully',
    'message.passwordError': 'Error updating password',
    'message.updating': 'Updating...',
    'message.loading': 'Loading...',
    'button.update': 'Update',
    'button.cancel': 'Cancel',
    'button.save': 'Save',
    'button.confirm': 'Confirm'
  }
};

interface LanguageContextType {
  currentLanguage: Language;
  changeLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage === 'es' || savedLanguage === 'en') ? savedLanguage : 'es';
  });

  useEffect(() => {
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  const changeLanguage = (lang: Language) => {
    setCurrentLanguage(lang);
    localStorage.setItem('language', lang);
    
    // Preservar el tema actual antes de recargar
    const currentTheme = localStorage.getItem('theme');
    const currentFontSize = localStorage.getItem('fontSize');
    
    // Recargar la página
    window.location.reload();
    
    // Restaurar el tema y tamaño de fuente (aunque esto no se ejecutará por el reload)
    if (currentTheme) {
      localStorage.setItem('theme', currentTheme);
    }
    if (currentFontSize) {
      localStorage.setItem('fontSize', currentFontSize);
    }
  };

  const t = (key: TranslationKey): string => {
    return translations[currentLanguage][key];
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}; 
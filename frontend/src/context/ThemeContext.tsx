import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  isDarkMode: boolean;
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  themeMode: 'system',
  toggleTheme: () => {},
  setThemeMode: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Determinar el modo inicial basado en localStorage o preferencia del sistema
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'system';
    const savedTheme = localStorage.getItem('themeMode') as ThemeMode | null;
    return savedTheme || 'system';
  });

  // Estado para seguir si actualmente está en modo oscuro (independiente de la fuente)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    
    const savedTheme = localStorage.getItem('themeMode') as ThemeMode | null;
    
    if (savedTheme === 'dark') return true;
    if (savedTheme === 'light') return false;
    
    // Si es 'system' o null, usar preferencia del sistema
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Efecto para escuchar cambios en la preferencia del sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (themeMode === 'system') {
        setIsDarkMode(mediaQuery.matches);
      }
    };
    
    // Configurar listener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Para navegadores antiguos
      mediaQuery.addListener(handleChange);
    }
    
    // Limpiar listener
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // Para navegadores antiguos
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [themeMode]);

  // Efecto para actualizar el tema cuando cambia themeMode
  useEffect(() => {
    if (themeMode === 'dark') {
      setIsDarkMode(true);
    } else if (themeMode === 'light') {
      setIsDarkMode(false);
    } else if (themeMode === 'system') {
      setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    
    localStorage.setItem('themeMode', themeMode);
  }, [themeMode]);

  // Efecto para aplicar la clase dark al html cuando cambia isDarkMode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setThemeMode(isDarkMode ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, themeMode, toggleTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 
import React from 'react';
import { useParams } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

const ProcesoeImpugnacionPage: React.FC = () => {
  const { personaId } = useParams<{ personaId: string }>();
  const { isDarkMode } = useTheme();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className={`rounded-xl p-6 ${
        isDarkMode 
          ? 'bg-[#1a2234] border border-gray-700/50' 
          : 'bg-white border border-gray-200'
      }`}>
        <h1 className={`text-2xl font-bold mb-4 ${
          isDarkMode ? 'text-gray-100' : 'text-gray-900'
        }`}>
          Proceso e Impugnación
        </h1>
        <p className={`text-sm ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          ID de la persona: {personaId}
        </p>
        <div className="mt-4">
          <p className={`text-center ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Módulo en desarrollo...
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProcesoeImpugnacionPage; 
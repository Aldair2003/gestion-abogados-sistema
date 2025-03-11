import React, { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon, InformationCircleIcon, CalendarIcon, UsersIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import HashtagIcon from '../icons/HashtagIcon';
import juezIcon from '../../assets/Juez.png';
import JuecesModal from './JuecesModal';

interface CantonCardProps {
  id: number;
  nombre: string;
  codigo: string;
  imagenUrl?: string;
  totalJueces?: number;
  totalPersonas?: number;
  ultimaActualizacion?: string;
  onView?: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

const CantonCard: React.FC<CantonCardProps> = ({
  id,
  nombre,
  codigo,
  imagenUrl,
  totalJueces = 0,
  totalPersonas = 0,
  ultimaActualizacion,
  onView,
  onEdit,
  onDelete,
}) => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showJuecesModal, setShowJuecesModal] = useState(false);
  const [currentTotalJueces, setCurrentTotalJueces] = useState(totalJueces);

  // Actualizar el conteo cuando cambie la prop
  useEffect(() => {
    setCurrentTotalJueces(totalJueces);
  }, [totalJueces]);

  const handleJuecesUpdate = (total: number) => {
    setCurrentTotalJueces(total);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Evitar navegación si se hace clic en los botones de acción
    if (
      (e.target as HTMLElement).closest('button') ||
      (e.target as HTMLElement).closest('.actions-container')
    ) {
      return;
    }
    console.log('=== CantonCard handleCardClick ===');
    console.log('Navegando a cantón:', id);
    console.log('URL de navegación:', `/cantones/${id}/personas`);
    navigate(`/cantones/${id}/personas`);
  };

  // Usar una imagen por defecto si no hay URL o si hubo un error
  const imageSource = imagenUrl && !imageError 
    ? imagenUrl 
    : '/assets/images/placeholder-canton.jpg';

  return (
    <>
      <div 
        className={`group relative overflow-hidden rounded-xl transition-all duration-300 transform cursor-pointer ${
          isDarkMode 
            ? 'bg-[#1a2234] hover:bg-[#1e2738] border border-gray-700/50 shadow-lg shadow-black/10' 
            : 'bg-white hover:bg-gray-50 border border-gray-200 shadow-lg shadow-black/5'
        } ${isHovered ? 'scale-[1.02]' : 'scale-100'}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
      >
        {/* Badge del código con mejor contraste */}
        <div className="absolute top-3 left-3 z-10">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300 ${
            isDarkMode 
              ? 'bg-[#1e2738] text-white border border-primary-500/30 shadow-lg shadow-primary-500/20' 
              : 'bg-white/95 text-primary-600 border border-gray-200/50 shadow-lg shadow-black/5'
          } ${isHovered ? 'translate-y-0 opacity-100 scale-105' : '-translate-y-1 opacity-90'}`}>
            <HashtagIcon className={`h-4 w-4 ${isDarkMode ? 'text-primary-400' : 'text-primary-600'}`} />
            <span className={`text-sm font-bold tracking-wide ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>{codigo}</span>
          </div>
        </div>

        {/* Contenedor de imagen con mejor manejo de aspectos */}
        <div className="relative aspect-[16/9] overflow-hidden">
          <img
            src={imageSource}
            alt={nombre}
            className={`w-full h-full object-cover transition-all duration-500 ${
              isHovered ? 'scale-105 blur-[1px]' : 'scale-100'
            }`}
            onError={handleImageError}
            loading="lazy"
          />
          
          {/* Overlay con gradiente mejorado */}
          <div 
            className={`absolute inset-0 transition-opacity duration-300 ${
              isDarkMode 
                ? 'bg-gradient-to-t from-[#0f1729]/95 via-[#0f1729]/70 to-transparent' 
                : 'bg-gradient-to-t from-black/90 via-black/50 to-transparent'
            } ${isHovered ? 'opacity-100' : 'opacity-90'}`}
          />
          
          {/* Acciones con mejor interactividad */}
          <div className={`actions-container absolute inset-x-0 bottom-0 p-4 flex items-center justify-end gap-2 transition-all duration-300 ${
            isHovered ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
          }`}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowJuecesModal(true);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg backdrop-blur-md text-white transition-all duration-200 shadow-lg shadow-black/10 ${
                isDarkMode 
                  ? 'bg-primary-500/20 hover:bg-primary-500/30' 
                  : 'bg-white/10 hover:bg-white/20'
              } hover:scale-105`}
              title="Más Información"
            >
              <InformationCircleIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Más Información</span>
            </button>
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(id);
                }}
                className={`p-2.5 rounded-lg backdrop-blur-md text-white transition-all duration-200 shadow-lg shadow-black/10 ${
                  isDarkMode 
                    ? 'bg-primary-500/20 hover:bg-primary-500/30' 
                    : 'bg-white/10 hover:bg-white/20'
                } hover:scale-105`}
                title="Editar"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(id);
                }}
                className={`p-2.5 rounded-lg backdrop-blur-md text-white transition-all duration-200 shadow-lg shadow-black/10 ${
                  isDarkMode 
                    ? 'bg-red-500/20 hover:bg-red-500' 
                    : 'bg-white/10 hover:bg-red-500'
                } hover:scale-105`}
                title="Eliminar"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Contenido con mejor organización y contraste */}
        <div className="p-4">
          <h3 className={`text-xl font-bold leading-tight mb-4 transition-colors duration-200 ${
            isDarkMode 
              ? `text-gray-100 ${isHovered ? 'text-primary-300' : ''}` 
              : `text-gray-900 ${isHovered ? 'text-primary-600' : ''}`
          }`}>
            {nombre}
          </h3>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className={`flex items-center gap-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              <img 
                src={juezIcon} 
                alt="Jueces" 
                className="h-4 w-4 object-contain filter dark:invert dark:brightness-200" 
              />
              <span className="text-sm">{currentTotalJueces} jueces</span>
            </div>
            <div className={`flex items-center gap-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              <UsersIcon className="h-4 w-4" />
              <span className="text-sm">{totalPersonas} personas</span>
            </div>
          </div>

          {/* Última actualización */}
          <div className={`flex items-center text-xs ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <CalendarIcon className="h-4 w-4 mr-1.5" />
            Actualizado: 
            <span className={`ml-1 font-medium ${
              isDarkMode ? 'text-primary-300' : 'text-gray-700'
            }`}>
              {ultimaActualizacion || new Date().toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Modal de Jueces */}
      <JuecesModal
        isOpen={showJuecesModal}
        onClose={() => setShowJuecesModal(false)}
        cantonId={id}
        cantonNombre={nombre}
        onJuecesUpdate={handleJuecesUpdate}
      />
    </>
  );
};

export default CantonCard; 
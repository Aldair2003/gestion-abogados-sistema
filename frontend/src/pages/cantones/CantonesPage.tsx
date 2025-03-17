import React, { useState, useEffect, useCallback } from 'react';
import { 
  MagnifyingGlassIcon, 
  ExclamationTriangleIcon,
  UsersIcon,
  DocumentTextIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { UserIcon, ExclamationCircleIcon } from '../../components/icons/CustomIcons';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Dialog } from '@headlessui/react';
import CantonCard from '../../components/cantones/CantonCard';
import CantonFormModal from '../../components/cantones/CantonFormModal';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import cantonIcon from '../../assets/canton.png';
import { usePermissions } from '../../hooks/usePermissions';
import { permissionService } from '../../services/permissionService';
import { getApiUrl, getPhotoUrl } from '../../utils/urls';

interface Canton {
  id: number;
  nombre: string;
  codigo: string;
  imagenUrl?: string;
  imagen?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  totalJueces: number;
  totalPersonas: number;
  totalDocumentos: number;
  documentos?: number;
  jueces: Array<{
    juez: {
      id: number;
      nombre: string;
    }
  }>;
  personas: Array<{
    id: number;
    documentos: Array<any>;
  }>;
}

// Configurar axios
// axios.defaults.baseURL = 'http://localhost:3000';
// axios.defaults.headers.common['Accept'] = 'application/json';
// axios.defaults.headers.common['Content-Type'] = 'application/json';

// URL base para las imágenes
// const IMAGE_BASE_URL = 'http://localhost:3000';

const CantonesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { isDarkMode } = useTheme();
  const [cantones, setCantones] = useState<Canton[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCanton, setSelectedCanton] = useState<Canton | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'recent' | 'old' | 'frequent'>('recent');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [cantonToDelete, setCantonToDelete] = useState<Canton | null>(null);
  const { permissions, loading: loadingPermissions } = usePermissions();
  const isAdmin = user?.rol === 'ADMIN';

  const fetchCantones = useCallback(async () => {
    try {
      setIsLoading(true);
      let response;
      
      if (isAdmin) {
        response = await permissionService.getCantones();
      } else {
        response = await permissionService.getAssignedCantones();
      }

      console.log('Respuesta de cantones:', response);

      if (!response || !Array.isArray(response) || response.length === 0) {
        if (!isAdmin) {
          toast.info('No tienes cantones asignados');
        }
        setCantones([]);
        setIsLoading(false);
        return;
      }

      // Procesar los cantones
      const cantonesConImagenes = response.map((canton: Canton) => {
        console.log(`Procesando cantón ${canton.nombre}:`, {
          totalDocumentos: canton.totalDocumentos,
          totalPersonas: canton.totalPersonas,
          totalJueces: canton.totalJueces
        });

        return {
          ...canton,
          imagenUrl: canton.imagenUrl ? getPhotoUrl(canton.imagenUrl) : undefined,
          totalJueces: canton.totalJueces || 0,
          totalPersonas: canton.totalPersonas || 0,
          totalDocumentos: canton.totalDocumentos || 0
        };
      });

      console.log('Cantones procesados:', cantonesConImagenes);
      setCantones(cantonesConImagenes);
    } catch (error) {
      console.error('Error detallado al cargar cantones:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.');
        } else {
          toast.error(`Error al cargar los cantones: ${error.response?.data?.message || 'Error desconocido'}`);
        }
      } else {
        toast.error('Error al cargar los cantones');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  // Verificar acceso y permisos
  useEffect(() => {
    if (!user) {
      toast.error('No has iniciado sesión');
      navigate('/login');
      return;
    }

    // Si es admin, tiene acceso directo
    if (isAdmin) {
      return;
    }

    // Para colaboradores, esperamos a que carguen los permisos
    if (!loadingPermissions && !permissions?.length) {
      toast.error('No tienes permisos asignados para ver cantones');
      navigate('/dashboard');
    }
  }, [user, navigate, permissions, isAdmin, loadingPermissions]);

  // Configurar axios con el token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [token]);

  // Cargar cantones cuando los permisos estén listos
  useEffect(() => {
    if (!loadingPermissions) {
      if (isAdmin || (permissions && permissions.length > 0)) {
        fetchCantones();
      }
    }
  }, [isAdmin, permissions, loadingPermissions, fetchCantones]);

  // Ordenar cantones
  const sortedCantones = [...cantones].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
      case 'old':
        return new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime();
      case 'frequent':
        // Ordenar por la suma total de jueces y personas, de mayor a menor
        const totalA = (a.totalJueces || 0);
        const totalB = (b.totalJueces || 0);
        return totalB - totalA;
      default:
        return 0;
    }
  });

  // Filtrar cantones
  const filteredCantones = sortedCantones.filter(
    (canton) =>
      canton.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      canton.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Manejadores de eventos
  const handleCreateCanton = () => {
    setSelectedCanton(null);
    setIsModalOpen(true);
  };

  const handleEditCanton = (id: number) => {
    const canton = cantones.find((c) => c.id === id);
    if (canton) {
      setSelectedCanton(canton);
      setIsModalOpen(true);
    }
  };

  const handleViewCanton = (id: number) => {
    navigate(`/cantones/${id}`);
  };

  const handleDeleteCanton = async (id: number) => {
    const canton = cantones.find(c => c.id === id);
    if (canton) {
      console.log('Canton a eliminar:', canton);
      console.log('Total documentos:', canton.totalDocumentos);
      
      setCantonToDelete({
        ...canton,
        totalJueces: canton.totalJueces || 0,
        totalPersonas: canton.totalPersonas || 0,
        totalDocumentos: canton.totalDocumentos || 0,
        personas: canton.personas || []
      });
      setShowDeleteConfirm(true);
    }
  };

  const confirmDelete = async () => {
    if (!cantonToDelete) return;

    try {
      await axios.delete(getApiUrl(`/cantones/${cantonToDelete.id}`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      toast.success('Cantón eliminado exitosamente');
      fetchCantones();
      setShowDeleteConfirm(false);
      setCantonToDelete(null);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.');
      } else {
        toast.error('Error al eliminar el cantón');
      }
      console.error(error);
    }
  };

  const handleSubmitCanton = async (formData: {
    nombre: string;
    codigo: string;
    imagen?: File;
  }) => {
    try {
      const data = new FormData();
      data.append('nombre', formData.nombre);
      data.append('codigo', formData.codigo);
      if (formData.imagen) {
        data.append('imagen', formData.imagen);
        console.log('Imagen a subir:', formData.imagen);
      }

      const url = selectedCanton
        ? getApiUrl(`/cantones/${selectedCanton.id}`)
        : getApiUrl('/cantones');

      console.log('Variables de entorno:', {
        REACT_APP_API_URL: process.env.REACT_APP_API_URL,
        REACT_APP_ENV: process.env.REACT_APP_ENV,
        URL_FINAL: url
      });

      console.log('Enviando petición:', {
        method: selectedCanton ? 'put' : 'post',
        url,
        hasImage: !!formData.imagen,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      const response = await axios({
        method: selectedCanton ? 'put' : 'post',
        url,
        data,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.status === 200 || response.status === 201) {
        toast.success(selectedCanton ? 'Cantón actualizado exitosamente' : 'Cantón creado exitosamente');
        setIsModalOpen(false);
        fetchCantones();
      }
    } catch (error) {
      console.error('Error al guardar el cantón:', error);
      if (axios.isAxiosError(error)) {
        console.error('Detalles del error:', {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers,
          message: error.message,
          code: error.code,
          config: error.config
        });
        toast.error(`Error: ${error.response?.data?.message || 'Error desconocido'}`);
      } else {
        toast.error('Error al guardar el cantón');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Cargando cantones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="space-y-6">
        {/* Header con información del cantón */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 px-1 py-2">
          <div className={`group p-4 rounded-2xl transition-all duration-300 transform hover:scale-105 relative ${
            isDarkMode 
              ? 'bg-gradient-to-br from-[#232f45]/40 to-[#1a2234]/40 border border-primary-500/10 shadow-lg shadow-primary-500/5' 
              : 'bg-gradient-to-br from-gray-50/60 to-white/60 border border-primary-500/5 shadow-sm'
          }`}>
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
            <img 
              src={cantonIcon} 
              alt="Cantón" 
              className="h-12 w-12 sm:h-16 sm:w-16 object-contain relative z-10 filter dark:brightness-[1.6] transition-all duration-300 drop-shadow-xl group-hover:drop-shadow-[0_15px_15px_rgba(79,70,229,0.4)]"
            />
          </div>
          <div className="flex flex-col">
            <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Gestión de Cantones
            </h1>
            <p className={`mt-1 text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Administra los cantones del sistema de manera eficiente.
            </p>
          </div>
        </div>

        {/* Barra de búsqueda, filtros y estadísticas */}
        <div className={`p-4 sm:p-6 rounded-2xl transition-all duration-300 ${
          isDarkMode 
            ? 'bg-[#1a2234]/80 backdrop-blur-xl border border-gray-800/80 shadow-lg shadow-black/10' 
            : 'bg-white/90 backdrop-blur-xl border border-gray-200/60 shadow-lg shadow-gray-200/30'
        }`}>
          <div className="flex flex-col gap-4 sm:gap-6">
            {/* Barra de búsqueda y botón de agregar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <div className="flex-1">
                <div className={`relative group transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-[#151e2d]/90 rounded-xl shadow-lg shadow-black/5 border border-gray-800/80' 
                    : 'bg-gray-50/90 rounded-xl shadow-md shadow-gray-200/50 border border-gray-200/80'
                }`}>
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className={`h-5 w-5 transition-colors duration-300 ${
                      isDarkMode 
                        ? 'text-gray-500 group-hover:text-gray-400 group-focus-within:text-primary-400' 
                        : 'text-gray-400 group-hover:text-gray-500 group-focus-within:text-primary-500'
                    }`} />
                  </div>
                  <input
                    type="text"
                    className={`block w-full pl-11 pr-4 py-3 sm:py-3.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                      isDarkMode 
                        ? 'bg-[#151e2d]/90 border-gray-800/80 text-gray-200 placeholder-gray-500 focus:border-primary-500/70 focus:ring-primary-500/20 hover:border-gray-700' 
                        : 'bg-gray-50/90 border-gray-200/80 text-gray-700 placeholder-gray-400 focus:border-primary-500/70 focus:ring-primary-500/20 hover:border-gray-300'
                    } border shadow-sm focus:shadow-lg focus:outline-none focus:ring-2 hover:shadow-md`}
                    placeholder="Buscar cantón por nombre o código..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button
                        onClick={() => setSearchTerm('')}
                        className={`p-1.5 rounded-full transition-all duration-300 ${
                          isDarkMode
                            ? 'hover:bg-gray-700/50 text-gray-500 hover:text-gray-300'
                            : 'hover:bg-gray-200/50 text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        <span className="sr-only">Limpiar búsqueda</span>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={handleCreateCanton}
                  className={`inline-flex items-center justify-center px-4 sm:px-6 py-3 sm:py-3.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-300 ${
                    isDarkMode
                      ? 'bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/20 border border-primary-400/20 hover:shadow-primary-500/30 hover:scale-[1.02]' 
                      : 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/20 hover:shadow-primary-600/30 hover:scale-[1.02]'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  <span>Agregar Cantón</span>
                </button>
              )}
            </div>

            {/* Línea divisoria con gradiente */}
            <div className={`h-px ${
              isDarkMode 
                ? 'bg-gradient-to-r from-transparent via-gray-800 to-transparent' 
                : 'bg-gradient-to-r from-transparent via-gray-200 to-transparent'
            }`}></div>

            {/* Filtros y estadísticas */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <span className={`text-sm font-medium tracking-wide ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Ordenar por:
                </span>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <button
                    onClick={() => setSortBy('recent')}
                    className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm font-medium tracking-wide transition-all duration-300 ${
                      sortBy === 'recent'
                        ? isDarkMode
                          ? 'bg-primary-600/30 text-white border border-primary-400/50 shadow-lg shadow-primary-500/10'
                          : 'bg-primary-50 text-primary-700 border border-primary-200 shadow-md shadow-primary-500/5'
                        : isDarkMode
                          ? 'bg-[#151e2d]/80 text-gray-300 hover:bg-[#1a2234]/80 border border-gray-800/60 hover:border-gray-700'
                          : 'bg-gray-50/80 text-gray-600 hover:bg-gray-100/80 border border-gray-200/60 hover:border-gray-300'
                    } hover:scale-[1.02] flex-shrink-0`}
                  >
                    Más recientes
                  </button>
                  <button
                    onClick={() => setSortBy('old')}
                    className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm font-medium tracking-wide transition-all duration-300 ${
                      sortBy === 'old'
                        ? isDarkMode
                          ? 'bg-primary-600/30 text-white border border-primary-400/50 shadow-lg shadow-primary-500/10'
                          : 'bg-primary-50 text-primary-700 border border-primary-200 shadow-md shadow-primary-500/5'
                        : isDarkMode
                          ? 'bg-[#151e2d]/80 text-gray-300 hover:bg-[#1a2234]/80 border border-gray-800/60 hover:border-gray-700'
                          : 'bg-gray-50/80 text-gray-600 hover:bg-gray-100/80 border border-gray-200/60 hover:border-gray-300'
                    } hover:scale-[1.02] flex-shrink-0`}
                  >
                    Más antiguos
                  </button>
                  <button
                    onClick={() => setSortBy('frequent')}
                    className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm font-medium tracking-wide transition-all duration-300 ${
                      sortBy === 'frequent'
                        ? isDarkMode
                          ? 'bg-primary-600/30 text-white border border-primary-400/50 shadow-lg shadow-primary-500/10'
                          : 'bg-primary-50 text-primary-700 border border-primary-200 shadow-md shadow-primary-500/5'
                        : isDarkMode
                          ? 'bg-[#151e2d]/80 text-gray-300 hover:bg-[#1a2234]/80 border border-gray-800/60 hover:border-gray-700'
                          : 'bg-gray-50/80 text-gray-600 hover:bg-gray-100/80 border border-gray-200/60 hover:border-gray-300'
                    } hover:scale-[1.02] flex-shrink-0`}
                  >
                    Más frecuente
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Total: <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{cantones.length}</span> cantones
                </div>
                {isAdmin && (
                  <button
                    className={`inline-flex items-center justify-center w-full sm:w-auto px-4 py-2.5 rounded-lg text-sm font-medium tracking-wide transition-all duration-300 ${
                      isDarkMode
                        ? 'bg-[#151e2d]/90 text-gray-300 hover:bg-[#1a2234]/90 border border-gray-800/60 hover:border-gray-700'
                        : 'bg-gray-50/90 text-gray-600 hover:bg-gray-100/90 border border-gray-200/60 hover:border-gray-300'
                    } hover:scale-[1.02]`}
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Exportar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lista de cantones */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="relative">
              <div className="h-12 w-12 rounded-full animate-spin border-4 border-primary-500/20 border-t-primary-500"></div>
              <div className={`mt-4 text-center ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Cargando cantones...
              </div>
            </div>
          </div>
        ) : filteredCantones.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 animate-fadeIn pb-8 sm:pb-12">
            {filteredCantones.map((canton) => (
              <CantonCard
                key={canton.id}
                {...canton}
                onView={() => handleViewCanton(canton.id)}
                onEdit={isAdmin ? () => handleEditCanton(canton.id) : undefined}
                onDelete={isAdmin ? () => handleDeleteCanton(canton.id) : undefined}
              />
            ))}
          </div>
        ) : (
          <div className={`max-w-lg mx-auto flex flex-col items-center justify-center h-64 rounded-xl ${
            isDarkMode ? 'bg-[#1a2234]' : 'bg-white'
          } border ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200'} shadow-lg ${
            isDarkMode ? 'shadow-black/10' : 'shadow-black/5'
          }`}>
            <div className={`text-center px-4 sm:px-6 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${
                isDarkMode ? 'bg-[#0f1729]' : 'bg-gray-50'
              }`}>
                <MagnifyingGlassIcon className="h-6 w-6" />
              </div>
              <p className="text-lg font-medium mb-2">
                {searchTerm
                  ? 'No se encontraron cantones'
                  : 'No hay cantones registrados'}
              </p>
              <p className="text-sm">
                {searchTerm
                  ? 'Intenta con otros términos de búsqueda'
                  : 'Comienza agregando un nuevo cantón'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal de creación/edición */}
      <CantonFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitCanton}
        initialData={selectedCanton || undefined}
      />

      {/* Modal de confirmación de eliminación */}
      <Dialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        className="relative z-[9001]"
      >
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className={`w-full max-w-lg transform overflow-hidden rounded-2xl p-6 text-left align-middle shadow-xl transition-all ${
            isDarkMode 
              ? 'bg-[#1a2234] border border-gray-700/50' 
              : 'bg-white border border-gray-200'
          }`}>
            <div className="space-y-6">
              {/* Header con icono */}
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                  isDarkMode ? 'bg-red-500/10' : 'bg-red-100'
                }`}>
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <Dialog.Title className={`text-lg font-semibold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Confirmar eliminación
                  </Dialog.Title>
                  <p className={`mt-1 text-sm ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    ¿Está seguro de eliminar el cantón {cantonToDelete?.nombre}?
                  </p>
                </div>
              </div>

              {/* Información detallada */}
              <div className={`rounded-xl p-4 ${
                isDarkMode 
                  ? 'bg-red-500/5 border border-red-500/10' 
                  : 'bg-red-50 border border-red-100'
              }`}>
                <h4 className={`text-sm font-medium mb-3 ${
                  isDarkMode ? 'text-red-400' : 'text-red-600'
                }`}>
                  Este cantón contiene:
                </h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <UserIcon className={`h-5 w-5 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <span className={`text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      <strong>{cantonToDelete?.totalJueces}</strong> jueces asignados
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <UsersIcon className={`h-5 w-5 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <span className={`text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      <strong>{cantonToDelete?.totalPersonas}</strong> personas registradas
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <DocumentTextIcon className={`h-5 w-5 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <span className={`text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      <strong>{cantonToDelete?.totalDocumentos}</strong> documentos almacenados
                    </span>
                  </li>
                </ul>
              </div>

              {/* Advertencia */}
              <div className={`rounded-xl p-4 ${
                isDarkMode 
                  ? 'bg-gray-800/50 border border-gray-700' 
                  : 'bg-gray-50 border border-gray-200'
              }`}>
                <h4 className={`text-sm font-medium mb-3 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Al eliminar:
                </h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <ExclamationCircleIcon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                      isDarkMode ? 'text-red-400' : 'text-red-500'
                    }`} />
                    <span className={`text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Los jueces serán desvinculados de este cantón
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ExclamationCircleIcon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                      isDarkMode ? 'text-red-400' : 'text-red-500'
                    }`} />
                    <span className={`text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Todas las personas registradas serán <strong>eliminadas permanentemente</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ExclamationCircleIcon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                      isDarkMode ? 'text-red-400' : 'text-red-500'
                    }`} />
                    <span className={`text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Todos los documentos asociados serán <strong>eliminados permanentemente</strong>
                    </span>
                  </li>
                </ul>
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700/50">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isDarkMode
                      ? 'bg-gray-700/50 hover:bg-gray-700 text-gray-300'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isDarkMode
                      ? 'bg-red-500/20 hover:bg-red-500/30 text-white border border-red-500/30'
                      : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                  }`}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default CantonesPage;
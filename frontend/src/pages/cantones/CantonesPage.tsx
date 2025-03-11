import React, { useState, useEffect, useCallback } from 'react';
import { PlusIcon, MagnifyingGlassIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
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
import { User } from '../../types/user';

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
}

// Configurar axios
axios.defaults.baseURL = 'http://localhost:3000';
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['Content-Type'] = 'application/json';

// URL base para las imágenes
const IMAGE_BASE_URL = 'http://localhost:3000';

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
        // Admin ve todos los cantones
        response = await permissionService.getCantones();
      } else {
        // Colaborador solo ve cantones con permiso
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

      // Crear un mapa de cantón a número de jueces
      const juecesMap = response.reduce((acc: any, item: any) => {
        acc[item.id] = item.totalJueces || 0;
        return acc;
      }, {});

      // Añadir la URL base a las imágenes y asegurarse de que la ruta sea correcta
      const cantonesConImagenes = response.map((canton: Canton) => {
        let imagenUrl;
        if (canton.imagenUrl) {
          imagenUrl = canton.imagenUrl.startsWith('http') 
            ? canton.imagenUrl 
            : `${IMAGE_BASE_URL}${canton.imagenUrl.startsWith('/') ? '' : '/'}${canton.imagenUrl}`;
        }
        
        return {
          ...canton,
          imagenUrl,
          totalJueces: juecesMap[canton.id] || 0,
          createdAt: canton.createdAt,
          updatedAt: canton.updatedAt
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
      setCantonToDelete(canton);
      setShowDeleteConfirm(true);
    }
  };

  const confirmDelete = async () => {
    if (!cantonToDelete) return;

    try {
      await axios.delete(`/api/cantones/${cantonToDelete.id}`, {
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
        ? `/api/cantones/${selectedCanton.id}`
        : '/api/cantones';
      const method = selectedCanton ? 'put' : 'post';

      console.log('Enviando petición:', {
        method,
        url,
        hasImage: !!formData.imagen
      });

      const response = await axios({
        method,
        url,
        data,
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });

      console.log('Respuesta después de guardar:', {
        status: response.status,
        data: response.data,
        headers: response.headers
      });

      toast.success(
        selectedCanton
          ? 'Cantón actualizado exitosamente'
          : 'Cantón creado exitosamente'
      );
      setIsModalOpen(false);
      await fetchCantones(); // Esperar a que se recarguen los cantones
    } catch (error) {
      console.error('Error completo:', error);
      if (axios.isAxiosError(error)) {
        console.error('Detalles del error:', {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers
        });
        if (error.response?.status === 401) {
          toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.');
        } else {
          toast.error(`Error al guardar el cantón: ${error.response?.data?.message || error.message}`);
        }
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
    <>
      <div className="h-screen flex flex-col overflow-hidden">
        {/* Header y Toolbar fijos */}
        <div className={`flex-none ${isDarkMode ? 'bg-[#0f1729]' : 'bg-gray-50'}`}>
          <div className="max-w-7xl mx-auto pl-0 pr-4 sm:pr-6 lg:pr-8">
            {/* Header más compacto e integrado */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`flex items-center gap-4 flex-1`}>
                <div className={`group p-3 rounded-2xl transition-all duration-300 transform hover:scale-105 relative ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-[#1e2738]/80 via-[#232f45]/80 to-[#2a3441]/80 border border-primary-500/30 shadow-lg shadow-primary-500/20 hover:shadow-primary-400/40 hover:border-primary-400/40' 
                    : 'bg-gradient-to-br from-white/90 via-gray-50/90 to-gray-100/90 border border-primary-500/15 shadow-md shadow-primary-500/15 hover:shadow-primary-500/25 hover:border-primary-500/25'
                }`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                  <img 
                    src={cantonIcon} 
                    alt="Cantón" 
                    className="h-[5rem] w-[5rem] object-contain relative z-10 filter dark:brightness-[1.6] transition-all duration-300 drop-shadow-xl group-hover:drop-shadow-[0_15px_15px_rgba(79,70,229,0.4)]"
                  />
                </div>
                <div className="flex flex-col">
                  <h1 className={`text-2xl font-bold tracking-tight ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Gestión de Cantones
                  </h1>
                  <p className={`mt-1 text-sm ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Administra los cantones del sistema de manera eficiente.
                  </p>
                </div>
              </div>
            </div>

            {/* Barra de herramientas mejorada */}
            <div className={`flex flex-col gap-4 p-4 rounded-xl ${
              isDarkMode 
                ? 'bg-[#1a2234] shadow-lg shadow-black/10 border border-gray-700/50' 
                : 'bg-white shadow-lg shadow-black/5 border border-gray-200/50'
            }`}>
              {/* Primera fila: Búsqueda y Acciones */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className={`h-5 w-5 transition-colors duration-200 ${
                        isDarkMode 
                          ? 'text-gray-500 group-focus-within:text-primary-400' 
                          : 'text-gray-400 group-focus-within:text-primary-500'
                      }`} />
                    </div>
                    <input
                      type="text"
                      className={`block w-full pl-11 pr-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                        isDarkMode 
                          ? 'bg-[#0f1729] border-gray-700/50 text-white placeholder-gray-500 focus:border-primary-500 focus:ring-primary-500/20 hover:border-gray-600' 
                          : 'bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:ring-primary-500/20 hover:border-gray-300'
                      } border shadow-sm focus:shadow-lg focus:outline-none focus:ring-2 hover:shadow-md`}
                      placeholder="Buscar cantón por nombre o código..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <button
                          onClick={() => setSearchTerm('')}
                          className={`p-1 rounded-full transition-colors duration-200 ${
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
                    className={`inline-flex items-center px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isDarkMode
                        ? 'bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/20 border border-primary-400/20 hover:shadow-primary-500/30' 
                        : 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/20 hover:shadow-primary-600/30'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    <span>Agregar Cantón</span>
                  </button>
                )}
              </div>

              {/* Segunda fila: Filtros y Estadísticas */}
              <div className="flex items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-3">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-600'}`}>
                    Ordenar por:
                  </span>
                  <button
                    onClick={() => setSortBy('recent')}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                      sortBy === 'recent'
                        ? isDarkMode
                          ? 'bg-primary-500/30 text-white border border-primary-400'
                          : 'bg-primary-50 text-primary-700 border border-primary-200'
                        : isDarkMode
                          ? 'bg-[#0f1729] text-gray-200 hover:bg-gray-800 border border-gray-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                    }`}
                  >
                    Más recientes
                  </button>
                  <button
                    onClick={() => setSortBy('old')}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                      sortBy === 'old'
                        ? isDarkMode
                          ? 'bg-primary-500/30 text-white border border-primary-400'
                          : 'bg-primary-50 text-primary-700 border border-primary-200'
                        : isDarkMode
                          ? 'bg-[#0f1729] text-gray-200 hover:bg-gray-800 border border-gray-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                    }`}
                  >
                    Más antiguos
                  </button>
                  <button
                    onClick={() => setSortBy('frequent')}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                      sortBy === 'frequent'
                        ? isDarkMode
                          ? 'bg-primary-500/30 text-white border border-primary-400'
                          : 'bg-primary-50 text-primary-700 border border-primary-200'
                        : isDarkMode
                          ? 'bg-[#0f1729] text-gray-200 hover:bg-gray-800 border border-gray-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                    }`}
                  >
                    Más frecuente
                  </button>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-600'}`}>
                    Total: <span className="font-medium text-white">{cantones.length}</span> cantones
                  </div>
                  {isAdmin && (
                    <button
                      className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                        isDarkMode
                          ? 'bg-[#0f1729] text-gray-300 hover:bg-gray-800 border border-gray-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                      }`}
                    >
                      <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Exportar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal con scroll totalmente invisible */}
        <main 
          className={`flex-1 overflow-y-auto no-scrollbar ${isDarkMode ? 'bg-[#0f1729]' : 'bg-gray-50'}`}
          style={{
            WebkitOverflowScrolling: 'touch',
            msOverflowStyle: 'none',
            scrollbarWidth: 'none'
          }}
        >
          <div className="max-w-7xl mx-auto pl-0 pr-4 sm:pr-6 lg:pr-8 py-6 no-scrollbar">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
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
                <div className={`text-center px-6 ${
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
        </main>
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
          <Dialog.Panel className={`w-full max-w-md transform overflow-hidden rounded-2xl p-6 text-left align-middle shadow-xl transition-all ${
            isDarkMode 
              ? 'bg-[#1a2234] border border-gray-700/50' 
              : 'bg-white border border-gray-200'
          }`}>
            <div className="flex items-center gap-4">
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
                  ¿Está seguro de eliminar el cantón {cantonToDelete?.nombre}? Esta acción no se puede deshacer.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-red-500/20 hover:bg-red-500/30 text-white border border-red-500/30'
                    : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                }`}
              >
                Eliminar
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
};

export default CantonesPage;
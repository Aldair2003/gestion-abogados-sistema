import React, { useState, useEffect, useCallback } from 'react';
import { Dialog } from '@headlessui/react';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import Select, { StylesConfig, CSSObjectWithLabel } from 'react-select';
import { getApiUrl } from '../../utils/urls';

interface Canton {
  id: number;
  nombre: string;
}

interface SelectOption {
  value: number;
  label: string;
}

interface Juez {
  id: number;
  nombre: string;
  secretario?: string;
  isActive: boolean;
  createdAt: string;
  cantones: {
    canton: Canton;
  }[];
}

interface JuecesModalProps {
  isOpen: boolean;
  onClose: () => void;
  cantonId: number;
  cantonNombre: string;
  onJuecesUpdate?: (total: number) => void;
}

const JuecesModal: React.FC<JuecesModalProps> = ({
  isOpen,
  onClose,
  cantonId,
  cantonNombre,
  onJuecesUpdate,
}) => {
  const { isDarkMode } = useTheme();
  const { token, user } = useAuth();
  const [jueces, setJueces] = useState<Juez[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [nombreJuez, setNombreJuez] = useState('');
  const [secretarioJuez, setSecretarioJuez] = useState('');
  const [editingJuez, setEditingJuez] = useState<Juez | null>(null);
  const [cantones, setCantones] = useState<Canton[]>([]);
  const [selectedCantones, setSelectedCantones] = useState<Canton[]>([]);
  const [isLoadingCantones, setIsLoadingCantones] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [juezToDelete, setJuezToDelete] = useState<Juez | null>(null);

  // Configurar axios
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [token]);

  // Cargar cantones disponibles
  const fetchCantones = useCallback(async () => {
    try {
      setIsLoadingCantones(true);
      const response = await axios.get(getApiUrl('/cantones'));
      if (response.data?.data?.cantones) {
        setCantones(response.data.data.cantones);
      }
    } catch (error) {
      console.error('Error al cargar cantones:', error);
      toast.error('Error al cargar los cantones');
    } finally {
      setIsLoadingCantones(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchCantones();
    }
  }, [isOpen, fetchCantones]);

  // Cargar jueces del cantón
  const fetchJueces = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(getApiUrl(`/cantones/${cantonId}/jueces`));
      console.log('Respuesta de jueces:', response.data);
      
      if (response.data?.data) {
        // Verificar si los jueces tienen el campo secretario
        const juecesData = response.data.data;
        console.log('Datos de jueces recibidos:', juecesData);
        
        setJueces(juecesData);
        onJuecesUpdate?.(juecesData.length);
      }
    } catch (error) {
      console.error('Error al cargar jueces:', error);
      toast.error('Error al cargar los jueces');
    } finally {
      setIsLoading(false);
    }
  }, [cantonId, onJuecesUpdate]);

  useEffect(() => {
    if (isOpen && cantonId) {
      fetchJueces();
    }
  }, [isOpen, cantonId, fetchJueces]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const cantonesIds = selectedCantones.map(c => Number(c.id));
      
      // Agregar logs para depuración
      console.log('Datos a enviar:', {
        nombre: nombreJuez,
        secretario: secretarioJuez,
        cantones: cantonesIds
      });
      
      if (editingJuez) {
        // Actualizar juez existente
        const url = getApiUrl(`/jueces/${editingJuez.id}`);
        console.log('URL para actualizar juez:', url);
        
        const response = await axios.put(url, {
          nombre: nombreJuez,
          secretario: secretarioJuez,
          cantones: cantonesIds
        });
        
        console.log('Respuesta de actualización:', response.data);
        
        toast.success('Juez actualizado correctamente');
        
        // Actualizar la lista completa para obtener los datos actualizados
        fetchJueces();
      } else {
        // Crear nuevo juez
        const url = getApiUrl(`/cantones/${cantonId}/jueces`);
        console.log('URL para crear juez:', url);
        
        const response = await axios.post(url, {
          nombre: nombreJuez,
          secretario: secretarioJuez,
          cantones: cantonesIds
        });
        
        console.log('Respuesta de creación:', response.data);
        
        toast.success('Juez agregado correctamente');
        
        // Actualizar la lista completa para obtener el ID correcto
        fetchJueces();
      }
      
      // Limpiar formulario
      setNombreJuez('');
      setSecretarioJuez('');
      setSelectedCantones([]);
      setShowAddForm(false);
      setEditingJuez(null);
      
    } catch (error) {
      console.error('Error al guardar juez:', error);
      toast.error('Error al guardar el juez');
    }
  };

  const handleEdit = (juez: Juez) => {
    setEditingJuez(juez);
    setNombreJuez(juez.nombre);
    setSecretarioJuez(juez.secretario || '');
    setSelectedCantones(juez.cantones.map(c => c.canton));
    setShowAddForm(true);
  };

  const handleDelete = async (juez: Juez) => {
    setJuezToDelete(juez);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!juezToDelete) return;
    
    try {
      const url = getApiUrl(`/cantones/${cantonId}/jueces/${juezToDelete.id}`);
      console.log('URL para eliminar juez:', url);
      await axios.delete(url);
      toast.success('Juez eliminado del cantón exitosamente');
      fetchJueces();
      setShowDeleteConfirm(false);
      setJuezToDelete(null);
    } catch (error: any) {
      console.error('Error al eliminar juez:', error);
      if (axios.isAxiosError(error)) {
        console.error('Detalles del error:', {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers,
          message: error.message,
          code: error.code,
          config: error.config
        });
      }
      toast.error(error.response?.data?.message || 'Error al eliminar el juez');
    }
  };

  const selectStyles: StylesConfig<SelectOption, true> = {
    control: (baseStyles: CSSObjectWithLabel) => ({
      ...baseStyles,
      backgroundColor: isDarkMode ? '#1a2234' : 'white',
      borderColor: isDarkMode ? '#374151' : '#D1D5DB',
    }),
    menu: (baseStyles: CSSObjectWithLabel) => ({
      ...baseStyles,
      backgroundColor: isDarkMode ? '#1a2234' : 'white',
    }),
    option: (baseStyles: CSSObjectWithLabel, { isFocused }: { isFocused: boolean }) => ({
      ...baseStyles,
      backgroundColor: isDarkMode 
        ? isFocused 
          ? '#374151' 
          : '#1a2234'
        : isFocused
          ? '#F3F4F6'
          : 'white',
      color: isDarkMode ? 'white' : '#111827',
    }),
    multiValue: (baseStyles: CSSObjectWithLabel) => ({
      ...baseStyles,
      backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
    }),
    multiValueLabel: (baseStyles: CSSObjectWithLabel) => ({
      ...baseStyles,
      color: isDarkMode ? 'white' : '#111827',
    }),
    multiValueRemove: (baseStyles: CSSObjectWithLabel) => ({
      ...baseStyles,
      color: isDarkMode ? 'white' : '#4B5563',
      ':hover': {
        backgroundColor: isDarkMode ? '#4B5563' : '#E5E7EB',
        color: isDarkMode ? 'white' : '#111827',
      },
    }),
  };

  return (
    <>
      <Dialog 
        open={isOpen} 
        onClose={onClose}
        className="relative z-[9000]"
      >
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[8999]" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-start justify-center p-4 z-[9000] overflow-y-auto">
          <Dialog.Panel className={`w-full max-w-3xl rounded-2xl transform transition-all ${
            isDarkMode 
              ? 'bg-[#1a2234] border border-gray-700/50' 
              : 'bg-white border border-gray-200'
          } shadow-2xl my-4 sm:my-8 mx-auto overflow-hidden max-h-[90vh] flex flex-col`}>
            {/* Header - Fijo en la parte superior */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700/50 bg-opacity-90 backdrop-blur-sm sticky top-0 z-10">
              <div>
                <Dialog.Title className={`text-base sm:text-lg font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Jueces de {cantonNombre}
                </Dialog.Title>
                <p className={`mt-1 text-xs sm:text-sm ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Gestiona los jueces asignados a este cantón
                </p>
              </div>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'hover:bg-gray-700/50 text-gray-300 hover:text-white' 
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                }`}
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Content - Desplazable */}
            <div className="p-4 sm:p-6 overflow-y-auto">
              {/* Toolbar */}
              {user?.rol === 'ADMIN' && (
                <div className="mb-4 sm:mb-6">
                  <button
                    onClick={() => {
                      setShowAddForm(true);
                      setEditingJuez(null);
                      setNombreJuez('');
                      setSecretarioJuez('');
                      setSelectedCantones([{ id: cantonId, nombre: cantonNombre }]);
                    }}
                    className={`inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-sm font-medium transition-colors ${
                      isDarkMode
                        ? 'bg-primary-500/20 hover:bg-primary-500/30 text-white border border-primary-500/30'
                        : 'bg-primary-50 hover:bg-primary-100 text-primary-700 border border-primary-200'
                    }`}
                  >
                    <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                    <span>Agregar Juez</span>
                  </button>
                </div>
              )}

              {/* Form */}
              {showAddForm && (
                <form onSubmit={handleSubmit} className="mb-4 sm:mb-6">
                  <div className={`p-3 sm:p-4 rounded-lg ${
                    isDarkMode 
                      ? 'bg-[#0f1729] border border-gray-700/50' 
                      : 'bg-gray-50 border border-gray-200'
                  }`}>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <label 
                            htmlFor="nombreJuez" 
                            className={`block text-xs sm:text-sm font-medium mb-1 ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}
                          >
                            Nombre del juez
                          </label>
                          <input
                            id="nombreJuez"
                            type="text"
                            value={nombreJuez}
                            onChange={(e) => setNombreJuez(e.target.value)}
                            placeholder="Nombre del juez"
                            className={`w-full px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border text-sm transition-colors ${
                              isDarkMode
                                ? 'bg-[#1a2234] border-gray-700 text-white placeholder-gray-400 focus:border-primary-500'
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-primary-500'
                            }`}
                            required
                          />
                        </div>
                        
                        <div>
                          <label 
                            htmlFor="secretarioJuez" 
                            className={`block text-xs sm:text-sm font-medium mb-1 ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}
                          >
                            Nombre del secretario
                          </label>
                          <input
                            id="secretarioJuez"
                            type="text"
                            value={secretarioJuez}
                            onChange={(e) => setSecretarioJuez(e.target.value)}
                            placeholder="Nombre del secretario"
                            className={`w-full px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border text-sm transition-colors ${
                              isDarkMode
                                ? 'bg-[#1a2234] border-gray-700 text-white placeholder-gray-400 focus:border-primary-500'
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-primary-500'
                            }`}
                          />
                        </div>
                      </div>

                      <div>
                        <label 
                          htmlFor="cantones" 
                          className={`block text-xs sm:text-sm font-medium mb-1 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}
                        >
                          Cantones asignados
                        </label>
                        {isLoadingCantones ? (
                          <div className="flex justify-center py-2">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                          </div>
                        ) : (
                          <Select
                            id="cantones"
                            isMulti
                            value={selectedCantones?.map(canton => ({
                              value: Number(canton.id),
                              label: canton.nombre
                            })) || []}
                            onChange={(selected: readonly SelectOption[]) => {
                              setSelectedCantones(
                                selected.map(option => ({
                                  id: option.value,
                                  nombre: option.label
                                }))
                              );
                            }}
                            options={cantones?.map(canton => ({
                              value: Number(canton.id),
                              label: canton.nombre
                            })) || []}
                            className="react-select-container"
                            classNamePrefix="react-select"
                            placeholder="Seleccionar cantones..."
                            styles={selectStyles}
                          />
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 sm:gap-4 mt-3 sm:mt-4">
                        <button
                          type="submit"
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isDarkMode
                              ? 'bg-primary-500 hover:bg-primary-600 text-white'
                              : 'bg-primary-600 hover:bg-primary-700 text-white'
                          }`}
                        >
                          {editingJuez ? 'Actualizar' : 'Agregar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddForm(false);
                            setEditingJuez(null);
                            setNombreJuez('');
                            setSecretarioJuez('');
                            setSelectedCantones([]);
                          }}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isDarkMode
                              ? 'bg-gray-700/50 hover:bg-gray-700 text-gray-300'
                              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                          }`}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              )}

              {/* Table */}
              <div className={`rounded-lg border ${
                isDarkMode ? 'border-gray-700/50' : 'border-gray-200'
              } overflow-x-auto`}>
                {/* Versión para pantallas medianas y grandes */}
                <div className="hidden md:block">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700/50">
                    <thead className={isDarkMode ? 'bg-[#0f1729]' : 'bg-gray-50'}>
                      <tr>
                        <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-500'
                        }`}>
                          Nombre
                        </th>
                        <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-500'
                        }`}>
                          Secretario
                        </th>
                        <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-500'
                        }`}>
                          Cantones Asignados
                        </th>
                        <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-500'
                        }`}>
                          Fecha de Asignación
                        </th>
                        {user?.rol === 'ADMIN' && (
                          <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Acciones</span>
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${
                      isDarkMode ? 'divide-gray-700/50' : 'divide-gray-200'
                    }`}>
                      {isLoading ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center">
                            <div className="flex justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                            </div>
                          </td>
                        </tr>
                      ) : jueces.length === 0 ? (
                        <tr>
                          <td 
                            colSpan={5} 
                            className={`px-6 py-4 text-sm text-center ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-500'
                            }`}
                          >
                            No hay jueces asignados a este cantón
                          </td>
                        </tr>
                      ) : (
                        jueces.map((juez) => (
                          <tr key={juez.id} className={isDarkMode ? 'bg-[#1a2234] hover:bg-[#1e2738]' : 'bg-white hover:bg-gray-50'}>
                            <td className={`px-6 py-4 text-sm ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {juez.nombre}
                            </td>
                            <td className={`px-6 py-4 text-sm ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-500'
                            }`}>
                              {juez.secretario || '-'}
                            </td>
                            <td className={`px-6 py-4 text-sm ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-500'
                            }`}>
                              {juez.cantones?.map(c => c.canton.nombre).join(', ') || ''}
                            </td>
                            <td className={`px-6 py-4 text-sm ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-500'
                            }`}>
                              {new Date(juez.createdAt).toLocaleDateString()}
                            </td>
                            {user?.rol === 'ADMIN' && (
                              <td className="px-6 py-4 text-right text-sm font-medium">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => handleEdit(juez)}
                                    className={`p-1.5 rounded-lg transition-colors ${
                                      isDarkMode
                                        ? 'hover:bg-gray-700/50 text-gray-300 hover:text-primary-400'
                                        : 'hover:bg-gray-100 text-gray-500 hover:text-primary-600'
                                    }`}
                                  >
                                    <PencilIcon className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(juez)}
                                    className={`p-1.5 rounded-lg transition-colors ${
                                      isDarkMode
                                        ? 'hover:bg-gray-700/50 text-gray-300 hover:text-red-400'
                                        : 'hover:bg-gray-100 text-gray-500 hover:text-red-600'
                                    }`}
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Versión para pantallas pequeñas (móviles) */}
                <div className="md:hidden">
                  {isLoading ? (
                    <div className="p-4 flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                    </div>
                  ) : jueces.length === 0 ? (
                    <div className={`p-4 text-sm text-center ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      No hay jueces asignados a este cantón
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700/50">
                      {jueces.map((juez) => (
                        <div key={juez.id} className={`p-4 ${
                          isDarkMode ? 'bg-[#1a2234] hover:bg-[#1e2738]' : 'bg-white hover:bg-gray-50'
                        }`}>
                          <div className="flex justify-between items-start mb-2">
                            <div className={`font-medium ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {juez.nombre}
                            </div>
                            {user?.rol === 'ADMIN' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEdit(juez)}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    isDarkMode
                                      ? 'hover:bg-gray-700/50 text-gray-300 hover:text-primary-400'
                                      : 'hover:bg-gray-100 text-gray-500 hover:text-primary-600'
                                  }`}
                                >
                                  <PencilIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(juez)}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    isDarkMode
                                      ? 'hover:bg-gray-700/50 text-gray-300 hover:text-red-400'
                                      : 'hover:bg-gray-100 text-gray-500 hover:text-red-600'
                                  }`}
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 gap-1 text-sm">
                            <div className={`${
                              isDarkMode ? 'text-gray-300' : 'text-gray-500'
                            }`}>
                              <span className="font-medium">Secretario:</span> {juez.secretario || '-'}
                            </div>
                            <div className={`${
                              isDarkMode ? 'text-gray-300' : 'text-gray-500'
                            }`}>
                              <span className="font-medium">Cantones:</span> {juez.cantones?.map(c => c.canton.nombre).join(', ') || ''}
                            </div>
                            <div className={`${
                              isDarkMode ? 'text-gray-300' : 'text-gray-500'
                            }`}>
                              <span className="font-medium">Fecha:</span> {new Date(juez.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Diálogo de confirmación de eliminación */}
      <Dialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        className="relative z-[9001]"
      >
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className={`w-full max-w-xs sm:max-w-md transform overflow-hidden rounded-2xl p-3 sm:p-4 text-left align-middle shadow-xl transition-all ${
            isDarkMode 
              ? 'bg-[#1a2234] border border-gray-700/50' 
              : 'bg-white border border-gray-200'
          }`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
              <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                isDarkMode ? 'bg-red-500/10' : 'bg-red-100'
              }`}>
                <ExclamationTriangleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
              </div>
              <div>
                <Dialog.Title className={`text-sm sm:text-base font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Confirmar eliminación
                </Dialog.Title>
                <p className={`mt-0.5 sm:mt-1 text-xs sm:text-sm ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  ¿Está seguro de eliminar al juez {juezToDelete?.nombre} del cantón {cantonNombre}?
                </p>
              </div>
            </div>

            <div className="mt-3 sm:mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
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
                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
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

export default JuecesModal; 
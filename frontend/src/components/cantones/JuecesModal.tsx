import React, { useState, useEffect, useCallback } from 'react';
import { Dialog } from '@headlessui/react';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import Select, { StylesConfig, CSSObjectWithLabel } from 'react-select';

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
      const response = await axios.get('/api/cantones');
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
      const response = await axios.get(`/api/cantones/${cantonId}/jueces`);
      if (response.data?.data) {
        setJueces(response.data.data);
        onJuecesUpdate?.(response.data.data.length);
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
      let response;
      
      if (editingJuez) {
        response = await axios.put(`/api/jueces/${editingJuez.id}`, { 
          nombre: nombreJuez,
          cantones: cantonesIds
        });
        toast.success('Juez actualizado exitosamente');
      } else {
        response = await axios.post(`/api/cantones/${cantonId}/jueces`, { 
          nombre: nombreJuez,
          cantones: cantonesIds
        });
        toast.success('Juez agregado exitosamente');
      }

      // Actualizar el contador inmediatamente si el juez está asignado a este cantón
      if (cantonesIds.includes(Number(cantonId))) {
        const currentJueces = [...jueces];
        if (!editingJuez) {
          // Si es un nuevo juez, agregarlo a la lista
          currentJueces.push({
            ...response.data.data,
            cantones: selectedCantones.map(canton => ({ canton }))
          });
        } else {
          // Si es una edición, actualizar el juez existente
          const index = currentJueces.findIndex(j => j.id === editingJuez.id);
          if (index !== -1) {
            currentJueces[index] = {
              ...response.data.data,
              cantones: selectedCantones.map(canton => ({ canton }))
            };
          }
        }
        setJueces(currentJueces);
        onJuecesUpdate?.(currentJueces.length);
      }

      setNombreJuez('');
      setShowAddForm(false);
      setEditingJuez(null);
      setSelectedCantones([]);
      fetchJueces(); // Actualizar la lista completa
    } catch (error: any) {
      console.error('Error al guardar juez:', error);
      toast.error(error.response?.data?.message || 'Error al guardar el juez');
    }
  };

  const handleEdit = (juez: Juez) => {
    setEditingJuez(juez);
    setNombreJuez(juez.nombre);
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
      await axios.delete(`/api/cantones/${cantonId}/jueces/${juezToDelete.id}`);
      toast.success('Juez eliminado del cantón exitosamente');
      fetchJueces();
      setShowDeleteConfirm(false);
      setJuezToDelete(null);
    } catch (error: any) {
      console.error('Error al eliminar juez:', error);
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
        
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[9000] overflow-y-auto">
          <Dialog.Panel className={`w-full max-w-3xl rounded-2xl transform transition-all ${
            isDarkMode 
              ? 'bg-[#1a2234] border border-gray-700/50' 
              : 'bg-white border border-gray-200'
          } shadow-2xl my-8 mx-auto`}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700/50">
              <div>
                <Dialog.Title className={`text-lg font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Jueces de {cantonNombre}
                </Dialog.Title>
                <p className={`mt-1 text-sm ${
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

            {/* Content */}
            <div className="p-6">
              {/* Toolbar */}
              {user?.rol === 'ADMIN' && (
                <div className="mb-6">
                  <button
                    onClick={() => {
                      setShowAddForm(true);
                      setEditingJuez(null);
                      setNombreJuez('');
                      setSelectedCantones([{ id: cantonId, nombre: cantonNombre }]);
                    }}
                    className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isDarkMode
                        ? 'bg-primary-500/20 hover:bg-primary-500/30 text-white border border-primary-500/30'
                        : 'bg-primary-50 hover:bg-primary-100 text-primary-700 border border-primary-200'
                    }`}
                  >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Agregar Juez
                  </button>
                </div>
              )}

              {/* Form */}
              {showAddForm && (
                <form onSubmit={handleSubmit} className="mb-6">
                  <div className={`p-4 rounded-lg ${
                    isDarkMode 
                      ? 'bg-[#0f1729] border border-gray-700/50' 
                      : 'bg-gray-50 border border-gray-200'
                  }`}>
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={nombreJuez}
                        onChange={(e) => setNombreJuez(e.target.value)}
                        placeholder="Nombre del juez"
                        className={`w-full px-4 py-2 rounded-lg border text-sm transition-colors ${
                          isDarkMode
                            ? 'bg-[#1a2234] border-gray-700 text-white placeholder-gray-400 focus:border-primary-500'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-primary-500'
                        }`}
                        required
                      />
                      
                      {isLoadingCantones ? (
                        <div className="flex justify-center py-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                        </div>
                      ) : (
                        <Select
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

                      <div className="flex gap-4">
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
              }`}>
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
                        <td colSpan={4} className="px-6 py-4 text-center">
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                          </div>
                        </td>
                      </tr>
                    ) : jueces.length === 0 ? (
                      <tr>
                        <td 
                          colSpan={4} 
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
                  ¿Está seguro de eliminar al juez {juezToDelete?.nombre} del cantón {cantonNombre}?
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

export default JuecesModal; 
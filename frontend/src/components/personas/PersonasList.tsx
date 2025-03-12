import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { personaService, Persona } from '../../services/personaService';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import personasIcon from '../../assets/personasicon.png';
import iconoListaPerson from '../../assets/ICONOLISTAPERSON.png';
import { 
  ExclamationTriangleIcon,
  DocumentTextIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import ArrowPathIcon from '../icons/ArrowPathIcon';

import { PhoneIcon, EnvelopeIcon, HomeIcon } from '../icons/ContactIcons';
import { FunnelIcon } from '../icons/FilterIcons';
import { ChevronDownIcon, AdjustmentsVerticalIcon } from '../icons/CustomIcons';
import PersonaFormModal from './PersonaFormModal';
import DocumentosModal from './DocumentosModal';
import { CreateUserIcon } from '../icons/CustomIcons';
import { CalendarIcon } from '../icons/CustomIcons';
import { Dialog } from '@headlessui/react';
import { ConfirmationModal } from '../common/ConfirmationModal';

interface PersonasListProps {
  cantonId: string;
  searchTerm?: string;
  cantonNombre: string;
  cantonCodigo: string;
  onSearchChange?: (term: string) => void;
}

const PersonasList: React.FC<PersonasListProps> = ({ 
  cantonId, 
  searchTerm = '',
  cantonNombre,
  cantonCodigo,
  onSearchChange
}) => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [isDocumentosModalOpen, setIsDocumentosModalOpen] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [showFilters, setShowFilters] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [personaToDelete, setPersonaToDelete] = useState<Persona | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [personaToEdit, setPersonaToEdit] = useState<Persona | null>(null);
  const [needsRefresh, setNeedsRefresh] = useState(false);

  const isAdmin = user?.rol === 'ADMIN';

  const fetchPersonas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('=== Inicio fetchPersonas en PersonasList ===');
      console.log('cantonId recibido:', cantonId);
      
      if (!cantonId || isNaN(Number(cantonId))) {
        console.error('ID de cantón inválido:', cantonId);
        setError('ID de cantón inválido');
        return;
      }

      console.log('Llamando a getPersonasByCanton...');
      const response = await personaService.getPersonasByCanton(cantonId);
      console.log('Respuesta recibida:', response);
      
      if (response.status === 'success' && response.data?.personas) {
        console.log('Personas obtenidas:', response.data.personas);
        setPersonas(response.data.personas);
      } else {
        console.error('Respuesta sin datos de personas:', response);
        setError('No se pudieron cargar las personas');
      }
    } catch (error: any) {
      console.error('Error al cargar personas:', error);
      setError(error.message || 'Error al cargar la lista de personas');
      toast.error(error.message || 'Error al cargar la lista de personas');
    } finally {
      setLoading(false);
      console.log('=== Fin fetchPersonas en PersonasList ===');
    }
  }, [cantonId]);

  useEffect(() => {
    fetchPersonas();
  }, [fetchPersonas]);

  // Manejar cambios en la búsqueda
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchTerm(value);
    onSearchChange?.(value);
  };

  // Filtrar personas según el término de búsqueda
  const filteredPersonas = personas.filter(persona => {
    if (!localSearchTerm) return true;
    
    const searchTermLower = localSearchTerm.toLowerCase();
    return (
      persona.cedula.toLowerCase().includes(searchTermLower) ||
      persona.nombres.toLowerCase().includes(searchTermLower) ||
      persona.apellidos.toLowerCase().includes(searchTermLower) ||
      persona.telefono.toLowerCase().includes(searchTermLower) ||
      (persona.email?.toLowerCase() || '').includes(searchTermLower) ||
      (persona.domicilio?.toLowerCase() || '').includes(searchTermLower)
    );
  });

  const handleEditPersona = (persona: Persona) => {
    if (!isAdmin && persona.creadorId?.toString() !== user?.id?.toString()) {
      toast.error('Solo puedes editar las personas que has creado');
      return;
    }
    console.log('Editando persona:', persona);
    setPersonaToEdit(persona);
    setIsEditModalOpen(true);
  };

  const handleDeletePersona = (persona: Persona) => {
    if (!isAdmin) {
      toast.error('Solo los administradores pueden eliminar personas');
      return;
    }
    setPersonaToDelete(persona);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!personaToDelete) return;
    
    try {
      await personaService.deletePersona(personaToDelete.id.toString());
      toast.success('Persona eliminada correctamente');
      fetchPersonas();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar la persona');
    } finally {
      setIsDeleteModalOpen(false);
      setPersonaToDelete(null);
    }
  };

  const handleViewDocuments = (persona: Persona) => {
    setSelectedPersona(persona);
    setIsDocumentosModalOpen(true);
  };

  const handleDocumentosModalClose = () => {
    setIsDocumentosModalOpen(false);
    if (needsRefresh) {
        fetchPersonas();
        setNeedsRefresh(false);
    }
    setTimeout(() => {
        setSelectedPersona(null);
    }, 300);
  };

  const handleDocumentosSuccess = () => {
    setNeedsRefresh(true);
  };

  const handleModalSuccess = () => {
    fetchPersonas();
  };

  const handlePersonaClick = (persona: Persona) => {
    navigate(`/proceso-impugnacion/${persona.id}`);
  };

  // Calcular estadísticas
  const totalPersonas = personas.length;
  const personasCompletas = personas.filter(p => p.documentosCompletos).length;
  const personasIncompletas = totalPersonas - personasCompletas;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Encabezado y Estadísticas */}
        <div className={`rounded-2xl shadow-sm overflow-hidden ${
          isDarkMode 
            ? 'bg-[#1a2234] border border-gray-700/50' 
            : 'bg-white border border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <img 
                src={personasIcon}
                alt="Cargando personas"
                className="w-32 h-32 opacity-50 animate-pulse"
              />
              <div>
                <h1 className={`text-2xl font-bold mb-1 ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-900'
                }`}>
                  {cantonNombre}
                </h1>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Administra las personas del cantón de manera eficiente.
                </p>
              </div>
            </div>
            <div className={`text-sm font-medium ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Código: {cantonCodigo}
            </div>
          </div>
        </div>
        <div className={`card-stats ${
          isDarkMode ? 'bg-[#1a2234] border border-gray-700/50' : 'bg-white border border-gray-200'
        }`}>
          <div className="grid grid-cols-3 gap-3">
            <div className={`p-3 rounded-lg ${
              isDarkMode 
                ? 'bg-[#1a2234] border border-gray-700/50' 
                : 'bg-white border border-gray-200'
            }`}>
              <p className={`text-[10px] uppercase tracking-wider font-medium ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Total
              </p>
              <p className={`text-2xl font-semibold ${
                isDarkMode ? 'text-gray-200' : 'text-gray-900'
              }`}>
                {totalPersonas}
              </p>
            </div>

            <div className={`p-3 rounded-lg ${
              isDarkMode 
                ? 'bg-[#1a2234] border border-gray-700/50' 
                : 'bg-white border border-gray-200'
            }`}>
              <p className={`text-[10px] uppercase tracking-wider font-medium ${
                isDarkMode ? 'text-green-400' : 'text-green-600'
              }`}>
                Completas
              </p>
              <p className={`text-2xl font-semibold ${
                isDarkMode ? 'text-green-400' : 'text-green-600'
              }`}>
                {personasCompletas}
              </p>
            </div>

            <div className={`p-3 rounded-lg ${
              isDarkMode 
                ? 'bg-[#1a2234] border border-gray-700/50' 
                : 'bg-white border border-gray-200'
            }`}>
              <p className={`text-[10px] uppercase tracking-wider font-medium ${
                isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
              }`}>
                Pendientes
              </p>
              <p className={`text-2xl font-semibold ${
                isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
              }`}>
                {personasIncompletas}
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2.5
                      bg-primary-500 dark:bg-primary-500
                      text-white font-medium rounded-xl
                      shadow-lg shadow-primary-500/20
                      hover:shadow-xl hover:shadow-primary-500/30
                      hover:bg-primary-600 dark:hover:bg-primary-600
                      transition-all duration-200"
          >
            <CreateUserIcon className="w-5 h-5 mr-2 text-white" />
            <span className="font-medium">Registrar Persona</span>
          </button>
        </div>
        <div className={`p-3 rounded-lg shadow-sm ${
          isDarkMode 
            ? 'bg-[#1a2234] border border-gray-700/50' 
            : 'bg-white border border-gray-200'
        }`}>
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className={`h-4 w-4 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-400'
                }`} />
              </div>
              <input
                type="text"
                placeholder="Buscar por cédula, teléfono o email..."
                className={`block w-full pl-9 pr-3 py-2 border rounded-lg text-sm transition-all duration-200 ${
                  isDarkMode 
                    ? 'bg-[#0f1729] border-gray-700/50 text-gray-200 placeholder-gray-500 focus:border-primary-500 focus:ring-primary-500/20' 
                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:ring-primary-500/20'
                }`}
                value={localSearchTerm}
                onChange={handleSearchChange}
              />
            </div>
            <button
              className={`p-2 rounded-lg border transition-all duration-200 ${
                isDarkMode
                  ? 'bg-[#0f1729] border-gray-700/50 text-gray-300'
                  : 'bg-gray-50 border-gray-300 text-gray-700'
              }`}
            >
              <FunnelIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className={`flex items-center justify-center h-64 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          <div className="text-center">
            <ArrowPathIcon className="h-10 w-10 mx-auto animate-spin mb-4" />
            <p className="text-lg">Cargando personas...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Encabezado y Estadísticas */}
        <div className={`rounded-2xl shadow-sm overflow-hidden ${
          isDarkMode 
            ? 'bg-[#1a2234] border border-gray-700/50' 
            : 'bg-white border border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <img 
                src={personasIcon}
                alt="No hay resultados"
                className="w-32 h-32 opacity-50"
              />
              <div>
                <h1 className={`text-2xl font-bold mb-1 ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-900'
                }`}>
                  {cantonNombre}
                </h1>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Administra las personas del cantón de manera eficiente.
                </p>
              </div>
            </div>
            <div className={`text-sm font-medium ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Código: {cantonCodigo}
            </div>
          </div>
        </div>
        <div className={`card-stats ${
          isDarkMode ? 'bg-[#1a2234] border border-gray-700/50' : 'bg-white border border-gray-200'
        }`}>
          <div className="grid grid-cols-3 gap-3">
            <div className={`p-3 rounded-lg ${
              isDarkMode 
                ? 'bg-[#1a2234] border border-gray-700/50' 
                : 'bg-white border border-gray-200'
            }`}>
              <p className={`text-[10px] uppercase tracking-wider font-medium ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Total
              </p>
              <p className={`text-2xl font-semibold ${
                isDarkMode ? 'text-gray-200' : 'text-gray-900'
              }`}>
                {totalPersonas}
              </p>
            </div>

            <div className={`p-3 rounded-lg ${
              isDarkMode 
                ? 'bg-[#1a2234] border border-gray-700/50' 
                : 'bg-white border border-gray-200'
            }`}>
              <p className={`text-[10px] uppercase tracking-wider font-medium ${
                isDarkMode ? 'text-green-400' : 'text-green-600'
              }`}>
                Completas
              </p>
              <p className={`text-2xl font-semibold ${
                isDarkMode ? 'text-green-400' : 'text-green-600'
              }`}>
                {personasCompletas}
              </p>
            </div>

            <div className={`p-3 rounded-lg ${
              isDarkMode 
                ? 'bg-[#1a2234] border border-gray-700/50' 
                : 'bg-white border border-gray-200'
            }`}>
              <p className={`text-[10px] uppercase tracking-wider font-medium ${
                isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
              }`}>
                Pendientes
              </p>
              <p className={`text-2xl font-semibold ${
                isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
              }`}>
                {personasIncompletas}
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2.5
                      bg-primary-500 dark:bg-primary-500
                      text-white font-medium rounded-xl
                      shadow-lg shadow-primary-500/20
                      hover:shadow-xl hover:shadow-primary-500/30
                      hover:bg-primary-600 dark:hover:bg-primary-600
                      transition-all duration-200"
          >
            <CreateUserIcon className="w-5 h-5 mr-2 text-white" />
            <span className="font-medium">Registrar Persona</span>
          </button>
        </div>
        <div className={`p-3 rounded-lg shadow-sm ${
          isDarkMode 
            ? 'bg-[#1a2234] border border-gray-700/50' 
            : 'bg-white border border-gray-200'
        }`}>
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className={`h-4 w-4 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-400'
                }`} />
              </div>
              <input
                type="text"
                placeholder="Buscar por cédula, teléfono o email..."
                className={`block w-full pl-9 pr-3 py-2 border rounded-lg text-sm transition-all duration-200 ${
                  isDarkMode 
                    ? 'bg-[#0f1729] border-gray-700/50 text-gray-200 placeholder-gray-500 focus:border-primary-500 focus:ring-primary-500/20' 
                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:ring-primary-500/20'
                }`}
                value={localSearchTerm}
                onChange={handleSearchChange}
              />
            </div>
            <button
              className={`p-2 rounded-lg border transition-all duration-200 ${
                isDarkMode
                  ? 'bg-[#0f1729] border-gray-700/50 text-gray-300'
                  : 'bg-gray-50 border-gray-300 text-gray-700'
              }`}
            >
              <FunnelIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className={`flex items-center justify-center h-64 ${
          isDarkMode ? 'text-red-400' : 'text-red-600'
        }`}>
          <div className="text-center">
            <ExclamationTriangleIcon className="h-10 w-10 mx-auto mb-4" />
            <p className="text-lg">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto -mt-8">
      <div className="space-y-2">
        {/* Encabezado con título e información */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl"></div>
              <div className={`relative w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden ${
                isDarkMode 
                  ? 'bg-[#1a2234] ring-1 ring-white/10' 
                  : 'bg-white ring-1 ring-black/5 shadow-xl shadow-gray-200/20'
              }`}>
                <img 
                  src={personasIcon}
                  alt="Cantón" 
                  className="w-16 h-16 object-contain"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-2xl font-bold ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-900'
                }`}>
                  {cantonNombre}
                </h1>
                <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  isDarkMode 
                    ? 'bg-[#1a2234] text-gray-300 border border-gray-700/50' 
                    : 'bg-white text-gray-600 border border-gray-200 shadow-sm'
                }`}>
                  Código: {cantonCodigo}
                </div>
              </div>
              <p className={`text-sm mt-1 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Administra las personas del cantón de manera eficiente.
              </p>
            </div>
          </div>
        </div>

        {/* Card de estadísticas y botón de registro */}
        <div className="flex items-center gap-3">
          <div className="grid grid-cols-3 gap-3 flex-1">
            <div className={`p-3 rounded-lg ${
              isDarkMode 
                ? 'bg-[#1a2234] border border-gray-700/50' 
                : 'bg-white border border-gray-200'
            }`}>
              <p className={`text-[10px] uppercase tracking-wider font-medium ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Total
              </p>
              <p className={`text-2xl font-semibold ${
                isDarkMode ? 'text-gray-200' : 'text-gray-900'
              }`}>
                {totalPersonas}
              </p>
            </div>

            <div className={`p-3 rounded-lg ${
              isDarkMode 
                ? 'bg-[#1a2234] border border-gray-700/50' 
                : 'bg-white border border-gray-200'
            }`}>
              <p className={`text-[10px] uppercase tracking-wider font-medium ${
                isDarkMode ? 'text-green-400' : 'text-green-600'
              }`}>
                Completas
              </p>
              <p className={`text-2xl font-semibold ${
                isDarkMode ? 'text-green-400' : 'text-green-600'
              }`}>
                {personasCompletas}
              </p>
            </div>

            <div className={`p-3 rounded-lg ${
              isDarkMode 
                ? 'bg-[#1a2234] border border-gray-700/50' 
                : 'bg-white border border-gray-200'
            }`}>
              <p className={`text-[10px] uppercase tracking-wider font-medium ${
                isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
              }`}>
                Pendientes
              </p>
              <p className={`text-2xl font-semibold ${
                isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
              }`}>
                {personasIncompletas}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2.5
                      bg-primary-500 dark:bg-primary-500
                      text-white font-medium rounded-xl
                      shadow-lg shadow-primary-500/20
                      hover:shadow-xl hover:shadow-primary-500/30
                      hover:bg-primary-600 dark:hover:bg-primary-600
                      transition-all duration-200"
          >
            <CreateUserIcon className="w-5 h-5 mr-2 text-white" />
            <span className="font-medium">Registrar Persona</span>
          </button>
        </div>

        {/* Barra de búsqueda y filtros */}
        <div className={`space-y-4 ${
          isDarkMode ? 'text-gray-200' : 'text-gray-900'
        }`}>
          <div className={`p-4 rounded-xl shadow-sm ${
            isDarkMode 
              ? 'bg-[#1a2234] border border-gray-700/50' 
              : 'bg-white border border-gray-200'
          }`}>
            {/* Barra de búsqueda principal */}
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar por cédula, teléfono o email..."
                  className={`block w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-[#0f1729] border-gray-700/50 text-gray-200 placeholder-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20' 
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
                  }`}
                  value={localSearchTerm}
                  onChange={handleSearchChange}
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2.5 rounded-xl border transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  isDarkMode
                    ? 'bg-[#0f1729] border-gray-700/50 text-gray-300'
                    : 'bg-white border-gray-300 text-gray-700'
                } ${showFilters ? 'ring-2 ring-primary-500/20 border-primary-500' : ''}`}
              >
                <AdjustmentsVerticalIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Panel de filtros */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700/50">
                    {/* Filtro por estado documental */}
                    <div>
                      <label className={`block text-sm font-medium mb-1.5 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Estado Documental
                      </label>
                      <div className="relative">
                        <select
                          className={`block w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm transition-all duration-200 appearance-none ${
                            isDarkMode 
                              ? 'bg-[#0f1729] border-gray-700/50 text-gray-200' 
                              : 'bg-gray-50 border-gray-300 text-gray-900'
                          } focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20`}
                        >
                          <option value="">Todos</option>
                          <option value="complete">Documentos Completos</option>
                          <option value="incomplete">Documentos Pendientes</option>
                        </select>
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    </div>

                    {/* Filtro por fecha de registro */}
                    <div>
                      <label className={`block text-sm font-medium mb-1.5 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Fecha de Registro
                      </label>
                      <div className="relative">
                        <select
                          className={`block w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm transition-all duration-200 appearance-none ${
                            isDarkMode 
                              ? 'bg-[#0f1729] border-gray-700/50 text-gray-200' 
                              : 'bg-gray-50 border-gray-300 text-gray-900'
                          } focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20`}
                        >
                          <option value="">Cualquier fecha</option>
                          <option value="today">Hoy</option>
                          <option value="week">Esta semana</option>
                          <option value="month">Este mes</option>
                          <option value="year">Este año</option>
                        </select>
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <CalendarIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    </div>

                    {/* Ordenar por */}
                    <div>
                      <label className={`block text-sm font-medium mb-1.5 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Ordenar por
                      </label>
                      <div className="relative">
                        <select
                          className={`block w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm transition-all duration-200 appearance-none ${
                            isDarkMode 
                              ? 'bg-[#0f1729] border-gray-700/50 text-gray-200' 
                              : 'bg-gray-50 border-gray-300 text-gray-900'
                          } focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20`}
                        >
                          <option value="recent">Más recientes</option>
                          <option value="cedula">Cédula</option>
                          <option value="name">Nombre</option>
                          <option value="docs">Estado documental</option>
                        </select>
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <AdjustmentsVerticalIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Lista de personas */}
        {filteredPersonas.length > 0 ? (
          <div className={`space-y-4 ${
            isDarkMode 
              ? 'bg-transparent' 
              : 'bg-transparent'
          }`}>
            <div className="grid grid-cols-1 gap-4">
              {filteredPersonas.map((persona) => (
                <div 
                  key={persona.id}
                  onClick={() => handlePersonaClick(persona)}
                  className={`relative rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer ${
                    isDarkMode 
                      ? 'bg-[#1a2234] border border-gray-700/50 hover:bg-[#1f2943]' 
                      : 'bg-white border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {/* Indicador de estado */}
                  <div className={`absolute left-0 top-0 w-1 h-full ${
                    persona.documentosCompletos 
                      ? 'bg-green-500' 
                      : 'bg-yellow-500'
                  }`} />

                  <div className="p-6">
                    <div className="flex items-center justify-between pl-4">
                      <div className="flex items-center space-x-4">
                        <div className={`relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden ${
                          isDarkMode
                            ? 'bg-[#0f1729] shadow-inner'
                            : 'bg-gray-100'
                        }`}>
                          <img 
                            src={iconoListaPerson}
                            alt="Persona"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h3 className={`text-lg font-bold mb-1 ${
                            isDarkMode ? 'text-gray-100' : 'text-gray-900'
                          }`}>
                            {persona.nombres} {persona.apellidos}
                          </h3>
                          <div className="flex items-center space-x-3">
                            <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                              isDarkMode 
                                ? 'bg-[#0f1729] text-gray-300' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              <span className="mr-1">CI:</span>
                              {persona.cedula}
                            </div>
                            <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                              persona.documentosCompletos
                                ? isDarkMode 
                                  ? 'bg-green-500/10 text-green-400' 
                                  : 'bg-green-50 text-green-700'
                                : isDarkMode
                                  ? 'bg-yellow-500/10 text-yellow-400'
                                  : 'bg-yellow-50 text-yellow-700'
                            }`}>
                              {persona.documentosCompletos ? 'Documentos Completos' : 'Documentos Pendientes'}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewDocuments(persona)}
                          className={`p-2.5 rounded-xl transition-all duration-200 ${
                            isDarkMode
                              ? 'bg-[#0f1729] text-gray-300 hover:bg-gray-800 hover:text-primary-400'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-primary-600'
                          }`}
                          title="Ver documentos"
                        >
                          <DocumentTextIcon className="h-5 w-5" />
                        </button>

                        <button
                          onClick={() => handleEditPersona(persona)}
                          className={`p-2.5 rounded-xl transition-all duration-200 ${
                            isDarkMode
                              ? 'bg-[#0f1729] text-gray-300 hover:bg-gray-800 hover:text-blue-400'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-blue-600'
                          }`}
                          title="Editar persona"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>

                        <button
                          onClick={() => handleDeletePersona(persona)}
                          className={`p-2.5 rounded-xl transition-all duration-200 ${
                            isDarkMode
                              ? 'bg-[#0f1729] text-gray-300 hover:bg-gray-800 hover:text-red-400'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-red-600'
                          }`}
                          title="Eliminar persona"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 pl-20">
                      <div className={`flex items-center px-4 py-2.5 rounded-xl ${
                        isDarkMode 
                          ? 'bg-[#0f1729] text-gray-300' 
                          : 'bg-gray-50 text-gray-700'
                      }`}>
                        <PhoneIcon className="h-4 w-4 mr-3 flex-shrink-0" />
                        <span className="text-sm truncate">{persona.telefono}</span>
                      </div>
                      {persona.email && (
                        <div className={`flex items-center px-4 py-2.5 rounded-xl ${
                          isDarkMode 
                            ? 'bg-[#0f1729] text-gray-300' 
                            : 'bg-gray-50 text-gray-700'
                        }`}>
                          <EnvelopeIcon className="h-4 w-4 mr-3 flex-shrink-0" />
                          <span className="text-sm truncate">{persona.email}</span>
                        </div>
                      )}
                      {persona.domicilio && (
                        <div className={`flex items-center px-4 py-2.5 rounded-xl ${
                          isDarkMode 
                            ? 'bg-[#0f1729] text-gray-300' 
                            : 'bg-gray-50 text-gray-700'
                        }`}>
                          <HomeIcon className="h-4 w-4 mr-3 flex-shrink-0" />
                          <span className="text-sm truncate">{persona.domicilio}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={`flex items-center justify-center h-64 rounded-xl ${
            isDarkMode 
              ? 'bg-[#1a2234] border border-gray-700/50' 
              : 'bg-white border border-gray-200'
          }`}>
            <div className="text-center">
              <img 
                src={personasIcon}
                alt="No hay personas"
                className="w-32 h-32 opacity-50"
              />
              <p className={`text-lg ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                No se encontraron personas
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      <PersonaFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        cantonId={cantonId}
      />

      {selectedPersona && (
        <DocumentosModal
          isOpen={isDocumentosModalOpen}
          onClose={handleDocumentosModalClose}
          onSuccess={handleDocumentosSuccess}
          persona={selectedPersona}
        />
      )}

      {/* Modal de confirmación de eliminación */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setPersonaToDelete(null);
        }}
        onConfirm={() => {
          confirmDelete();
        }}
        title="Confirmar eliminación"
        message={
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-500/20">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <p className="text-center">
              ¿Está seguro que desea eliminar a {personaToDelete?.nombres} {personaToDelete?.apellidos}?<br/>
              <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                Esta acción no se puede deshacer.
              </span>
            </p>
          </div>
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
        preventClose={false}
      />

      {/* Modal de edición */}
      <PersonaFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          console.log('Cerrando modal de edición');
          setIsEditModalOpen(false);
          setPersonaToEdit(null);
        }}
        onSuccess={() => {
          console.log('Edición exitosa');
          fetchPersonas();
          setIsEditModalOpen(false);
          setPersonaToEdit(null);
        }}
        cantonId={cantonId}
        persona={personaToEdit}
      />
    </div>
  );
};

export default PersonasList; 
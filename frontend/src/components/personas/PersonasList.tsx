import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { personaService, Persona, FilterParams } from '../../services/personaService';
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
  MagnifyingGlassIcon,
  UsersIcon
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
import debounce from 'lodash/debounce';
import { permissionService } from '../../services/permissionService';
import api from '../../services/api';

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
  const [documentalFilter, setDocumentalFilter] = useState<'all' | 'complete' | 'incomplete'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [sortOption, setSortOption] = useState<'cedula' | 'apellidos' | 'documentosCompletos' | 'fecha_registro'>('fecha_registro');
  const [isFiltering, setIsFiltering] = useState(false);
  const [creatorNames, setCreatorNames] = useState<Record<string, string>>({});

  const isAdmin = user?.rol === 'ADMIN';

  const getDateRange = useMemo(() => (filter: string): { startDate?: string; endDate?: string } => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filter) {
      case 'today':
        return {
          startDate: today.toISOString(),
          endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
        };
      case 'week':
        const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return {
          startDate: weekStart.toISOString(),
          endDate: now.toISOString()
        };
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return {
          startDate: monthStart.toISOString(),
          endDate: now.toISOString()
        };
      default:
        return {};
    }
  }, []);

  const applyFilters = useCallback(async (searchValue: string = localSearchTerm) => {
    try {
      setIsFiltering(true);
      setError(null);

      const dateRange = getDateRange(dateFilter);
      const params: FilterParams = {
        ...dateRange,
        sortBy: sortOption === 'fecha_registro' ? 'createdAt' : sortOption,
        sortOrder: 'desc',
        search: searchValue.trim()
      };

      const response = await personaService.getPersonasByCanton(cantonId, params);
      
      if (response.status === 'success' && response.data?.personas) {
        const filteredPersonas = response.data.personas.filter(persona => {
          if (documentalFilter === 'complete') {
            return persona.documentosCompletos === true;
          } else if (documentalFilter === 'incomplete') {
            return persona.documentosCompletos === false;
          }
          return true;
        });

        setPersonas(filteredPersonas);
        setLoading(false);
      } else {
        setError('No se pudieron cargar las personas');
      }
    } catch (error: any) {
      console.error('Error al aplicar filtros:', error);
      setError(error.message || 'Error al filtrar la lista de personas');
      toast.error(error.message || 'Error al filtrar la lista de personas');
    } finally {
      setIsFiltering(false);
    }
  }, [cantonId, documentalFilter, dateFilter, sortOption, getDateRange]);

  const debouncedSearch = useMemo(
    () =>
      debounce((term: string) => {
        applyFilters(term);
      }, 200),
    [applyFilters]
  );

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchTerm(value);
    onSearchChange?.(value);
    
    debouncedSearch(value);
  }, [debouncedSearch, onSearchChange]);

  const handleFilterChange = useCallback((type: string, value: any) => {
    switch (type) {
      case 'documental':
        setDocumentalFilter(value);
        break;
      case 'date':
        setDateFilter(value);
        break;
      case 'sort':
        setSortOption(value);
        break;
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      applyFilters();
    }, 300);
    return () => clearTimeout(timer);
  }, [documentalFilter, dateFilter, sortOption, applyFilters]);

  useEffect(() => {
    setLoading(true);
    applyFilters();
  }, [cantonId]);

  const handleEditPersona = (persona: Persona) => {
    if (!isAdmin && persona.creadorId?.toString() !== user?.id?.toString() && persona.createdBy?.toString() !== user?.id?.toString()) {
      toast.error('Solo puedes editar las personas que has creado');
      return;
    }
    console.log('Editando persona:', persona);
    console.log('Abriendo modal de edición...');
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
      applyFilters();
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
        applyFilters();
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
    applyFilters();
  };

  const handlePersonaClick = (persona: Persona) => {
    navigate(`/proceso-impugnacion/${persona.id}`);
  };

  const totalPersonas = personas.length;
  const personasCompletas = personas.filter(p => p.documentosCompletos).length;
  const personasIncompletas = totalPersonas - personasCompletas;

  // Memoize filtered personas
  const filteredPersonas = useMemo(() => personas, [personas]);

  // Función para obtener los nombres de los creadores
  const fetchCreatorNames = useCallback(async () => {
    try {
      // Obtener colaboradores
      const response = await permissionService.getCollaborators();
      const creatorMap: Record<string, string> = {};
      
      if (response.data && Array.isArray(response.data)) {
        response.data.forEach((collaborator: any) => {
          creatorMap[collaborator.id] = collaborator.nombre;
        });
      }
      
      // Añadir el administrador actual si estamos en una cuenta de administrador
      if (user && user.rol === 'ADMIN' && user.id) {
        creatorMap[user.id.toString()] = user.nombre || 'Administrador';
      }
      
      setCreatorNames(creatorMap);
    } catch (error) {
      console.error('Error al obtener los nombres de los creadores:', error);
    }
  }, [user]);
  
  useEffect(() => {
    fetchCreatorNames();
  }, [fetchCreatorNames]);
  
  // Función para obtener el nombre del creador
  const getCreatorName = (persona: Persona) => {
    // Usar creadorId o createdBy, lo que esté disponible
    const creatorId = persona.creadorId || persona.createdBy;
    
    if (!creatorId) return 'Sistema';
    
    const creatorName = creatorNames[creatorId.toString()];
    
    // Si el usuario actual es administrador, mostrar todos los nombres reales
    if (isAdmin) {
      // Para administradores, mostrar el nombre real si está disponible
      if (creatorName) {
        return creatorName;
      } else if (creatorId === 1) {
        return 'Administrador';
      } else {
        return 'Colaborador';
      }
    } else {
      // Si el usuario es colaborador, mostrar nombres de colaboradores y "Sistema" para admins
      // Verificar si el creador es un administrador (ID = 1 u otros IDs de admin conocidos)
      const isCreatorAdmin = creatorId === 1;
      
      if (isCreatorAdmin) {
        return 'Sistema';
      } else {
        return creatorName || 'Colaborador';
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8">
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
                placeholder="Buscar por nombre, cédula, teléfono, email o contacto de referencia..."
                className={`block w-full pl-10 pr-10 py-2.5 border rounded-xl text-sm transition-all duration-200 ${
                  isDarkMode 
                    ? 'bg-[#0f1729] border-gray-700/50 text-gray-200 placeholder-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20' 
                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
                }`}
                value={localSearchTerm}
                onChange={handleSearchChange}
                autoComplete="off"
                spellCheck="false"
              />
            </div>
            {isFiltering && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <ArrowPathIcon className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            )}
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
            <span className="font-medium">na</span>
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
                placeholder="Buscar por nombre, cédula, teléfono, email o contacto de referencia..."
                className={`block w-full pl-10 pr-10 py-2.5 border rounded-xl text-sm transition-all duration-200 ${
                  isDarkMode 
                    ? 'bg-[#0f1729] border-gray-700/50 text-gray-200 placeholder-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20' 
                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
                }`}
                value={localSearchTerm}
                onChange={handleSearchChange}
                autoComplete="off"
                spellCheck="false"
              />
            </div>
            {isFiltering && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <ArrowPathIcon className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            )}
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
    <div className="max-w-7xl mx-auto -mt-8 px-2 sm:px-6 lg:px-8">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl"></div>
              <div className={`relative w-14 sm:w-16 md:w-20 h-14 sm:h-16 md:h-20 rounded-2xl flex items-center justify-center overflow-hidden ${
                isDarkMode 
                  ? 'bg-[#1a2234] ring-1 ring-white/10' 
                  : 'bg-white ring-1 ring-black/5 shadow-xl shadow-gray-200/20'
              }`}>
                <img 
                  src={personasIcon}
                  alt="Cantón" 
                  className="w-10 sm:w-12 md:w-16 h-10 sm:h-12 md:h-16 object-contain"
                />
              </div>
            </div>
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h1 className={`text-lg sm:text-xl md:text-2xl font-bold ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-900'
                }`}>
                  {cantonNombre}
                </h1>
                <div className={`inline-flex px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium ${
                  isDarkMode 
                    ? 'bg-[#1a2234] text-gray-300 border border-gray-700/50' 
                    : 'bg-white text-gray-600 border border-gray-200 shadow-sm'
                }`}>
                  Código: {cantonCodigo}
                </div>
              </div>
              <p className={`text-xs sm:text-sm mt-1 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Administra las personas del cantón de manera eficiente.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-3 flex-1">
            <div className={`p-2 sm:p-3 rounded-lg ${
              isDarkMode 
                ? 'bg-[#1a2234] border border-gray-700/50' 
                : 'bg-white border border-gray-200'
            }`}>
              <p className={`text-[10px] uppercase tracking-wider font-medium ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Total
              </p>
              <p className={`text-xl sm:text-2xl font-semibold ${
                isDarkMode ? 'text-gray-200' : 'text-gray-900'
              }`}>
                {totalPersonas}
              </p>
            </div>

            <div className={`p-2 sm:p-3 rounded-lg ${
              isDarkMode 
                ? 'bg-[#1a2234] border border-gray-700/50' 
                : 'bg-white border border-gray-200'
            }`}>
              <p className={`text-[10px] uppercase tracking-wider font-medium ${
                isDarkMode ? 'text-green-400' : 'text-green-600'
              }`}>
                Completas
              </p>
              <p className={`text-xl sm:text-2xl font-semibold ${
                isDarkMode ? 'text-green-400' : 'text-green-600'
              }`}>
                {personasCompletas}
              </p>
            </div>

            <div className={`p-2 sm:p-3 rounded-lg ${
              isDarkMode 
                ? 'bg-[#1a2234] border border-gray-700/50' 
                : 'bg-white border border-gray-200'
            }`}>
              <p className={`text-[10px] uppercase tracking-wider font-medium ${
                isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
              }`}>
                Pendientes
              </p>
              <p className={`text-xl sm:text-2xl font-semibold ${
                isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
              }`}>
                {personasIncompletas}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center px-3 sm:px-4 py-2 sm:py-2.5
                      bg-primary-500 dark:bg-primary-500
                      text-white font-medium rounded-xl
                      shadow-lg shadow-primary-500/20
                      hover:shadow-xl hover:shadow-primary-500/30
                      hover:bg-primary-600 dark:hover:bg-primary-600
                      transition-all duration-200"
          >
            <CreateUserIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 text-white" />
            <span className="text-sm sm:text-base font-medium">Registrar Persona</span>
          </button>
        </div>

        <div className={`space-y-4 ${
          isDarkMode ? 'text-gray-200' : 'text-gray-900'
        }`}>
          <div className={`p-3 sm:p-4 rounded-xl shadow-sm ${
            isDarkMode 
              ? 'bg-[#1a2234] border border-gray-700/50' 
              : 'bg-white border border-gray-200'
          }`}>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar por nombre, cédula..."
                  className={`block w-full pl-9 sm:pl-10 pr-8 sm:pr-10 py-2 sm:py-2.5 border rounded-xl text-xs sm:text-sm transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-[#0f1729] border-gray-700/50 text-gray-200 placeholder-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20' 
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
                  }`}
                  value={localSearchTerm}
                  onChange={handleSearchChange}
                  autoComplete="off"
                  spellCheck="false"
                />
                {isFiltering && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <ArrowPathIcon className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 sm:p-2.5 rounded-xl border transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  isDarkMode
                    ? 'bg-[#0f1729] border-gray-700/50 text-gray-300'
                    : 'bg-white border-gray-300 text-gray-700'
                } ${showFilters ? 'ring-2 ring-primary-500/20 border-primary-500' : ''}`}
              >
                <AdjustmentsVerticalIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            <AnimatePresence mode="sync">
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-3 sm:pt-4">
                    <div className="relative">
                      <select
                        value={documentalFilter}
                        onChange={(e) => handleFilterChange('documental', e.target.value)}
                        disabled={isFiltering}
                        className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border rounded-lg text-xs sm:text-sm transition-all duration-200 ${
                          isDarkMode 
                            ? 'bg-[#0f1729] border-gray-700/50 text-gray-200' 
                            : 'bg-gray-50 border-gray-300 text-gray-900'
                        } focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500`}
                      >
                        <option value="all">Estado Documental: Todos</option>
                        <option value="complete">Documentos Completos</option>
                        <option value="incomplete">Documentos Incompletos</option>
                      </select>
                    </div>

                    <div className="relative">
                      <select
                        value={dateFilter}
                        onChange={(e) => handleFilterChange('date', e.target.value)}
                        disabled={isFiltering}
                        className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border rounded-lg text-xs sm:text-sm transition-all duration-200 ${
                          isDarkMode 
                            ? 'bg-[#0f1729] border-gray-700/50 text-gray-200' 
                            : 'bg-gray-50 border-gray-300 text-gray-900'
                        } focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500`}
                      >
                        <option value="all">Fecha de Registro: Todos</option>
                        <option value="today">Hoy</option>
                        <option value="week">Última Semana</option>
                        <option value="month">Último Mes</option>
                      </select>
                    </div>

                    <div className="relative">
                      <select
                        value={sortOption}
                        onChange={(e) => handleFilterChange('sort', e.target.value)}
                        disabled={isFiltering}
                        className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border rounded-lg text-xs sm:text-sm transition-all duration-200 ${
                          isDarkMode 
                            ? 'bg-[#0f1729] border-gray-700/50 text-gray-200' 
                            : 'bg-gray-50 border-gray-300 text-gray-900'
                        } focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500`}
                      >
                        <option value="fecha_registro">Ordenar por: Fecha de Registro</option>
                        <option value="cedula">Ordenar por: Cédula</option>
                        <option value="apellidos">Ordenar por: Apellidos</option>
                        <option value="documentosCompletos">Ordenar por: Documentos</option>
                      </select>
                    </div>

                    <div className="sm:col-span-3 flex justify-end mt-2">
                      <button
                        onClick={() => {
                          handleFilterChange('documental', 'all');
                          handleFilterChange('date', 'all');
                          handleFilterChange('sort', 'fecha_registro');
                          setLocalSearchTerm('');
                          onSearchChange?.('');
                          applyFilters();
                        }}
                        className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 ${
                          isDarkMode
                            ? 'bg-[#0f1729] text-gray-300 border border-gray-700/50 hover:bg-gray-800'
                            : 'bg-gray-50 text-gray-700 border border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        Limpiar Filtros
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {personas.length > 0 ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3">
              <AnimatePresence mode="sync">
                {filteredPersonas.map((persona: Persona) => (
                  <motion.div
                    key={persona.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                    className={`relative rounded-xl overflow-hidden transition-all duration-200 group ${
                      isDarkMode 
                        ? 'bg-[#1a2234] border-2 border-gray-700/80 hover:bg-[#1f2943] shadow-lg shadow-black/10' 
                        : 'bg-white border-2 border-gray-200 hover:bg-gray-50 shadow-lg shadow-gray-200/50'
                    }`}
                  >
                    <div className={`absolute left-0 top-0 w-1.5 h-full transition-all duration-300 ${
                      persona.documentosCompletos 
                        ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' 
                        : 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]'
                    }`} />

                    <div className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pl-2 sm:pl-3 gap-3 sm:gap-4">
                        <div 
                          className="flex items-start sm:items-center space-x-2 sm:space-x-3 flex-1 cursor-pointer"
                          onClick={() => handlePersonaClick(persona)}
                        >
                          <div className={`relative flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden ${
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
                          <div className="flex flex-col">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3">
                              <h3 className={`text-sm sm:text-base font-bold ${
                                isDarkMode ? 'text-gray-100' : 'text-gray-900'
                              }`}>
                                {persona.nombres} {persona.apellidos}
                              </h3>
                              <div className={`inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg text-sm sm:text-base font-bold transition-all duration-200 mt-1 sm:mt-0 ${
                                isDarkMode 
                                  ? 'bg-gradient-to-r from-gray-700/50 to-gray-800/50 text-gray-100 border border-gray-600/30 shadow-inner shadow-black/10' 
                                  : 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-900 border border-gray-200/80 shadow-sm'
                              }`}>
                                <span className={`mr-1 sm:mr-2 text-xs font-semibold ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>CI:</span>
                                {persona.cedula}
                              </div>
                            </div>
                            <div className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium mt-1 transition-all duration-300 ${
                              persona.documentosCompletos
                                ? isDarkMode 
                                  ? 'bg-green-500/10 text-green-400 ring-1 ring-green-500/20' 
                                  : 'bg-green-50 text-green-700 ring-1 ring-green-500/20'
                                : isDarkMode
                                  ? 'bg-yellow-500/10 text-yellow-400 ring-1 ring-yellow-500/20'
                                  : 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-500/20'
                            }`}>
                              {persona.documentosCompletos ? 'Documentos Completos' : 'Documentos Pendientes'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2 ml-12 sm:ml-0 mt-2 sm:mt-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDocuments(persona);
                            }}
                            className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 ${
                              isDarkMode
                                ? 'bg-[#0f1729] text-gray-300 hover:bg-gray-800 hover:text-primary-400 border border-gray-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-primary-600 border border-gray-200'
                            }`}
                            title="Ver documentos"
                          >
                            <DocumentTextIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>

                          {(() => {
                            const isCreator = persona.creadorId?.toString() === user?.id?.toString() || 
                                              persona.createdBy?.toString() === user?.id?.toString();
                            console.log(`Persona ${persona.id} - isCreator: ${isCreator}, userId: ${user?.id}`);
                            console.log(`creadorId: ${persona.creadorId}, createdBy: ${persona.createdBy}`);
                            
                            return (isAdmin || isCreator) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log('Botón de editar clickeado para persona:', persona.id);
                                  handleEditPersona(persona);
                                }}
                                className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 ${
                                  isDarkMode
                                    ? 'bg-[#0f1729] text-gray-300 hover:bg-gray-800 hover:text-blue-400 border border-gray-700'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-blue-600 border border-gray-200'
                                }`}
                                title="Editar persona"
                              >
                                <PencilIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </button>
                            );
                          })()}

                          {isAdmin && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePersona(persona);
                              }}
                              className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 ${
                                isDarkMode
                                  ? 'bg-[#0f1729] text-gray-300 hover:bg-gray-800 hover:text-red-400 border border-gray-700'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-red-600 border border-gray-200'
                              }`}
                              title="Eliminar persona"
                            >
                              <TrashIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div 
                        className="mt-3 sm:mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 pl-12 sm:pl-16 cursor-pointer"
                        onClick={() => handlePersonaClick(persona)}
                      >
                        <div className={`flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border group-hover:border-gray-300 ${
                          isDarkMode 
                            ? 'bg-[#0f1729] text-gray-300 border-gray-700 group-hover:border-gray-600' 
                            : 'bg-gray-50 text-gray-700 border-gray-200'
                        }`}>
                          <PhoneIcon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 sm:mr-3 flex-shrink-0 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`} />
                          <span className="text-xs sm:text-sm font-medium truncate">{persona.telefono}</span>
                        </div>
                        {persona.email && (
                          <div className={`flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border group-hover:border-gray-300 ${
                            isDarkMode 
                              ? 'bg-[#0f1729] text-gray-300 border-gray-700 group-hover:border-gray-600' 
                              : 'bg-gray-50 text-gray-700 border-gray-200'
                          }`}>
                            <EnvelopeIcon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 sm:mr-3 flex-shrink-0 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`} />
                            <span className="text-xs sm:text-sm font-medium truncate">{persona.email}</span>
                          </div>
                        )}
                        {persona.domicilio && (
                          <div className={`flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border group-hover:border-gray-300 ${
                            isDarkMode 
                              ? 'bg-[#0f1729] text-gray-300 border-gray-700 group-hover:border-gray-600' 
                              : 'bg-gray-50 text-gray-700 border-gray-200'
                          }`}>
                            <HomeIcon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 sm:mr-3 flex-shrink-0 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`} />
                            <span className="text-xs sm:text-sm font-medium truncate">{persona.domicilio}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-1 text-xs text-gray-400 dark:text-gray-500 flex items-center pl-12 sm:pl-16">
                        <UsersIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                        <span>Creado por: {getCreatorName(persona)}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
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

      <PersonaFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          console.log('Cerrando modal de edición');
          setIsEditModalOpen(false);
          setPersonaToEdit(null);
        }}
        onSuccess={() => {
          console.log('Edición exitosa');
          applyFilters();
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
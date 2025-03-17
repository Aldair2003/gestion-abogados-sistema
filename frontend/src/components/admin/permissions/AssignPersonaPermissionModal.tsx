import { useState, useEffect, useMemo } from 'react';
import { Modal } from '../../common/Modal';
import { SelectField } from '../../common/SelectField';
import { User, Persona } from '../../../types/permissions';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { personaService } from '../../../services/personaService';
import { permissionService } from '../../../services/permissionService';

// Interfaz para las personas que vienen del servicio personaService
interface PersonaFromService {
  id: string | number;
  nombres: string;
  apellidos: string;
  cedula: string;
  cantonId?: string | number;
  canton?: {
    id: string | number;
    nombre: string;
  };
}

interface AssignPersonaPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (data: any) => void;
  users: User[];
  personas: Persona[];
}

export const AssignPersonaPermissionModal = ({
  isOpen,
  onClose,
  onAssign,
  users = [],
  personas = []
}: AssignPersonaPermissionModalProps) => {
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [permissions, setPermissions] = useState({
    viewSpecific: false,
    manageAll: false
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCanton, setSelectedCanton] = useState<string>('all');
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);
  const [userCantones, setUserCantones] = useState<any[]>([]);
  const [personasByCantonMap, setPersonasByCantonMap] = useState<Record<string, PersonaFromService[]>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>([]);
  
  // Cargar los usuarios que ya tienen permisos asignados
  useEffect(() => {
    const loadAssignedUsers = async () => {
      try {
        const permissions = await permissionService.getPersonaPermissions();
        // Extraer los IDs de usuarios que ya tienen permisos asignados
        const userIds = Array.isArray(permissions) 
          ? permissions.map(p => p.user.id).filter((id, index, self) => self.indexOf(id) === index)
          : [];
        setAssignedUserIds(userIds);
      } catch (error) {
        console.error('Error al cargar usuarios con permisos:', error);
      }
    };
    
    if (isOpen) {
      loadAssignedUsers();
    }
  }, [isOpen]);
  
  // Filtrar usuarios que tienen al menos un cantón asignado y que no tienen permisos ya asignados
  const usersWithCantones = Array.isArray(users) 
    ? users.filter(user => 
        user && 
        user.cantones && 
        Array.isArray(user.cantones) && 
        user.cantones.length > 0 &&
        !assignedUserIds.includes(user.id)
      )
    : [];

  // Cargar los cantones del usuario seleccionado
  useEffect(() => {
    if (selectedUser && Array.isArray(users)) {
      const user = users.find(u => u && u.id === selectedUser);
      
      // Asegurarse de que los cantones del usuario estén correctamente formateados
      const userCantonesArray = user?.cantones || [];
      console.log('Cantones del usuario seleccionado:', userCantonesArray);
      
      if (userCantonesArray.length === 0) {
        // Si el usuario no tiene cantones asignados, mostrar un mensaje
        toast.error('Este colaborador no tiene cantones asignados. Primero debe asignarle cantones.');
      }
      
      setUserCantones(userCantonesArray);
      setSelectedCanton('all'); // Resetear el cantón seleccionado
      setSelectedPersonas([]); // Resetear las personas seleccionadas
    }
  }, [selectedUser, users]);

  // Cargar personas por cantón cuando cambia el usuario seleccionado
  useEffect(() => {
    const loadPersonasByCanton = async () => {
      if (!userCantones.length) return;
      
      setIsLoading(true);
      const personasMap: Record<string, PersonaFromService[]> = {};
      
      try {
        // Cargar personas para cada cantón del usuario
        for (const canton of userCantones) {
          if (canton && canton.id) {
            const response = await personaService.getPersonasByCanton(canton.id.toString());
            if (response.status === 'success' && response.data?.personas) {
              personasMap[canton.id] = response.data.personas;
            }
          }
        }
        
        setPersonasByCantonMap(personasMap);
      } catch (error) {
        console.error('Error al cargar personas por cantón:', error);
        toast.error('Error al cargar las personas de los cantones');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPersonasByCanton();
  }, [userCantones]);

  // Filtrar personas según el término de búsqueda y el cantón seleccionado
  const filteredPersonasByCanton = useMemo(() => {
    const result: Record<string, { canton: any; personas: PersonaFromService[] }> = {};
    
    // Si no hay cantones o no hay personas, devolver un objeto vacío
    if (!userCantones.length || Object.keys(personasByCantonMap).length === 0) {
      return result;
    }
    
    // Filtrar por cantón seleccionado
    const cantonesToProcess = selectedCanton === 'all' 
      ? userCantones 
      : userCantones.filter(canton => canton && canton.id === selectedCanton);
    
    // Procesar cada cantón
    for (const canton of cantonesToProcess) {
      if (!canton || !canton.id) continue;
      
      const personasInCanton = personasByCantonMap[canton.id] || [];
      
      // Filtrar por término de búsqueda
      const filteredPersonas = personasInCanton.filter(persona => {
        if (!persona) return false;
        
        const nombreCompleto = `${persona.nombres || ''} ${persona.apellidos || ''}`.toLowerCase();
        const cedula = persona.cedula || '';
        
        return nombreCompleto.includes(searchTerm.toLowerCase()) || 
               cedula.includes(searchTerm);
      });
      
      if (filteredPersonas.length > 0) {
        result[canton.id] = {
          canton,
          personas: filteredPersonas
        };
      }
    }
    
    return result;
  }, [userCantones, personasByCantonMap, selectedCanton, searchTerm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que se haya seleccionado un usuario
    if (!selectedUser) {
      toast.error('Debe seleccionar un colaborador');
      return;
    }
    
    // Validar que se haya seleccionado al menos un permiso
    if (!permissions.viewSpecific && !permissions.manageAll) {
      toast.error('Debe seleccionar al menos un tipo de permiso');
      return;
    }
    
    // Validar que se hayan seleccionado personas si se eligió el permiso de ver específicas
    if (permissions.viewSpecific && selectedPersonas.length === 0) {
      toast.error('Debe seleccionar al menos una persona para el permiso de ver específicas');
      return;
    }
    
    // Obtener el cantón seleccionado o el primer cantón del usuario si no hay selección específica
    const cantonId = selectedCanton !== 'all' 
      ? selectedCanton 
      : userCantones.length > 0 
        ? userCantones[0].id.toString() 
        : null;
    
    if (!cantonId) {
      toast.error('No se pudo determinar el cantón para asignar permisos');
      return;
    }
    
    // Datos a enviar en el formato que espera el backend
    const data = {
      userId: parseInt(selectedUser),
      personaIds: selectedPersonas.map(id => parseInt(id)),
      cantonId: parseInt(cantonId),
      permissions: {
        canView: permissions.viewSpecific,
        canCreate: permissions.manageAll,
        canEdit: permissions.manageAll
      }
    };
    
    console.log('Enviando datos de asignación de permisos:', data);
    onAssign(data);
  };

  const handleSelectAll = (cantonId: string) => {
    const personasInCanton = filteredPersonasByCanton[cantonId]?.personas || [];
    const personaIds = personasInCanton.map(p => p.id.toString());
    
    setSelectedPersonas(prev => {
      const otherPersonas = prev.filter(id => 
        !personasInCanton.some(p => p.id.toString() === id)
      );
      return [...otherPersonas, ...personaIds];
    });
  };

  const handleDeselectAll = (cantonId: string) => {
    const personasInCanton = filteredPersonasByCanton[cantonId]?.personas || [];
    
    setSelectedPersonas(prev => 
      prev.filter(id => !personasInCanton.some(p => p.id.toString() === id))
    );
  };

  const getSelectionSummary = () => {
    const summary: Record<string, number> = {};
    
    Object.entries(filteredPersonasByCanton).forEach(([cantonId, { canton, personas }]) => {
      const selectedCount = personas.filter(p => selectedPersonas.includes(p.id.toString())).length;
      if (selectedCount > 0) {
        summary[canton.nombre] = selectedCount;
      }
    });

    return Object.entries(summary);
  };

  const totalPersonasCount = useMemo(() => {
    return Object.values(filteredPersonasByCanton).reduce((total, { personas }) => 
      total + personas.length, 0);
  }, [filteredPersonasByCanton]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Asignar Permiso de Personas"
      maxWidth="max-w-5xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Selector de Colaborador */}
        <div>
          <SelectField
            label="Colaborador"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            required
          >
            <option value="">Seleccione un colaborador</option>
            {usersWithCantones.length > 0 ? (
              usersWithCantones.map((user) => (
                user && (
                  <option key={user.id} value={user.id}>
                    {user.nombre} {user.cantones && Array.isArray(user.cantones) && user.cantones.length > 0 
                      ? `- (${user.cantones.map(c => c?.nombre || '').filter(Boolean).join(', ')})` 
                      : ''}
                  </option>
                )
              ))
            ) : (
              <option value="" disabled>No hay colaboradores con cantones asignados</option>
            )}
          </SelectField>
          {usersWithCantones.length === 0 && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              No hay colaboradores con cantones asignados. Primero debe asignar cantones a los colaboradores.
            </p>
          )}
        </div>

        {/* Permisos */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Permisos
          </label>
          <div className={`flex flex-wrap gap-3 p-3 rounded-lg border ${
            !selectedUser 
              ? 'bg-gray-100 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50 opacity-70' 
              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
          }`}>
            <label className={`flex items-center ${!selectedUser ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
              <input
                type="checkbox"
                checked={permissions.viewSpecific}
                onChange={(e) => setPermissions(prev => ({
                  ...prev,
                  viewSpecific: e.target.checked
                }))}
                disabled={!selectedUser}
                className={`rounded border-gray-300 shadow-sm focus:ring-primary-200 ${
                  !selectedUser 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-primary-600 focus:border-primary-300 focus:ring focus:ring-opacity-50'
                }`}
              />
              <span className={`ml-2 text-sm ${
                !selectedUser 
                  ? 'text-gray-500 dark:text-gray-500' 
                  : 'text-gray-700 dark:text-gray-300'
              }`}>
                Ver personas específicas
              </span>
            </label>
            <label className={`flex items-center ${!selectedUser ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
              <input
                type="checkbox"
                checked={permissions.manageAll}
                onChange={(e) => setPermissions(prev => ({
                  ...prev,
                  manageAll: e.target.checked
                }))}
                disabled={!selectedUser}
                className={`rounded border-gray-300 shadow-sm focus:ring-primary-200 ${
                  !selectedUser 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-primary-600 focus:border-primary-300 focus:ring focus:ring-opacity-50'
                }`}
              />
              <span className={`ml-2 text-sm ${
                !selectedUser 
                  ? 'text-gray-500 dark:text-gray-500' 
                  : 'text-gray-700 dark:text-gray-300'
              }`}>
                Gestionar personas del cantón
              </span>
            </label>
          </div>
        </div>

        {/* Selector de Personas */}
        {permissions.viewSpecific && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Buscador */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Buscar por nombre o cédula
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full rounded-lg border-gray-300 dark:border-gray-600 
                             shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 
                             focus:ring-opacity-50 dark:bg-gray-700 dark:text-white pl-8 py-1.5 text-sm"
                    placeholder="Buscar..."
                  />
                  <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* Filtro por cantón */}
              <div className="sm:w-48">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Filtrar por cantón
                </label>
                <select
                  value={selectedCanton}
                  onChange={(e) => setSelectedCanton(e.target.value)}
                  className="block w-full rounded-lg border-gray-300 dark:border-gray-600 
                           shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 
                           focus:ring-opacity-50 dark:bg-gray-700 dark:text-white text-sm py-1.5"
                >
                  <option value="all">Todos</option>
                  {Array.isArray(userCantones) && userCantones.map((canton) => (
                    canton && canton.id && (
                      <option key={canton.id} value={canton.id}>
                        {canton.nombre || 'Cantón sin nombre'}
                      </option>
                    )
                  ))}
                </select>
              </div>
            </div>

            {/* Estado de carga */}
            {isLoading && (
              <div className="flex justify-center items-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Cargando personas...</span>
              </div>
            )}

            {/* Mensaje cuando no hay personas */}
            {!isLoading && totalPersonasCount === 0 && selectedUser && (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="h-10 w-10 text-gray-400 dark:text-gray-500 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                </div>
                <h4 className="text-base font-medium text-gray-700 dark:text-gray-300">
                  No se encontraron personas
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mt-1">
                  {searchTerm 
                    ? `No hay resultados para "${searchTerm}". Intente con otro término de búsqueda.` 
                    : selectedCanton !== 'all' 
                      ? 'No hay personas registradas en este cantón.' 
                      : 'No hay personas registradas en los cantones asignados a este colaborador.'}
                </p>
              </div>
            )}

            {/* Lista de personas por cantón */}
            {!isLoading && totalPersonasCount > 0 && (
              <div className="max-h-72 overflow-y-auto space-y-4 border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800">
                {Object.entries(filteredPersonasByCanton).map(([cantonId, { canton, personas }]) => (
                  canton && canton.id && (
                    <div key={cantonId} className="space-y-2">
                      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white flex items-center text-sm">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300 mr-2">
                            <span className="text-xs font-semibold">{personas.length}</span>
                          </span>
                          {canton.nombre || 'Cantón sin nombre'}
                        </h4>
                        <div className="space-x-1 flex flex-wrap justify-end">
                          <button
                            type="button"
                            onClick={() => handleSelectAll(cantonId)}
                            className="text-xs px-1.5 py-0.5 rounded bg-primary-50 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-800/50 transition-colors"
                          >
                            Seleccionar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeselectAll(cantonId)}
                            className="text-xs px-1.5 py-0.5 rounded bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                          >
                            Deseleccionar
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1">
                        {Array.isArray(personas) && personas.map((persona) => (
                          persona && persona.id && (
                            <label key={persona.id} className="flex items-center p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                              <input
                                type="checkbox"
                                checked={selectedPersonas.includes(persona.id.toString())}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedPersonas(prev => [...prev, persona.id.toString()]);
                                  } else {
                                    setSelectedPersonas(prev => prev.filter(id => id !== persona.id.toString()));
                                  }
                                }}
                                className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                              />
                              <div className="ml-2 overflow-hidden">
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                                  {persona.nombres} {persona.apellidos || 'Sin apellidos'}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {persona.cedula || 'Sin cédula'}
                                </div>
                              </div>
                            </label>
                          )
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}

            {/* Resumen de selección */}
            {selectedPersonas.length > 0 && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <h4 className="font-medium text-gray-900 dark:text-white mb-1.5 flex items-center text-sm">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300 mr-2">
                    <span className="text-xs font-semibold">{selectedPersonas.length}</span>
                  </span>
                  Resumen de selección
                </h4>
                <div className="space-y-1">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Total seleccionados: {selectedPersonas.length} personas
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {getSelectionSummary().map(([canton, count]) => (
                      <span key={canton} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300">
                        {canton}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Botones */}
        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border 
                     border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
                     dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!selectedUser || (!permissions.manageAll && (!permissions.viewSpecific || selectedPersonas.length === 0)) || isLoading}
            className="w-full sm:w-auto px-3 py-1.5 text-sm font-medium text-white bg-primary-600 
                     border border-transparent rounded-lg shadow-sm hover:bg-primary-700 
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Asignar Permiso
          </button>
        </div>
      </form>
    </Modal>
  );
}; 
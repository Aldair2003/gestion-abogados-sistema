import { useState, useEffect } from 'react';
import { Modal } from '../../common/Modal';
import { PersonaPermission, Persona, Canton } from '../../../types/permissions';
import { permissionService } from '../../../services/permissionService';
import { toast } from 'react-hot-toast';
import { getPhotoUrl } from '../../../utils/urls';
import { PlusIcon, MagnifyingGlassIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

// Icono de persona
const PersonIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth="1.5" 
    stroke="currentColor" 
    className={className}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
  </svg>
);

// Icono de ubicación
const MapPinIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth="1.5" 
    stroke="currentColor" 
    className={className}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
  </svg>
);

interface EditPersonaPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  permission: PersonaPermission;
  onSave: () => void;
}

export const EditPersonaPermissionModal = ({
  isOpen,
  onClose,
  permission,
  onSave
}: EditPersonaPermissionModalProps) => {
  const [permissions, setPermissions] = useState({
    viewSpecific: permission.canView || false,
    manageAll: permission.canManage || false
  });
  const [loading, setLoading] = useState(false);
  const [availablePersonas, setAvailablePersonas] = useState<Persona[]>([]);
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingPersonas, setLoadingPersonas] = useState(false);
  
  // Estado para manejar los cantones y el cantón seleccionado
  const [cantones, setCantones] = useState<Canton[]>([]);
  const [selectedCantonId, setSelectedCantonId] = useState<string>('');
  const [showCantonSelector, setShowCantonSelector] = useState(false);
  
  // Estado para rastrear las personas ya asignadas
  const [assignedPersonas, setAssignedPersonas] = useState<string[]>([]);

  // Inicializar cantones y cantón seleccionado
  useEffect(() => {
    // Obtener cantones del permiso
    const cantonesFromPermission: Canton[] = [];
    
    // Agregar el cantón de la persona si existe
    if (permission.persona?.canton) {
      cantonesFromPermission.push(permission.persona.canton);
    }
    
    // Agregar cantones adicionales si existen
    if (permission.cantones && permission.cantones.length > 0) {
      // Filtrar para evitar duplicados
      permission.cantones.forEach(canton => {
        if (!cantonesFromPermission.some(c => c.id === canton.id)) {
          cantonesFromPermission.push(canton);
        }
      });
    }
    
    setCantones(cantonesFromPermission);
    
    // Seleccionar el primer cantón por defecto
    if (cantonesFromPermission.length > 0) {
      setSelectedCantonId(cantonesFromPermission[0].id);
    }
    
    // Cargar todas las personas asignadas al usuario
    loadAssignedPersonas();
  }, [permission]);

  // Actualizar los permisos cuando cambia la prop permission
  useEffect(() => {
    setPermissions({
      viewSpecific: permission.canView || false,
      manageAll: permission.canManage || false
    });
    
    // Limpiar selecciones al abrir el modal
    setSelectedPersonas([]);
    
    // Cargar personas asignadas cuando se abre el modal
    if (isOpen) {
      loadAssignedPersonas();
    }
  }, [permission, isOpen]);

  // Cargar personas disponibles cuando cambia el cantón seleccionado
  useEffect(() => {
    if (selectedCantonId && isOpen) {
      loadAvailablePersonas();
    }
  }, [selectedCantonId, isOpen]);

  const loadAvailablePersonas = async () => {
    if (!selectedCantonId) return;
    
    setLoadingPersonas(true);
    try {
      // Usar el servicio para obtener las personas
      const response = await permissionService.getPersonas();
      console.log('Personas cargadas:', response);
      
      // Verificar que la respuesta sea un array
      if (Array.isArray(response)) {
        // Formatear los nombres de las personas si es necesario
        const formattedPersonas = response.map(persona => ({
          ...persona,
          nombre: formatFullName(persona)
        }));
        console.log('Personas formateadas:', formattedPersonas);
        
        // Filtrar personas que pertenecen al cantón seleccionado
        console.log('Filtrando personas por cantón:', selectedCantonId);
        
        // Filtrar personas por cantón seleccionado
        const personasMismoCanton = formattedPersonas.filter(persona => {
          // Convertir IDs a string para comparación segura
          const personaCantonId = persona.cantonId?.toString();
          const targetCantonId = selectedCantonId.toString();
          
          // Verificar si la persona tiene un cantonId que coincide con el seleccionado
          if (personaCantonId === targetCantonId) {
            return true;
          }
          
          // Verificar si la persona tiene un objeto canton con id que coincide con el seleccionado
          if (persona.canton && typeof persona.canton === 'object' && 
              persona.canton.id?.toString() === targetCantonId) {
            return true;
          }
          
          // Verificar si la persona tiene un campo canton que es un string y coincide con el seleccionado
          if (typeof persona.canton === 'string' && persona.canton === targetCantonId) {
            return true;
          }
          
          return false;
        });
        
        console.log('Personas del mismo cantón:', personasMismoCanton);
        
        // Si no se encontraron personas con el filtro estricto, mostrar un mensaje
        if (personasMismoCanton.length === 0) {
          console.log('No se encontraron personas en el cantón seleccionado');
          setAvailablePersonas([]);
        } else {
          setAvailablePersonas(personasMismoCanton);
        }
      } else {
        console.warn('No se recibieron datos de personas en el formato esperado', response);
        setAvailablePersonas([]);
      }
    } catch (error) {
      console.error('Error cargando personas:', error);
      toast.error('Error al cargar las personas disponibles');
      setAvailablePersonas([]);
    } finally {
      setLoadingPersonas(false);
    }
  };

  // Función para formatear el nombre completo de una persona
  const formatFullName = (persona: any) => {
    if (!persona) return 'Sin nombre';
    
    try {
      // Intentar construir el nombre completo a partir de nombres y apellidos
      if (persona.nombres && persona.apellidos) {
        return `${persona.nombres} ${persona.apellidos}`;
      }
      
      // Si ya tiene un nombre formateado, usarlo
      if (persona.nombre) {
        return persona.nombre;
      }
      
      // Si no hay información de nombre, mostrar la cédula
      return persona.cedula ? `Persona ${persona.cedula}` : 'Sin nombre';
    } catch (error) {
      console.error('Error al formatear nombre completo:', error);
      return persona.cedula ? `Persona ${persona.cedula}` : 'Sin nombre';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Primero actualizar los permisos existentes
      await permissionService.updatePersonaPermission(permission.id, {
        canView: permissions.viewSpecific,
        canCreate: permissions.manageAll,
        canEdit: permissions.manageAll
      });
      
      // Identificar personas que se han marcado para desasignar
      // (están en assignedPersonas y también en selectedPersonas)
      const personasToRemove = selectedPersonas.filter(id => isPersonaAssigned(id));
      
      // Identificar personas que se han marcado para asignar
      // (están en selectedPersonas pero no en assignedPersonas)
      const personasToAdd = selectedPersonas.filter(id => !isPersonaAssigned(id));
      
      // Revocar permisos para personas desasignadas
      if (personasToRemove.length > 0) {
        console.log('Revocando permisos para personas:', personasToRemove);
        for (const personaId of personasToRemove) {
          try {
            await permissionService.revokePersonaPermission(permission.user.id, personaId);
            console.log(`Permiso revocado para persona ${personaId}`);
          } catch (error) {
            console.error(`Error al revocar permiso para persona ${personaId}:`, error);
          }
        }
      }
      
      // Si hay personas para añadir, asignar nuevos permisos
      if (personasToAdd.length > 0) {
        if (!selectedCantonId) {
          toast.error('No se ha seleccionado un cantón');
          return;
        }
        
        console.log('Asignando permisos a personas:', {
          userId: parseInt(permission.user.id),
          personaIds: personasToAdd.map(id => parseInt(id)),
          cantonId: parseInt(selectedCantonId),
          permissions: {
            canView: permissions.viewSpecific,
            canCreate: permissions.manageAll,
            canEdit: permissions.manageAll
          }
        });
        
        await permissionService.assignPersonaPermission({
          userId: parseInt(permission.user.id),
          personaIds: personasToAdd.map(id => parseInt(id)),
          cantonId: parseInt(selectedCantonId),
          permissions: {
            canView: permissions.viewSpecific,
            canCreate: permissions.manageAll,
            canEdit: permissions.manageAll
          }
        });
      }
      
      // Limpiar la selección después de guardar
      setSelectedPersonas([]);
      
      toast.success('Permisos actualizados correctamente');
      onSave();
    } catch (error: any) {
      console.error('Error al actualizar permisos:', error);
      toast.error(error.message || 'Error al actualizar permisos');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar personas según el término de búsqueda
  const filteredPersonas = availablePersonas.filter(persona => {
    if (!persona) return false;
    
    // Usar nombre completo o solo nombre si está disponible
    const nombreCompleto = persona.nombre || '';
    const cedula = persona.cedula || '';
    
    return nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) || 
           cedula.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Función para manejar la selección/deselección de personas
  const togglePersonaSelection = (personaId: string) => {
    console.log(`Toggling persona ${personaId}`);
    console.log(`Estado actual: asignada=${isPersonaAssigned(personaId)}, seleccionada=${selectedPersonas.includes(personaId)}`);
    
    // Verificar si la persona está en la lista de seleccionadas
    const isCurrentlySelected = selectedPersonas.includes(personaId);
    
    // Si la persona ya está asignada y se desmarca, la marcamos para desasignar
    if (isPersonaAssigned(personaId)) {
      if (isCurrentlySelected) {
        // Si ya está marcada para desasignar, cancelamos la desasignación
        setSelectedPersonas(prev => prev.filter(id => id !== personaId));
        console.log(`Cancelando desasignación de persona ${personaId}`);
        toast.success('Cancelada la desasignación');
      } else {
        // Si no está marcada para desasignar, la marcamos
        setSelectedPersonas(prev => [...prev, personaId]);
        console.log(`Marcando persona ${personaId} para desasignar`);
        toast.success('Persona marcada para desasignar');
      }
    } 
    // Si no está asignada
    else {
      if (isCurrentlySelected) {
        // Si está seleccionada, la quitamos
        setSelectedPersonas(prev => prev.filter(id => id !== personaId));
        console.log(`Desmarcando persona ${personaId} para asignar`);
      } else {
        // Si no está seleccionada, la añadimos
        setSelectedPersonas(prev => [...prev, personaId]);
        console.log(`Marcando persona ${personaId} para asignar`);
        toast.success('Persona marcada para asignar');
      }
    }
  };

  // Verificar si una persona está seleccionada para añadir o quitar
  const isPersonaSelected = (personaId: string) => {
    return selectedPersonas.includes(personaId);
  };
  
  // Contar cuántas personas están seleccionadas para añadir (no estaban asignadas)
  const countPersonasToAdd = () => {
    return selectedPersonas.filter(id => !isPersonaAssigned(id)).length;
  };
  
  // Contar cuántas personas están seleccionadas para quitar (estaban asignadas)
  const countPersonasToRemove = () => {
    return selectedPersonas.filter(id => isPersonaAssigned(id)).length;
  };

  // Función para formatear el nombre de la persona de manera segura
  const formatPersonName = (nombre: string | undefined) => {
    if (!nombre) return 'Sin nombre';
    
    try {
      const parts = nombre.split(' ');
      return parts.length > 1 ? parts.slice(0, 2).join(' ') : nombre;
    } catch (error) {
      console.error('Error al formatear nombre:', error);
      return nombre;
    }
  };

  // Función para cargar todas las personas asignadas al usuario
  const loadAssignedPersonas = async () => {
    try {
      console.log('Cargando personas asignadas para el usuario:', permission.user.id);
      // Obtener todos los permisos de personas para este usuario
      const allPermissions = await permissionService.getPersonaPermissions(true);
      console.log('Todos los permisos obtenidos:', allPermissions);
      
      // Filtrar solo los permisos del usuario actual
      const userPermissions = allPermissions.filter(p => p.user.id === permission.user.id);
      console.log('Permisos filtrados para el usuario:', userPermissions);
      
      // Extraer los IDs de las personas asignadas
      const assignedIds: string[] = [];
      
      // Incluir todas las personas asignadas al usuario
      userPermissions.forEach(p => {
        if (p.persona) {
          console.log('Añadiendo persona asignada:', p.persona);
          assignedIds.push(p.persona.id.toString());
        }
      });
      
      console.log('IDs de personas asignadas al usuario:', assignedIds);
      setAssignedPersonas(assignedIds);
      
      // Limpiar la selección al cargar nuevas personas asignadas
      setSelectedPersonas([]);
      
      // Actualizar los permisos basados en los permisos reales
      if (userPermissions.length > 0) {
        // Verificar si algún permiso tiene canView o canManage
        const hasViewPermission = userPermissions.some(p => p.canView);
        const hasManagePermission = userPermissions.some(p => p.canManage);
        
        setPermissions({
          viewSpecific: hasViewPermission,
          manageAll: hasManagePermission
        });
        
        console.log(`Actualizando checkboxes: viewSpecific=${hasViewPermission}, manageAll=${hasManagePermission}`);
      }
    } catch (error) {
      console.error('Error al cargar personas asignadas:', error);
    }
  };

  // Verificar si una persona está asignada
  const isPersonaAssigned = (personaId: string | number) => {
    const personaIdStr = personaId.toString();
    const result = assignedPersonas.includes(personaIdStr);
    console.log(`Verificando si persona ${personaIdStr} está asignada: ${result}`);
    return result;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Permiso de Personas"
      maxWidth="max-w-5xl"
    >
      <div className="space-y-4">
        {/* Información del colaborador */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Editando permisos para
          </h4>

          <div className="flex items-center">
            <div className="relative h-9 w-9 rounded-full overflow-hidden bg-primary-100 dark:bg-primary-500/10
                        ring-2 ring-primary-500/20 dark:ring-primary-500/30">
              {permission.user.photoUrl ? (
                <img
                  src={getPhotoUrl(permission.user.photoUrl)}
                  alt={permission.user.nombre}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(permission.user.nombre || 'U')}&background=6366f1&color=fff`;
                  }}
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-[#4F46E5] text-white font-medium">
                  {(permission.user.nombre?.[0] || 'U').toUpperCase()}
                </div>
              )}
            </div>
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {permission.user.nombre}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {permission.user.email}
              </div>
            </div>
          </div>
        </div>
        
        {/* Layout de dos columnas para pantallas medianas y grandes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Columna izquierda: Cantón y persona asignada */}
          <div className="space-y-3">
            {/* Selector de cantones */}
            {cantones.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Cantón
                </h4>
                
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCantonSelector(!showCantonSelector)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm bg-white dark:bg-gray-700 
                             border border-gray-300 dark:border-gray-600 rounded-md shadow-sm 
                             focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <div className="flex items-center">
                      <MapPinIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                      <span className="text-gray-700 dark:text-gray-200 text-sm truncate">
                        {cantones.find(c => c.id === selectedCantonId)?.nombre || 'Seleccionar cantón'}
                      </span>
                    </div>
                    <ChevronDownIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </button>
                  
                  {showCantonSelector && (
                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 shadow-lg rounded-md border border-gray-200 dark:border-gray-600 max-h-48 overflow-y-auto">
                      {cantones.map(canton => (
                        <button
                          key={canton.id}
                          type="button"
                          onClick={() => {
                            setSelectedCantonId(canton.id);
                            setShowCantonSelector(false);
                            // Limpiar selección de personas al cambiar de cantón
                            setSelectedPersonas([]);
                            // Cargar personas del cantón seleccionado
                            loadAvailablePersonas();
                          }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center
                                   ${selectedCantonId === canton.id ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-200'}`}
                        >
                          <MapPinIcon className={`h-4 w-4 mr-2 ${selectedCantonId === canton.id ? 'text-primary-500 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`} />
                          {canton.nombre}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Información de la persona */}
            {permission.persona && (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Persona asignada
                </h4>
                
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <PersonIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {permission.persona.nombre ? formatPersonName(permission.persona.nombre) : 'Sin nombre'}
                    </div>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                        {permission.persona.cedula || 'Sin cédula'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {permission.persona.canton && (
                  <div className="mt-2 flex items-center">
                    <div className="flex-shrink-0 h-4 w-4 text-gray-500 dark:text-gray-400">
                      <MapPinIcon className="h-4 w-4" />
                    </div>
                    <div className="ml-2 text-xs text-gray-700 dark:text-gray-300">
                      Cantón: {permission.persona.canton.nombre}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Permisos */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Permisos
              </h4>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={permissions.viewSpecific}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    setPermissions(prev => ({
                      ...prev,
                      viewSpecific: isChecked
                    }));
                    console.log(`Checkbox "Ver personas específicas" cambiado a: ${isChecked}`);
                  }}
                  className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-primary-800"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Ver personas específicas
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={permissions.manageAll}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    setPermissions(prev => ({
                      ...prev,
                      manageAll: isChecked
                    }));
                    console.log(`Checkbox "Gestionar personas del cantón" cambiado a: ${isChecked}`);
                  }}
                  className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-primary-800"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Gestionar personas del cantón
                </span>
              </label>
            </div>
          </div>
        </div>

          {/* Columna derecha: Agregar más personas */}
          <div className="space-y-3">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  Agregar más personas
                </h4>
              </div>
              
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="bg-white dark:bg-gray-800 p-2 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center relative">
                    <input
                      type="text"
                      placeholder="Buscar personas por nombre o cédula..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md 
                               focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                               dark:bg-gray-700 dark:text-white"
                    />
                    <MagnifyingGlassIcon className="absolute left-2.5 h-3.5 w-3.5 text-gray-400" />
                  </div>
                </div>
                
                <div className="max-h-56 overflow-y-auto p-2 bg-white dark:bg-gray-800">
                  {loadingPersonas ? (
                    <div className="text-center py-3 text-sm text-gray-500 dark:text-gray-400">
                      Cargando personas...
                    </div>
                  ) : filteredPersonas.length === 0 ? (
                    <div className="text-center py-3 text-sm text-gray-500 dark:text-gray-400">
                      {selectedCantonId 
                        ? 'No se encontraron personas en este cantón' 
                        : 'Seleccione un cantón para ver personas disponibles'}
                    </div>
                  ) : (
                    <div>
                      {/* Título con el nombre del usuario */}
                      <div className="flex justify-between items-center mb-2 px-1">
                        <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
                          Personas asignadas a {permission.user.nombre}
                        </div>
                        {(countPersonasToAdd() > 0 || countPersonasToRemove() > 0) && (
                          <div className="text-xs">
                            {countPersonasToAdd() > 0 && (
                              <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full dark:bg-green-900/30 dark:text-green-400 mr-1">
                                +{countPersonasToAdd()}
                              </span>
                            )}
                            {countPersonasToRemove() > 0 && (
                              <span className="bg-red-100 text-red-800 px-1.5 py-0.5 rounded-full dark:bg-red-900/30 dark:text-red-400">
                                -{countPersonasToRemove()}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-1 gap-1">
                        {filteredPersonas.map(persona => {
                          const isAssigned = isPersonaAssigned(persona.id);
                          const isSelected = selectedPersonas.includes(persona.id);
                          
                          // Depuración para cada persona
                          console.log(`Persona ${persona.id} (${persona.nombre}): asignada=${isAssigned}, seleccionada=${isSelected}`);
                          
                          // Las personas asignadas deben aparecer marcadas por defecto
                          const isChecked = isAssigned || isSelected;
                          
                          return (
                            <label 
                              key={persona.id} 
                              className={`flex items-center p-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md cursor-pointer transition-colors ${
                                isChecked ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30' : ''
                              } ${isAssigned && isSelected ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30' : ''}`}
                            >
                              <div className="relative flex items-center">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => togglePersonaSelection(persona.id)}
                                  className={`w-4 h-4 rounded border-gray-300 shadow-sm focus:ring focus:ring-opacity-50 dark:border-gray-600 dark:bg-gray-700 ${
                                    isAssigned && isSelected 
                                      ? 'text-red-600 focus:border-red-300 focus:ring-red-200 dark:focus:ring-red-800' 
                                      : 'text-blue-600 focus:border-blue-300 focus:ring-blue-200 dark:focus:ring-blue-800'
                                  }`}
                                />
                                {isAssigned && !isSelected && (
                                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                  </span>
                                )}
                                {isAssigned && isSelected && (
                                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                    <span className="animate-pulse relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                  </span>
                                )}
                              </div>
                              <div className="ml-2 flex items-center flex-1 min-w-0">
                                <div className={`flex-shrink-0 h-7 w-7 rounded-full ${
                                  isAssigned && isSelected
                                    ? 'bg-red-100 dark:bg-red-800/30'
                                    : isChecked 
                                      ? 'bg-blue-100 dark:bg-blue-800/30' 
                                      : 'bg-gray-100 dark:bg-gray-700'
                                } flex items-center justify-center mr-2`}>
                                  <PersonIcon className={`h-3.5 w-3.5 ${
                                    isAssigned && isSelected
                                      ? 'text-red-600 dark:text-red-400'
                                      : isChecked
                                        ? 'text-blue-600 dark:text-blue-400' 
                                        : 'text-gray-600 dark:text-gray-400'
                                  }`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className={`text-sm font-medium ${
                                    isAssigned && isSelected
                                      ? 'text-red-700 dark:text-red-300'
                                      : isChecked
                                        ? 'text-blue-700 dark:text-blue-300' 
                                        : 'text-gray-900 dark:text-white'
                                  } truncate`}>
                                    {persona.nombre ? formatPersonName(persona.nombre) : 'Sin nombre'}
                                    {isAssigned && !isSelected && (
                                      <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded dark:bg-blue-900/30 dark:text-blue-300">
                                        Asignada
                                      </span>
                                    )}
                                    {isAssigned && isSelected && (
                                      <span className="ml-1 text-xs bg-red-100 text-red-800 px-1 py-0.5 rounded dark:bg-red-900/30 dark:text-red-300">
                                        Desasignar
                                      </span>
                                    )}
                                    {!isAssigned && isSelected && (
                                      <span className="ml-1 text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded dark:bg-green-900/30 dark:text-green-300">
                                        Asignar
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {persona.cedula || 'Sin cédula'}
                                  </div>
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4">
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
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
              disabled={loading}
              className="w-full sm:w-auto px-3 py-1.5 text-sm font-medium text-white bg-primary-600 
                     border border-transparent rounded-lg shadow-sm hover:bg-primary-700 
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
                       disabled:opacity-70 disabled:cursor-not-allowed"
          >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
      </div>
    </Modal>
  );
}; 
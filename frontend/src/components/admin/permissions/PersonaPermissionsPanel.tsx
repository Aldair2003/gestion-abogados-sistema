import { useState, useEffect, useCallback, useRef } from 'react';
import { PlusIcon, ExclamationTriangleIcon, PencilIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { MapPinIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';
import { permissionService } from '../../../services/permissionService';
import { User, Persona, PersonaPermission, CantonPermission } from '../../../types/permissions';
import { getPhotoUrl } from '../../../utils/urls';
import { AssignPersonaPermissionModal } from './AssignPersonaPermissionModal';
import { EditPersonaPermissionModal } from './EditPersonaPermissionModal';
import { Dialog } from '@headlessui/react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';

// Evento personalizado para sincronizar permisos entre componentes
const PERMISSION_SYNC_EVENT = 'permission-sync';

/**
 * Función para disparar el evento de sincronización de permisos
 * @param detail Detalles opcionales para el evento
 */
export const triggerPermissionSync = (detail?: any) => {
  const event = new CustomEvent(PERMISSION_SYNC_EVENT, { detail });
  window.dispatchEvent(event);
  console.log('Evento de sincronización de permisos disparado:', detail);
};

/**
 * Hook para sincronizar permisos entre componentes
 * @param callback Función a ejecutar cuando se dispara el evento de sincronización
 */
const usePermissionSync = (callback: (forceReload?: boolean) => void) => {
  useEffect(() => {
    // Función para manejar el evento de sincronización
    const handleSync = (event: CustomEvent) => {
      console.log('Evento de sincronización de permisos recibido:', event.detail);
      callback(true); // Forzar recarga de datos
    };

    // Registrar el evento
    window.addEventListener(PERMISSION_SYNC_EVENT, handleSync as EventListener);

    // Limpiar el evento al desmontar
    return () => {
      window.removeEventListener(PERMISSION_SYNC_EVENT, handleSync as EventListener);
    };
  }, [callback]);
};

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

// Icono de grupo de usuarios
const UserGroupIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth="1.5" 
    stroke="currentColor" 
    className={className}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
  </svg>
);

// Interfaz para permisos agrupados por usuario
interface GroupedPersonaPermission {
  userId: string;
  user: {
    id: string;
    nombre: string;
    email: string;
    photoUrl?: string;
  };
  cantones: any[];
  permissions: {
    canView: boolean;
    canManage: boolean;
  };
  personas: {
    id: string;
    nombre: string;
    cedula: string;
    canton?: any;
  }[];
  updatedAt: string;
}

export const PersonaPermissionsPanel = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<PersonaPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<PersonaPermission | null>(null);
  const [permissionToRevoke, setPermissionToRevoke] = useState<PersonaPermission | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [imageErrors, setImageErrors] = useState<{[key: string]: boolean}>({});
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [groupedPermissions, setGroupedPermissions] = useState<GroupedPersonaPermission[]>([]);
  const [showPersonasModal, setShowPersonasModal] = useState(false);
  const [selectedUserPersonas, setSelectedUserPersonas] = useState<{
    user: { id: string; nombre: string; email: string; photoUrl?: string };
    personas: { id: string; nombre: string; cedula: string; canton?: any }[];
  } | null>(null);
  const [userCanManagePersonas, setUserCanManagePersonas] = useState(false);
  const [cantonPermissions, setCantonPermissions] = useState<CantonPermission[]>([]);
  
  // Definir loadPermissions como useCallback para evitar recreaciones innecesarias
  const loadPermissions = useCallback(async (forceReload = false) => {
    setLoading(true);
    try {
      const response = await permissionService.getPersonaPermissions(forceReload);
      console.log('Permisos cargados:', response);
      
      // Guardar los permisos originales para operaciones individuales
      setPermissions(Array.isArray(response) ? response : []);
      
      // Agrupar permisos por usuario
      if (Array.isArray(response) && response.length > 0) {
        const groupedByUser: { [key: string]: GroupedPersonaPermission } = {};
        
        response.forEach(permission => {
          const userId = permission.user.id;
          
          if (!groupedByUser[userId]) {
            groupedByUser[userId] = {
              userId,
              user: permission.user,
              cantones: [],
              permissions: {
                canView: permission.canView,
                canManage: permission.canManage
              },
              personas: [],
              updatedAt: permission.updatedAt
            };
          }
          
          // Añadir cantones únicos
          if (permission.cantones && permission.cantones.length > 0) {
            permission.cantones.forEach(canton => {
              if (!groupedByUser[userId].cantones.some(c => c.id === canton.id)) {
                groupedByUser[userId].cantones.push(canton);
              }
            });
          } else if (permission.persona && permission.persona.canton) {
            if (!groupedByUser[userId].cantones.some(c => c.id === permission.persona.canton.id)) {
              groupedByUser[userId].cantones.push(permission.persona.canton);
            }
          }
          
          // Añadir persona si existe
          if (permission.persona) {
            if (!groupedByUser[userId].personas.some(p => p.id === permission.persona.id)) {
              groupedByUser[userId].personas.push(permission.persona);
            }
          }
          
          // Actualizar permisos (si alguno tiene canManage, se mantiene)
          if (permission.canManage) {
            groupedByUser[userId].permissions.canManage = true;
          }
          if (permission.canView) {
            groupedByUser[userId].permissions.canView = true;
          }
          
          // Actualizar fecha (usar la más reciente)
          if (new Date(permission.updatedAt) > new Date(groupedByUser[userId].updatedAt)) {
            groupedByUser[userId].updatedAt = permission.updatedAt;
          }
        });
        
        setGroupedPermissions(Object.values(groupedByUser));
      } else {
        setGroupedPermissions([]);
      }
    } catch (error) {
      console.error('Error cargando permisos:', error);
      toast.error('Error al cargar los permisos');
      setPermissions([]);
      setGroupedPermissions([]);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Usar el hook de sincronización de permisos
  usePermissionSync(loadPermissions);

  useEffect(() => {
    loadPermissions();
    loadUsersAndPersonas();
    loadCantonPermissions();
  }, [loadPermissions]);

  // Verificar si el usuario tiene permisos para gestionar personas
  useEffect(() => {
    if (user && cantonPermissions.length > 0) {
      // Si es admin, siempre puede gestionar
      if (user.rol === 'ADMIN') {
        setUserCanManagePersonas(true);
        return;
      }

      // Verificar si tiene permiso de gestión en algún cantón
      const hasManagePermission = cantonPermissions.some((permission: CantonPermission) => 
        permission.user.id === user.id.toString() && permission.permissions.edit === true
      );
      
      setUserCanManagePersonas(hasManagePermission);
      console.log('Usuario puede gestionar personas:', hasManagePermission);
    }
  }, [user, cantonPermissions]);

  const loadCantonPermissions = async () => {
    try {
      const permissions = await permissionService.getCantonPermissions();
      setCantonPermissions(permissions);
      console.log('Permisos de cantones cargados:', permissions);
    } catch (error) {
      console.error('Error al cargar permisos de cantones:', error);
    }
  };

  const loadUsersAndPersonas = async () => {
    try {
      const [usersResponse, personasResponse] = await Promise.all([
        permissionService.getCollaborators(),
        permissionService.getPersonas()
      ]);
      
      if (usersResponse && usersResponse.data) {
        console.log('Colaboradores cargados:', usersResponse.data);
        setUsers(usersResponse.data);
      } else {
        console.warn('No se recibieron datos de colaboradores');
        setUsers([]);
      }
      
      if (Array.isArray(personasResponse)) {
        console.log('Personas cargadas:', personasResponse);
        setPersonas(personasResponse);
      } else {
        console.warn('No se recibieron datos de personas');
        setPersonas([]);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar usuarios y personas');
      setUsers([]);
      setPersonas([]);
    }
  };

  const handleAssignPermission = async (data: any) => {
    try {
      console.log('Datos recibidos para asignar permisos:', data);
      
      // Asegurarse de que los datos estén en el formato correcto
      const formattedData = {
        userId: typeof data.userId === 'string' ? parseInt(data.userId) : data.userId,
        personaIds: Array.isArray(data.personaIds) 
          ? data.personaIds.map((id: string | number) => typeof id === 'string' ? parseInt(id) : id)
          : [],
        cantonId: typeof data.cantonId === 'string' ? parseInt(data.cantonId) : data.cantonId,
        permissions: {
          canView: Boolean(data.permissions?.canView),
          canCreate: Boolean(data.permissions?.canCreate),
          canEdit: Boolean(data.permissions?.canEdit)
        }
      };
      
      console.log('Datos formateados para enviar al backend:', formattedData);
      const response = await permissionService.assignPersonaPermission(formattedData);
      console.log('Respuesta de asignación de permisos:', response);
      
      toast.success('Permisos asignados correctamente');
      
      // Forzar la recarga de permisos para asegurar que se muestren los nuevos
      await loadPermissions(true);
      
      setShowAssignModal(false);
    } catch (error) {
      console.error('Error asignando permisos:', error);
      toast.error('Error al asignar los permisos');
    }
  };

  const handleEditPermission = (permission: PersonaPermission) => {
    setSelectedPermission(permission);
    setShowEditModal(true);
  };

  const handleRevokePermission = (permission: PersonaPermission) => {
    setPermissionToRevoke(permission);
    setShowDeleteConfirm(true);
  };

  const confirmRevoke = async () => {
    if (!permissionToRevoke) return;
    
    try {
      await permissionService.revokePersonaPermission(permissionToRevoke.id);
      toast.success('Permiso revocado correctamente');
      loadPermissions(true);
      setShowDeleteConfirm(false);
      setPermissionToRevoke(null);
    } catch (error) {
      console.error('Error revocando permiso:', error);
      toast.error('Error al revocar el permiso');
    }
  };

  const handleImageError = (userId: string) => {
    setImageErrors(prev => ({ ...prev, [userId]: true }));
  };

  // Efecto para detectar si se puede desplazar horizontalmente
  useEffect(() => {
    const checkScroll = () => {
      const container = tableContainerRef.current;
      if (container) {
        setCanScrollLeft(container.scrollLeft > 0);
        setCanScrollRight(
          container.scrollLeft < container.scrollWidth - container.clientWidth - 5
        );
      }
    };

    const container = tableContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      // Verificar inicialmente
      checkScroll();
      
      // Verificar después de que el contenido se haya cargado
      window.addEventListener('resize', checkScroll);
    }
    
    return () => {
      if (container) {
        container.removeEventListener('scroll', checkScroll);
      }
      window.removeEventListener('resize', checkScroll);
    };
  }, [permissions]);

  // Agregar estilos CSS para ocultar la barra de desplazamiento
  useEffect(() => {
    // Crear un elemento de estilo
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .permissions-table-container::-webkit-scrollbar {
        display: none;
      }
      
      @media (max-width: 768px) {
        .permissions-table-container {
          -webkit-overflow-scrolling: touch;
          overflow-x: auto;
          scroll-snap-type: x proximity;
        }
        
        .permissions-table-container table {
          width: max-content;
          min-width: 100%;
        }
        
        .permissions-table-container th,
        .permissions-table-container td {
          white-space: nowrap;
        }
        
        .permissions-table-container .hidden-mobile {
          display: none;
        }
      }
    `;
    
    // Agregar el elemento de estilo al head del documento
    document.head.appendChild(styleElement);
    
    // Limpiar el elemento de estilo cuando el componente se desmonte
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const handleScrollLeft = () => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  const handleViewPersonas = (groupedPermission: GroupedPersonaPermission) => {
    setSelectedUserPersonas({
      user: groupedPermission.user,
      personas: groupedPermission.personas
    });
    setShowPersonasModal(true);
  };

  // Función para manejar el cierre del modal de edición
  const handleEditModalClose = () => {
    setShowEditModal(false);
    setSelectedPermission(null);
    // Recargar los permisos después de cerrar el modal
    loadPermissions();
  };

  // Función para manejar el guardado de permisos
  const handlePermissionSaved = () => {
    // Recargar los permisos después de guardar
    loadPermissions();
    // Cerrar el modal
    setShowEditModal(false);
    setSelectedPermission(null);
  };

  return (
    <div className="space-y-6">
      {/* Header con botón de asignar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Permisos de Personas
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gestione los permisos de acceso a personas para los colaboradores
          </p>
        </div>
        
        {userCanManagePersonas && (
          <button
            onClick={() => setShowAssignModal(true)}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent 
                     rounded-lg shadow-sm text-sm font-medium text-white 
                     bg-primary-600 hover:bg-primary-700 w-full sm:w-auto
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Asignar Permiso
          </button>
        )}
      </div>

      {/* Tabla de permisos */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden relative">
        {/* Indicadores de desplazamiento horizontal */}
        {canScrollLeft && (
          <button 
            onClick={handleScrollLeft}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 items-center justify-center 
                     bg-white dark:bg-gray-700 rounded-full shadow-lg border border-gray-200 dark:border-gray-600
                     text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400
                     transition-all duration-200"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
        )}
        
        {canScrollRight && (
          <button 
            onClick={handleScrollRight}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 items-center justify-center 
                     bg-white dark:bg-gray-700 rounded-full shadow-lg border border-gray-200 dark:border-gray-600
                     text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400
                     transition-all duration-200"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        )}
        
        <div 
          ref={tableContainerRef}
          className="permissions-table-container overflow-x-auto scrollbar-hide touch-pan-x" 
          style={{ 
            WebkitOverflowScrolling: 'touch', 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            position: 'relative',
            overflowY: 'hidden'
          }}>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <colgroup>
              <col className="w-[180px] sm:w-auto" />
              <col className="w-[180px] sm:w-auto" />
              <col className="w-[150px] sm:w-auto" />
              <col className="w-[150px] sm:w-auto" />
              <col className="w-[180px] sm:w-auto" />
              <col className="w-[120px] sm:w-auto" />
            </colgroup>
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Colaborador
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cantones
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Permisos
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Personas
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Última Modificación
                </th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-3 sm:px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    Cargando permisos...
                  </td>
                </tr>
              ) : groupedPermissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 sm:px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No hay permisos asignados
                  </td>
                </tr>
              ) : (
                groupedPermissions.map((groupedPermission) => (
                  <tr key={groupedPermission.userId} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-3 sm:px-6 py-4">
                      <div className="flex items-center">
                        <div className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full overflow-hidden bg-primary-100 dark:bg-primary-500/10
                                    ring-2 ring-primary-500/20 dark:ring-primary-500/30">
                          {groupedPermission.user.photoUrl && !imageErrors[groupedPermission.user.id] ? (
                            <img
                              src={getPhotoUrl(groupedPermission.user.photoUrl)}
                              alt={groupedPermission.user.nombre}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(groupedPermission.user.nombre || 'U')}&background=6366f1&color=fff`;
                                handleImageError(groupedPermission.user.id);
                              }}
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-[#4F46E5] text-white font-medium">
                              {(groupedPermission.user.nombre?.[0] || 'U').toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="ml-3 sm:ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[120px] sm:max-w-none">
                            {groupedPermission.user.nombre}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate max-w-[120px] sm:max-w-none">
                            {groupedPermission.user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4">
                      <div className="flex flex-wrap gap-2 max-w-[150px] sm:max-w-md">
                        {groupedPermission.cantones.length > 0 ? (
                          groupedPermission.cantones.map((canton) => (
                            <span
                              key={canton.id}
                              className="group relative inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium 
                                       bg-gradient-to-br from-primary-50 to-primary-100 
                                       dark:from-primary-900/50 dark:to-primary-800/50
                                       text-primary-700 dark:text-primary-300
                                       border border-primary-200/50 dark:border-primary-700/50
                                       shadow-sm hover:shadow-md transition-all duration-200"
                            >
                              <MapPinIcon className="h-3 w-3 sm:h-4 sm:w-4 text-primary-500 dark:text-primary-400" />
                              <span className="truncate">{canton.nombre}</span>
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Sin cantones asignados
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {groupedPermission.permissions.canView && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium 
                                         bg-blue-100 text-blue-800 dark:bg-blue-900/70 dark:text-blue-300
                                         border border-blue-200 dark:border-blue-800">
                            Ver
                          </span>
                        )}
                        {groupedPermission.permissions.canManage && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium 
                                         bg-green-100 text-green-800 dark:bg-green-900/70 dark:text-green-300
                                         border border-green-200 dark:border-green-800">
                            Gestionar
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4">
                      {groupedPermission.personas.length === 1 ? (
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                            <PersonIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {groupedPermission.personas[0].nombre}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {groupedPermission.personas[0].cedula}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleViewPersonas(groupedPermission)}
                          className="flex flex-col items-center justify-center gap-1 px-8 py-2 rounded-md 
                                   bg-gradient-to-br from-primary-50 to-primary-100 
                                   dark:from-primary-900/50 dark:to-primary-800/50
                                   text-primary-700 dark:text-primary-300
                                   border border-primary-200/50 dark:border-primary-700/50
                                   shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          <UserGroupIcon className="h-4 w-4 text-primary-500 dark:text-primary-400" />
                          <span className="text-xs font-medium whitespace-nowrap">{groupedPermission.personas.length} personas</span>
                        </button>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(groupedPermission.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            // Buscar el primer permiso para este usuario para editar
                            const permissionToEdit = permissions.find(p => p.user.id === groupedPermission.userId);
                            if (permissionToEdit) {
                              handleEditPermission(permissionToEdit);
                            }
                          }}
                          className="inline-flex items-center p-1.5 sm:p-2 rounded-lg transition-colors
                                   text-blue-600 hover:text-blue-700 hover:bg-blue-50
                                   dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/50"
                        >
                          <PencilIcon className="h-4 w-4" />
                          <span className="hidden sm:inline ml-1">Editar</span>
                        </button>
                        <button
                          onClick={() => {
                            // Buscar el primer permiso para este usuario para revocar
                            const permissionToRevoke = permissions.find(p => p.user.id === groupedPermission.userId);
                            if (permissionToRevoke) {
                              handleRevokePermission(permissionToRevoke);
                            }
                          }}
                          className="inline-flex items-center p-1.5 sm:p-2 rounded-lg transition-colors
                                   text-red-600 hover:text-red-700 hover:bg-red-50
                                   dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/50"
                        >
                          <TrashIcon className="h-4 w-4" />
                          <span className="hidden sm:inline ml-1">Revocar</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Instrucciones de desplazamiento para móviles */}
      <div className="md:hidden flex justify-center items-center text-xs text-gray-500 dark:text-gray-400 mt-2 mb-1">
        <span className="text-center">
          Desliza horizontalmente para ver más contenido
        </span>
      </div>

      {/* Instrucciones de desplazamiento para PC */}
      <div className="hidden md:flex justify-center items-center text-xs text-gray-500 dark:text-gray-400 mt-2 mb-1">
        <span className="flex items-center gap-1">
          <span>Usa las flechas</span>
          <ChevronLeftIcon className="h-3 w-3" />
          <ChevronRightIcon className="h-3 w-3" />
          <span>o desplázate horizontalmente para ver más contenido</span>
        </span>
      </div>

      {/* Modal de confirmación de eliminación */}
      <Dialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        className="relative z-[9001]"
      >
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className={`w-full max-w-md transform overflow-hidden rounded-2xl p-6 text-left align-middle shadow-xl transition-all ${
            isDarkMode 
              ? 'bg-gray-900 border border-gray-700/50' 
              : 'bg-white border border-gray-200'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                isDarkMode ? 'bg-red-500/10' : 'bg-red-100'
              }`}>
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <Dialog.Title className={`text-base font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Confirmar eliminación
                </Dialog.Title>
                <p className={`mt-1 text-sm ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  ¿Está seguro de eliminar los permisos de {permissionToRevoke?.user.nombre} para {permissionToRevoke?.persona?.nombre || 'esta persona'}? Esta acción no se puede deshacer.
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700/50 hover:bg-gray-700 text-gray-300' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmRevoke}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white"
              >
                Eliminar
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Modal para asignar permisos */}
      <AssignPersonaPermissionModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onAssign={handleAssignPermission}
        users={users}
        personas={personas}
      />

      {/* Modal de edición de permisos */}
      {showEditModal && selectedPermission && (
        <EditPersonaPermissionModal
          isOpen={showEditModal}
          onClose={handleEditModalClose}
          permission={selectedPermission}
          onSave={handlePermissionSaved}
        />
      )}

      {/* Modal para ver todas las personas de un colaborador */}
      <Dialog
        open={showPersonasModal}
        onClose={() => setShowPersonasModal(false)}
        className="relative z-[9001]"
      >
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className={`w-full max-w-md sm:max-w-lg md:max-w-xl transform overflow-hidden rounded-2xl p-4 sm:p-6 text-left align-middle shadow-xl transition-all ${
            isDarkMode 
              ? 'bg-gray-900 border border-gray-700/50' 
              : 'bg-white border border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 rounded-full overflow-hidden bg-primary-100 dark:bg-primary-500/10
                            ring-2 ring-primary-500/20 dark:ring-primary-500/30">
                  {selectedUserPersonas?.user.photoUrl && !imageErrors[selectedUserPersonas.user.id] ? (
                    <img
                      src={getPhotoUrl(selectedUserPersonas.user.photoUrl)}
                      alt={selectedUserPersonas.user.nombre}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUserPersonas.user.nombre || 'U')}&background=6366f1&color=fff`;
                        handleImageError(selectedUserPersonas.user.id);
                      }}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-[#4F46E5] text-white font-medium">
                      {(selectedUserPersonas?.user.nombre?.[0] || 'U').toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <Dialog.Title className={`text-lg font-semibold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Personas asignadas a {selectedUserPersonas?.user.nombre}
                  </Dialog.Title>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    {selectedUserPersonas?.user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPersonasModal(false)}
                className={`p-2 rounded-full ${
                  isDarkMode 
                    ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-300' 
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                }`}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className={`mt-4 border rounded-lg overflow-hidden ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className={`px-4 py-3 ${
                isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'
              }`}>
                <div className="grid grid-cols-12 gap-4 text-xs font-medium uppercase tracking-wider">
                  <div className="col-span-7 sm:col-span-5 text-left text-gray-500 dark:text-gray-400">Nombre</div>
                  <div className="col-span-5 sm:col-span-3 text-left text-gray-500 dark:text-gray-400">Cédula</div>
                  <div className="hidden sm:block sm:col-span-4 text-left text-gray-500 dark:text-gray-400">Cantón</div>
                </div>
              </div>
              
              <div className={`divide-y ${
                isDarkMode ? 'divide-gray-700' : 'divide-gray-200'
              }`}>
                {selectedUserPersonas?.personas.map(persona => (
                  <div key={persona.id} className="px-4 py-3 grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-7 sm:col-span-5 flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mr-3">
                        <PersonIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {persona.nombre}
                      </div>
                    </div>
                    <div className="col-span-5 sm:col-span-3 text-sm text-gray-500 dark:text-gray-400 truncate">
                      {persona.cedula}
                    </div>
                    <div className="hidden sm:block sm:col-span-4">
                      {persona.canton ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium 
                                       bg-primary-50 dark:bg-primary-900/30
                                       text-primary-700 dark:text-primary-300">
                          <MapPinIcon className="h-3 w-3 text-primary-500 dark:text-primary-400" />
                          <span className="truncate">{persona.canton.nombre}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Sin cantón
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPersonasModal(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  isDarkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Cerrar
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}; 
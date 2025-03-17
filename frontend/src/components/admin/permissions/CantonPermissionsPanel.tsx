import { useState, useEffect, useCallback, useRef } from 'react';
import { PlusIcon, ExclamationTriangleIcon, PencilIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { MapPinIcon } from '@heroicons/react/24/solid';
import { AssignPermissionModal } from './AssignPermissionModal';
import { EditPermissionModal } from './EditPermissionModal';
import { Dialog } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import { permissionService } from '../../../services/permissionService';
import { User, Canton, CantonPermission, CantonPermissionData, PersonaPermissionData, PermissionWithResource } from '../../../types/permissions';
import { getPhotoUrl } from '../../../utils/urls';
import { useTheme } from '../../../contexts/ThemeContext';
import { triggerPermissionSync } from './PersonaPermissionsPanel';

interface GroupedPermission extends Omit<PermissionWithResource, 'canton'> {
  cantones: Canton[];
}

export const CantonPermissionsPanel = () => {
  const { isDarkMode } = useTheme();
  const [permissions, setPermissions] = useState<GroupedPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<PermissionWithResource | null>(null);
  const [permissionToRevoke, setPermissionToRevoke] = useState<GroupedPermission | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [cantones, setCantones] = useState<Canton[]>([]);
  const [imageErrors, setImageErrors] = useState<{[key: string]: boolean}>({});
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPermissions();
    loadUsersAndCantones();
  }, []);

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
      checkScroll();
      
      window.addEventListener('resize', checkScroll);
    }
    
    return () => {
      if (container) {
        container.removeEventListener('scroll', checkScroll);
      }
      window.removeEventListener('resize', checkScroll);
    };
  }, [permissions]);

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .canton-permissions-table-container::-webkit-scrollbar {
        display: none;
      }
      
      @media (max-width: 768px) {
        .canton-permissions-table-container {
          -webkit-overflow-scrolling: touch;
          overflow-x: auto;
          scroll-snap-type: x proximity;
        }
        
        .canton-permissions-table-container table {
          width: max-content;
          min-width: 100%;
        }
        
        .canton-permissions-table-container th,
        .canton-permissions-table-container td {
          white-space: nowrap;
        }
        
        .canton-permissions-table-container .hidden-mobile {
          display: none;
        }
      }
    `;
    
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const loadPermissions = async (reload = false) => {
    if (!reload) {
      setLoading(true);
    }
    try {
      const permissions = await permissionService.getCantonPermissions();
      const groupedPermissions = permissions.reduce((acc: { [key: string]: CantonPermission[] }, permission: CantonPermission) => {
        if (!acc[permission.user.id]) {
          acc[permission.user.id] = [];
        }
        acc[permission.user.id].push(permission);
        return acc;
      }, {});
      
      const uniquePermissions: GroupedPermission[] = (Object.values(groupedPermissions) as CantonPermission[][]).map((userPermissions) => ({
        id: userPermissions[0].id,
        userId: userPermissions[0].user.id,
        user: userPermissions[0].user,
        permissions: userPermissions[0].permissions,
        cantones: userPermissions.map(p => p.canton),
        cantonId: userPermissions[0].cantonId
      }));
      
      setPermissions(uniquePermissions);
    } catch (error) {
      console.error('Error cargando permisos:', error);
      toast.error('Error al cargar los permisos');
    } finally {
      if (!reload) {
        setLoading(false);
      }
    }
  };

  const loadUsersAndCantones = async () => {
    try {
      const [usersResponse, cantonesResponse] = await Promise.all([
        permissionService.getCollaborators(),
        permissionService.getCantones()
      ]);
      
      console.log('Respuesta de colaboradores:', usersResponse);
      console.log('Cantones recibidos:', cantonesResponse);
      
      if (usersResponse && usersResponse.data) {
        console.log('Colaboradores cargados:', usersResponse.data);
        setUsers(usersResponse.data);
      } else {
        console.warn('No se recibieron datos de colaboradores');
        setUsers([]);
      }
      
      if (Array.isArray(cantonesResponse) && cantonesResponse.length > 0) {
        console.log('Cantones cargados:', cantonesResponse);
        setCantones(cantonesResponse);
      } else {
        console.warn('No se recibieron datos de cantones');
        setCantones([]);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar usuarios y cantones');
      setUsers([]);
      setCantones([]);
    }
  };

  const handleAssignPermission = async (data: CantonPermissionData | PersonaPermissionData) => {
    if ('cantonId' in data) {
      try {
        await permissionService.assignCantonPermission({
          userId: data.userId,
          cantonIds: [data.cantonId],
          permissions: {
            view: true,
            edit: data.permissions?.edit || false,
            delete: data.permissions?.delete || false,
            createExpedientes: data.permissions?.createExpedientes || false
          }
        });
        toast.success('Permisos asignados correctamente');
        loadPermissions();
        setShowAssignModal(false);
      } catch (error) {
        console.error('Error asignando permisos:', error);
        toast.error('Error al asignar los permisos');
      }
    }
  };

  const handleSaveEdit = async (permissionId: string, updatedData: {
    cantonIds: string[];
    permissions: {
      view: boolean;
      edit: boolean;
      delete: boolean;
      createExpedientes: boolean;
    };
  }) => {
    try {
      const userId = selectedPermission?.user.id || '';
      
      console.log('Datos actualizados:', {
        permissionId,
        userId,
        cantonIds: updatedData.cantonIds,
        permissions: updatedData.permissions
      });
      
      const previousCantonIds = selectedPermission ? 
        permissions
          .filter(p => p.user.id === userId)
          .map(p => p.cantones[0]?.id).filter(Boolean) : 
        [];
      
      console.log('IDs de cantones anteriores:', previousCantonIds);
      console.log('Nuevos IDs de cantones:', updatedData.cantonIds);
      
      const response = await permissionService.assignMultipleCantonPermissions({
        userId,
        cantonIds: updatedData.cantonIds,
        permissions: updatedData.permissions
      });
      
      console.log('Respuesta de actualización:', response);
      
      const removedCantonIds = previousCantonIds.filter(
        id => !updatedData.cantonIds.includes(id)
      );
      
      console.log('Cantones eliminados:', removedCantonIds);
      
      if (removedCantonIds.length > 0) {
        await permissionService.syncPersonaPermissionsAfterCantonChange(
          userId,
          removedCantonIds,
          'delete'
        );
      }
      
      for (const cantonId of updatedData.cantonIds) {
        if (previousCantonIds.includes(cantonId)) {
          await permissionService.syncPersonaPermissionsAfterCantonChange(
            userId,
            [cantonId],
            'update',
            updatedData.permissions
          );
        } else {
          await permissionService.syncPersonaPermissionsAfterCantonChange(
            userId,
            [cantonId],
            'add',
            updatedData.permissions
          );
        }
      }
      
      triggerPermissionSync({ 
        action: 'cantonPermissionsUpdated', 
        userId 
      });
      
      loadPermissions(true);
      setShowEditModal(false);
      setSelectedPermission(null);
      toast.success('Permisos actualizados correctamente');
    } catch (error) {
      console.error('Error al guardar los permisos:', error);
      toast.error('Error al actualizar los permisos');
    }
  };

  const handleRevokePermission = async (permission: GroupedPermission) => {
    setPermissionToRevoke(permission);
    setShowDeleteConfirm(true);
  };

  const confirmRevoke = async () => {
    if (!permissionToRevoke) return;

    try {
      for (const canton of permissionToRevoke.cantones) {
        try {
          await permissionService.syncPersonaPermissionsAfterCantonChange(
            permissionToRevoke.user.id.toString(),
            [canton.id.toString()],
            'delete'
          );
        } catch (syncError) {
          console.error(`Error sincronizando permisos para el cantón ${canton.id}:`, syncError);
        }
      }
      
      for (const canton of permissionToRevoke.cantones) {
        await permissionService.revokeCantonPermission(
          permissionToRevoke.user.id.toString(),
          canton.id.toString()
        );
      }
      
      triggerPermissionSync({
        action: 'delete',
        userId: permissionToRevoke.user.id.toString(),
        cantonIds: permissionToRevoke.cantones.map(c => c.id)
      });
      
      toast.success('Permisos revocados correctamente');
      loadPermissions();
      setShowDeleteConfirm(false);
      setPermissionToRevoke(null);
    } catch (error) {
      console.error('Error revocando permisos:', error);
      toast.error('Error al revocar los permisos');
    }
  };

  const handleImageError = (userId: string) => {
    setImageErrors(prev => ({ ...prev, [userId]: true }));
  };

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Permisos de Cantones
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gestione los permisos de acceso a cantones para los colaboradores
          </p>
        </div>
        
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
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden relative">
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
          className="canton-permissions-table-container overflow-x-auto scrollbar-hide touch-pan-x" 
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
              <col className="w-[180px] sm:w-auto" />
              <col className="w-[120px] sm:w-auto" />
            </colgroup>
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Colaborador
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cantón
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Permisos
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
                  <td colSpan={5} className="px-3 sm:px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    Cargando permisos...
                  </td>
                </tr>
              ) : permissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 sm:px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No hay permisos asignados
                  </td>
                </tr>
              ) : (
                permissions.map((permission) => (
                  <tr key={permission.user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-3 sm:px-6 py-4">
                      <div className="flex items-center">
                        <div className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full overflow-hidden bg-primary-100 dark:bg-primary-500/10
                                    ring-2 ring-primary-500/20 dark:ring-primary-500/30">
                          {(() => {
                            return permission.user.photoUrl && !imageErrors[permission.user.id] ? (
                              <img
                                src={getPhotoUrl(permission.user.photoUrl)}
                                alt={permission.user.nombre}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(permission.user.nombre || 'U')}&background=6366f1&color=fff`;
                                  handleImageError(permission.user.id);
                                }}
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-[#4F46E5] text-white font-medium">
                                {(permission.user.nombre?.[0] || 'U').toUpperCase()}
                              </div>
                            );
                          })()}
                        </div>
                        <div className="ml-3 sm:ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[120px] sm:max-w-none">
                            {permission.user.nombre}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate max-w-[120px] sm:max-w-none">
                            {permission.user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4">
                      <div className="flex flex-wrap gap-2 max-w-[150px] sm:max-w-md">
                        {permission.cantones.map(canton => (
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
                        ))}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      Ver cantones
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      Hace 2 días
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            const firstPermission: PermissionWithResource = {
                              ...permission,
                              canton: permission.cantones[0],
                              userId: permission.user.id
                            };
                            setSelectedPermission(firstPermission);
                            setShowEditModal(true);
                          }}
                          className="inline-flex items-center p-1.5 sm:p-2 rounded-lg transition-colors
                                   text-blue-600 hover:text-blue-700 hover:bg-blue-50
                                   dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/50"
                        >
                          <PencilIcon className="h-4 w-4" />
                          <span className="hidden sm:inline ml-1">Editar</span>
                        </button>
                        <button
                          onClick={() => handleRevokePermission(permission)}
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

      <div className="md:hidden flex justify-center items-center text-xs text-gray-500 dark:text-gray-400 mt-2 mb-1">
        <span className="text-center">
          Desliza horizontalmente para ver más contenido
        </span>
      </div>

      <div className="hidden md:flex justify-center items-center text-xs text-gray-500 dark:text-gray-400 mt-2 mb-1">
        <span className="flex items-center gap-1">
          <span>Usa las flechas</span>
          <ChevronLeftIcon className="h-3 w-3" />
          <ChevronRightIcon className="h-3 w-3" />
          <span>o desplázate horizontalmente para ver más contenido</span>
        </span>
      </div>

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
                  ¿Está seguro de eliminar los permisos de {permissionToRevoke?.user.nombre} para {permissionToRevoke?.cantones.map(c => c.nombre).join(', ')}? Esta acción no se puede deshacer.
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
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmRevoke}
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

      <AssignPermissionModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onAssign={handleAssignPermission}
        type="canton"
        resources={cantones}
        users={users}
      />

      <EditPermissionModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedPermission(null);
        }}
        permission={selectedPermission}
        onSave={handleSaveEdit}
        type="canton"
      />
    </div>
  );
}; 
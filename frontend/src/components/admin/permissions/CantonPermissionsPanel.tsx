import { useState, useEffect } from 'react';
import { PlusIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { AssignPermissionModal } from './AssignPermissionModal';
import { EditPermissionModal } from './EditPermissionModal';
import { Dialog } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import { permissionService } from '../../../services/permissionService';
import { User, Canton, CantonPermission, CantonPermissionData, PersonaPermissionData } from '../../../types/permissions';
import { getPhotoUrl } from '../../../utils/urls';
import { useTheme } from '../../../contexts/ThemeContext';

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

interface GroupedPermission extends Omit<CantonPermission, 'canton'> {
  cantones: Canton[];
}

export const CantonPermissionsPanel = () => {
  const { isDarkMode } = useTheme();
  const [permissions, setPermissions] = useState<GroupedPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<CantonPermission | null>(null);
  const [permissionToRevoke, setPermissionToRevoke] = useState<GroupedPermission | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [cantones, setCantones] = useState<Canton[]>([]);
  const [imageErrors, setImageErrors] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    loadPermissions();
    loadUsersAndCantones();
  }, []);

  const loadPermissions = async () => {
    setLoading(true);
    try {
      const permissions = await permissionService.getCantonPermissions();
      // Agrupar permisos por usuario
      const groupedPermissions = permissions.reduce((acc: { [key: string]: CantonPermission[] }, permission: CantonPermission) => {
        if (!acc[permission.user.id]) {
          acc[permission.user.id] = [];
        }
        acc[permission.user.id].push(permission);
        return acc;
      }, {});
      
      // Convertir el objeto agrupado en un array de permisos únicos por usuario
      const uniquePermissions: GroupedPermission[] = (Object.values(groupedPermissions) as CantonPermission[][]).map((userPermissions) => ({
        id: userPermissions[0].id,
        userId: userPermissions[0].userId,
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
      setLoading(false);
    }
  };

  const loadUsersAndCantones = async () => {
    try {
      const [usersResponse, cantonesResponse] = await Promise.all([
        permissionService.getCollaborators(),
        permissionService.getCantones()
      ]);
      
      console.log('Cantones recibidos:', cantonesResponse);
      console.log('Estructura de cantones:', {
        cantones: cantonesResponse,
        primerCanton: cantonesResponse[0]
      });
      
      const users = usersResponse.data.data || [];
      setCantones(cantonesResponse);
      setUsers(users);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar usuarios y cantones');
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

  const handleSaveEdit = async (permissionId: string, updatedData: { cantonIds: string[], permissions: { view: boolean, edit: boolean, delete: boolean, createExpedientes: boolean } }) => {
    try {
      await permissionService.assignMultipleCantonPermissions({
        userId: selectedPermission?.user.id || '',
        cantonIds: updatedData.cantonIds,
        permissions: updatedData.permissions
      });
      
      toast.success('Permisos actualizados correctamente');
      loadPermissions();
      setShowEditModal(false);
    } catch (error) {
      console.error('Error actualizando permisos:', error);
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
      // Revocar todos los permisos de cantones del usuario
      for (const canton of permissionToRevoke.cantones) {
        await permissionService.revokeCantonPermission(
          permissionToRevoke.userId.toString(),
          canton.id.toString()
        );
      }
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

  return (
    <div className="space-y-6">
      {/* Header con botón de asignar */}
      <div className="flex justify-between items-center">
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
          className="inline-flex items-center px-4 py-2 border border-transparent 
                   rounded-lg shadow-sm text-sm font-medium text-white 
                   bg-primary-600 hover:bg-primary-700 
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Asignar Permiso
        </button>
      </div>

      {/* Tabla de permisos */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Colaborador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cantón
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Permisos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Última Modificación
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    Cargando permisos...
                  </td>
                </tr>
              ) : permissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No hay permisos asignados
                  </td>
                </tr>
              ) : (
                permissions.map((permission) => (
                  <tr key={permission.user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden bg-primary-100 dark:bg-primary-500/10
                                      ring-2 ring-primary-500/20 dark:ring-primary-500/30">
                          {(() => {
                            return permission.user.photoUrl && !imageErrors[permission.user.id] ? (
                              <img
                                src={getPhotoUrl(permission.user.photoUrl)}
                                alt={permission.user.nombre}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(permission.user.nombre)}&background=6366f1&color=fff`;
                                  handleImageError(permission.user.id);
                                }}
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-[#4F46E5] text-white font-medium">
                                {permission.user.nombre[0].toUpperCase()}
                              </div>
                            );
                          })()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {permission.user.nombre}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {permission.user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2 max-w-md">
                        {permission.cantones.map(canton => (
                          <span
                            key={canton.id}
                            className="group relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium 
                                     bg-gradient-to-br from-primary-50 to-primary-100 
                                     dark:from-primary-900/50 dark:to-primary-800/50
                                     text-primary-700 dark:text-primary-300
                                     border border-primary-200/50 dark:border-primary-700/50
                                     shadow-sm hover:shadow-md transition-all duration-200
                                     hover:scale-105 transform"
                          >
                            <MapPinIcon className="h-4 w-4 text-primary-500 dark:text-primary-400" />
                            <span className="truncate">{canton.nombre}</span>
                            {canton.provincia && (
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1.5 text-xs
                                            bg-gray-900/95 text-white rounded-lg opacity-0 group-hover:opacity-100
                                            transition-all duration-200 pointer-events-none whitespace-nowrap z-10
                                            shadow-lg backdrop-blur-sm border border-gray-700/50
                                            group-hover:translate-y-0 translate-y-1">
                                <div className="flex items-center gap-2">
                                  <MapPinIcon className="h-3.5 w-3.5" />
                                  <span className="font-medium">Provincia: {canton.provincia}</span>
                                </div>
                              </div>
                            )}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        Ver cantones
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      Hace 2 días
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          // Convertir el permiso agrupado a CantonPermission para el modal de edición
                          const firstPermission: CantonPermission = {
                            ...permission,
                            canton: permission.cantones[0]
                          };
                          setSelectedPermission(firstPermission);
                          setShowEditModal(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleRevokePermission(permission)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Revocar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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

      {/* Modales */}
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
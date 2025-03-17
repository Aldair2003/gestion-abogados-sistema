import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { AssignPermissionModal } from './AssignPermissionModal';
import { EditPermissionModal } from './EditPermissionModal';
import { toast } from 'react-hot-toast';
import { permissionService } from '../../../services/permissionService';
import { User, Persona, PersonaPermission, PermissionData } from '../../../types/permissions';
import { getPhotoUrl } from '../../../utils/urls';

interface UpdatedData {
  cantonIds: string[];
  permissions: {
    view: boolean;
    edit: boolean;
    delete: boolean;
    createExpedientes: boolean;
  };
}

export const PersonaPermissionsPanel = () => {
  const [permissions, setPermissions] = useState<PersonaPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<PersonaPermission | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);

  useEffect(() => {
    loadPermissions();
    loadUsersAndPersonas();
  }, []);

  const loadPermissions = async () => {
    setLoading(true);
    try {
      const response = await permissionService.getPersonaPermissions();
      setPermissions(response.data);
    } catch (error) {
      console.error('Error cargando permisos:', error);
      toast.error('Error al cargar los permisos');
    } finally {
      setLoading(false);
    }
  };

  const loadUsersAndPersonas = async () => {
    try {
      const [usersResponse, personasResponse] = await Promise.all([
        permissionService.getCollaborators(),
        permissionService.getPersonas()
      ]);
      setUsers(usersResponse.data);
      setPersonas(personasResponse.data);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar usuarios y personas');
    }
  };

  const handleAssignPermission = async (data: PermissionData) => {
    if ('personaId' in data) {
      try {
        await permissionService.assignPersonaPermission({
          userId: data.userId,
          personaId: data.personaId,
          permissions: {
            view: data.permissions?.view ?? true,
            edit: data.permissions?.edit ?? false,
            delete: data.permissions?.delete ?? false,
            createExpedientes: data.permissions?.createExpedientes ?? false
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

  const handleEditPermission = (permission: PersonaPermission) => {
    setSelectedPermission(permission);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (permissionId: string, updatedData: UpdatedData) => {
    try {
      await permissionService.updatePersonaPermission(permissionId, {
        userId: selectedPermission?.user.id || '',
        personaId: selectedPermission?.persona.id || '',
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

  const handleRevokePermission = async (permissionId: string) => {
    if (!window.confirm('¿Está seguro de revocar este permiso?')) {
      return;
    }

    try {
      await permissionService.revokePersonaPermission(permissionId);
      toast.success('Permiso revocado correctamente');
      loadPermissions();
    } catch (error) {
      console.error('Error revocando permiso:', error);
      toast.error('Error al revocar el permiso');
    }
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

      {/* Tabla de permisos */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Colaborador
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Persona
                </th>
                <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Permisos
                </th>
                <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
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
                  <tr key={permission.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-3 sm:px-6 py-4">
                      <div className="flex items-center">
                        <div className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full overflow-hidden bg-primary-100 dark:bg-primary-500/10
                                    ring-2 ring-primary-500/20 dark:ring-primary-500/30">
                          {(() => {
                            return permission.user.photoUrl ? (
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
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[120px] sm:max-w-none">
                          {permission.persona.nombre}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate max-w-[120px] sm:max-w-none">
                          Cédula: {permission.persona.cedula}
                        </div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-3 sm:px-6 py-4">
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {permission.permissions.view && (
                          <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                            Ver
                          </span>
                        )}
                        {permission.permissions.edit && (
                          <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            Editar
                          </span>
                        )}
                        {permission.permissions.delete && (
                          <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                            Eliminar
                          </span>
                        )}
                        {permission.permissions.createExpedientes && (
                          <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                            Crear Expedientes
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      Hace 2 días
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditPermission(permission)}
                          className="inline-flex items-center p-1.5 sm:p-2 rounded-lg transition-colors
                                   text-blue-600 hover:text-blue-700 hover:bg-blue-50
                                   dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/50"
                        >
                          <PencilIcon className="w-4 h-4" />
                          <span className="hidden sm:inline ml-1">Editar</span>
                        </button>
                        <button
                          onClick={() => handleRevokePermission(permission.id)}
                          className="inline-flex items-center p-1.5 sm:p-2 rounded-lg transition-colors
                                   text-red-600 hover:text-red-700 hover:bg-red-50
                                   dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/50"
                        >
                          <TrashIcon className="w-4 h-4" />
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

      {/* Modales */}
      <AssignPermissionModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onAssign={handleAssignPermission}
        type="persona"
        resources={personas}
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
        type="persona"
      />
    </div>
  );
}; 
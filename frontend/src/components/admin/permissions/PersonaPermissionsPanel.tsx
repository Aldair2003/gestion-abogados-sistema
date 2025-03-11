import { useState, useEffect } from 'react';
import { PlusIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { AssignPermissionModal } from './AssignPermissionModal';
import { EditPermissionModal } from './EditPermissionModal';
import { Dialog } from '@headlessui/react';
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
      <div className="flex justify-between items-center">
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
                  Persona
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
                  <tr key={permission.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 
                                    flex items-center justify-center text-primary-600 dark:text-primary-400 font-medium">
                          {permission.user.nombre[0].toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="font-medium">{permission.user.nombre}</div>
                          <div className="text-gray-500 dark:text-gray-400">{permission.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="font-medium">{permission.persona.nombre}</div>
                      <div className="text-gray-500 dark:text-gray-400">Cédula: {permission.persona.cedula}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex gap-2">
                        {permission.permissions.view && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Ver
                          </span>
                        )}
                        {permission.permissions.edit && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Editar
                          </span>
                        )}
                        {permission.permissions.delete && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Eliminar
                          </span>
                        )}
                        {permission.permissions.createExpedientes && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Crear Expedientes
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      Hace 2 días
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleEditPermission(permission)}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => handleRevokePermission(permission.id)}
                        className="text-red-600 hover:text-red-900"
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
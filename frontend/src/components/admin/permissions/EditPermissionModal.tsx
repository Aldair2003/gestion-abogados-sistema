import { useState, useEffect } from 'react';
import { Modal } from '../../common/Modal';
import Select, { MultiValue, ActionMeta } from 'react-select';
import { permissionService } from '../../../services/permissionService';
import { getPhotoUrl } from '../../../utils/urls';
import { useTheme } from '../../../contexts/ThemeContext';

const RESOURCE_TYPE = {
  CANTON: 'canton' as const,
  PERSONA: 'persona' as const
};

type ResourceType = typeof RESOURCE_TYPE[keyof typeof RESOURCE_TYPE];

interface PermissionData {
  view: boolean;
  edit: boolean;
  delete: boolean;
  createExpedientes: boolean;
}

interface DBCanton {
  id: number | string;
  nombre: string;
  provincia: string;
}

interface Canton {
  value: string | number;
  label: string;
  provincia: string;
}

interface UpdatedData {
  cantonIds: string[];
  permissions: PermissionData;
}

interface PermissionWithResource {
  id: string;
  userId: string;
  user: {
    id: string;
    nombre: string;
    email: string;
    photoUrl?: string;
  };
  permissions: {
    view: boolean;
    edit: boolean;
    delete: boolean;
    createExpedientes: boolean;
  };
  canton?: DBCanton;
  cantones?: DBCanton[];
  persona?: {
    id: string;
    nombre: string;
    cedula: string;
  };
}

interface EditPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  permission: PermissionWithResource | null;
  onSave: (permissionId: string, updatedData: UpdatedData) => void;
  type: ResourceType;
}

export const EditPermissionModal = ({ isOpen, onClose, permission, onSave, type }: EditPermissionModalProps) => {
  const { isDarkMode } = useTheme();
  const [permissions, setPermissions] = useState<PermissionData>({
    view: true,
    edit: false,
    delete: false,
    createExpedientes: false
  });
  const [allCantones, setAllCantones] = useState<Canton[]>([]);
  const [cantones, setCantones] = useState<Canton[]>([]);
  const [selectedCantones, setSelectedCantones] = useState<Canton[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!permission || !type) return;

    if (type === RESOURCE_TYPE.CANTON) {
      // Si es un permiso de cantón, configurar los cantones seleccionados
      let cantonesSeleccionados: Canton[] = [];
      
      if (permission.cantones && Array.isArray(permission.cantones)) {
        cantonesSeleccionados = permission.cantones.map((canton: DBCanton) => ({
          value: canton.id,
          label: canton.nombre,
          provincia: canton.provincia
        }));
      } else if (permission.canton) {
        cantonesSeleccionados = [{
          value: permission.canton.id,
          label: permission.canton.nombre,
          provincia: permission.canton.provincia
        }];
      }
      
      setSelectedCantones(cantonesSeleccionados);
      
      // Cargar y filtrar los cantones disponibles
      loadCantonesAndFilter(cantonesSeleccionados);
    }
    
    // Configurar los permisos
    if (permission.permissions) {
      setPermissions(permission.permissions);
    }
  }, [permission, type]);

  const loadCantonesAndFilter = async (cantonesSeleccionados: Canton[]) => {
    setLoading(true);
    try {
      const response = await permissionService.getCantones();
      const formattedCantones: Canton[] = response.map((canton: any) => ({
        value: canton.id,
        label: canton.nombre,
        provincia: canton.provincia
      }));

      // Filtrar los cantones ya seleccionados
      const selectedIds = cantonesSeleccionados.map(canton => canton.value);
      const availableCantones = formattedCantones.filter(
        canton => !selectedIds.includes(canton.value)
      );

      setAllCantones(formattedCantones);
      setCantones(availableCantones);
    } catch (error) {
      console.error('Error cargando cantones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCantonesChange = (
    newValue: MultiValue<Canton>,
    actionMeta: ActionMeta<Canton>
  ) => {
    const updatedSelection = newValue as Canton[];
    setSelectedCantones(updatedSelection);
    
    // Actualizar los cantones disponibles
    const selectedIds = updatedSelection.map(canton => canton.value);
    const availableCantones = allCantones.filter(
      canton => !selectedIds.includes(canton.value)
    );
    setCantones(availableCantones);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar que permission no sea null antes de continuar
    if (!permission) {
      console.error('No hay permiso seleccionado para editar');
      return;
    }

    if (type === RESOURCE_TYPE.CANTON) {
      const updatedData: UpdatedData = {
        cantonIds: selectedCantones.map((canton: Canton) => canton.value.toString()),
        permissions
      };
      onSave(permission.id, updatedData);
    } else {
      onSave(permission.id, {
        cantonIds: [],
        permissions
      });
    }
  };

  if (!permission) return null;

  const getResourceLabel = () => {
    return type === RESOURCE_TYPE.CANTON ? 'cantón' : 'persona';
  };

  const getResourceInfo = () => {
    if (!permission) return { title: '', options: [], selected: null };

    if (type === RESOURCE_TYPE.CANTON && permission.canton) {
      return {
        title: 'Cantón',
        options: [
          {
            value: permission.canton.id,
            label: permission.canton.nombre,
            provincia: permission.canton.provincia
          }
        ],
        selected: {
          value: permission.canton.id,
          label: permission.canton.nombre,
          provincia: permission.canton.provincia
        }
      };
    } else if (type === RESOURCE_TYPE.PERSONA && permission.persona) {
      return {
        title: 'Persona',
        name: permission.persona.nombre,
        detail: `Cédula: ${permission.persona.cedula}`,
        value: permission.persona.id,
        label: permission.persona.nombre
      };
    }
    return { title: '', options: [], selected: null };
  };

  const resourceInfo = getResourceInfo();

  // Estilos personalizados para react-select
  const selectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      backgroundColor: isDarkMode ? 'rgb(31, 41, 55)' : 'white',
      borderColor: state.isFocused 
        ? 'rgb(99, 102, 241)' 
        : isDarkMode 
          ? 'rgb(75, 85, 99)' 
          : 'rgb(209, 213, 219)',
      borderRadius: '0.5rem',
      minHeight: '42px',
      boxShadow: state.isFocused ? '0 0 0 1px rgb(99, 102, 241)' : 'none',
      '&:hover': {
        borderColor: 'rgb(99, 102, 241)'
      }
    }),
    menuPortal: (base: any) => ({
      ...base,
      zIndex: 9999,
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: isDarkMode ? 'rgb(31, 41, 55)' : 'white',
      border: isDarkMode ? '1px solid rgb(75, 85, 99)' : '1px solid rgb(209, 213, 219)',
      borderRadius: '0.5rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      zIndex: 9999,
    }),
    singleValue: (base: any) => ({
      ...base,
      color: isDarkMode ? 'rgb(209, 213, 219)' : 'rgb(17, 24, 39)'
    }),
    input: (base: any) => ({
      ...base,
      color: isDarkMode ? 'rgb(209, 213, 219)' : 'rgb(17, 24, 39)'
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected 
        ? 'rgb(99, 102, 241)' 
        : state.isFocused 
          ? isDarkMode ? 'rgb(55, 65, 81)' : 'rgb(243, 244, 246)'
          : isDarkMode ? 'rgb(31, 41, 55)' : 'white',
      color: state.isSelected 
        ? 'white' 
        : isDarkMode ? 'rgb(209, 213, 219)' : 'rgb(17, 24, 39)',
      padding: '8px 12px',
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: state.isSelected 
          ? 'rgb(99, 102, 241)' 
          : isDarkMode ? 'rgb(55, 65, 81)' : 'rgb(243, 244, 246)'
      }
    }),
    menuList: (base: any) => ({
      ...base,
      padding: '4px',
      maxHeight: '200px'
    }),
    multiValue: (base: any) => ({
      ...base,
      backgroundColor: isDarkMode ? 'rgb(55, 65, 81)' : 'rgb(243, 244, 246)',
      borderRadius: '0.375rem'
    }),
    multiValueLabel: (base: any) => ({
      ...base,
      color: isDarkMode ? 'rgb(209, 213, 219)' : 'rgb(17, 24, 39)',
      padding: '2px 6px'
    }),
    multiValueRemove: (base: any) => ({
      ...base,
      color: isDarkMode ? 'rgb(209, 213, 219)' : 'rgb(107, 114, 128)',
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: isDarkMode ? 'rgb(75, 85, 99)' : 'rgb(229, 231, 235)',
        color: isDarkMode ? 'white' : 'rgb(17, 24, 39)'
      }
    }),
    placeholder: (base: any) => ({
      ...base,
      color: isDarkMode ? 'rgb(156, 163, 175)' : 'rgb(107, 114, 128)'
    }),
    noOptionsMessage: (base: any) => ({
      ...base,
      color: isDarkMode ? 'rgb(209, 213, 219)' : 'rgb(107, 114, 128)'
    }),
    container: (base: any) => ({
      ...base,
      width: '100%'
    })
  };

  // Filtrar los cantones ya seleccionados
  const getFilteredOptions = () => {
    const selectedIds = selectedCantones.map(canton => canton.value);
    return cantones.filter(canton => !selectedIds.includes(canton.value));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Permisos"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {/* Información del Usuario */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Colaborador
            </label>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="relative h-10 w-10 rounded-full overflow-hidden bg-primary-100 dark:bg-primary-500/10
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
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {permission.user.nombre}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {permission.user.email}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Información del Recurso */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {type === RESOURCE_TYPE.CANTON ? 'Cantones' : 'Persona'}
            </label>
            {type === RESOURCE_TYPE.CANTON ? (
              <Select
                value={selectedCantones}
                options={getFilteredOptions()}
                styles={selectStyles}
                isMulti
                isLoading={loading}
                onChange={handleCantonesChange}
                formatOptionLabel={({ label, provincia }) => (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-900 dark:text-white">{label}</span>
                    {provincia && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        {provincia}
                      </span>
                    )}
                  </div>
                )}
                placeholder="Seleccione cantones..."
                noOptionsMessage={() => loading ? "Cargando cantones..." : "No hay cantones disponibles"}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                classNamePrefix="select"
              />
            ) : (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {resourceInfo.name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {resourceInfo.detail}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Permisos - Solo mostrar si no es cantón */}
          {type !== RESOURCE_TYPE.CANTON && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Permisos
              </label>
              <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={permissions.view}
                    onChange={(e) => setPermissions(prev => ({ ...prev, view: e.target.checked }))}
                    className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Ver {getResourceLabel()}</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={permissions.edit}
                    onChange={(e) => setPermissions(prev => ({ ...prev, edit: e.target.checked }))}
                    className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Editar información</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={permissions.delete}
                    onChange={(e) => setPermissions(prev => ({ ...prev, delete: e.target.checked }))}
                    className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Eliminar {getResourceLabel()}</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={permissions.createExpedientes}
                    onChange={(e) => setPermissions(prev => ({ ...prev, createExpedientes: e.target.checked }))}
                    className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Crear expedientes</span>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Guardar Cambios
          </button>
        </div>
      </form>
    </Modal>
  );
}; 
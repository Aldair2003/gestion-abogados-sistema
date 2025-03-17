import { useState } from 'react';
import { Modal } from '../../common/Modal';
import { SelectField } from '../../common/SelectField';
import { User, CantonPermissionData, PersonaPermissionData } from '../../../types/permissions';
import Select from 'react-select';
import { useTheme } from '../../../contexts/ThemeContext';

interface Resource {
  id: string;
  nombre: string;
  [key: string]: any;
}

interface AssignPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (data: CantonPermissionData | PersonaPermissionData) => void;
  type: 'canton' | 'persona';
  resources: Resource[];
  users: User[];
}

export const AssignPermissionModal = ({ 
  isOpen, 
  onClose, 
  onAssign, 
  type,
  resources,
  users 
}: AssignPermissionModalProps) => {
  const { isDarkMode } = useTheme();
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedResources, setSelectedResources] = useState<string[]>([]);

  const resourcesList = Array.isArray(resources) ? resources : [];
  
  // Asegurarse de que los recursos tengan el formato correcto
  const resourceOptions = resourcesList.map(resource => ({
    value: resource.id.toString(),
    label: resource.nombre,
    provincia: resource.provincia || ''
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const baseData = {
      userId: selectedUser,
      permissions: {
        view: true,
        edit: false,
        delete: false,
        createExpedientes: false
      }
    };

    // Crear un array de promesas para asignar permisos
    const assignPromises = selectedResources.map(resourceId => {
      const data = type === 'canton' 
        ? { ...baseData, cantonId: resourceId } as CantonPermissionData
        : { ...baseData, personaId: resourceId } as PersonaPermissionData;
      
      return onAssign(data);
    });

    // Ejecutar todas las asignaciones
    Promise.all(assignPromises)
      .then(() => onClose())
      .catch((error) => console.error('Error asignando permisos:', error));
  };

  const handleResourceChange = (selected: any) => {
    setSelectedResources(selected ? selected.map((item: any) => item.value) : []);
  };

  const getResourceLabel = () => {
    return type === 'canton' ? 'Cantones' : 'Personas';
  };

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
      boxShadow: state.isFocused ? '0 0 0 1px rgb(99, 102, 241)' : 'none',
      '&:hover': {
        borderColor: 'rgb(99, 102, 241)'
      }
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: isDarkMode ? 'rgb(31, 41, 55)' : 'white',
      border: isDarkMode ? '1px solid rgb(75, 85, 99)' : '1px solid rgb(209, 213, 219)',
      zIndex: 9999
    }),
    menuPortal: (base: any) => ({
      ...base,
      zIndex: 9999
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected 
        ? 'rgb(99, 102, 241)' 
        : state.isFocused 
          ? isDarkMode ? 'rgb(55, 65, 81)' : 'rgb(243, 244, 246)'
          : 'transparent',
      color: state.isSelected 
        ? 'white' 
        : isDarkMode ? 'rgb(209, 213, 219)' : 'rgb(17, 24, 39)',
      '&:hover': {
        backgroundColor: state.isSelected 
          ? 'rgb(99, 102, 241)' 
          : isDarkMode ? 'rgb(55, 65, 81)' : 'rgb(243, 244, 246)'
      }
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
      '&:hover': {
        backgroundColor: isDarkMode ? 'rgb(75, 85, 99)' : 'rgb(229, 231, 235)',
        color: isDarkMode ? 'white' : 'rgb(17, 24, 39)'
      }
    }),
    input: (base: any) => ({
      ...base,
      color: isDarkMode ? 'rgb(209, 213, 219)' : 'rgb(17, 24, 39)'
    }),
    placeholder: (base: any) => ({
      ...base,
      color: isDarkMode ? 'rgb(156, 163, 175)' : 'rgb(107, 114, 128)'
    }),
    singleValue: (base: any) => ({
      ...base,
      color: isDarkMode ? 'rgb(209, 213, 219)' : 'rgb(17, 24, 39)'
    })
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Asignar Permiso de ${getResourceLabel()}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {/* Selector de Usuario */}
          <div>
            <SelectField
              label="Colaborador"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              required
              className="w-full"
            >
              <option value="">Seleccione un colaborador</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.nombre}
                </option>
              ))}
            </SelectField>
          </div>

          {/* Selector de Cantones con React Select */}
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {getResourceLabel()}
            </label>
            <Select
              isMulti
              options={resourceOptions}
              styles={selectStyles}
              placeholder={`Seleccione ${type === 'canton' ? 'cantones' : 'personas'}...`}
              noOptionsMessage={() => `No hay ${type === 'canton' ? 'cantones' : 'personas'} disponibles`}
              onChange={handleResourceChange}
              className="w-full"
              formatOptionLabel={({ label, provincia }) => (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                  <span className="text-sm font-medium">{label}</span>
                  {provincia && (
                    <span className="text-xs text-gray-400">
                      {provincia}
                    </span>
                  )}
                </div>
              )}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          </div>

          {/* Permisos */}
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Permisos
            </label>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                El colaborador tendrá permiso de visualización de los {type === 'canton' ? 'cantones' : 'personas'} seleccionados
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border 
                     border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
                     dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!selectedUser || selectedResources.length === 0}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-primary-600 
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
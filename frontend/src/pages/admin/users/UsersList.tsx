import React, { useState, useEffect, useCallback, memo } from 'react';

import { UsersTable } from '../../../components/admin/UsersTable';
import { UsersFilters } from '../components/UsersFilters';
import { UserFormModal } from '../../../components/admin/UserFormModal';
import { toast } from 'react-toastify';
import api from '../../../services/api';
import { Pagination } from '../components/Pagination';
import { ConfirmationModal } from '../../../components/common/ConfirmationModal';
import { UserDetailModal } from '../../../components/users/UserDetailModal';
import { useUserDetails } from '../../../hooks/useUserDetails';
import { User, UserUpdateData, UserRole, UserCreateData } from '../../../types/user';
import { UsersIcon, TableCellsIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { ExcelIcon, PDFIcon, CreateUserIcon } from '../../../components/icons/CustomIcons';

interface FiltersState {
  search: string;
  rol: UserRole | '';
  isActive: string;
  createdAtStart: Date | null;
  createdAtEnd: Date | null;
  lastLoginStart: Date | null;
  lastLoginEnd: Date | null;
  page: number;
  limit: number;
  sortField: string;
  sortDirection: 'asc' | 'desc';
}

interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

interface SelectedUser {
  id: number;
  nombre: string;
  email: string;
  cedula: string;
  telefono: string;
  rol: UserRole;
  isActive: boolean;
}

// Memorizar componentes pesados
const MemoizedUsersTable = memo(UsersTable);
const MemoizedUsersFilters = memo(UsersFilters);
const MemoizedPagination = memo(Pagination);

export const UsersList = () => {
  console.log('Renderizando UsersList');
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [filters, setFilters] = useState<FiltersState>({
    search: '',
    rol: '',
    isActive: '',
    createdAtStart: null,
    createdAtEnd: null,
    lastLoginStart: null,
    lastLoginEnd: null,
    page: 1,
    limit: 5,
    sortField: 'createdAt',
    sortDirection: 'desc'
  });
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 5
  });
  const [userToDeactivate, setUserToDeactivate] = useState<number | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const { loading: loadingDetails, userDetails, fetchUserDetails } = useUserDetails();
  const [userToToggle, setUserToToggle] = useState<{ id: number; currentStatus: boolean } | null>(null);

  // Estados de carga optimizados
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Optimizar el manejo de filtros con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500);

    return () => clearTimeout(timer);
  }, [filters]);

  const fetchUsers = useCallback(async () => {
    try {
      if (!isLoadingInitial) {
        setIsLoadingData(true);
      }
      setError(null);
      
      const params = {
        search: debouncedFilters.search || undefined,
        rol: debouncedFilters.rol || undefined,
        isActive: debouncedFilters.isActive === '' ? undefined : debouncedFilters.isActive,
        createdAtStart: debouncedFilters.createdAtStart?.toISOString(),
        createdAtEnd: debouncedFilters.createdAtEnd?.toISOString(),
        lastLoginStart: debouncedFilters.lastLoginStart?.toISOString(),
        lastLoginEnd: debouncedFilters.lastLoginEnd?.toISOString(),
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        sortField: debouncedFilters.sortField,
        sortDirection: debouncedFilters.sortDirection
      };

      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, value]) => value !== undefined)
      );
      
      const response = await api.get('/users', { params: cleanParams });
      
      setUsers(response.data.users || []);
      setPagination(prev => ({
        ...prev,
        totalPages: response.data.totalPages,
        totalItems: response.data.total
      }));
    } catch (error: any) {
      console.error('Error al cargar usuarios:', error);
      setError(error.response?.data?.message || 'Error al cargar los usuarios');
      toast.error('Error al cargar los usuarios');
    } finally {
      setIsLoadingData(false);
      setIsLoadingInitial(false);
    }
  }, [debouncedFilters, pagination.currentPage, pagination.itemsPerPage, isLoadingInitial]);

  // Efecto inicial para cargar usuarios
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Efecto para manejar cambios en los filtros
  useEffect(() => {
    if (!isLoadingInitial) {
      const timer = setTimeout(() => {
        fetchUsers();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [debouncedFilters, fetchUsers, isLoadingInitial]);

  const handleFilterChange = useCallback((newFilters: Partial<FiltersState>) => {
    setFilters(prev => {
      const updatedFilters = { ...prev, ...newFilters };
      if ('search' in newFilters) {
        return updatedFilters;
      }
      return { ...updatedFilters, page: 1 };
    });
  }, []);

  const handleCreateUser = async (userData: UserCreateData) => {
    try {
      const response = await api.post('/users/register', userData);

      if (response.data) {
        await fetchUsers();
        setModalOpen(false);
        toast.success('Usuario creado exitosamente. Se ha enviado un correo con las credenciales temporales.');
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      const errorMessage = error.response?.data?.message || 'Error al crear el usuario';
      toast.error(errorMessage);
    }
  };

  const handleUpdateUser = async (data: UserCreateData | UserUpdateData): Promise<void> => {
    try {
      if (!selectedUser) return;

      const updateData: UserUpdateData = {
        nombre: 'nombre' in data ? data.nombre : selectedUser.nombre,
        email: 'email' in data ? data.email : selectedUser.email,
        cedula: 'cedula' in data ? data.cedula : selectedUser.cedula,
        telefono: 'telefono' in data ? data.telefono : selectedUser.telefono,
        rol: data.rol,
        isActive: selectedUser.isActive
      };

      await api.put(`/users/${selectedUser.id}`, updateData);
      await fetchUsers();
      toast.success('¡Usuario actualizado exitosamente!', {
        style: {
          borderRadius: '10px',
          background: '#1e293b',
          color: '#fff',
        },
      });
      setModalOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      console.error('Error al actualizar usuario:', error);
      toast.error(error.response?.data?.message || 'Error al actualizar usuario', {
        style: {
          borderRadius: '10px',
          background: '#1e293b',
          color: '#fff',
        },
      });
    }
  };

  const handleDeactivateConfirm = async () => {
    if (userToDeactivate) {
      try {
        await api.patch(`/users/${userToDeactivate}/deactivate`);
        toast.success('Usuario desactivado exitosamente');
        fetchUsers();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Error al desactivar usuario');
      }
      setUserToDeactivate(null);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await api.delete(`/users/${id}`);
      
      if (response.data?.status === 'success') {
        await fetchUsers();
        toast.success('Usuario eliminado exitosamente', {
          style: {
            borderRadius: '10px',
            background: '#1e293b',
            color: '#fff',
          },
        });
      } else {
        throw new Error(response.data?.message || 'Error al eliminar usuario');
      }
    } catch (error: any) {
      console.error('Error al eliminar usuario:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Error al eliminar usuario';
      toast.error(errorMessage, {
        style: {
          borderRadius: '10px',
          background: '#fee2e2',
          color: '#991b1b',
          border: '1px solid #f87171'
        },
      });
    }
  };

  const openCreateModal = () => {
    setSelectedUser(null);
    setModalOpen(true);
  };

  const openEditModal = (id: number) => {
    const user = users.find(u => u.id === id);
    if (user) {
      setSelectedUser({
        id: user.id,
        nombre: user.nombre || '',
        email: user.email,
        cedula: user.cedula || '',
        telefono: user.telefono || '',
        rol: user.rol,
        isActive: user.isActive
      });
      setModalOpen(true);
    } else {
      toast.error('Usuario no encontrado');
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage === pagination.currentPage) return;
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  const handleSort = (sortConfig: SortConfig) => {
    setFilters(prev => ({
      ...prev,
      sortField: sortConfig.field,
      sortDirection: sortConfig.direction
    }));
  };

  const handleViewUser = async (id: number) => {
    await fetchUserDetails(id);
    setDetailModalOpen(true);
  };

  const handleExport = async (type: 'excel' | 'pdf') => {
    try {
      const response = await api.get(`/users/export/${type}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `usuarios.${type === 'excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Error al exportar el archivo');
    }
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        await api.patch(`/users/${id}/deactivate`);
        toast.success('Usuario desactivado exitosamente');
      } else {
        await api.patch(`/users/${id}/activate`);
        toast.success('Usuario activado exitosamente');
      }
      await fetchUsers();
    } catch (error: any) {
      console.error('Error al cambiar estado del usuario:', error);
      toast.error(error.response?.data?.message || 'Error al cambiar estado del usuario');
    }
  };

  const handleToggleConfirm = async () => {
    if (!userToToggle) return;
    
    try {
      const { id, currentStatus } = userToToggle;
      const action = currentStatus ? 'deactivate' : 'activate';
      await api.patch(`/users/${id}/${action}`);
      toast.success(`Usuario ${currentStatus ? 'desactivado' : 'activado'} exitosamente`);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cambiar estado del usuario');
    } finally {
      setUserToToggle(null);
    }
  };

  const handleCloseModal = () => {
    setDetailModalOpen(false);
  };

  if (isLoadingInitial || (!users.length && isLoadingData)) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-[#0f172a]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">
          {isLoadingInitial ? 'Cargando panel de administración...' : 'Cargando usuarios...'}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="text-red-500 mb-4">
          <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Error al cargar los usuarios
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={() => fetchUsers()}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a]">
      <div className="max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header con estadísticas y botones */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-[#1e293b]/90 rounded-2xl shadow-lg
                    border border-gray-200 dark:border-gray-700/30
                    backdrop-blur-md p-4 sm:p-6 lg:p-8"
        >
          {/* Header y Acciones */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg shadow-primary-500/20">
                  <TableCellsIcon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-white" />
                </div>
                Gestión de Usuarios
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Administra los usuarios del sistema, sus roles y permisos
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleExport('excel')}
                className="inline-flex items-center px-3 sm:px-4 py-2 sm:py-2.5
                         bg-emerald-50 dark:bg-emerald-500/10
                         text-emerald-700 dark:text-emerald-400
                         hover:bg-emerald-100 dark:hover:bg-emerald-500/20
                         rounded-xl text-xs sm:text-sm font-medium
                         border border-emerald-200/50 dark:border-emerald-500/20
                         shadow-sm hover:shadow-md
                         transition-all duration-200"
              >
                <ExcelIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
                Excel
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleExport('pdf')}
                className="inline-flex items-center px-3 sm:px-4 py-2 sm:py-2.5
                         bg-red-50 dark:bg-red-500/10
                         text-red-700 dark:text-red-400
                         hover:bg-red-100 dark:hover:bg-red-500/20
                         rounded-xl text-xs sm:text-sm font-medium
                         border border-red-200/50 dark:border-red-500/20
                         shadow-sm hover:shadow-md
                         transition-all duration-200"
              >
                <PDFIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
                PDF
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={openCreateModal}
                className="inline-flex items-center px-3 sm:px-4 py-2 sm:py-2.5
                         bg-primary-500 dark:bg-primary-500
                         text-white font-medium rounded-xl text-xs sm:text-sm
                         shadow-lg shadow-primary-500/20
                         hover:shadow-xl hover:shadow-primary-500/30
                         hover:bg-primary-600 dark:hover:bg-primary-600
                         transition-all duration-200"
              >
                <CreateUserIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
                Nuevo Usuario
              </motion.button>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mt-4 sm:mt-6 lg:mt-8">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-[#1e293b] 
                       rounded-xl p-3 sm:p-4 lg:p-6 
                       border border-primary-200 dark:border-primary-500/20
                       hover:border-primary-300 dark:hover:border-primary-500/30
                       hover:shadow-lg hover:shadow-primary-500/10
                       transition-all duration-300">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl
                            shadow-lg shadow-primary-500/20">
                  <UsersIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-100">
                    Total Usuarios
                  </p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mt-0.5 sm:mt-1">
                    {pagination.totalItems}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-[#1e293b]
                       rounded-xl p-3 sm:p-4 lg:p-6 
                       border border-green-200 dark:border-green-500/20
                       hover:border-green-300 dark:hover:border-green-500/30
                       hover:shadow-lg hover:shadow-green-500/10
                       transition-all duration-300">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl
                            shadow-lg shadow-green-500/20">
                  <UsersIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-100">
                    Usuarios Activos
                  </p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mt-0.5 sm:mt-1">
                    {users.filter(u => u.isActive).length}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-[#1e293b]
                       rounded-xl p-3 sm:p-4 lg:p-6 
                       border border-purple-200 dark:border-purple-500/20
                       hover:border-purple-300 dark:hover:border-purple-500/30
                       hover:shadow-lg hover:shadow-purple-500/10
                       transition-all duration-300">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl
                            shadow-lg shadow-purple-500/20">
                  <UsersIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-100">
                    Administradores
                  </p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mt-0.5 sm:mt-1">
                    {users.filter(u => u.rol === 'ADMIN').length}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-[#1e293b]
                       rounded-xl p-3 sm:p-4 lg:p-6 
                       border border-blue-200 dark:border-blue-500/20
                       hover:border-blue-300 dark:hover:border-blue-500/30
                       hover:shadow-lg hover:shadow-blue-500/10
                       transition-all duration-300">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl
                            shadow-lg shadow-blue-500/20">
                  <UsersIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-100">
                    Colaboradores
                  </p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mt-0.5 sm:mt-1">
                    {users.filter(u => u.rol === 'COLABORADOR').length}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Filtros */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mt-4 sm:mt-6"
        >
          <MemoizedUsersFilters 
            filters={filters} 
            onFilterChange={handleFilterChange} 
          />
        </motion.div>

        {/* Tabla de usuarios */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mt-4 sm:mt-6 bg-white dark:bg-[#1e293b] rounded-2xl shadow-lg overflow-hidden
                    border border-gray-200 dark:border-gray-700/30"
        >
          <MemoizedUsersTable 
            users={users}
            loading={isLoadingData}
            onEdit={openEditModal}
            onDelete={handleDelete}
            onView={handleViewUser}
            onSort={handleSort}
            onToggleActive={handleToggleActive}
            currentSort={{ field: filters.sortField, direction: filters.sortDirection }}
          />
        </motion.div>

        {/* Paginación */}
        <div className="mt-4 sm:mt-6">
          <MemoizedPagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>

        {/* Modales */}
        <ConfirmationModal
          isOpen={!!userToDeactivate}
          onClose={() => setUserToDeactivate(null)}
          onConfirm={handleDeactivateConfirm}
          title="Desactivar Usuario"
          message="¿Está seguro de que desea desactivar este usuario? Esta acción no se puede deshacer."
          confirmText="Sí, desactivar"
          cancelText="Cancelar"
          type="danger"
        />

        <ConfirmationModal
          isOpen={!!userToToggle}
          onClose={() => setUserToToggle(null)}
          onConfirm={handleToggleConfirm}
          title={`${userToToggle?.currentStatus ? 'Desactivar' : 'Activar'} Usuario`}
          message={`¿Está seguro de que desea ${userToToggle?.currentStatus ? 'desactivar' : 'activar'} este usuario?`}
          confirmText={`Sí, ${userToToggle?.currentStatus ? 'desactivar' : 'activar'}`}
          cancelText="Cancelar"
          type={userToToggle?.currentStatus ? 'danger' : 'info'}
        />
      </div>

      <UserFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedUser(null);
        }}
        onSubmit={selectedUser ? handleUpdateUser : handleCreateUser}
        initialData={selectedUser || undefined}
        title={selectedUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
        mode={selectedUser ? 'edit' : 'create'}
      />

      {userDetails && (
        <UserDetailModal
          isOpen={detailModalOpen}
          onClose={handleCloseModal}
          user={userDetails}
          loading={loadingDetails}
        />
      )}
    </div>
  ); 
}; 
import React, { useState, useEffect, useCallback } from 'react';

import { UsersTable } from '../../../components/admin/UsersTable';
import { UsersFilters } from '../components/UsersFilters';
import { UserFormModal } from '../../../components/admin/UserFormModal';
import { toast } from 'react-toastify';
import api from '../../../services/api';
import { Pagination } from '../components/Pagination';
import { ConfirmationModal } from '../../../components/common/ConfirmationModal';
import { UserDetailModal } from '../../../components/users/UserDetailModal';
import { useUserDetails } from '../../../hooks/useUserDetails';
import { User, UserUpdateData, UserRole, UserCreateData, UserWithActivity } from '../../../types/user';
import { PlusIcon, UsersIcon, TableCellsIcon, DocumentTextIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

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

export const UsersList = () => {
  console.log('Renderizando UsersList');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
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
    limit: 10,
    sortField: 'createdAt',
    sortDirection: 'desc'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [userToDeactivate, setUserToDeactivate] = useState<number | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const { loading: loadingDetails, userDetails, fetchUserDetails } = useUserDetails();
  const [userToToggle, setUserToToggle] = useState<{ id: number; currentStatus: boolean } | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      console.log('Iniciando fetchUsers');
      setLoading(true);
      setError(null);
      
      // Preparar los parámetros de la petición
      const params = {
        search: filters.search || undefined,
        rol: filters.rol || undefined,
        isActive: filters.isActive === '' ? undefined : filters.isActive,
        createdAtStart: filters.createdAtStart?.toISOString(),
        createdAtEnd: filters.createdAtEnd?.toISOString(),
        lastLoginStart: filters.lastLoginStart?.toISOString(),
        lastLoginEnd: filters.lastLoginEnd?.toISOString(),
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        sortField: filters.sortField,
        sortDirection: filters.sortDirection
      };

      // Eliminar parámetros undefined
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, value]) => value !== undefined)
      );
      
      console.log('Parámetros de la petición:', cleanParams);
      const response = await api.get('/users', { params: cleanParams });
      console.log('Respuesta de usuarios:', response.data);
      
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
      setLoading(false);
    }
  }, [filters, pagination.currentPage, pagination.itemsPerPage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(timer);
  }, [filters, fetchUsers]);

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
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  const handleFilterChange = (newFilters: Partial<FiltersState>) => {
    setFilters(prev => {
      // Si hay un nuevo valor para rol, asegurarse de que sea un UserRole válido o string vacío
      if ('rol' in newFilters) {
        const rolValue = newFilters.rol;
        if (rolValue && Object.values(UserRole).includes(rolValue as UserRole)) {
          newFilters.rol = rolValue as UserRole;
        } else {
          newFilters.rol = '';
        }
      }
      return { ...prev, ...newFilters };
    });
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

  const handleExportExcel = async () => {
    try {
      const response = await api.get('/users/export/excel', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'usuarios.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Error al exportar a Excel');
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await api.get('/users/export/pdf', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'usuarios.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Error al exportar a PDF');
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
      await api.patch(`/admin/users/${id}/${action}`);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
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
    <div className="space-y-6 max-h-[calc(100vh-120px)] overflow-y-auto p-6 bg-gray-50 dark:bg-[#0f172a]">
      {/* Header con estadísticas y botones */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[#1e293b]/90 rounded-2xl shadow-lg
                  border border-gray-200 dark:border-gray-700/30
                  backdrop-blur-md p-8
                  hover:shadow-xl transition-all duration-300"
      >
        {/* Header y Acciones */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg shadow-primary-500/20">
                <TableCellsIcon className="h-8 w-8 text-white" />
              </div>
              Gestión de Usuarios
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Administra los usuarios del sistema, sus roles y permisos
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExportExcel}
              className="inline-flex items-center px-4 py-2.5 
                       bg-gradient-to-r from-emerald-500 to-emerald-600
                       hover:from-emerald-600 hover:to-emerald-700
                       text-white font-medium rounded-xl
                       shadow-lg shadow-emerald-500/20
                       hover:shadow-xl hover:shadow-emerald-500/30
                       transition-all duration-300"
            >
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              Excel
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExportPDF}
              className="inline-flex items-center px-4 py-2.5 
                       bg-gradient-to-r from-red-500 to-red-600
                       hover:from-red-600 hover:to-red-700
                       text-white font-medium rounded-xl
                       shadow-lg shadow-red-500/20
                       hover:shadow-xl hover:shadow-red-500/30
                       transition-all duration-300"
            >
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              PDF
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openCreateModal}
              className="inline-flex items-center px-4 py-2.5
                       bg-gradient-to-r from-primary-500 to-primary-600
                       hover:from-primary-600 hover:to-primary-700
                       text-white font-medium rounded-xl
                       shadow-lg shadow-primary-500/20
                       hover:shadow-xl hover:shadow-primary-500/30
                       transition-all duration-300"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Nuevo Usuario
            </motion.button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-[#1e293b] 
                       rounded-xl p-6 
                       border border-primary-200 dark:border-primary-500/20
                       hover:border-primary-300 dark:hover:border-primary-500/30
                       hover:shadow-lg hover:shadow-primary-500/10
                       transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl
                            shadow-lg shadow-primary-500/20">
                <UsersIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-100">
                  Total Usuarios
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {pagination.totalItems}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-[#1e293b]
                       rounded-xl p-6 
                       border border-emerald-200 dark:border-emerald-500/20
                       hover:border-emerald-300 dark:hover:border-emerald-500/30
                       hover:shadow-lg hover:shadow-emerald-500/10
                       transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl
                            shadow-lg shadow-emerald-500/20">
                <CheckCircleIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-100">
                  Usuarios Activos
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {users.filter(u => u.isActive).length}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-[#1e293b]
                       rounded-xl p-6 
                       border border-purple-200 dark:border-purple-500/20
                       hover:border-purple-300 dark:hover:border-purple-500/30
                       hover:shadow-lg hover:shadow-purple-500/10
                       transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl
                            shadow-lg shadow-purple-500/20">
                <UsersIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-100">
                  Administradores
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {users.filter(u => u.rol === 'ADMIN').length}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-[#1e293b]
                       rounded-xl p-6 
                       border border-blue-200 dark:border-blue-500/20
                       hover:border-blue-300 dark:hover:border-blue-500/30
                       hover:shadow-lg hover:shadow-blue-500/10
                       transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl
                            shadow-lg shadow-blue-500/20">
                <UsersIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-100">
                  Colaboradores
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {users.filter(u => u.rol === 'COLABORADOR').length}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Filtros */}
      <UsersFilters 
        filters={filters} 
        onFilterChange={handleFilterChange} 
      />

      {/* Tabla de usuarios */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 dark:bg-dark-800/80 rounded-2xl shadow-lg overflow-hidden
                  border border-gray-200/20 dark:border-dark-700/20 
                  backdrop-blur-sm"
      >
        <UsersTable 
          users={users}
          loading={loading}
          onEdit={openEditModal}
          onDelete={handleDelete}
          onView={handleViewUser}
          onSort={handleSort}
          onToggleActive={handleToggleActive}
          currentSort={{ field: filters.sortField, direction: filters.sortDirection }}
        />
      </motion.div>

      {/* Paginación */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
      />

      <ConfirmationModal
        isOpen={!!userToDeactivate}
        onClose={() => setUserToDeactivate(null)}
        onConfirm={handleDeactivateConfirm}
        title="Desactivar Usuario"
        message="¿Estás seguro de que deseas desactivar este usuario? Esta acción no se puede deshacer."
        confirmText="Sí, desactivar"
        cancelText="Cancelar"
        type="danger"
      />

      <ConfirmationModal
        isOpen={!!userToToggle}
        onClose={() => setUserToToggle(null)}
        onConfirm={handleToggleConfirm}
        title={`${userToToggle?.currentStatus ? 'Desactivar' : 'Activar'} Usuario`}
        message={`¿Estás seguro de que deseas ${userToToggle?.currentStatus ? 'desactivar' : 'activar'} este usuario?`}
        confirmText={`Sí, ${userToToggle?.currentStatus ? 'desactivar' : 'activar'}`}
        cancelText="Cancelar"
        type={userToToggle?.currentStatus ? 'danger' : 'info'}
      />

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
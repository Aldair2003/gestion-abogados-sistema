import React, { useState } from 'react';
import { User } from '../../types/user';
import { RoleChangeModal } from './RoleChangeModal';
import { roleService, RoleChangeRequest } from '../../services/roleService';
import { UsersIcon } from '@heroicons/react/24/outline';

interface UserRoleActionsProps {
  user: User;
  onRoleChange?: (userId: number) => void;
}

export const UserRoleActions: React.FC<UserRoleActionsProps> = ({
  user,
  onRoleChange
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRoleChange = async (request: RoleChangeRequest) => {
    try {
      await roleService.changeUserRole(request);
      onRoleChange?.(user.id);
    } catch (error) {
      console.error('Error al cambiar el rol:', error);
      throw error;
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <UsersIcon className="h-4 w-4 mr-1" />
        Cambiar Rol
      </button>

      <RoleChangeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={user}
        onRoleChange={handleRoleChange}
      />
    </>
  );
}; 
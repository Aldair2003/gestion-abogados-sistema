import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { User, UserRole } from '../../types/user';
import { roleService, RoleChangeRequest } from '../../services/roleService';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface RoleChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onRoleChange: (request: RoleChangeRequest) => Promise<void>;
}

export const RoleChangeModal: React.FC<RoleChangeModalProps> = ({
  isOpen,
  onClose,
  user,
  onRoleChange
}) => {
  const [newRole, setNewRole] = useState<UserRole>(user.rol);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onRoleChange({
        userId: user.id,
        newRole,
        reason
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al cambiar el rol');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-10 overflow-y-auto"
    >
      <div className="flex min-h-screen items-center justify-center">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

        <div className="relative bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <div className="absolute top-4 right-4">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <Dialog.Title className="text-lg font-medium mb-4">
            Cambiar Rol de Usuario
          </Dialog.Title>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Usuario
                </label>
                <p className="mt-1 text-sm text-gray-500">
                  {user.nombre || user.email}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Rol Actual
                </label>
                <p className="mt-1 text-sm text-gray-500">{user.rol}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nuevo Rol
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                >
                  {roleService.getAvailableRoles().map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Razón del Cambio
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  rows={3}
                  required
                  placeholder="Explica la razón del cambio de rol..."
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !roleService.validateRoleChange(user.rol, newRole)}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Cambiando...' : 'Cambiar Rol'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Dialog>
  );
}; 
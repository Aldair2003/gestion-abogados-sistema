import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';

export const Permissions = () => {
  const { 
    permissions, 
    assignPermission, 
    removePermission 
  } = usePermissions();

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-6">Gestión de Permisos</h2>
      
      {/* Implementar matriz de permisos */}
    </div>
  );
}; 
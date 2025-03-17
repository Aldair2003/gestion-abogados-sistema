import { useEffect } from 'react';

// Evento personalizado para sincronizar permisos entre componentes
const PERMISSION_SYNC_EVENT = 'permission-sync';

/**
 * Hook para sincronizar permisos entre componentes
 * @param callback Función a ejecutar cuando se dispara el evento de sincronización
 */
export const usePermissionSync = (callback: (forceReload?: boolean) => void) => {
  useEffect(() => {
    // Función para manejar el evento de sincronización
    const handleSync = (event: CustomEvent) => {
      console.log('Evento de sincronización de permisos recibido:', event.detail);
      callback(true); // Forzar recarga de datos
    };

    // Registrar el evento
    window.addEventListener(PERMISSION_SYNC_EVENT, handleSync as EventListener);

    // Limpiar el evento al desmontar
    return () => {
      window.removeEventListener(PERMISSION_SYNC_EVENT, handleSync as EventListener);
    };
  }, [callback]);

  return {
    // Función para disparar el evento de sincronización
    triggerSync: (detail?: any) => {
      console.log('Disparando evento de sincronización de permisos:', detail);
      const event = new CustomEvent(PERMISSION_SYNC_EVENT, { detail });
      window.dispatchEvent(event);
    }
  };
};

// Función auxiliar para disparar el evento de sincronización desde cualquier parte
export const triggerPermissionSync = (detail?: any) => {
  console.log('Disparando evento de sincronización de permisos:', detail);
  const event = new CustomEvent(PERMISSION_SYNC_EVENT, { detail });
  window.dispatchEvent(event);
}; 
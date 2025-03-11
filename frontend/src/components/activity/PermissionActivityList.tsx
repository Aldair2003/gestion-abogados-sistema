import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { permissionService } from '../../services/permissionService';
import { ActivityIcon } from './ActivityIcon';

interface PermissionActivity {
  id: string;
  type: 'canton' | 'persona';
  action: 'assign' | 'update' | 'revoke';
  userId: string;
  userName: string;
  userEmail: string;
  resourceId: string;
  resourceName: string;
  resourceDetail: string;
  timestamp: string;
  details: {
    before?: {
      permissions: {
        view: boolean;
        edit: boolean;
        delete: boolean;
        createExpedientes: boolean;
      };
    };
    after?: {
      permissions: {
        view: boolean;
        edit: boolean;
        delete: boolean;
        createExpedientes: boolean;
      };
    };
  };
}

interface PermissionActivityListProps {
  filters?: {
    userId?: string;
    cantonId?: string;
    personaId?: string;
    startDate?: string;
    endDate?: string;
    type?: 'canton' | 'persona';
    action?: 'assign' | 'update' | 'revoke';
  };
}

export const PermissionActivityList = ({ filters }: PermissionActivityListProps) => {
  const [activities, setActivities] = useState<PermissionActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, [filters]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const response = await permissionService.getPermissionActivities(filters);
      setActivities(response.data);
    } catch (error) {
      console.error('Error cargando actividades:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'assign':
        return 'asignó permisos a';
      case 'update':
        return 'actualizó permisos de';
      case 'revoke':
        return 'revocó permisos de';
      default:
        return 'modificó permisos de';
    }
  };

  const getResourceTypeText = (type: string) => {
    return type === 'canton' ? 'el cantón' : 'la persona';
  };

  const getPermissionChanges = (activity: PermissionActivity) => {
    if (!activity.details.before || !activity.details.after) return null;

    const changes: string[] = [];
    const { before, after } = activity.details;

    if (before.permissions.view !== after.permissions.view) {
      changes.push(`Ver: ${before.permissions.view ? 'Sí' : 'No'} → ${after.permissions.view ? 'Sí' : 'No'}`);
    }
    if (before.permissions.edit !== after.permissions.edit) {
      changes.push(`Editar: ${before.permissions.edit ? 'Sí' : 'No'} → ${after.permissions.edit ? 'Sí' : 'No'}`);
    }
    if (before.permissions.delete !== after.permissions.delete) {
      changes.push(`Eliminar: ${before.permissions.delete ? 'Sí' : 'No'} → ${after.permissions.delete ? 'Sí' : 'No'}`);
    }
    if (before.permissions.createExpedientes !== after.permissions.createExpedientes) {
      changes.push(`Crear Expedientes: ${before.permissions.createExpedientes ? 'Sí' : 'No'} → ${after.permissions.createExpedientes ? 'Sí' : 'No'}`);
    }

    return changes.length > 0 ? changes : null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {activities.map((activity, activityIdx) => (
          <li key={activity.id}>
            <div className="relative pb-8">
              {activityIdx !== activities.length - 1 ? (
                <span
                  className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700"
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative flex items-start space-x-3">
                <div className="relative">
                  <ActivityIcon type={activity.type} action={activity.action} />
                </div>
                <div className="min-w-0 flex-1">
                  <div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {activity.userName}
                      </span>{' '}
                      <span className="text-gray-500 dark:text-gray-400">
                        {getActionText(activity.action)} {getResourceTypeText(activity.type)}{' '}
                        <span className="font-medium text-gray-900 dark:text-white">
                          {activity.resourceName}
                        </span>
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(activity.timestamp), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                    </p>
                  </div>
                  {activity.action === 'update' && (
                    <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                      <div className="font-medium mb-1">Cambios realizados:</div>
                      <ul className="list-disc pl-5 space-y-1">
                        {getPermissionChanges(activity)?.map((change, index) => (
                          <li key={index}>{change}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}; 
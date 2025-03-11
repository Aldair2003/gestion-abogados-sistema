export interface UserInfo {
  id: string;
  nombre?: string;
  email: string;
  rol: string;
}

export interface ActivityDetails {
  description?: string;
  metadata?: {
    ipAddress?: string;
    browser?: string;
    location?: string;
    changes?: {
      before?: any;
      after?: any;
    };
  };
  userInfo?: {
    performer?: UserInfo;
    target?: UserInfo;
  };
  timestamp?: string;
  isImportant?: boolean;
  style?: {
    color?: string;
    icon?: string;
  };
}

export interface ActivityFilters {
  userId?: string;
  targetId?: string;
  category?: string;
  action?: 'assign' | 'update' | 'revoke' | string;
  startDate?: string;
  endDate?: string;
  type?: 'canton' | 'persona' | string;
  isImportant?: boolean;
  page?: number;
  limit?: number;
  cantonId?: string;
  personaId?: string;
  metadata?: {
    browser?: string;
    os?: string;
    location?: string;
    ipAddress?: string;
  };
}

export interface Activity {
  id: number;
  userId: number;
  action: string;
  category: string;
  details: ActivityDetails;
  createdAt: string;
  isImportant: boolean;
  userName?: string;
  userEmail?: string;
  timestamp?: string;
}

export interface PermissionActivity extends Omit<Activity, 'details'> {
  type: 'canton' | 'persona';
  action: 'assign' | 'update' | 'revoke';
  resourceId: string;
  resourceName: string;
  resourceDetail: string;
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
import { ActivityCategory } from '@prisma/client';

export interface LogActivity {
  category: ActivityCategory;
  targetId?: number;
  details: {
    description?: string;
    metadata?: {
      ipAddress?: string;
      browser?: string;
      location?: string;
      changes?: {
        before?: any;
        after?: any;
      };
      userAgent?: string;
      userEmail?: string;
      targetUserEmail?: string;
      createdBy?: string;
      timestamp?: string;
      reason?: string;
      totalDeleted?: number;
      totalActivated?: number;
      totalImported?: number;
      updatedFields?: string[];
      deletedUserIds?: number[];
      activatedUserIds?: number[];
      importedEmails?: string[];
      userRole?: string;
      requiresProfileCompletion?: boolean;
      [key: string]: any; // Permite campos adicionales dinámicos
    };
    userInfo?: {
      performer?: {
        id: number;
        nombre: string;
        email: string;
        rol: string;
      };
      target?: {
        id: number;
        nombre: string;
        email: string;
        rol: string;
      };
    };
    timestamp?: string;
    importance?: 'low' | 'medium' | 'high';
    status?: 'success' | 'error' | 'warning' | 'info';
    changes?: {
      before?: any;
      after?: any;
    };
  };
  isImportant?: boolean;
}

export interface ActivityLogWhereInput {
  userId?: number;
  action?: string;
  category?: ActivityCategory;
  targetId?: number;
  isImportant?: boolean;
  createdAt?: {
    gte?: Date;
    lte?: Date;
  };
} 
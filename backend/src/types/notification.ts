export enum NotificationType {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS',
  PROFILE_COMPLETED = 'PROFILE_COMPLETED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED'
}

export interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: Date;
  metadata?: Record<string, any>;
} 
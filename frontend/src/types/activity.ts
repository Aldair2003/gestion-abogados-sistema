export interface UserInfo {
  id: number;
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

export interface Activity {
  id: number;
  userId: number;
  action: string;
  category: string;
  targetId?: number;
  details?: ActivityDetails;
  createdAt: string;
  user?: UserInfo;
  target?: UserInfo;
} 
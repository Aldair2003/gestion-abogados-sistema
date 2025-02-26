import { UserWithId } from './user';

declare global {
  namespace Express {
    interface Request {
      user?: UserWithId;
    }
  }
} 
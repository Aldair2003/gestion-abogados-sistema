import { Request } from 'express';
import { User } from '@prisma/client';
import { CantonPermissionAttributes, PersonaPermissionAttributes } from './permissions';

export interface RequestWithUser extends Request {
  user?: User;
  cantonPermissions?: CantonPermissionAttributes;
  personaPermissions?: PersonaPermissionAttributes;
} 
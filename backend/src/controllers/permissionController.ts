import { Request, Response } from 'express';
import { Permission, User } from '../models';
import { prisma } from '../lib/prisma';
import { RequestWithUser } from '../types/express';

interface CreatePermissionRequest {
  nombre: string;
  descripcion: string;
  modulo: string;
}

interface AssignPermissionRequest {
  userId: number;
  permissionIds: number[];
}

export const createPermission = async (req: Request<{}, {}, CreatePermissionRequest>, res: Response): Promise<void> => {
  try {
    const { nombre, descripcion, modulo } = req.body;

    const existingPermission = await Permission.findOne({ where: { nombre } });
    if (existingPermission) {
      res.status(400).json({ message: 'El permiso ya existe' });
      return;
    }

    const permission = await Permission.create({
      nombre,
      descripcion,
      modulo
    });

    res.status(201).json({
      message: 'Permiso creado exitosamente',
      permission
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al crear el permiso',
      error: (error as Error).message
    });
  }
};

export const getPermissions = async (_req: Request, res: Response): Promise<void> => {
  try {
    const permissions = await Permission.findAll();
    res.status(200).json(permissions);
  } catch (error) {
    res.status(500).json({
      message: 'Error al obtener los permisos',
      error: (error as Error).message
    });
  }
};

export const assignPermissionsToUser = async (
  req: Request<{}, {}, AssignPermissionRequest>,
  res: Response
): Promise<void> => {
  try {
    const { userId, permissionIds } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    const permissions = await Permission.findAll({
      where: {
        id: permissionIds
      }
    });

    if (permissions.length !== permissionIds.length) {
      res.status(400).json({ message: 'Algunos permisos no existen' });
      return;
    }

    await (user as any).setPermissions(permissions);

    res.status(200).json({
      message: 'Permisos asignados exitosamente',
      user: {
        id: user.id,
        nombre: user.nombre,
        permissions: permissions
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al asignar permisos',
      error: (error as Error).message
    });
  }
};

export const getUserPermissions = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({ message: 'No autorizado' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        rol: true,
        isActive: true
      }
    });

    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    // Definir permisos basados en el rol
    const permissions = {
      // Permisos de administrador
      canCreateUsers: user.rol.toLowerCase() === 'admin',
      canEditUsers: user.rol.toLowerCase() === 'admin',
      canDeleteUsers: user.rol.toLowerCase() === 'admin',
      canViewUsers: user.rol.toLowerCase() === 'admin',
      canAssignRoles: user.rol.toLowerCase() === 'admin',
      
      // Permisos básicos (todos los usuarios)
      canViewOwnProfile: true,
      canEditOwnProfile: true,
      
      // Permisos específicos de colaborador
      canCreateCases: ['admin', 'colaborador'].includes(user.rol.toLowerCase()),
      canViewOwnCases: true
    };

    res.json({
      userId: user.id,
      rol: user.rol,
      isActive: user.isActive,
      permissions
    });

  } catch (error) {
    console.error('Error al obtener permisos:', error);
    res.status(500).json({ message: 'Error al obtener permisos' });
  }
}; 
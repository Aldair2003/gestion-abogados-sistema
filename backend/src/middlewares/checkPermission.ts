import { Request, Response, NextFunction } from 'express';
import { User, Permission } from '../models';

export const checkPermission = (requiredPermission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: 'No autenticado' });
      }

      const user = await User.findByPk(userId, {
        include: [{
          model: Permission,
          as: 'permissions'
        }]
      });

      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      // Admin tiene todos los permisos
      if (user.rol === 'admin') {
        return next();
      }

      // Verificar permiso específico
      const hasPermission = user.permissions?.some(p => p.nombre === requiredPermission);
      
      if (!hasPermission) {
        return res.status(403).json({ message: 'No tienes permiso para realizar esta acción' });
      }

      next();
    } catch (error) {
      res.status(500).json({ message: 'Error al verificar permisos' });
    }
  };
}; 
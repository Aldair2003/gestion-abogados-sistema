import { Response } from 'express';
import { RequestWithUser } from '../middlewares/auth';
import { prisma } from '../lib/prisma';

// Definir el tipo de notificación basado en la tabla
type Notification = {
  id: number;
  userId: number;
  type: string;
  message: string;
  isRead: boolean;
  metadata: any;
  createdAt: Date;
};

export const getNotifications = async (req: RequestWithUser, res: Response) => {
  try {
    const notifications = await prisma.$queryRaw<Notification[]>`
      SELECT * FROM "Notification"
      WHERE "userId" = ${req.user.id}
      AND "isRead" = false
      ORDER BY "createdAt" DESC
    `;
    return res.json(notifications);
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener notificaciones' });
  }
};

export const markAsRead = async (req: RequestWithUser, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.$executeRaw`
      UPDATE "Notification"
      SET "isRead" = true
      WHERE "id" = ${Number(id)}
      AND "userId" = ${req.user.id}
    `;
    return res.json({ message: 'Notificación marcada como leída' });
  } catch (error) {
    return res.status(500).json({ message: 'Error al marcar notificación como leída' });
  }
};

export const deleteNotification = async (req: RequestWithUser, res: Response) => {
  try {
    const notificationId = Number(req.params.id);
    
    const [notification] = await prisma.$queryRaw<Notification[]>`
      SELECT * FROM "Notification"
      WHERE "id" = ${notificationId}
      AND "userId" = ${req.user.id}
      LIMIT 1
    `;

    if (!notification) {
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }

    await prisma.$executeRaw`
      DELETE FROM "Notification"
      WHERE "id" = ${notificationId}
      AND "userId" = ${req.user.id}
    `;

    return res.json({ message: 'Notificación eliminada exitosamente' });
  } catch (error) {
    return res.status(500).json({ message: 'Error al eliminar notificación' });
  }
}; 
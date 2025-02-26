import { prisma } from '../lib/prisma';
import { NotificationType } from '../types/notification';

export { NotificationType };

export const createNotification = async (
  userId: number,
  type: NotificationType,
  message: string,
  metadata?: Record<string, any>
) => {
  return prisma.$queryRaw`
    INSERT INTO "Notification" ("userId", "type", "message", "metadata", "isRead", "createdAt")
    VALUES (${userId}, ${type}, ${message}, ${metadata}::jsonb, false, NOW())
    RETURNING *
  `;
};

export const getUnreadNotifications = async (userId: number) => {
  return prisma.$queryRaw`
    SELECT * FROM "Notification"
    WHERE "userId" = ${userId}
    AND "isRead" = false
    ORDER BY "createdAt" DESC
  `;
};

export const markNotificationAsRead = async (notificationId: number, userId: number) => {
  return prisma.$queryRaw`
    UPDATE "Notification"
    SET "isRead" = true
    WHERE "id" = ${notificationId}
    AND "userId" = ${userId}
  `;
}; 
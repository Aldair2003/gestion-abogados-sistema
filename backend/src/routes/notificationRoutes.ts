import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { getNotifications, markAsRead, deleteNotification } from '../controllers/notificationController';
import { RequestHandler } from 'express-serve-static-core';

const router = Router();

router.use(authMiddleware);

router.get('/', getNotifications as unknown as RequestHandler);
router.patch('/:id/read', markAsRead as unknown as RequestHandler);
router.delete('/:id', deleteNotification as unknown as RequestHandler);

export default router; 
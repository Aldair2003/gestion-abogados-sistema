import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { getNotifications, markAsRead, deleteNotification } from '../controllers/notificationController';
import { withAuth } from '../types/common';

const router = Router();

router.use(authMiddleware);

router.get('/', withAuth(getNotifications));
router.patch('/:id/read', withAuth(markAsRead));
router.delete('/:id', withAuth(deleteNotification));

export default router; 
import { Router } from 'express';
import * as activityLogController from '../controllers/activityLogController';
import { authMiddleware, isAdmin } from '../middlewares/auth';
import { RequestHandler } from 'express';

const router = Router();

router.get(
  '/',
  [authMiddleware as RequestHandler, isAdmin as RequestHandler],
  activityLogController.getLogs as RequestHandler
);

export default router; 
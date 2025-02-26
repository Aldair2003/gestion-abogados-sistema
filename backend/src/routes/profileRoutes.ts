import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { getUserProfile, updateUserProfile } from '../controllers/profileController';
import { RequestHandler } from 'express-serve-static-core';

const router = Router();

router.use(authMiddleware);

router.get('/', getUserProfile as unknown as RequestHandler);
router.put('/', updateUserProfile as unknown as RequestHandler);

export default router; 
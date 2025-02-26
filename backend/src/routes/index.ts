import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import permissionRoutes from './permissionRoutes';
import { authMiddleware } from '../middlewares/auth';
import * as userController from '../controllers/userController';
import upload from '../middlewares/upload';

const router = Router();

// Rutas de autenticación (públicas)
router.use('/auth', authRoutes);

// Rutas de perfil
router.get('/users/me', authMiddleware, userController.getCurrentUser);
router.put('/users/me', authMiddleware, userController.updateUserProfile);
router.post('/users/me/photo', authMiddleware, upload.single('photo'), userController.updateProfilePhoto);

// Otras rutas protegidas
router.use('/users', authMiddleware, userRoutes);
router.use('/permissions', authMiddleware, permissionRoutes);

export default router; 
import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import permissionRoutes from './permissionRoutes';
import { authMiddleware } from '../middlewares/auth';
import * as userController from '../controllers/userController';
import * as profileController from '../controllers/profileController';
import upload from '../middlewares/upload';

const router = Router();

// Rutas de autenticación (públicas)
router.use('/auth', authRoutes);

// Rutas de perfil personal (solo requieren autenticación)
router.get('/users/me', authMiddleware, userController.getCurrentUser);
router.put('/users/me/profile', authMiddleware, upload.single('photo'), profileController.updatePersonalProfile);
router.post('/users/me/photo', authMiddleware, upload.single('photo'), userController.updateProfilePhoto);

// Otras rutas protegidas (requieren perfil completo)
router.use('/users', authMiddleware, userRoutes);
router.use('/permissions', authMiddleware, permissionRoutes);

export default router; 
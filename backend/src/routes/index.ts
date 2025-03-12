import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import permissionRoutes from './permissionRoutes';
import cantonRoutes from './cantonRoutes';
import juezRoutes from './juezRoutes';
import personaRoutes from './personaRoutes';
import { authMiddleware } from '../middlewares/auth';
import * as userController from '../controllers/userController';
import * as profileController from '../controllers/profileController';
import upload from '../middlewares/upload';
import { withAuth } from '../types/common';

const router = Router();

// Rutas de autenticación (públicas)
router.use('/users', authRoutes);

// Rutas de perfil personal (solo requieren autenticación)
router.get('/users/me', authMiddleware, withAuth(userController.getCurrentUser));
router.put('/users/me/profile', authMiddleware, upload.single('photo'), withAuth(profileController.updatePersonalProfile));
router.post('/users/me/photo', authMiddleware, upload.single('photo'), withAuth(userController.updateProfilePhoto));

// Otras rutas protegidas (requieren perfil completo)
router.use('/users', authMiddleware, userRoutes);
router.use('/permissions', authMiddleware, permissionRoutes);

// Rutas de cantones, jueces y personas
router.use('/cantones', cantonRoutes);
router.use('/jueces', juezRoutes);
router.use('/personas', personaRoutes);

export default router; 
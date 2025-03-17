import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import permissionRoutes from './permissionRoutes';
import cantonRoutes from './cantonRoutes';
import juezRoutes from './juezRoutes';
import personaRoutes from './personaRoutes';
import onboardingRoutes from './onboardingRoutes';
import { authMiddleware } from '../middlewares/auth';
import * as userController from '../controllers/userController';
import * as profileController from '../controllers/profileController';
import * as onboardingController from '../controllers/onboardingController';
import upload from '../middlewares/upload';
import { withAuthenticatedHandler } from '../middlewares/auth';

const router = Router();

// Rutas públicas de autenticación
router.use('/auth', authRoutes);

// Rutas protegidas de usuario (excepto logout)
router.use('/users', (req, res, next) => {
  // Permitir la ruta de logout sin autenticación
  if (req.path === '/logout' && req.method === 'POST') {
    return authRoutes(req, res, next);
  }
  // Para todas las demás rutas, aplicar autenticación
  return authMiddleware(req, res, next);
});

// Rutas de perfil personal (requieren autenticación)
router.get('/users/me', withAuthenticatedHandler(userController.getCurrentUser));
router.get('/users/onboarding-status', withAuthenticatedHandler(onboardingController.getOnboardingStatus));
router.put('/users/me/profile', upload.single('photo'), withAuthenticatedHandler(profileController.updatePersonalProfile));
router.post('/users/me/photo', upload.single('photo'), withAuthenticatedHandler(userController.updateProfilePhoto));

// Otras rutas protegidas (requieren perfil completo)
router.use('/permissions', authMiddleware, permissionRoutes);

// Rutas de cantones, jueces y personas
router.use('/cantones', cantonRoutes);
router.use('/jueces', juezRoutes);
router.use('/personas', personaRoutes);

export default router; 
import { Router } from 'express';
import { authenticateToken, withAuthenticatedHandler } from '../middlewares/auth';
import { getOnboardingStatus } from '../controllers/onboardingController';

const router = Router();

// Ruta para obtener el estado de onboarding del usuario
router.get('/onboarding-status', authenticateToken, withAuthenticatedHandler(getOnboardingStatus));

export default router; 
import { Router } from 'express';
import { 
  createCanton,
  updateCanton,
  getCantones,
  getCantonById,
  deleteCanton,
  getJuecesByCanton,
  createJuezInCanton,
  deleteJuezFromCanton,
  getJuecesStats
} from '../controllers/cantonController';
import { uploadCantonImage } from '../middlewares/uploadMiddleware';
import { authenticateToken, isAdmin, withAuthenticatedHandler } from '../middlewares/auth';

const router = Router();

// Rutas protegidas que requieren autenticación
router.get('/', authenticateToken, withAuthenticatedHandler(getCantones));
router.get('/:id', authenticateToken, withAuthenticatedHandler(getCantonById));

// Rutas que requieren autenticación y rol de administrador
router.post('/', authenticateToken, isAdmin, uploadCantonImage.single('imagen'), withAuthenticatedHandler(createCanton));
router.put('/:id', authenticateToken, isAdmin, uploadCantonImage.single('imagen'), withAuthenticatedHandler(updateCanton));
router.delete('/:id', authenticateToken, isAdmin, withAuthenticatedHandler(deleteCanton));

// Rutas de jueces
router.get('/:id/jueces', authenticateToken, withAuthenticatedHandler(getJuecesByCanton));
router.post('/:id/jueces', authenticateToken, isAdmin, withAuthenticatedHandler(createJuezInCanton));
router.delete('/:id/jueces/:juezId', authenticateToken, isAdmin, withAuthenticatedHandler(deleteJuezFromCanton));
router.get('/:id/jueces/stats', authenticateToken, withAuthenticatedHandler(getJuecesStats));

export default router; 
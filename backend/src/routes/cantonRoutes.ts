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
import { authenticateToken, isAdmin } from '../middlewares/auth';

const router = Router();

// Rutas protegidas que requieren autenticación
router.use(authenticateToken);

// Rutas de cantones
router.get('/', getCantones);
router.get('/stats/jueces', getJuecesStats);
router.get('/:id', getCantonById);
router.post('/', isAdmin, uploadCantonImage.single('imagen'), createCanton);
router.put('/:id', isAdmin, uploadCantonImage.single('imagen'), updateCanton);
router.delete('/:id', isAdmin, deleteCanton);

// Rutas de jueces dentro de cantones
router.get('/:id/jueces', getJuecesByCanton);
router.post('/:id/jueces', isAdmin, createJuezInCanton);
router.delete('/:id/jueces/:juezId', isAdmin, deleteJuezFromCanton);

export default router; 
import { Router } from 'express';
import { 
  createJuez,
  updateJuez,
  getJueces,
  getJuezById,
  deleteJuez
} from '../controllers/cantonController';
import { authenticateToken, isAdmin } from '../middlewares/auth';

const router = Router();

// Rutas protegidas que requieren autenticación
router.use(authenticateToken);

// Rutas de jueces
router.get('/', getJueces);
router.get('/:id', getJuezById);
router.post('/', isAdmin, createJuez);
router.put('/:id', isAdmin, updateJuez);
router.delete('/:id', isAdmin, deleteJuez);

export default router; 
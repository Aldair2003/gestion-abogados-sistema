import { Router } from 'express';
import { 
  createJuez,
  updateJuez,
  getJueces,
  getJuezById,
  deleteJuez
} from '../controllers/cantonController';
import { authenticateToken, isAdmin, withAuthenticatedHandler } from '../middlewares/auth';

const router = Router();

// Rutas protegidas que requieren autenticación
router.use(authenticateToken);

// Rutas de jueces
router.get('/', withAuthenticatedHandler(getJueces));
router.get('/:id', withAuthenticatedHandler(getJuezById));
router.post('/', isAdmin, withAuthenticatedHandler(createJuez));
router.put('/:id', isAdmin, withAuthenticatedHandler(updateJuez));
router.delete('/:id', isAdmin, withAuthenticatedHandler(deleteJuez));

export default router; 
import { Router } from 'express';
import {
  createPersona,
  updatePersona,
  getPersonas,
  getPersonaById,
  deletePersona,
  addDocumentoToPersona,
  getDocumentosByPersona,
  deleteDocumentoFromPersona,
  getPersonaStats
} from '../controllers/personaController';
import { uploadDocumentos } from '../middlewares/uploadMiddleware';
import { authenticateToken } from '../middlewares/auth';
import { 
  checkCantonAccess,
  checkPersonaAccess,
  checkCanCreatePersona,
  checkCanEditPersona
} from '../middlewares/checkPermissions';

const router = Router();

// Rutas protegidas que requieren autenticación
router.use(authenticateToken);

// Rutas para listar y crear personas dentro de un cantón
router.get('/canton/:cantonId/personas', checkCantonAccess, getPersonas);
router.post('/canton/:cantonId/personas', checkCanCreatePersona, createPersona);

// Rutas para gestionar personas específicas
router.get('/:id', checkPersonaAccess, getPersonaById);
router.put('/:id', checkCanEditPersona, updatePersona);
router.delete('/:id', checkPersonaAccess, deletePersona);

// Rutas para documentos de personas
router.get('/:id/documentos', checkPersonaAccess, getDocumentosByPersona);
router.post(
  '/:id/documentos',
  checkCanEditPersona,
  uploadDocumentos.single('documento'),
  addDocumentoToPersona
);
router.delete(
  '/:id/documentos/:documentoId',
  checkCanEditPersona,
  deleteDocumentoFromPersona
);

// Ruta para estadísticas (solo admin)
router.get('/stats', getPersonaStats);

export default router; 
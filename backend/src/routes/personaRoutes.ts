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
  getPersonaStats,
  getPersonasCreatedByUser,
  getPermissionStats,
  getAllPersonas
} from '../controllers/personaController';
import { uploadDocumentos } from '../middlewares/uploadMiddleware';
import { authenticateToken, withAuthenticatedHandler } from '../middlewares/auth';
import { 
  checkCantonAccess,
  checkPersonaAccess,
  checkCanCreatePersona,
  checkCanEditPersona
} from '../middlewares/checkPermissions';
import { checkPersonaPermission } from '../middlewares/permissions';

const router = Router();

// Rutas protegidas que requieren autenticación
router.use(authenticateToken);

// Ruta para obtener todas las personas (para administradores)
router.get('/all', withAuthenticatedHandler(getAllPersonas));

// Rutas para listar y crear personas dentro de un cantón
router.get('/canton/:cantonId/personas', 
  withAuthenticatedHandler(checkCantonAccess), 
  withAuthenticatedHandler(getPersonas)
);

router.post('/canton/:cantonId/personas', 
  withAuthenticatedHandler(checkCanCreatePersona), 
  withAuthenticatedHandler(createPersona)
);

// Rutas para gestionar personas específicas
router.get('/:id', 
  withAuthenticatedHandler(checkPersonaAccess), 
  withAuthenticatedHandler(getPersonaById)
);

router.put('/:id', 
  withAuthenticatedHandler(checkCanEditPersona), 
  withAuthenticatedHandler(updatePersona)
);

router.delete('/:id', 
  withAuthenticatedHandler(checkPersonaAccess), 
  withAuthenticatedHandler(deletePersona)
);

// Rutas para documentos de personas
router.get('/:id/documentos', 
  withAuthenticatedHandler(checkPersonaAccess), 
  withAuthenticatedHandler(getDocumentosByPersona)
);

router.post('/:id/documentos',
  withAuthenticatedHandler(checkCanEditPersona),
  uploadDocumentos.single('documento'),
  withAuthenticatedHandler(addDocumentoToPersona)
);

router.delete('/:id/documentos/:documentoId',
  withAuthenticatedHandler(checkCanEditPersona),
  withAuthenticatedHandler(deleteDocumentoFromPersona)
);

// Ruta para estadísticas (solo admin)
router.get('/stats', withAuthenticatedHandler(getPersonaStats));

// Nuevas rutas
router.get('/canton/:cantonId/user/:userId/created',
  withAuthenticatedHandler(checkPersonaAccess),
  withAuthenticatedHandler(getPersonasCreatedByUser)
);

router.get('/stats/:userId?',
  withAuthenticatedHandler(getPermissionStats)
);

export default router; 
import { Router, RequestHandler } from 'express';
import * as userController from '../controllers/userController';
import { authMiddleware, isAdmin, withAuthenticatedHandler } from '../middlewares/auth';
import { loginLimiter, registerLimiter } from '../middlewares/rateLimit';
import upload from '../middlewares/upload';
import { asyncHandler } from '../types/common';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Autenticación y manejo de sesiones
 *   - name: Users Management
 *     description: Gestión y administración de usuarios
 *   - name: Profile
 *     description: Gestión del perfil de usuario
 *   - name: Permissions
 *     description: Control de permisos y roles
 * 
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 * 
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         nombre:
 *           type: string
 *         email:
 *           type: string
 *         cedula:
 *           type: string
 *         telefono:
 *           type: string
 *         rol:
 *           type: string
 *           enum: [admin, user, colaborador]
 *         isActive:
 *           type: boolean
 *         matricula:
 *           type: string
 *         domicilio:
 *           type: string
 *         nivelEstudios:
 *           type: string
 *           enum: [estudiante, graduado, maestria]
 *         universidad:
 *           type: string
 * 
 *     LoginResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           description: JWT para autenticación
 *         user:
 *           $ref: '#/components/schemas/User'
 * 
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Mensaje de error
 *         errors:
 *           type: array
 *           items:
 *             type: string
 *           description: Lista detallada de errores
 * 
 *     Error:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         errors:
 *           type: array
 *           items:
 *             type: string
 * 
 * # Endpoints de Autenticación
 * /api/users/login:
 *   post:
 *     tags: [Auth]
 *     summary: Iniciar sesión en el sistema
 *     description: Autenticar usuario con email y contraseña
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "usuario@ejemplo.com"
 *               password:
 *                 type: string
 *                 example: "Contraseña123!"
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Credenciales inválidas
 *       429:
 *         description: Demasiados intentos de inicio de sesión
 * 
 * # Endpoints de Gestión de Usuarios
 * /api/users:
 *   get:
 *     tags: [Users Management]
 *     summary: Obtener lista de usuarios
 *     description: Obtiene lista paginada y filtrable de usuarios (solo admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Usuarios por página
 *       - in: query
 *         name: nombre
 *         schema:
 *           type: string
 *         description: Filtrar por nombre
 *       - in: query
 *         name: rol
 *         schema:
 *           type: string
 *           enum: [admin, colaborador]
 *         description: Filtrar por rol
 *     responses:
 *       200:
 *         description: Lista de usuarios obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *       403:
 *         description: No autorizado - Solo administradores
 * 
 * # Endpoints de Gestión de Contraseñas
 * /api/users/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Solicitar recuperación de contraseña
 *     description: Envía un email con token para restablecer contraseña
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "usuario@ejemplo.com"
 *     responses:
 *       200:
 *         description: Email de recuperación enviado exitosamente
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 * 
 * /api/users/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Restablecer contraseña
 *     description: Cambia la contraseña usando el token de recuperación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 example: "token-de-recuperacion"
 *               newPassword:
 *                 type: string
 *                 example: "NuevaContraseña123!"
 *     responses:
 *       200:
 *         description: Contraseña actualizada exitosamente
 *       400:
 *         description: Token inválido o contraseña no cumple requisitos
 * 
 * /api/users/change-password:
 *   post:
 *     tags: [Profile]
 *     summary: Cambiar contraseña del usuario
 *     description: Usuario autenticado cambia su propia contraseña
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: "ContraseñaActual123!"
 *               newPassword:
 *                 type: string
 *                 example: "NuevaContraseña123!"
 *     responses:
 *       200:
 *         description: Contraseña actualizada exitosamente
 *       400:
 *         description: Nueva contraseña no cumple requisitos
 *       401:
 *         description: Contraseña actual incorrecta
 * 
 * # Endpoints de Perfil de Usuario
 * /api/users/me:
 *   get:
 *     tags: [Profile]
 *     summary: Obtener perfil propio
 *     description: Obtiene los datos del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: No autenticado
 * 
 * # Endpoints de Administración de Usuarios
 * /api/users/register:
 *   post:
 *     summary: Registrar un nuevo usuario (Solo Admin)
 *     description: |
 *       Permite a un administrador crear un nuevo usuario.
 *       - Se genera una contraseña temporal: 'Temporal123!'
 *       - Se envía un email al usuario con sus credenciales
 *       - El usuario deberá cambiar su contraseña en el primer inicio de sesión
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - rol
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: usuario@ejemplo.com
 *               rol:
 *                 type: string
 *                 enum: [admin, user, colaborador]
 *                 example: user
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               emailInvalido:
 *                 value:
 *                   message: Email inválido
 *               emailExistente:
 *                 value:
 *                   message: Usuario ya existe
 *               rolInvalido:
 *                 value:
 *                   message: Rol inválido
 *
 * # Endpoints de Administración de Usuarios (continuación)
 * /api/users/{id}:
 *   put:
 *     tags: [Users Management]
 *     summary: Actualizar usuario
 *     description: Modificar datos de un usuario (requiere admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Usuario Actualizado"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "actualizado@ejemplo.com"
 *               cedula:
 *                 type: string
 *                 example: "1234567890"
 *               telefono:
 *                 type: string
 *                 example: "0987654321"
 *               rol:
 *                 type: string
 *                 enum: [admin, colaborador]
 *                 example: "colaborador"
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Usuario actualizado exitosamente"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       403:
 *         description: No tiene permisos de administrador
 *       404:
 *         description: Usuario no encontrado
 * 
 * /api/users/{id}/deactivate:
 *   patch:
 *     tags: [Users Management]
 *     summary: Desactivar usuario
 *     description: Desactiva un usuario del sistema (requiere admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario a desactivar
 *     responses:
 *       200:
 *         description: Usuario desactivado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Usuario desactivado exitosamente"
 *       403:
 *         description: No tiene permisos de administrador
 *       404:
 *         description: Usuario no encontrado
 * 
 * # Endpoints de Permisos
 * /api/permissions/user:
 *   get:
 *     tags: [Permissions]
 *     summary: Obtener permisos del usuario actual
 *     description: Retorna los permisos basados en el rol del usuario
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Permisos obtenidos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: integer
 *                   example: 1
 *                 rol:
 *                   type: string
 *                   enum: [admin, colaborador]
 *                   example: "admin"
 *                 isActive:
 *                   type: boolean
 *                   example: true
 *                 permissions:
 *                   type: object
 *                   properties:
 *                     canCreateUsers:
 *                       type: boolean
 *                       description: Permiso para crear usuarios
 *                     canEditUsers:
 *                       type: boolean
 *                       description: Permiso para editar usuarios
 *                     canDeleteUsers:
 *                       type: boolean
 *                       description: Permiso para eliminar usuarios
 *                     canViewUsers:
 *                       type: boolean
 *                       description: Permiso para ver usuarios
 *                     canAssignRoles:
 *                       type: boolean
 *                       description: Permiso para asignar roles
 *                     canViewOwnProfile:
 *                       type: boolean
 *                       description: Permiso para ver perfil propio
 *                     canEditOwnProfile:
 *                       type: boolean
 *                       description: Permiso para editar perfil propio
 *                     canCreateCases:
 *                       type: boolean
 *                       description: Permiso para crear casos
 *                     canViewOwnCases:
 *                       type: boolean
 *                       description: Permiso para ver casos propios
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Usuario no tiene permisos suficientes
 * 
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Actualizar perfil de usuario
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               email:
 *                 type: string
 *               cedula:
 *                 type: string
 *               telefono:
 *                 type: string
 *               matricula:
 *                 type: string
 *               domicilio:
 *                 type: string
 *               nivelEstudios:
 *                 type: string
 *                 enum: [estudiante, graduado, maestria]
 *               universidad:
 *                 type: string
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 * 
 * /api/users/complete-profile:
 *   post:
 *     summary: Completar perfil de usuario (Primer inicio de sesión)
 *     description: |
 *       Permite al usuario completar su perfil después del primer inicio de sesión.
 *       Requisitos:
 *       - Nombre completo obligatorio
 *       - Cédula única y válida
 *       - Teléfono en formato válido
 *       - Contraseña que cumpla requisitos de seguridad
 *       - Si es estudiante, universidad obligatoria
 *       - Matrícula y domicilio opcionales
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - cedula
 *               - telefono
 *               - password
 *               - nivelEstudios
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Juan Pérez
 *               cedula:
 *                 type: string
 *                 example: 1234567890
 *               telefono:
 *                 type: string
 *                 pattern: '^09[0-9]{8}$'
 *                 example: "0991234567"
 *               password:
 *                 type: string
 *                 description: |
 *                   Debe contener:
 *                   - Mínimo 8 caracteres
 *                   - Al menos una mayúscula
 *                   - Al menos una minúscula
 *                   - Al menos un número
 *                   - Al menos un carácter especial
 *                 example: "Password123!"
 *               matricula:
 *                 type: string
 *                 example: "MAT2024-123"
 *               domicilio:
 *                 type: string
 *                 example: "Av. Principal 123"
 *               nivelEstudios:
 *                 type: string
 *                 enum: [ESTUDIANTE, GRADUADO, MAESTRIA]
 *               universidad:
 *                 type: string
 *                 description: Obligatorio si nivelEstudios es ESTUDIANTE
 *     responses:
 *       200:
 *         description: Perfil completado exitosamente
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               cedulaInvalida:
 *                 value:
 *                   message: Cédula inválida
 *               telefonoInvalido:
 *                 value:
 *                   message: Teléfono inválido
 *               passwordDebil:
 *                 value:
 *                   message: La contraseña no cumple con los requisitos
 *                   errors: 
 *                     - Debe contener al menos una mayúscula
 *                     - Debe contener al menos un número
 * 
 * /api/users/profile-status:
 *   get:
 *     summary: Obtener estado del perfil
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estado del perfil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isCompleted:
 *                   type: boolean
 *                 isFirstLogin:
 *                   type: boolean
 *                 pendingFields:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 * 
 * /api/users/validate-cedula:
 *   post:
 *     summary: Validar cédula
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cedula
 *             properties:
 *               cedula:
 *                 type: string
 *                 example: 1234567890
 *     responses:
 *       200:
 *         description: Resultado de validación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isValid:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Formato inválido
 *       500:
 *         description: Error del servidor
 * 
 * /api/users/force-password-change:
 *   post:
 *     summary: Forzar cambio de contraseña
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contraseña actualizada exitosamente
 *       400:
 *         description: Contraseña no cumple requisitos
 *       401:
 *         description: Contraseña actual incorrecta
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */

// Convertir los middlewares a RequestHandler
const adminAuth: RequestHandler[] = [
  authMiddleware as RequestHandler,
  isAdmin as RequestHandler
];

// Rutas públicas
/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso, retorna token JWT
 *       401:
 *         description: Credenciales inválidas
 */
router.post('/login', loginLimiter, asyncHandler(userController.login));

// Rutas que requieren autenticación de admin
router.post(
  '/register',
  [
    registerLimiter,
    authMiddleware as RequestHandler,
    isAdmin as RequestHandler
  ],
  asyncHandler(userController.register)
);

// Rutas protegidas - cualquier usuario autenticado
router.post(
  '/change-password',
  authMiddleware,
  withAuthenticatedHandler(userController.changePassword)
);

/**
 * @swagger
 * /api/users/forgot-password:
 *   post:
 *     summary: Solicitar recuperación de contraseña
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email de recuperación enviado
 *       404:
 *         description: Usuario no encontrado
 */
router.post('/forgot-password', asyncHandler(userController.forgotPassword));

/**
 * @swagger
 * /api/users/reset-password:
 *   post:
 *     
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contraseña restablecida exitosamente
 *       400:
 *         description: Token inválido o expirado
 */
router.post('/reset-password', asyncHandler(userController.resetPassword));

// Rutas protegidas - solo admin
router.put(
  '/:id',
  adminAuth,
  asyncHandler(withAuthenticatedHandler(userController.updateUser))
);

router.patch(
  '/:id/activate',
  adminAuth,
  asyncHandler(withAuthenticatedHandler(userController.activateUser))
);

router.patch(
  '/:id/deactivate',
  adminAuth,
  asyncHandler(withAuthenticatedHandler(userController.deactivateUser))
);

// Rutas de gestión de usuarios
router.get(
  '/',
  adminAuth,
  asyncHandler(userController.getUsers)
);

// Nueva ruta para obtener el usuario actual
router.get('/me', authMiddleware, asyncHandler(withAuthenticatedHandler(userController.getUserProfile)));

router.put('/me', authMiddleware, asyncHandler(withAuthenticatedHandler(userController.updateUserProfile)));

router.get(
  '/profile/status', 
  authMiddleware, 
  asyncHandler(withAuthenticatedHandler(userController.getProfileStatus))
);

router.post(
  '/force-password-change',
  authMiddleware,
  asyncHandler(withAuthenticatedHandler(userController.forcePasswordChange))
);

router.post(
  '/profile/complete',
  authMiddleware,
  asyncHandler(withAuthenticatedHandler(userController.completeProfile))
);

router.delete(
  '/:id',
  adminAuth,
  asyncHandler(withAuthenticatedHandler(userController.deleteUser))
);

router.get(
  '/:id/details',
  adminAuth,
  asyncHandler(userController.getUserDetails)
);

// Rutas de exportación
router.get(
  '/export/excel',
  adminAuth,
  asyncHandler(userController.exportToExcel)
);

router.get(
  '/export/pdf',
  adminAuth,
  asyncHandler(userController.exportToPDF)
);

router.post('/validate-email', asyncHandler(userController.validateEmail));
router.post('/validate-cedula', asyncHandler(userController.validateUserCedula));

// Logs y administración
router.post('/first-admin', asyncHandler(userController.createFirstAdmin));

router.get(
  '/activity-logs',
  adminAuth,
  withAuthenticatedHandler(userController.getActivityLogs)
);

// Ruta para completar el perfil
router.post(
  '/complete-profile',
  authMiddleware,
  withAuthenticatedHandler(userController.completeProfile)
);

// Ruta para completar el onboarding
router.post(
  '/complete-onboarding',
  authMiddleware,
  withAuthenticatedHandler(userController.completeOnboarding)
);

// Rutas de perfil
router.get(
  '/profile',
  authMiddleware,
  withAuthenticatedHandler(userController.getUserProfile)
);

router.get(
  '/profile/status',
  authMiddleware,
  withAuthenticatedHandler(userController.getProfileStatus)
);

router.post(
  '/profile/photo',
  [authMiddleware, upload.single('photo')],
  asyncHandler(withAuthenticatedHandler(userController.updateProfilePhoto))
);

router.post(
  '/profile/complete',
  authMiddleware,
  asyncHandler(withAuthenticatedHandler(userController.completeProfile))
);

// Validaciones
router.post('/validate/cedula', asyncHandler(userController.validateUserCedula));
router.post('/validate/email', asyncHandler(userController.validateEmail));

// Ruta para obtener colaboradores
router.get(
  '/collaborators',
  authMiddleware,
  asyncHandler(withAuthenticatedHandler(userController.getCollaborators))
);

export default router; 
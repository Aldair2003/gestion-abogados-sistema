import { Router } from 'express';
import { getUserPermissions } from '../controllers/permissionController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Permissions
 *   description: API para gestión de permisos y roles
 * 
 * components:
 *   schemas:
 *     Permissions:
 *       type: object
 *       properties:
 *         userId:
 *           type: number
 *           description: ID del usuario
 *         rol:
 *           type: string
 *           enum: [admin, colaborador]
 *           description: Rol del usuario
 *         isActive:
 *           type: boolean
 *           description: Estado del usuario
 *         permissions:
 *           type: object
 *           properties:
 *             canCreateUsers:
 *               type: boolean
 *               description: Permiso para crear usuarios
 *             canEditUsers:
 *               type: boolean
 *               description: Permiso para editar usuarios
 *             canDeleteUsers:
 *               type: boolean
 *               description: Permiso para eliminar usuarios
 *             canViewUsers:
 *               type: boolean
 *               description: Permiso para ver lista de usuarios
 *             canAssignRoles:
 *               type: boolean
 *               description: Permiso para asignar roles
 *             canViewOwnProfile:
 *               type: boolean
 *               description: Permiso para ver perfil propio
 *             canEditOwnProfile:
 *               type: boolean
 *               description: Permiso para editar perfil propio
 *             canCreateCases:
 *               type: boolean
 *               description: Permiso para crear casos legales
 *             canViewOwnCases:
 *               type: boolean
 *               description: Permiso para ver casos propios
 * 
 * /api/permissions/user:
 *   get:
 *     summary: Obtener permisos del usuario actual
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     description: Obtiene los permisos basados en el rol del usuario autenticado
 *     responses:
 *       200:
 *         description: Permisos obtenidos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Permissions'
 *             example:
 *               userId: 1
 *               rol: "admin"
 *               isActive: true
 *               permissions:
 *                 canCreateUsers: true
 *                 canEditUsers: true
 *                 canDeleteUsers: true
 *                 canViewUsers: true
 *                 canAssignRoles: true
 *                 canViewOwnProfile: true
 *                 canEditOwnProfile: true
 *                 canCreateCases: true
 *                 canViewOwnCases: true
 *       401:
 *         description: No autorizado - Token no válido o expirado
 *       403:
 *         description: Prohibido - No tiene permisos suficientes
 *       500:
 *         description: Error interno del servidor
 */
router.get('/user', authMiddleware, getUserPermissions);

export default router; 
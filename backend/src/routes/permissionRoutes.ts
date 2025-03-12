import { Router } from 'express';
import { withAuth } from '../types/common';
import {
  getAllCantonPermissions,
  getAssignedCantones,
  assignMultipleCantonPermissions,
  getPermissionsByCanton,
  assignCantonPermission,
  revokeCantonPermission,
  getPersonaPermissions,
  assignPersonaPermission,
  revokePersonaPermission,
  getPermissionLogs
} from '../controllers/permissionController';
import { authenticateToken, isAdmin } from '../middlewares/auth';

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
 *     CantonPermission:
 *       type: object
 *       properties:
 *         userId:
 *           type: integer
 *           description: ID del usuario
 *         cantonId:
 *           type: integer
 *           description: ID del cantón
 *         canView:
 *           type: boolean
 *           description: Permiso para ver información
 *         canCreate:
 *           type: boolean
 *           description: Permiso para crear registros
 *         canEdit:
 *           type: boolean
 *           description: Permiso para editar información
 *     
 *     PersonaPermission:
 *       type: object
 *       properties:
 *         userId:
 *           type: integer
 *           description: ID del usuario
 *         personaId:
 *           type: integer
 *           description: ID de la persona
 *         cantonId:
 *           type: integer
 *           description: ID del cantón asociado
 *         canView:
 *           type: boolean
 *           description: Permiso para ver información
 *         canCreate:
 *           type: boolean
 *           description: Permiso para crear registros
 *         canEditOwn:
 *           type: boolean
 *           description: Permiso para editar registros propios
 * 
 * paths:
 *   /api/permissions/user:
 *     get:
 *       summary: Obtener permisos del usuario actual
 *       tags: [Permissions]
 *       security:
 *         - bearerAuth: []
 *       responses:
 *         200:
 *           description: Permisos obtenidos exitosamente
 *         401:
 *           description: No autorizado
 * 
 *   /api/permissions/canton/assign:
 *     post:
 *       summary: Asignar permisos de cantón
 *       tags: [Permissions]
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CantonPermission'
 *       responses:
 *         201:
 *           description: Permisos asignados exitosamente
 *         400:
 *           description: Error de validación
 *         403:
 *           description: No autorizado
 * 
 *   /api/permissions/canton/{userId}:
 *     get:
 *       summary: Obtener permisos de cantón de un usuario
 *       tags: [Permissions]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: userId
 *           required: true
 *           schema:
 *             type: integer
 *       responses:
 *         200:
 *           description: Permisos obtenidos exitosamente
 *         403:
 *           description: No autorizado
 * 
 *   /api/permissions/canton/{cantonId}/permissions:
 *     get:
 *       summary: Obtener todos los permisos de un cantón
 *       tags: [Permissions]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: cantonId
 *           required: true
 *           schema:
 *             type: integer
 *       responses:
 *         200:
 *           description: Permisos obtenidos exitosamente
 *         403:
 *           description: No autorizado
 * 
 *   /api/permissions/persona/assign:
 *     post:
 *       summary: Asignar permisos de persona
 *       tags: [Permissions]
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PersonaPermission'
 *       responses:
 *         201:
 *           description: Permisos asignados exitosamente
 *         400:
 *           description: Error de validación
 *         403:
 *           description: No autorizado
 * 
 *   /api/permissions/persona/{userId}:
 *     get:
 *       summary: Obtener permisos de persona de un usuario
 *       tags: [Permissions]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: userId
 *           required: true
 *           schema:
 *             type: integer
 *       responses:
 *         200:
 *           description: Permisos obtenidos exitosamente
 *         403:
 *           description: No autorizado
 * 
 *   /api/permissions/canton/revoke/{userId}/{cantonId}:
 *     delete:
 *       summary: Revocar permisos de cantón
 *       tags: [Permissions]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: userId
 *           required: true
 *           schema:
 *             type: integer
 *         - in: path
 *           name: cantonId
 *           required: true
 *           schema:
 *             type: integer
 *       responses:
 *         200:
 *           description: Permisos revocados exitosamente
 *         403:
 *           description: No autorizado
 *         404:
 *           description: Usuario o cantón no encontrado
 * 
 *   /api/permissions/persona/revoke/{userId}/{personaId}:
 *     delete:
 *       summary: Revocar permisos de persona
 *       tags: [Permissions]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: userId
 *           required: true
 *           schema:
 *             type: integer
 *         - in: path
 *           name: personaId
 *           required: true
 *           schema:
 *             type: integer
 *       responses:
 *         200:
 *           description: Permisos revocados exitosamente
 *         403:
 *           description: No autorizado
 *         404:
 *           description: Usuario o persona no encontrado
 * 
 *   /api/permissions/logs:
 *     get:
 *       summary: Obtener historial de cambios de permisos
 *       tags: [Permissions]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: query
 *           name: page
 *           schema:
 *             type: integer
 *           description: Número de página
 *         - in: query
 *           name: limit
 *           schema:
 *             type: integer
 *           description: Registros por página
 *         - in: query
 *           name: startDate
 *           schema:
 *             type: string
 *             format: date
 *           description: Fecha inicial (YYYY-MM-DD)
 *         - in: query
 *           name: endDate
 *           schema:
 *             type: string
 *             format: date
 *           description: Fecha final (YYYY-MM-DD)
 *         - in: query
 *           name: action
 *           schema:
 *             type: string
 *           description: Tipo de acción (GRANT_CANTON_ACCESS, REVOKE_CANTON_ACCESS, etc)
 *       responses:
 *         200:
 *           description: Lista de cambios obtenida exitosamente
 *         403:
 *           description: No autorizado
 */

// Rutas accesibles para todos los usuarios autenticados
router.get('/canton/assigned', authenticateToken, withAuth(getAssignedCantones));

// Rutas de administración de permisos - Solo administradores
router.get('/canton', authenticateToken, withAuth(getAllCantonPermissions));
router.post('/canton/assign', authenticateToken, isAdmin, withAuth(assignMultipleCantonPermissions));
router.get('/cantones/:cantonId', authenticateToken, isAdmin, withAuth(getPermissionsByCanton));
router.post('/cantones/:cantonId/usuarios/:userId', authenticateToken, isAdmin, withAuth(assignCantonPermission));
router.delete('/cantones/:cantonId/usuarios/:userId', authenticateToken, isAdmin, withAuth(revokeCantonPermission));

// Permisos de personas - Solo administradores
router.get('/personas', authenticateToken, isAdmin, withAuth(getPersonaPermissions));
router.get('/personas/:personaId/usuarios/:userId', authenticateToken, isAdmin, withAuth(getPersonaPermissions));
router.post('/personas/:personaId/usuarios/:userId', authenticateToken, isAdmin, withAuth(assignPersonaPermission));
router.delete('/personas/:personaId/usuarios/:userId', authenticateToken, isAdmin, withAuth(revokePersonaPermission));

// Historial de permisos - Solo administradores
router.get('/historial', authenticateToken, isAdmin, withAuth(getPermissionLogs));

export default router; 
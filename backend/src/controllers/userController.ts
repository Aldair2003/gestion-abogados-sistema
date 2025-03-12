import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { sendWelcomeEmail, sendPasswordResetEmail, sendPasswordChangeConfirmation } from '../services/emailService';
import { validatePasswordStrength } from '../utils/passwordValidator';
import { validateCedula, validateTelefono } from '../utils/validators';
import { prisma } from '../lib/prisma';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { logActivity } from '../services/logService';
import { createNotification } from '../services/notificationService';
import { NotificationType } from '../types/notification';
import { AuthenticatedRequest } from '../types/common';
import { 
  RegisterRequest,
  EstadoProfesional,
  UserWithId,
  UserRole,
  UserUpdateData,
  ExportUserData,
  UserData,
  UserUpdateRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  UserFilters,
  PaginatedUsersResponse,
  UserResponse
} from '../types/user';
import { ApiErrorCode } from '../types/apiError';
import { JsonValue } from '../types/activity';

dotenv.config();

// Interfaces locales
interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

interface TransactionClient {
  activityLog: {
    deleteMany: (args: any) => Promise<any>;
  };
  notification: {
    deleteMany: (args: any) => Promise<any>;
  };
  userPermission: {
    deleteMany: (args: any) => Promise<any>;
  };
  user: {
    delete: (args: any) => Promise<any>;
  };
}

export enum ActivityCategory {
  AUTH = 'AUTH',
  USER = 'USER',
  PROFILE = 'PROFILE',
  SYSTEM = 'SYSTEM',
  PERMISSION = 'PERMISSION',
  ADMINISTRATIVE = 'ADMINISTRATIVE',
  ACCOUNT_STATUS = 'ACCOUNT_STATUS',
  SESSION = 'SESSION',
  CANTON = 'CANTON',
  JUEZ = 'JUEZ',
  PERSONA = 'PERSONA',
  DOCUMENTO = 'DOCUMENTO'
}

const serializeUserData = (user: any): Record<string, JsonValue> => {
  return Object.fromEntries(
    Object.entries(user).map(([key, value]) => [
      key,
      value instanceof Date ? value.toISOString() : 
      value === null ? null : 
      typeof value === 'object' ? JSON.parse(JSON.stringify(value)) : value
    ])
  ) as Record<string, JsonValue>;
};

export const register = async (req: Request<{}, {}, RegisterRequest>, res: Response): Promise<void> => {
  try {
    const { email, rol } = req.body;
    console.log('Iniciando registro de usuario:', { email, rol });

    // Normalizar el email a minúsculas
    const normalizedEmail = email.toLowerCase();

    // Validar email
    if (!normalizedEmail || !normalizedEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      console.warn('Intento de registro con email inválido:', normalizedEmail);
      res.status(400).json({ 
        message: 'Email inválido',
        error: 'El formato del email no es válido'
      });
      return;
    }

    // Validar rol
    if (!rol || !Object.values(UserRole).includes(rol)) {
      console.warn('Intento de registro con rol inválido:', rol);
      res.status(400).json({ 
        message: 'Rol inválido',
        error: 'El rol debe ser ADMIN o COLABORADOR',
        validRoles: Object.values(UserRole)
      });
      return;
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      console.warn('Intento de registro con email existente:', normalizedEmail);
      res.status(400).json({ 
        message: 'Usuario ya existe',
        error: 'El email ya está registrado en el sistema'
      });
      return;
    }

    // Contraseña temporal predefinida
    const temporalPassword = 'Temporal12345@';
    const hashedPassword = await bcrypt.hash(temporalPassword, 10);
    console.log('Creando nuevo usuario con rol:', rol);

    // Crear usuario solo con los campos necesarios
    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        rol: rol as UserRole,
        isActive: true,
        isFirstLogin: true,
        isProfileCompleted: false,
        isTemporaryPassword: true
      }
    });

    console.log('Usuario creado exitosamente:', { id: newUser.id, email: newUser.email, rol: newUser.rol });

    // Enviar email con credenciales temporales
    try {
      await sendWelcomeEmail(normalizedEmail, temporalPassword);
      console.log('Email de bienvenida enviado:', normalizedEmail);
    } catch (emailError) {
      console.error('Error al enviar email de bienvenida:', emailError);
      // No devolvemos error al cliente, pero registramos el problema
    }

    // Registrar actividad
    await logActivity(newUser.id, 'USER_CREATED', {
      category: ActivityCategory.USER,
      details: {
        description: 'Usuario creado exitosamente',
        metadata: {
          createdBy: 'SYSTEM',
          userEmail: normalizedEmail,
          userRole: rol,
          requiresProfileCompletion: true
        }
      }
    });

    res.status(201).json({
      message: 'Usuario creado exitosamente. Se han enviado las credenciales por email.',
      user: {
        id: newUser.id,
        email: newUser.email,
        rol: newUser.rol,
        isFirstLogin: true,
        isProfileCompleted: false
      }
    });
  } catch (error) {
    console.error('Error crítico en registro:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'No se pudo completar el registro. Por favor, intente más tarde.'
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    console.log('Intento de login:', { email });

    // Normalizar el email
    const normalizedEmail = email.toLowerCase().trim();
    console.log('Email normalizado:', normalizedEmail);

    // Buscar usuario usando la instancia global de prisma
    console.log('Buscando usuario en la base de datos...');
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: 'insensitive'
        }
      },
    });

    console.log('Búsqueda de usuario:', {
      emailBuscado: normalizedEmail,
      encontrado: !!user,
      activo: user?.isActive
    });

    if (!user) {
      console.log('Usuario no encontrado');
      res.status(401).json({
        error: ApiErrorCode.UNAUTHORIZED,
        message: 'Credenciales incorrectas. Por favor, verifique sus datos.',
      });
      return;
    }

    if (!user.isActive) {
      console.log('Usuario desactivado');
      res.status(401).json({
        error: ApiErrorCode.ACCOUNT_DISABLED,
        message: 'Su cuenta ha sido desactivada. Por favor, contacte al administrador.',
      });
      return;
    }

    // Validar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('Validación de contraseña:', { isValid: isValidPassword });

    if (!isValidPassword) {
      console.log('Contraseña inválida');
      res.status(401).json({
        error: ApiErrorCode.UNAUTHORIZED,
        message: 'Credenciales incorrectas. Por favor, verifique sus datos.',
      });
      return;
    }

    // Generar tokens
    const accessToken = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        rol: user.rol,
        isFirstLogin: user.isFirstLogin,
        isProfileCompleted: user.isProfileCompleted,
        lastActivity: new Date().toISOString(),
        tokenVersion: user.tokenVersion
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '12h' }
    );

    const refreshToken = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        rol: user.rol,
        tokenVersion: user.tokenVersion 
      },
      process.env.JWT_REFRESH_SECRET as string,
      { expiresIn: '7d' }
    );

    // Actualizar último login y tokenVersion
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
        tokenVersion: {
          increment: 1
        }
      },
      select: {
        id: true,
        email: true,
        rol: true,
        isFirstLogin: true,
        isProfileCompleted: true,
        tokenVersion: true,
        nombre: true
      }
    });

    // Registrar actividad
    await logActivity(user.id, 'LOGIN', {
      category: ActivityCategory.AUTH,
      details: {
        description: `Inicio de sesión exitoso para el usuario ${user.email}`,
        metadata: {
          userEmail: user.email,
          timestamp: new Date().toISOString()
        }
      }
    });

    const userResponse: UserWithId = {
      id: updatedUser.id,
      email: updatedUser.email,
      nombre: updatedUser.nombre || '',
      rol: updatedUser.rol as UserRole,
      isFirstLogin: updatedUser.isFirstLogin,
      isProfileCompleted: updatedUser.isProfileCompleted,
      tokenVersion: updatedUser.tokenVersion
    };

    console.log('Login exitoso:', { userId: user.id, email: user.email });

    res.json({
      user: userResponse,
      token: accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      error: ApiErrorCode.INTERNAL_ERROR,
      message: 'Error interno del servidor',
    });
  }
};

export const changePassword = async (
  req: AuthenticatedRequest & { body: ChangePasswordRequest }, 
  res: Response
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      res.status(401).json({ message: 'Contraseña actual incorrecta' });
      return;
    }

    // Validar fortaleza de la nueva contraseña
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        message: 'La nueva contraseña no cumple con los requisitos de seguridad',
        errors: passwordValidation.errors
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { 
        password: hashedPassword,
        isTemporaryPassword: false,
        updatedAt: new Date()
      }
    });

    await logActivity(userId, 'CHANGE_PASSWORD', {
      category: ActivityCategory.USER,
      details: {
        description: 'Contraseña cambiada exitosamente',
        metadata: {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          timestamp: new Date().toISOString()
        }
      }
    });

    // Crear notificación
    await createNotification(
      userId,
      NotificationType.PASSWORD_CHANGED,
      'Has cambiado tu contraseña exitosamente',
      {
        timestamp: new Date().toISOString()
      }
    );

    res.status(200).json({ 
      message: 'Contraseña actualizada exitosamente',
      isTemporaryPassword: false
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al cambiar la contraseña',
      error: (error as Error).message
    });
  }
};

export const forgotPassword = async (
  req: Request<{}, {}, ForgotPasswordRequest>, 
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    // Generar token de recuperación
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    await sendPasswordResetEmail(user.email, resetToken);

    await logActivity(user.id, 'FORGOT_PASSWORD', {
      category: ActivityCategory.USER,
      details: {
        description: `Solicitud de restablecimiento de contraseña para ${user.email}`,
        metadata: {
          userEmail: user.email
        }
      }
    });

    res.status(200).json({ 
      message: 'Se ha enviado un enlace de recuperación a tu email' 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en recuperación de contraseña' });
  }
};

export const resetPassword = async (
  req: Request<{}, {}, ResetPasswordRequest>, 
  res: Response
): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    // Validar fortaleza de la nueva contraseña
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        message: 'La nueva contraseña no cumple con los requisitos de seguridad',
        errors: passwordValidation.errors
      });
      return;
    }

    // Buscar usuario con token válido y no expirado
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      res.status(400).json({ message: 'Token inválido o expirado' });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: undefined,
        resetTokenExpiry: undefined,
        updatedAt: new Date()
      }
    });

    await logActivity(user.id, 'RESET_PASSWORD', {
      category: ActivityCategory.USER,
      details: {
        description: `Token de restablecimiento de contraseña eliminado`,
        metadata: {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          timestamp: new Date().toISOString(),
          changes: {
            before: {
              hasResetToken: true,
              resetTokenExpiry: user.resetTokenExpiry ? user.resetTokenExpiry.toISOString() : null
            },
            after: {
              hasResetToken: false,
              resetTokenExpiry: undefined
            }
          }
        }
      }
    });

    res.status(200).json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Error al restablecer la contraseña:', error);
    res.status(500).json({ message: 'Error al restablecer la contraseña' });
  }
};

// Editar usuario
export const updateUser = async (
  req: AuthenticatedRequest, 
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { nombre, cedula, telefono, email, isActive, rol } = req.body as UserUpdateRequest;

    // Verificar si el usuario que hace la petición es admin
    if (req.user?.rol !== UserRole.ADMIN) {
      res.status(403).json({ message: 'Solo los administradores pueden actualizar usuarios' });
      return;
    }

    // Verificar si está intentando cambiar el rol
    if (rol && !Object.values(UserRole).includes(rol)) {
      res.status(400).json({ 
        message: 'Rol inválido',
        validRoles: Object.values(UserRole)
      });
      return;
    }

    const updateData: UserUpdateRequest = {
      ...(nombre !== undefined && { nombre: String(nombre || '') }),
      ...(cedula !== undefined && { cedula: String(cedula || '') }),
      ...(telefono !== undefined && { telefono: String(telefono || '') }),
      ...(email !== undefined && { email: String(email || '') }),
      ...(rol !== undefined && { rol }),
      ...(isActive !== undefined && { isActive: Boolean(isActive) })
    };

    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });

    await logActivity(updatedUser.id, 'UPDATE_USER', {
      category: ActivityCategory.USER,
      details: {
        description: `Actualización de campos de usuario: ${Object.keys(updateData).join(', ')}`,
        metadata: {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          timestamp: new Date().toISOString(),
          updatedFields: Object.keys(updateData)
        }
      }
    });

    res.json({
      message: 'Usuario actualizado exitosamente',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        nombre: updatedUser.nombre,
        cedula: updatedUser.cedula,
        telefono: updatedUser.telefono,
        rol: updatedUser.rol,
        isActive: updatedUser.isActive
      }
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ message: 'Error al actualizar usuario' });
  }
};

// Desactivar usuario (soft delete)
export const deactivateUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.id);
    const adminId = req.user!.id;

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        isActive: true
      }
    });

    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'Usuario no encontrado'
      });
      return;
    }

    // Verificar que no se está desactivando a sí mismo
    if (userId === adminId) {
      res.status(400).json({
        status: 'error',
        message: 'No puedes desactivarte a ti mismo'
      });
      return;
    }

    // Desactivar usuario
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive: false }
    });

    // Registrar la actividad con información detallada
    await logActivity(adminId, 'DEACTIVATE_USER', {
      category: ActivityCategory.USER,
      targetId: userId,
      details: {
        description: `Usuario eliminado: ${user.email}`,
        metadata: {
          targetUserEmail: user.email
        }
      }
    });

    res.json({
      status: 'success',
      message: 'Usuario desactivado correctamente',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error al desactivar usuario:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al desactivar el usuario'
    });
  }
};

export const getUsers = async (
  req: Request<{}, {}, {}, UserFilters>, 
  res: Response<PaginatedUsersResponse>
) => {
  try {
    const { search, rol, isActive, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { nombre: { contains: search, mode: 'insensitive' } },
        { cedula: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (rol) {
      where.rol = rol;
    }

    if (isActive !== undefined) {
      where.isActive = typeof isActive === 'string' ? isActive.toLowerCase() === 'true' : isActive;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          email: true,
          nombre: true,
          cedula: true,
          telefono: true,
          rol: true,
          isActive: true,
          domicilio: true,
          estadoProfesional: true,
          numeroMatricula: true,
          universidad: true,
          photoUrl: true,
          lastLogin: true,
          createdAt: true
        }
      }),
      prisma.user.count({ where })
    ]);

    const totalPages = Math.ceil(total / Number(limit));
    const hasMore = Number(page) < totalPages;

    const formattedUsers: UserResponse[] = users.map((user: {
      id: number;
      email: string;
      nombre: string | null;
      cedula: string | null;
      telefono: string | null;
      domicilio: string | null;
      estadoProfesional: EstadoProfesional | null;
      numeroMatricula: string | null;
      universidad: string | null;
      photoUrl: string | null;
      rol: UserRole;
      isActive: boolean;
      lastLogin: Date | null;
      createdAt: Date;
    }) => ({
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      cedula: user.cedula,
      telefono: user.telefono,
      domicilio: user.domicilio,
      estadoProfesional: user.estadoProfesional,
      numeroMatricula: user.numeroMatricula,
      universidad: user.universidad,
      photoUrl: user.photoUrl,
      rol: user.rol,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    }));

    res.status(200).json({
      users: formattedUsers,
      total,
      page: Number(page),
      totalPages,
      hasMore
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      users: [],
      total: 0,
      page: 1,
      totalPages: 0,
      hasMore: false,
      message: 'Error al obtener usuarios'
    });
  }
};

export const getUserById = async (userId: number) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    return user;
  } catch (error) {
    console.error('Error al obtener usuario por ID:', error);
    throw error;
  }
};

export const getCurrentUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({ message: 'No autorizado' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nombre: true,
        email: true,
        cedula: true,
        telefono: true,
        domicilio: true,
        estadoProfesional: true,
        numeroMatricula: true,
        universidad: true,
        rol: true,
        isActive: true,
        isProfileCompleted: true,
        photoUrl: true,
        lastLogin: true
      }
    });

    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const getUserDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      include: {
        activityLogs: {
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            user: {
              select: {
                nombre: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      res.status(404).json({ 
        status: 'error',
        message: 'Usuario no encontrado' 
      });
      return;
    }

    res.json({
      status: 'success',
      data: user
    });
  } catch (error) {
    console.error('Error al obtener detalles del usuario:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Error al obtener detalles del usuario' 
    });
  }
};

export const exportToExcel = async (_: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        nombre: true,
        cedula: true,
        telefono: true,
        rol: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        isFirstLogin: true,
        isProfileCompleted: true,
        isTemporaryPassword: true,
        tokenVersion: true,
        domicilio: true,
        estadoProfesional: true,
        numeroMatricula: true,
        universidad: true,
        photoUrl: true
      }
    });

    const formattedUsers: ExportUserData[] = users.map((user) => ({
      ...user,
      nombre: user.nombre,
      cedula: user.cedula,
      telefono: user.telefono,
      lastLogin: user.lastLogin,
      domicilio: user.domicilio,
      estadoProfesional: user.estadoProfesional,
      numeroMatricula: user.numeroMatricula,
      universidad: user.universidad,
      photoUrl: user.photoUrl,
      rol: user.rol
    }));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Usuarios');

    worksheet.columns = [
      { header: 'Nombre', key: 'nombre', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Cédula', key: 'cedula', width: 15 },
      { header: 'Teléfono', key: 'telefono', width: 15 },
      { header: 'Rol', key: 'rol', width: 15 },
      { header: 'Estado', key: 'isActive', width: 10 },
      { header: 'Último Acceso', key: 'lastLogin', width: 20 },
      { header: 'Fecha Registro', key: 'createdAt', width: 20 }
    ];

    formattedUsers.forEach((user: ExportUserData) => {
      worksheet.addRow({
        ...user,
        isActive: user.isActive ? 'Activo' : 'Inactivo',
        lastLogin: user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Nunca',
        createdAt: new Date(user.createdAt).toLocaleString()
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=usuarios.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error al exportar usuarios:', error);
    res.status(500).json({ message: 'Error al exportar usuarios' });
  }
};

export const exportToPDF = async (_: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        nombre: true,
        cedula: true,
        telefono: true,
        rol: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        isFirstLogin: true,
        isProfileCompleted: true,
        isTemporaryPassword: true,
        tokenVersion: true,
        domicilio: true,
        estadoProfesional: true,
        numeroMatricula: true,
        universidad: true,
        photoUrl: true
      }
    });

    const formattedUsers: UserData[] = users.map((user) => ({
      ...user,
      nombre: user.nombre,
      cedula: user.cedula,
      telefono: user.telefono,
      lastLogin: user.lastLogin,
      domicilio: user.domicilio,
      estadoProfesional: user.estadoProfesional,
      numeroMatricula: user.numeroMatricula,
      universidad: user.universidad,
      photoUrl: user.photoUrl,
      rol: user.rol
    }));

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=usuarios.pdf');
    doc.pipe(res);

    // Encabezado
    doc.fontSize(24).text('Lista de Usuarios', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Fecha de generación: ${new Date().toLocaleString()}`, { align: 'right' });
    doc.moveDown(2);

    // Tabla de usuarios
    const tableTop = 150;
    const rowHeight = 30;
    let currentTop = tableTop;

    // Encabezados de columna
    doc.font('Helvetica-Bold');
    doc.text('Nombre', 50, currentTop);
    doc.text('Email', 200, currentTop);
    doc.text('Rol', 350, currentTop);
    doc.text('Estado', 450, currentTop);
    currentTop += rowHeight;

    // Datos
    doc.font('Helvetica');
    formattedUsers.forEach((user: UserData) => {
      if (currentTop > 700) {
        doc.addPage();
        currentTop = 50;
      }

      doc.text(user.nombre || 'Sin nombre', 50, currentTop);
      doc.text(user.email || 'Sin email', 200, currentTop);
      doc.text(user.rol || 'Sin rol', 350, currentTop);
      doc.text(user.isActive ? 'Activo' : 'Inactivo', 450, currentTop);
      currentTop += rowHeight;
    });

    doc.end();
  } catch (error) {
    console.error('Error al exportar usuarios:', error);
    res.status(500).json({ message: 'Error al exportar usuarios' });
  }
};

export const getUserProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        activityLogs: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        }
      }
    });

    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ message: 'Error al obtener perfil' });
  }
};

export const updateUserProfile = async (
  req: AuthenticatedRequest & { file?: Express.Multer.File },
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    // Validar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    // Construir objeto de actualización
    const updateData: UserUpdateData = {};

    // Solo actualizar los campos que vienen en el request
    if (req.body.nombre !== undefined) updateData.nombre = req.body.nombre || '';
    if (req.body.cedula !== undefined) {
      if (!validateCedula(req.body.cedula)) {
        res.status(400).json({
          message: 'La cédula ingresada no es válida',
          error: 'INVALID_CEDULA'
        });
        return;
      }
      // Verificar si la cédula ya existe para otro usuario
      const existingUser = await prisma.user.findFirst({
        where: {
          cedula: req.body.cedula,
          NOT: {
            id: req.user?.id
          }
        }
      });

      if (existingUser) {
        res.status(400).json({
          message: 'La cédula ya está registrada para otro usuario',
          error: 'DUPLICATE_CEDULA'
        });
        return;
      }
      updateData.cedula = req.body.cedula || '';
    }
    if (req.body.telefono !== undefined) {
      if (!validateTelefono(req.body.telefono)) {
        res.status(400).json({
          message: 'El formato del teléfono no es válido (debe ser 09XXXXXXXX)',
          error: 'INVALID_PHONE'
        });
        return;
      }
      updateData.telefono = req.body.telefono || '';
    }
    if (req.body.domicilio !== undefined) updateData.domicilio = req.body.domicilio || '';
    if (req.body.estadoProfesional !== undefined) updateData.estadoProfesional = req.body.estadoProfesional;
    if (req.body.numeroMatricula !== undefined) updateData.numeroMatricula = req.body.numeroMatricula || '';
    if (req.body.universidad !== undefined) updateData.universidad = req.body.universidad || '';

    // Actualizar fecha de modificación
    updateData.updatedAt = new Date();

    // Si hay un archivo de foto, actualizar la URL
    if (req.file) {
      updateData.photoUrl = `/uploads/profile-photos/${req.file.filename}`;
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(userId) },
      data: updateData,
      select: {
        id: true,
        nombre: true,
        email: true,
        cedula: true,
        telefono: true,
        domicilio: true,
        estadoProfesional: true,
        numeroMatricula: true,
        universidad: true,
        photoUrl: true,
        rol: true,
        isActive: true,
        isProfileCompleted: true
      }
    });

    // Registrar actividad
    await logActivity(userId, 'UPDATE_PROFILE', {
      category: ActivityCategory.PROFILE,
      details: {
        description: 'Perfil actualizado',
        metadata: {
          timestamp: new Date().toISOString(),
          updatedFields: Object.keys(updateData)
        },
        changes: {
          before: serializeUserData(existingUser),
          after: serializeUserData(updatedUser)
        }
      }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error en updateUserProfile:', error);
    if (error instanceof Error && 'code' in error) {
      res.status(400).json({
        message: 'Error al actualizar el perfil',
        error: (error as { code: string }).code
      });
    } else {
      res.status(500).json({
        message: 'Error interno del servidor',
        error: 'INTERNAL_ERROR'
      });
    }
  }
};

export const completeProfile = async (req: AuthenticatedRequest & { body: { 
  nombre: string;
  cedula: string;
  telefono: string;
  domicilio: string;
  estadoProfesional: EstadoProfesional;
  numeroMatricula?: string;
  universidad?: string;
} }, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const {
      nombre,
      cedula,
      telefono,
      domicilio,
      estadoProfesional,
      numeroMatricula,
      universidad
    } = req.body;

    // Validar campos requeridos
    if (!nombre || !cedula || !telefono || !domicilio || !estadoProfesional) {
      res.status(400).json({ 
        message: 'Faltan campos requeridos',
        error: 'MISSING_FIELDS'
      });
      return;
    }

    // Validar cédula
    if (!validateCedula(cedula)) {
      res.status(400).json({ 
        message: 'Cédula inválida',
        error: 'INVALID_CEDULA'
      });
      return;
    }

    // Validar teléfono (10 dígitos)
    if (!/^\d{10}$/.test(telefono)) {
      res.status(400).json({
        message: 'Formato de teléfono inválido. Debe contener 10 dígitos',
        error: 'INVALID_PHONE'
      });
      return;
    }

    // Validar que la universidad sea proporcionada si es estudiante
    if (estadoProfesional === EstadoProfesional.ESTUDIANTE && !universidad) {
      res.status(400).json({ 
        message: 'La universidad es requerida para estudiantes',
        error: 'MISSING_UNIVERSITY'
      });
      return;
    }

    // Validar matrícula para graduados
    if (estadoProfesional === EstadoProfesional.GRADUADO) {
      if (!numeroMatricula) {
        res.status(400).json({
          message: 'El número de matrícula es requerido para graduados',
          error: 'MISSING_MATRICULA'
        });
        return;
      }

      // Validar formato base de la matrícula (XX-XXXX-XXX)
      const matriculaBase = numeroMatricula.substring(0, 11);
      if (!/^[A-Za-z0-9]{2}-[A-Za-z0-9]{4}-[A-Za-z0-9]{3}/.test(matriculaBase)) {
        res.status(400).json({
          message: 'Formato de matrícula inválido. Debe comenzar con XX-XXXX-XXX',
          error: 'INVALID_MATRICULA_FORMAT'
        });
        return;
      }
    }

    try {
      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          nombre,
          cedula,
          telefono,
          domicilio,
          estadoProfesional,
          numeroMatricula,
          universidad,
          isProfileCompleted: true
        }
      });

      // Registrar actividad
      await logActivity(req.user.id, 'PROFILE_COMPLETED', {
        category: ActivityCategory.PROFILE,
        details: {
          description: 'Perfil de usuario completado exitosamente',
          metadata: {
            timestamp: new Date().toISOString()
          }
        }
      });

      // Crear notificación
      await createNotification(
        req.user.id,
        NotificationType.PROFILE_COMPLETED,
        'Has completado tu perfil exitosamente',
        {
          timestamp: new Date().toISOString()
        }
      );

      res.json(updatedUser);
    } catch (error) {
      console.error('Error en la base de datos:', error);
      res.status(500).json({ 
        message: 'Error al actualizar el perfil en la base de datos',
        error: 'DATABASE_ERROR'
      });
    }
  } catch (error) {
    console.error('Error al completar el perfil:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Verificar estado del perfil
export const getProfileStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const selectFields = {
      nombre: true,
      cedula: true,
      telefono: true,
      nivelEstudios: true,
      universidad: true,
      isProfileCompleted: true,
      isFirstLogin: true
    } as const;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: selectFields as any
    }) as unknown as {
      nombre: string;
      cedula: string;
      telefono: string;
      nivelEstudios: string;
      universidad: string;
      isProfileCompleted: boolean;
      isFirstLogin: boolean;
    };

    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    const pendingFields = [];
    if (!user.nombre) pendingFields.push('nombre');
    if (!user.cedula) pendingFields.push('cedula');
    if (!user.telefono) pendingFields.push('telefono');
    if (user.nivelEstudios === 'ESTUDIANTE' && !user.universidad) {
      pendingFields.push('universidad');
    }

    res.json({
      isCompleted: user.isProfileCompleted,
      isFirstLogin: user.isFirstLogin,
      pendingFields
    });
  } catch (error) {
    console.error('Error al verificar estado del perfil:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Validar cédula
export const validateUserCedula = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cedula } = req.body;

    // Validar que la cédula no sea null o undefined
    if (!cedula) {
      res.status(400).json({ 
        isValid: false,
        message: 'La cédula es requerida'
      });
      return;
    }

    // Validar formato de cédula
    const validationResult = validateCedula(cedula);
    if (!validationResult.isValid) {
      res.status(400).json({ 
        isValid: false,
        message: validationResult.message || 'Cédula inválida'
      });
      return;
    }

    // Verificar si ya existe
    const existingUser = await prisma.user.findFirst({
      where: {
        cedula: String(cedula).trim() // Asegurarnos de que sea string y eliminar espacios
      }
    });

    if (existingUser) {
      res.status(400).json({ 
        isValid: false,
        message: 'La cédula ya está registrada en el sistema'
      });
      return;
    }

    res.json({ 
      isValid: true,
      message: 'Cédula válida y disponible'
    });
  } catch (error) {
    console.error('Error al validar cédula:', error);
    res.status(500).json({ message: 'Error al validar cédula' });
  }
};

// Validar email
export const validateEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      res.status(400).json({ message: 'Formato de email inválido' });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    res.json({
      isValid: !existingUser,
      message: existingUser ? 'Email ya registrado' : 'Email disponible'
    });
  } catch (error) {
    console.error('Error al validar email:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Forzar cambio de contraseña
export const forcePasswordChange = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    // Validar que sea el primer inicio de sesión
    if (!user.isFirstLogin) {
      res.status(403).json({ 
        message: 'No autorizado. Esta operación solo está permitida en el primer inicio de sesión.',
        error: 'INVALID_OPERATION'
      });
      return;
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      res.status(401).json({ 
        message: 'Contraseña actual incorrecta',
        error: 'INVALID_PASSWORD'
      });
      return;
    }

    // Validar que la nueva contraseña sea diferente a la actual
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      res.status(400).json({
        message: 'La nueva contraseña debe ser diferente a la actual',
        error: 'SAME_PASSWORD'
      });
      return;
    }

    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        message: 'La contraseña no cumple con los requisitos',
        errors: passwordValidation.errors,
        error: 'INVALID_PASSWORD_STRENGTH'
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        isFirstLogin: false,
        updatedAt: new Date()
      }
    });

    // Enviar email de confirmación
    await sendPasswordChangeConfirmation(user.email);

    await logActivity(userId, 'PASSWORD_CHANGED', {
      category: ActivityCategory.USER,
      details: {
        description: 'Contraseña actualizada exitosamente en primer inicio de sesión',
        metadata: {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          timestamp: new Date().toISOString()
        }
      }
    });

    // Crear notificación
    await createNotification(
      userId,
      NotificationType.PASSWORD_CHANGED,
      'Has cambiado tu contraseña exitosamente',
      {
        isFirstLogin: true,
        timestamp: new Date().toISOString()
      }
    );

    res.json({ 
      message: 'Contraseña actualizada exitosamente',
      nextStep: user.isProfileCompleted ? 'NONE' : 'COMPLETE_PROFILE'
    });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ 
      message: 'Error al cambiar contraseña',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Agregar este nuevo endpoint
export const createFirstAdmin = async (req: Request<{}, {}, RegisterRequest>, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    // Verificar si ya existe algún admin
    const existingAdmin = await prisma.user.findFirst({
      where: { rol: UserRole.ADMIN }
    });

    if (existingAdmin) {
      res.status(400).json({ 
        message: 'Ya existe un administrador en el sistema. Use el endpoint normal de registro.' 
      });
      return;
    }

    // Normalizar y validar email
    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail || !normalizedEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      res.status(400).json({ message: 'Email inválido' });
      return;
    }

    // Verificar si el usuario ya existe usando el email normalizado
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      res.status(400).json({ message: 'Usuario ya existe' });
      return;
    }

    // Contraseña temporal predefinida
    const temporalPassword = 'Temporal12345@';
    const hashedPassword = await bcrypt.hash(temporalPassword, 10);

    // Crear primer admin con email normalizado
    const newAdmin = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        rol: UserRole.ADMIN,
        isActive: true,
        nombre: '',
        cedula: '',
        telefono: ''
      }
    });

    // Enviar email con credenciales usando el email normalizado
    await sendWelcomeEmail(normalizedEmail, temporalPassword);

    await logActivity(newAdmin.id, 'USER_CREATED', {
      category: ActivityCategory.SYSTEM,
      details: {
        description: 'Administrador creado exitosamente',
        metadata: {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          timestamp: new Date().toISOString()
        }
      }
    });

    res.status(201).json({
      message: 'Administrador creado exitosamente. Se han enviado las credenciales por email.',
      user: {
        id: newAdmin.id,
        email: normalizedEmail,
        rol: newAdmin.rol
      }
    });
  } catch (error) {
    console.error('Error al crear primer admin:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Activar usuario
export const activateUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const { id } = req.params;

    // Obtener información del usuario a activar
    const targetUser = await prisma.user.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        isActive: true
      }
    });

    if (!targetUser) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: { isActive: true }
    });

    await logActivity(req.user.id, 'ACTIVATE_USER', {
      category: ActivityCategory.USER,
      targetId: targetUser.id,
      details: {
        description: `Usuario ${targetUser.nombre} (${targetUser.email}) activado`,
        metadata: {
          targetUserEmail: targetUser.email,
          targetUserRole: targetUser.rol
        }
      }
    });

    res.json({ message: 'Usuario activado exitosamente', user });
  } catch (error) {
    console.error('Error al activar usuario:', error);
    res.status(500).json({ message: 'Error al activar usuario' });
  }
};

// Eliminar usuario
export const deleteUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        status: 'error',
        message: 'Usuario no autenticado' 
      });
      return;
    }

    const { id } = req.params;
    const userId = Number(id);
    
    // Verificar que no se intente eliminar al usuario actual
    if (req.user.id === userId) {
      res.status(400).json({ 
        status: 'error',
        message: 'No puedes eliminarte a ti mismo' 
      });
      return;
    }

    // Verificar si el usuario existe antes de eliminarlo
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        isActive: true
      }
    });

    if (!userToDelete) {
      res.status(404).json({ 
        status: 'error',
        message: 'Usuario no encontrado' 
      });
      return;
    }

    // Eliminar registros relacionados y el usuario en una transacción
    await prisma.$transaction(async (tx: TransactionClient) => {
      // Eliminar logs de actividad
      await tx.activityLog.deleteMany({
        where: { 
          OR: [
            { userId: userId },
            { targetId: userId }
          ]
        }
      });

      // Eliminar notificaciones
      await tx.notification.deleteMany({
        where: { userId: userId }
      });

      // Eliminar permisos de usuario
      await tx.userPermission.deleteMany({
        where: { userId: userId }
      });

      // Finalmente eliminar el usuario
      await tx.user.delete({
        where: { id: userId }
      });
    });

    // Enviar respuesta exitosa antes del log
    res.json({ 
      status: 'success',
      message: 'Usuario eliminado exitosamente',
      data: {
        deletedUser: {
          id: userToDelete.id,
          nombre: userToDelete.nombre,
          email: userToDelete.email
        }
      }
    });

    // Registrar la actividad después de enviar la respuesta
    await logActivity(req.user.id, 'DELETE_USER', {
      category: ActivityCategory.USER,
      targetId: userToDelete.id,
      details: {
        description: `Usuario eliminado: ${userToDelete.email}`,
        metadata: {
          targetUserEmail: userToDelete.email
        }
      }
    });

  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Error al eliminar usuario',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Obtener logs de actividad
export const getActivityLogs = async (req: AuthenticatedRequest, res: Response) => {
  const { userId, action, startDate, endDate, page = 1, limit = 10 } = req.query;
  
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const where = {
      userId: req.user.rol === 'ADMIN' 
        ? (userId ? Number(userId) : undefined) 
        : req.user.id,
      action: action?.toString(),
      createdAt: {
        gte: startDate ? new Date(startDate.toString()) : undefined,
        lte: endDate ? new Date(endDate.toString()) : undefined
      }
    };

    // Obtener el total de registros para la paginación
    const totalCount = await prisma.activityLog.count({ where });

    const logs = await prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            nombre: true,
            rol: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    });

    res.json({
      logs,
      total: totalCount,
      totalPages: Math.ceil(totalCount / Number(limit))
    });
  } catch (error) {
    console.error('Error al obtener logs:', error);
    res.status(500).json({ message: 'Error al obtener logs' });
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cedula, ...userData } = req.body;

    // Validar cédula
    if (!validateCedula(cedula)) {
      res.status(400).json({ 
        message: 'Cédula inválida. Debe ser una cédula ecuatoriana válida.' 
      });
      return;
    }

    // Verificar si la cédula ya existe
    const existingUser = await prisma.user.findFirst({
      where: {
        cedula: cedula ? String(cedula) : undefined
      }
    });

    if (existingUser) {
      res.status(400).json({ message: 'La cédula ya está registrada' });
      return;
    }

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        ...userData,
        cedula: String(cedula),
        updatedAt: new Date(),
        nombre: userData.nombre || undefined,
        telefono: userData.telefono || undefined,
        domicilio: userData.domicilio || undefined,
        universidad: userData.universidad || undefined,
        numeroMatricula: userData.numeroMatricula || undefined
      }
    });

    // Registrar actividad
    await logActivity(user.id, 'CREATE_USER', {
      category: ActivityCategory.USER,
      targetId: user.id,
      details: {
        description: 'Usuario creado exitosamente',
        metadata: {
          userEmail: user.email,
          userRole: user.rol,
          cedula: user.cedula || undefined
        }
      }
    });

    res.status(201).json(user);
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ message: 'Error al crear usuario' });
  }
};

export const completeOnboarding = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        isFirstLogin: false,
        isProfileCompleted: true
      }
    });

    // Registrar actividad
    await logActivity(req.user.id, 'PROFILE_COMPLETED', {
      category: ActivityCategory.PROFILE,
      details: {
        description: 'Perfil de usuario completado exitosamente',
        metadata: {
          timestamp: new Date().toISOString()
        }
      }
    });

    // Crear notificación
    await createNotification(
      req.user.id,
      NotificationType.SUCCESS,
      '¡Bienvenido! Has completado el proceso de onboarding exitosamente',
      {
        timestamp: new Date().toISOString()
      }
    );

    res.json(updatedUser);
  } catch (error) {
    console.error('Error al completar onboarding:', error);
    res.status(500).json({ message: 'Error al completar el proceso de onboarding' });
  }
};

export const updateProfilePhoto = async (req: AuthenticatedRequest & { file?: Express.Multer.File }, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: 'No se ha proporcionado ninguna imagen' });
      return;
    }

    // Construir la URL de la imagen
    const photoUrl = `/uploads/profile-photos/${req.file.filename}`;

    // Actualizar el usuario con la nueva URL de la foto
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        photoUrl,
        updatedAt: new Date()
      }
    });

    // Registrar la actividad
    await logActivity(req.user.id, 'PROFILE_UPDATED', {
      category: ActivityCategory.PROFILE,
      details: {
        description: 'Foto de perfil actualizada',
        metadata: {
          timestamp: new Date().toISOString(),
          photoUrl
        }
      }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error al actualizar foto de perfil:', error);
    res.status(500).json({ message: 'Error al actualizar foto de perfil' });
  }
};

export const changeUserRole = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId, newRole, reason } = req.body;
    const adminId = req.user!.id;

    // Validar que el usuario existe
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        isActive: true
      }
    });

    if (!targetUser) {
      res.status(404).json({
        status: 'error',
        message: 'Usuario no encontrado',
        error: {
          code: ApiErrorCode.NOT_FOUND,
          details: 'El usuario especificado no existe'
        }
      });
      return;
    }

    // Validar que no se está cambiando su propio rol
    if (userId === adminId) {
      res.status(403).json({
        status: 'error',
        message: 'Operación no permitida',
        error: {
          code: ApiErrorCode.FORBIDDEN,
          details: 'No puedes cambiar tu propio rol'
        }
      });
      return;
    }

    const currentRole = targetUser.rol;

    // Actualizar el rol del usuario
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { rol: newRole }
    });

    // Registrar la actividad
    await logActivity(adminId, 'CHANGE_ROLE', {
      category: ActivityCategory.USER,
      targetId: userId,
      details: {
        description: `Rol de usuario ${targetUser.nombre || ''} (${targetUser.email}) cambiado de ${currentRole} a ${newRole}`,
        userInfo: {
          performer: {
            id: adminId,
            nombre: req.user!.nombre || 'Admin',
            email: req.user!.email,
            rol: req.user!.rol
          },
          target: {
            id: targetUser.id,
            nombre: targetUser.nombre || '',
            email: targetUser.email,
            rol: newRole
          }
        },
        metadata: {
          reason: reason || undefined,
          timestamp: new Date().toISOString(),
          ipAddress: req.ip || '',
          userAgent: req.headers['user-agent'] || '',
          changes: {
            before: { rol: currentRole },
            after: { rol: newRole }
          }
        },
        importance: 'high',
        status: 'success'
      },
      isImportant: true
    });

    res.json({
      status: 'success',
      message: 'Rol actualizado correctamente',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error al cambiar rol de usuario:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al cambiar rol de usuario',
      error: {
        code: ApiErrorCode.INTERNAL_ERROR,
        details: error instanceof Error ? error.message : 'Error desconocido'
      }
    });
  }
};

export const bulkDeleteUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const { userIds } = req.body;

    if (!userIds || userIds.length === 0) {
      res.status(400).json({ message: 'Se requiere una lista de IDs de usuarios' });
      return;
    }

    const result = await prisma.user.deleteMany({
      where: {
        id: {
          in: userIds
        }
      }
    });

    await logActivity(req.user.id, 'BULK_DELETE_USERS', {
      category: ActivityCategory.USER,
      details: {
        description: `Eliminación masiva de usuarios completada`,
        metadata: {
          totalDeleted: result.count,
          deletedUserIds: userIds
        }
      }
    });

    res.json({
      message: `Se han eliminado ${result.count} usuarios`,
      totalDeleted: result.count
    });
  } catch (error) {
    console.error('Error al eliminar usuarios:', error);
    res.status(500).json({ message: 'Error al eliminar usuarios' });
  }
};

export const bulkActivateUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const { userIds } = req.body;

    if (!userIds || userIds.length === 0) {
      res.status(400).json({ message: 'Se requiere una lista de IDs de usuarios' });
      return;
    }

    const result = await prisma.user.updateMany({
      where: {
        id: {
          in: userIds
        }
      },
      data: {
        isActive: true
      }
    });

    await logActivity(req.user.id, 'BULK_ACTIVATE_USERS', {
      category: ActivityCategory.USER,
      details: {
        description: `Activación masiva de usuarios completada`,
        metadata: {
          totalActivated: result.count,
          activatedUserIds: userIds
        }
      }
    });

    res.json({
      message: `Se han activado ${result.count} usuarios`,
      totalActivated: result.count
    });
  } catch (error) {
    console.error('Error al activar usuarios:', error);
    res.status(500).json({ message: 'Error al activar usuarios' });
  }
};

export const importUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const { users } = req.body;

    if (!users || users.length === 0) {
      res.status(400).json({ message: 'Se requiere una lista de usuarios' });
      return;
    }

    const importedUsers = await Promise.all(users.map(async (userData: any) => {
      const user = await prisma.user.create({
        data: {
          ...userData,
          updatedAt: new Date()
        }
      });

      await logActivity(user.id, 'CREATE_USER', {
        category: ActivityCategory.USER,
        targetId: user.id,
        details: {
          description: 'Usuario importado exitosamente',
          metadata: {
            userEmail: userData.email,
            userRole: userData.rol
          }
        }
      });

      return user;
    }));

    await logActivity(req.user.id, 'IMPORT_USERS', {
      category: ActivityCategory.SYSTEM,
      details: {
        description: 'Importación de usuarios completada',
        metadata: {
          totalImported: importedUsers.length,
          importedEmails: importedUsers.map(u => u.email)
        }
      }
    });

    res.json({
      message: `Se han importado ${importedUsers.length} usuarios`,
      importedUsers
    });
  } catch (error) {
    console.error('Error al importar usuarios:', error);
    res.status(500).json({ message: 'Error al importar usuarios' });
  }
};

export const getCollaborators = async (_req: Request, res: Response): Promise<void> => {
  try {
    const collaborators = await prisma.user.findMany({
      where: {
        rol: 'COLABORADOR',
        isActive: true,
        nombre: {
          not: null
        }
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        cedula: true,
        telefono: true,
        isProfileCompleted: true
      }
    });
    
    // Filtrar solo los usuarios que tienen perfil completo
    const activeCollaborators = collaborators.filter((u: {
      id: number;
      nombre: string | null;
      email: string;
      cedula: string | null;
      telefono: string | null;
      rol: UserRole;
      isProfileCompleted: boolean;
    }) => 
      u.isProfileCompleted && 
      u.nombre && 
      u.cedula && 
      u.telefono
    );

    res.json({
      status: 'success',
      data: activeCollaborators
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error al obtener colaboradores',
      error: (error as Error).message
    });
  }
}; 
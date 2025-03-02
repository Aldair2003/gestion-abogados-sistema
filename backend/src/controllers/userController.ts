import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { sendWelcomeEmail, sendPasswordResetEmail, sendPasswordChangeConfirmation } from '../services/emailService';
import { validatePasswordStrength } from '../utils/passwordValidator';
import { validateCedula, validatePhone } from '../utils/validators';
import { prisma } from '../lib/prisma';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { Prisma, UserRole, ActivityCategory } from '@prisma/client';
import { logActivity } from '../services/logService';
import { createNotification } from '../services/notificationService';
import { NotificationType } from '../types/notification';
import { 
  RequestWithUser,
  RegisterRequest,
  EstadoProfesional,
  User
} from '../types/user';
import { ApiErrorCode } from '../types/api';
import { PrismaClient } from '@prisma/client';
import { UserWithId } from '../types/user';

dotenv.config();

// Interfaces locales
interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

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
    await logActivity({
      userId: newUser.id,
      action: 'USER_CREATED',
      category: 'ADMINISTRATIVE',
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
  const prisma = new PrismaClient();
  try {
    const { email, password } = req.body;

    // Normalizar el email
    const normalizedEmail = email.toLowerCase().trim();

    // Buscar usuario
    const user = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        isActive: true,
      },
    }) as User;

    if (!user) {
      res.status(401).json({
        error: ApiErrorCode.UNAUTHORIZED,
        message: 'Credenciales inválidas',
      });
      return;
    }

    // Validar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({
        error: ApiErrorCode.UNAUTHORIZED,
        message: 'Credenciales inválidas',
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
        lastActivity: new Date().toISOString()
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '15m' }
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
    await logActivity({
      userId: user.id,
      action: 'LOGIN',
      category: ActivityCategory.SESSION,
      details: {
        metadata: {
          userEmail: user.email
        }
      },
    });

    const userResponse: UserWithId = {
      id: updatedUser.id,
      email: updatedUser.email,
      nombre: updatedUser.nombre || undefined,
      rol: updatedUser.rol,
      isFirstLogin: updatedUser.isFirstLogin,
      isProfileCompleted: updatedUser.isProfileCompleted,
      tokenVersion: updatedUser.tokenVersion
    };

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
  } finally {
    await prisma.$disconnect();
  }
};

export const changePassword = async (
  req: RequestWithUser & { body: ChangePasswordRequest }, 
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

    await logActivity({
      userId: userId,
      action: 'CHANGE_PASSWORD',
      category: 'PROFILE',
      details: {
        description: 'Contraseña actualizada exitosamente',
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

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
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

    await logActivity({
      userId: user.id,
      action: 'FORGOT_PASSWORD',
      category: 'PROFILE',
      details: {
        description: 'Solicitud de restablecimiento de contraseña iniciada',
        userInfo: {
          performer: {
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            rol: user.rol
          }
        },
        metadata: {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          timestamp: new Date().toISOString(),
          resetTokenExpiry: resetTokenExpiry,
          userStatus: {
            isActive: user.isActive,
            isFirstLogin: user.isFirstLogin,
            isProfileCompleted: user.isProfileCompleted
          }
        },
        status: 'initiated'
      }
    });

    res.status(200).json({ 
      message: 'Se ha enviado un enlace de recuperación a tu email' 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en recuperación de contraseña' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
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
          gt: new Date() // Usar gt (greater than) de Prisma en lugar de Op.gt
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
        resetToken: null, // Usar null en lugar de undefined
        resetTokenExpiry: null
      }
    });

    await logActivity({
      userId: user.id,
      action: 'RESET_PASSWORD',
      category: 'PROFILE',
      details: {
        description: 'Contraseña restablecida exitosamente',
        userInfo: {
          performer: {
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            rol: user.rol
          }
        },
        metadata: {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          timestamp: new Date().toISOString(),
          changes: {
            before: {
              hasResetToken: true,
              resetTokenExpiry: user.resetTokenExpiry
            },
            after: {
              hasResetToken: false,
              resetTokenExpiry: null
            }
          }
        },
        status: 'success'
      }
    });

    res.status(200).json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al restablecer la contraseña' });
  }
};

// Editar usuario
export const updateUser = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nombre, cedula, telefono, email, isActive, rol } = req.body;

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

    // Crear un objeto con los datos a actualizar, manejando valores nulos
    const updateData: Prisma.UserUpdateInput = {
      ...(nombre !== undefined && { nombre: String(nombre || '') }),
      ...(cedula !== undefined && { cedula: String(cedula || '') }),
      ...(telefono !== undefined && { telefono: String(telefono || '') }),
      ...(email !== undefined && { email: String(email || '') }),
      ...(rol !== undefined && { rol: rol as UserRole }),
      ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      updatedAt: new Date()
    };

    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: updateData
    });

    await logActivity({
      userId: updatedUser.id,
      action: 'UPDATE_USER',
      category: 'ADMINISTRATIVE',
      details: {
        description: 'Información de usuario actualizada',
        metadata: {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          timestamp: new Date().toISOString()
        },
        changes: {
          before: {
            nombre: updatedUser.nombre,
            cedula: updatedUser.cedula,
            telefono: updatedUser.telefono,
            email: updatedUser.email,
            rol: updatedUser.rol,
            isActive: updatedUser.isActive
          },
          after: updatedUser
        }
      }
    });

    res.json({
      message: 'Usuario actualizado exitosamente',
      user: {
        id: updatedUser.id,
        nombre: updatedUser.nombre,
        email: updatedUser.email,
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
export const deactivateUser = async (req: RequestWithUser, res: Response): Promise<void> => {
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
    await logActivity({
      userId: adminId,
      targetId: userId,
      action: 'DEACTIVATE_USER',
      category: 'ACCOUNT_STATUS',
      details: {
        description: `Usuario ${user.nombre} (${user.email}) desactivado`,
        userInfo: {
          performer: {
            id: adminId,
            rol: req.user!.rol,
            nombre: req.user!.nombre || 'Admin',
            email: req.user!.email
          },
          target: {
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            rol: user.rol
          }
        },
        metadata: {
          timestamp: new Date().toISOString(),
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          changes: {
            before: { isActive: true },
            after: { isActive: false }
          }
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

export const getUsers = async (req: Request, res: Response) => {
  try {
    const { 
      search = '', 
      rol = '', 
      isActive, 
      page = 1, 
      limit = 10,
      sortField = 'createdAt',
      sortDirection = 'desc'
    } = req.query;

    // Construir where con sintaxis de Prisma
    const where: any = {};

    // Filtro de búsqueda
    if (search) {
      where.OR = [
        { nombre: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    // Filtro por rol
    if (rol && Object.values(UserRole).includes(rol as UserRole)) {
      where.rol = rol as UserRole;
    }

    // Filtro por estado
    if (isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true';
    }

    // Validar campos permitidos para ordenamiento
    const allowedSortFields = ['nombre', 'email', 'rol', 'isActive', 'lastLogin', 'createdAt'];
    const actualSortField = allowedSortFields.includes(String(sortField)) ? String(sortField) : 'createdAt';
    const actualSortDirection = ['asc', 'desc'].includes(String(sortDirection)) ? String(sortDirection) : 'desc';

    // Usar Prisma para la consulta
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (+page - 1) * +limit,
        take: +limit,
        orderBy: {
          [actualSortField]: actualSortDirection
        },
        select: {
          id: true,
          nombre: true,
          email: true,
          cedula: true,
          telefono: true,
          rol: true,
          isActive: true,
          lastLogin: true,
          photoUrl: true
        }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      users,
      total,
      page: +page,
      totalPages: Math.ceil(total / +limit)
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: 'Error al obtener usuarios' });
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

export const getCurrentUser = async (req: RequestWithUser, res: Response): Promise<void> => {
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
        nombre: true,
        email: true,
        cedula: true,
        telefono: true,
        rol: true,
        isActive: true,
        lastLogin: true,
        createdAt: true
      }
    });

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

    users.forEach(user => {
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
    console.error('Error exportando a Excel:', error);
    res.status(500).json({ message: 'Error al exportar usuarios' });
  }
};

export const exportToPDF = async (_: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        nombre: true,
        email: true,
        cedula: true,
        telefono: true,
        rol: true,
        isActive: true,
        lastLogin: true
      }
    });

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
    users.forEach(user => {
      if (currentTop > 700) { // Nueva página si no hay espacio
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
    console.error('Error exportando a PDF:', error);
    res.status(500).json({ message: 'Error al exportar usuarios' });
  }
};

export const getUserProfile = async (req: RequestWithUser, res: Response): Promise<void> => {
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
  req: RequestWithUser & { file?: Express.Multer.File },
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
    const updateData: Prisma.UserUpdateInput = {};

    // Solo actualizar los campos que vienen en el request
    if (req.body.nombre) updateData.nombre = req.body.nombre.trim();
    if (req.body.cedula) {
      // Validar cédula solo si se está actualizando
      if (!validateCedula(req.body.cedula)) {
        res.status(400).json({
          message: 'La cédula ingresada no es válida',
          error: 'INVALID_CEDULA'
        });
        return;
      }
      // Verificar duplicado solo si la cédula cambió
      if (req.body.cedula !== existingUser.cedula) {
        const userWithCedula = await prisma.user.findUnique({
          where: { cedula: req.body.cedula }
        });
        if (userWithCedula) {
          res.status(400).json({
            message: 'La cédula ya está registrada',
            error: 'DUPLICATE_CEDULA'
          });
          return;
        }
      }
      updateData.cedula = req.body.cedula.trim();
    }
    if (req.body.telefono) {
      // Validar teléfono solo si se está actualizando
      if (!validatePhone(req.body.telefono)) {
        res.status(400).json({
          message: 'El formato del teléfono no es válido (debe ser 09XXXXXXXX)',
          error: 'INVALID_PHONE'
        });
        return;
      }
      updateData.telefono = req.body.telefono.trim();
    }
    if (req.body.domicilio !== undefined) updateData.domicilio = req.body.domicilio?.trim() || null;
    if (req.body.estadoProfesional !== undefined) updateData.estadoProfesional = req.body.estadoProfesional || null;
    if (req.body.numeroMatricula !== undefined) updateData.numeroMatricula = req.body.numeroMatricula?.trim() || null;
    if (req.body.universidad !== undefined) updateData.universidad = req.body.universidad?.trim() || null;

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
    await logActivity({
      userId,
      action: 'UPDATE_PROFILE',
      category: 'PROFILE',
      details: {
        description: 'Perfil actualizado',
        metadata: {
          timestamp: new Date().toISOString()
        },
        changes: {
          before: existingUser,
          after: updatedUser
        }
      }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error en updateUserProfile:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      res.status(400).json({
        message: 'Error al actualizar el perfil',
        error: error.code
      });
    } else {
      res.status(500).json({
        message: 'Error interno del servidor',
        error: 'INTERNAL_ERROR'
      });
    }
  }
};

export const completeProfile = async (req: RequestWithUser & { body: { 
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
      await logActivity({
        userId: req.user.id,
        action: 'PROFILE_COMPLETED',
        category: 'PROFILE',
        details: {
          description: 'Perfil completado exitosamente',
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
export const getProfileStatus = async (req: RequestWithUser, res: Response): Promise<void> => {
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
    if (!validateCedula(cedula)) {
      res.status(400).json({ 
        isValid: false,
        message: 'Cédula inválida. Debe ser una cédula ecuatoriana válida.'
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
export const forcePasswordChange = async (req: RequestWithUser, res: Response): Promise<void> => {
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

    await logActivity({
      userId: userId,
      action: 'PASSWORD_CHANGED',
      category: 'PROFILE',
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

    // Validar email
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      res.status(400).json({ message: 'Email inválido' });
      return;
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      res.status(400).json({ message: 'Usuario ya existe' });
      return;
    }

    // Contraseña temporal predefinida
    const temporalPassword = 'Temporal12345@';
    const hashedPassword = await bcrypt.hash(temporalPassword, 10);

    // Crear primer admin
    const newAdmin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        rol: UserRole.ADMIN,
        isActive: true,
        nombre: '',
        cedula: '',
        telefono: ''
      }
    });

    // Enviar email con credenciales
    await sendWelcomeEmail(email, temporalPassword);

    await logActivity({
      userId: newAdmin.id,
      action: 'USER_CREATED',
      category: 'ADMINISTRATIVE',
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
        email: newAdmin.email,
        rol: newAdmin.rol
      }
    });
  } catch (error) {
    console.error('Error al crear primer admin:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Activar usuario
export const activateUser = async (req: RequestWithUser, res: Response) => {
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

    await logActivity({
      userId: req.user.id,
      targetId: Number(id),
      action: 'ACTIVATE_USER',
      category: 'ACCOUNT_STATUS',
      details: {
        description: `Usuario ${targetUser.nombre} (${targetUser.email}) activado`,
        userInfo: {
          performer: {
            id: req.user.id,
            nombre: req.user.nombre || 'Admin',
            email: req.user.email,
            rol: req.user.rol
          },
          target: {
            id: targetUser.id,
            nombre: targetUser.nombre,
            email: targetUser.email,
            rol: targetUser.rol
          }
        },
        metadata: {
          timestamp: new Date().toISOString(),
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          changes: {
            before: { isActive: false },
            after: { isActive: true }
          }
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
export const deleteUser = async (req: RequestWithUser, res: Response) => {
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
    await prisma.$transaction(async (tx) => {
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
    try {
      await logActivity({
        userId: req.user.id,
        targetId: userId,
        action: 'DELETE_USER',
        category: 'ADMINISTRATIVE',
        details: {
          description: `Usuario ${userToDelete.nombre} (${userToDelete.email}) eliminado del sistema`,
          userInfo: {
            performer: {
              id: req.user.id,
              nombre: req.user.nombre || 'Admin',
              email: req.user.email,
              rol: req.user.rol
            },
            target: {
              id: userToDelete.id,
              nombre: userToDelete.nombre,
              email: userToDelete.email,
              rol: userToDelete.rol
            }
          },
          metadata: {
            timestamp: new Date().toISOString(),
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            deletedUserId: userId
          }
        }
      });
    } catch (logError) {
      console.error('Error al registrar actividad de eliminación:', logError);
      // No afecta la respuesta al cliente ya que ya fue enviada
    }

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
export const getActivityLogs = async (req: RequestWithUser, res: Response) => {
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

    // Continuar con la creación del usuario
    const user = await prisma.user.create({
      data: {
        ...userData,
        cedula: String(cedula),
        updatedAt: new Date()
      }
    });

    // Registrar actividad
    await logActivity({
      userId: user.id,
      action: 'CREATE_USER',
      category: 'ADMINISTRATIVE',
      details: {
        description: 'Usuario creado exitosamente',
        userInfo: {
          performer: {
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            rol: user.rol
          }
        },
        metadata: {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          timestamp: new Date().toISOString(),
          userRole: user.rol,
          userEmail: user.email,
          cedula: user.cedula || ''
        },
        status: 'success'
      }
    });

    res.status(201).json(user);
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ message: 'Error al crear usuario' });
  }
};

export const completeOnboarding = async (req: RequestWithUser, res: Response): Promise<void> => {
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
    await logActivity({
      userId: req.user.id,
      action: 'PROFILE_COMPLETED',
      category: 'PROFILE',
      details: {
        description: 'Onboarding completado',
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

export const updateProfilePhoto = async (req: RequestWithUser & { file?: Express.Multer.File }, res: Response): Promise<void> => {
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
    await logActivity({
      userId: req.user.id,
      action: 'PROFILE_UPDATED',
      category: 'PROFILE',
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

export const changeUserRole = async (req: RequestWithUser, res: Response): Promise<void> => {
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
    await logActivity({
      userId: adminId,
      targetId: userId,
      action: 'CHANGE_ROLE',
      category: 'ADMINISTRATIVE',
      details: {
        description: `Rol de usuario ${targetUser.nombre} (${targetUser.email}) cambiado de ${currentRole} a ${newRole}`,
        userInfo: {
          performer: {
            id: adminId,
            nombre: req.user!.nombre || 'Admin',
            email: req.user!.email,
            rol: req.user!.rol
          },
          target: {
            id: targetUser.id,
            nombre: targetUser.nombre,
            email: targetUser.email,
            rol: newRole
          }
        },
        metadata: {
          reason,
          timestamp: new Date().toISOString(),
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
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
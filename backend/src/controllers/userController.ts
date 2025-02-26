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
import { Prisma, UserRole } from '@prisma/client';
import { logActivity } from '../services/logService';
import { UserFindUniqueArgs } from '../types/prisma';
import { createNotification } from '../services/notificationService';
import { NotificationType } from '../types/notification';
import { 
  RequestWithUser,
  RegisterRequest,
  EstadoProfesional
} from '../types/user';

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

    // Validar email
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      console.warn('Intento de registro con email inválido:', email);
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
      where: { email }
    });

    if (existingUser) {
      console.warn('Intento de registro con email existente:', email);
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
        email,
        password: hashedPassword,
        rol: rol as UserRole,
        isActive: true,
        isFirstLogin: true,
        isProfileCompleted: false
      }
    });

    console.log('Usuario creado exitosamente:', { id: newUser.id, email: newUser.email, rol: newUser.rol });

    // Enviar email con credenciales temporales
    try {
      await sendWelcomeEmail(email, temporalPassword);
      console.log('Email de bienvenida enviado:', email);
    } catch (emailError) {
      console.error('Error al enviar email de bienvenida:', emailError);
      // No devolvemos error al cliente, pero registramos el problema
    }

    // Registrar actividad
    await logActivity({
      userId: newUser.id,
      action: 'USER_CREATED',
      details: {
        createdBy: 'SYSTEM',
        userEmail: email,
        userRole: rol,
        requiresProfileCompletion: true
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
    console.log('Intento de login:', { email }); // No logear passwords

    const user = await prisma.user.findUnique({
      where: { email }
    });

    console.log('Usuario encontrado:', user ? 'Sí' : 'No');

    if (!user || !user.isActive) {
      console.log('Usuario no encontrado o inactivo');
      res.status(401).json({ message: 'Credenciales inválidas' });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('Password válido:', isValidPassword);

    if (!isValidPassword) {
      console.log('Password incorrecto');
      res.status(401).json({ message: 'Credenciales inválidas' });
      return;
    }

    // Actualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Determinar el estado del primer inicio de sesión y los pasos requeridos
    const loginStatus = {
      requiresPasswordChange: user.isFirstLogin,
      requiresProfileCompletion: !user.isProfileCompleted,
      nextStep: user.isFirstLogin ? 'PASSWORD_CHANGE' : 
                !user.isProfileCompleted ? 'COMPLETE_PROFILE' : 
                'NONE'
    };

    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        rol: user.rol,
        isFirstLogin: user.isFirstLogin,
        isProfileCompleted: user.isProfileCompleted
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    console.log('Login exitoso, enviando respuesta');

    // Registrar actividad de login
    await logActivity({
      userId: user.id,
      action: 'LOGIN',
      details: {
        description: 'Inicio de sesión exitoso',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        loginStatus
      }
    });

    res.json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        isActive: user.isActive,
        isFirstLogin: user.isFirstLogin,
        isProfileCompleted: user.isProfileCompleted
      },
      loginStatus
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
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
      data: { password: hashedPassword }
    });

    await logActivity({
      userId: userId,
      action: 'CHANGE_PASSWORD',
      details: {
        description: 'Contraseña actualizada exitosamente',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    res.status(200).json({ 
      message: 'Contraseña actualizada exitosamente' 
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
      details: {
        resetToken: resetToken,
        resetTokenExpiry: resetTokenExpiry.toISOString()
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
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
      details: {
        description: 'Contraseña actualizada exitosamente',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
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
      details: {
        description: 'Información de usuario actualizada',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
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
export const deactivateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id: Number(id) }
    });
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    await prisma.user.update({
      where: { id: Number(id) },
      data: { isActive: false }
    });

    await logActivity({
      userId: Number(id),
      action: 'DEACTIVATE_USER',
      details: {
        description: 'Usuario desactivado',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    res.status(200).json({
      message: 'Usuario desactivado exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al desactivar usuario',
      error: (error as Error).message
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
          lastLogin: true
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
        rol: true,
        isActive: true,
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
          take: 10
        },
        permissions: {
          include: {
            permission: true
          }
        }
      }
    } as UserFindUniqueArgs);

    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Error al obtener detalles del usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
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
      details: {
        changes: updateData,
        timestamp: new Date()
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

    // Validar que la universidad sea proporcionada si es estudiante
    if (estadoProfesional === 'ESTUDIANTE' && !universidad) {
      res.status(400).json({ 
        message: 'La universidad es requerida para estudiantes',
        error: 'MISSING_UNIVERSITY'
      });
      return;
    }

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
      details: {
        timestamp: new Date()
      }
    });

    // Crear notificación
    await createNotification(
      req.user.id,
      NotificationType.PROFILE_COMPLETED,
      'Has completado tu perfil exitosamente',
      {
        timestamp: new Date()
      }
    );

    res.json(updatedUser);
  } catch (error) {
    console.error('Error al completar el perfil:', error);
    res.status(500).json({ message: 'Error al actualizar el perfil' });
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
      action: 'FORCE_PASSWORD_CHANGE',
      details: {
        description: 'Contraseña actualizada exitosamente en primer inicio de sesión',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        timestamp: new Date()
      }
    });

    // Crear notificación
    await createNotification(
      userId,
      NotificationType.PASSWORD_CHANGED,
      'Has cambiado tu contraseña exitosamente',
      {
        isFirstLogin: true,
        timestamp: new Date()
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
      action: 'CREATE_USER',
      details: {
        description: 'Administrador creado exitosamente',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
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
    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: { isActive: true }
    });

    await logActivity({
      userId: req.user.id,
      action: 'ACTIVATE_USER',
      details: {
        targetUserId: user.id,
        timestamp: new Date()
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
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const { id } = req.params;
    
    // Verificar que no se intente eliminar al usuario actual
    if (req.user.id === Number(id)) {
      res.status(400).json({ message: 'No puedes eliminarte a ti mismo' });
      return;
    }

    // Verificar si el usuario existe antes de eliminarlo
    const userExists = await prisma.user.findUnique({
      where: { id: Number(id) }
    });

    if (!userExists) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    // Eliminar registros relacionados primero
    await prisma.$transaction([
      // Eliminar logs de actividad
      prisma.activityLog.deleteMany({
        where: { userId: Number(id) }
      }),
      // Eliminar notificaciones
      prisma.notification.deleteMany({
        where: { userId: Number(id) }
      }),
      // Eliminar permisos de usuario
      prisma.userPermission.deleteMany({
        where: { userId: Number(id) }
      }),
      // Finalmente eliminar el usuario
      prisma.user.delete({
        where: { id: Number(id) }
      })
    ]);

    await logActivity({
      userId: req.user.id,
      action: 'DELETE_USER',
      details: {
        deletedUserId: Number(id),
        timestamp: new Date()
      }
    });

    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ message: 'Error al eliminar usuario' });
  }
};

// Obtener logs de actividad
export const getActivityLogs = async (req: Request, res: Response) => {
  const { userId, action, startDate, endDate, page, limit } = req.query;
  
  try {
    const logs = await prisma.activityLog.findMany({
      where: {
        userId: userId ? Number(userId) : undefined,
        action: action?.toString(),
        createdAt: {
          gte: startDate ? new Date(startDate.toString()) : undefined,
          lte: endDate ? new Date(endDate.toString()) : undefined
        }
      },
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
      skip: page ? (Number(page) - 1) * (Number(limit) || 10) : 0,
      take: limit ? Number(limit) : 10
    });

    res.json(logs);
  } catch (error) {
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
        cedula: String(cedula), // Convertir explícitamente a string
        updatedAt: new Date()
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
      action: 'ONBOARDING_COMPLETED',
      details: {
        timestamp: new Date()
      }
    });

    // Crear notificación
    await createNotification(
      req.user.id,
      NotificationType.SUCCESS,
      '¡Bienvenido! Has completado el proceso de onboarding exitosamente',
      {
        timestamp: new Date()
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
      action: 'UPDATE_PROFILE_PHOTO',
      details: {
        timestamp: new Date(),
        photoUrl
      }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error al actualizar foto de perfil:', error);
    res.status(500).json({ message: 'Error al actualizar foto de perfil' });
  }
}; 
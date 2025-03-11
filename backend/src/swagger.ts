import { Express, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';

const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Sistema de Gestión de Abogados API',
    version: '1.0.0',
    description: `
      API REST para el Sistema de Gestión de Abogados.
    
    ## Características Principales
      - Sistema completo de autenticación y autorización:
        * Login con JWT
        * Recuperación de contraseña
        * Validación de sesiones
        * Protección de rutas
        * Manejo de roles (ADMIN, COLABORADOR)
      
      ## Políticas de Seguridad
      
      ### Rate Limiting
      - Login: 5 intentos por minuto
      - Registro: 3 intentos por hora
      - Recuperación de contraseña: 3 intentos por hora
      - API general: 100 peticiones por minuto
      
      ### Políticas de Tokens
      - Access Token:
        * Duración: 1 hora
        * Tipo: JWT
        * Renovación: Mediante refresh token
      
      - Refresh Token:
        * Duración: 7 días
        * Almacenamiento: Seguro en base de datos
        * Rotación: En cada uso
      
      - Tokens de Recuperación:
        * Duración: 1 hora
        * Un solo uso
        * Invalidación automática al usar
      
      ### Manejo de Sesiones
      - Límite de sesiones activas: 5 por usuario
      - Cierre automático por inactividad: 24 horas
      - Invalidación de todas las sesiones al cambiar contraseña
      
      - Gestión de perfiles profesionales:
        * Registro y actualización de información personal
        * Validación de cédulas ecuatorianas
        * Gestión de documentos profesionales
        * Control de estados profesionales
        * Seguimiento de matrículas profesionales
      
      - Registro de actividades de usuario:
        * Seguimiento detallado de acciones
        * Historial de modificaciones
        * Registro de inicios de sesión
        * Monitoreo de cambios en el sistema
        * Exportación de registros de actividad
      
      - Validaciones de datos ecuatorianos:
        * Verificación de cédulas
        * Validación de números telefónicos
        * Formato de matrículas vehiculares
        * Validación de correos electrónicos
        * Verificación de documentos oficiales
      
      - Sistema de permisos basado en roles:
        * Control granular de accesos
        * Permisos por módulo y acción
        * Gestión de cantones asignados
        * Control de acceso a documentos
        * Restricciones por nivel de usuario
      
      - Gestión de documentos y archivos:
        * Almacenamiento seguro de documentos
        * Validación de tipos de archivo
        * Control de versiones
        * Límites de tamaño y formato
        * Organización por categorías
      
      - Sistema de notificaciones:
        * Alertas en tiempo real
        * Notificaciones por email
        * Recordatorios automáticos
        * Seguimiento de estados
        * Historial de notificaciones
      
      - Exportación de datos:
        * Formatos Excel y PDF
        * Reportes personalizados
        * Estadísticas del sistema
        * Históricos de actividad
        * Documentación generada
    `,
    contact: {
      name: 'Soporte Técnico',
      email: 'soporte@sistema-abogados.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Servidor de Desarrollo'
    }
  ],
  tags: [
    {
      name: 'Auth',
      description: 'Autenticación y gestión de sesiones'
    },
    {
      name: 'Users',
      description: 'Gestión administrativa de usuarios'
    },
    {
      name: 'Profile',
      description: 'Gestión del perfil de usuario'
    },
    {
      name: 'Activity',
      description: 'Monitoreo y registro de actividades del sistema'
    },
    {
      name: 'Stats',
      description: 'Estadísticas y métricas del sistema'
    },
    {
      name: 'Notifications',
      description: 'Gestión de notificaciones del sistema'
    },
    {
      name: 'Permissions',
      description: 'API para gestión de permisos y roles'
    },
    {
      name: 'Colaborador',
      description: 'Operaciones permitidas para colaboradores'
    },
    {
      name: 'Cantones',
      description: 'Gestión de cantones y sus recursos asociados'
    },
    {
      name: 'Jueces',
      description: 'Gestión de jueces y sus asignaciones a cantones'
    },
    {
      name: 'Personas',
      description: 'Gestión de personas y sus documentos asociados'
    },
    {
      name: 'Validaciones',
      description: 'Endpoints para validación de datos críticos del sistema'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      },
      rateLimiting: {
        type: 'apiKey',
        name: 'X-Rate-Limit',
        in: 'header',
        description: `
          Rate limiting por endpoint:
          - Login: 5 intentos/minuto
          - Registro: 3 intentos/hora
          - Recuperación contraseña: 3 intentos/hora
          - API general: 100 peticiones/minuto
        `
      }
    },
    schemas: {
      ValidationError: {
        type: 'object',
        properties: {
          message: { 
            type: 'string',
            description: 'Mensaje general del error'
          },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: {
            type: 'string',
                  description: 'Campo que falló la validación'
          },
                message: {
            type: 'string',
                  description: 'Mensaje específico del error'
          },
                code: {
            type: 'string',
                  description: 'Código de error para identificación programática'
                }
              }
            }
          }
        }
      },
      CedulaValidation: {
        type: 'object',
        required: ['cedula'],
        properties: {
          cedula: {
            type: 'string',
            pattern: '^[0-9]{10}$',
            description: 'Cédula ecuatoriana (10 dígitos)',
            example: '1234567890'
          }
        }
      },
      EmailValidation: {
            type: 'object',
        required: ['email'],
            properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'Correo electrónico a validar',
            example: 'usuario@ejemplo.com'
          }
        }
      },
      MatriculaValidation: {
        type: 'object',
        required: ['matricula'],
        properties: {
          matricula: {
            type: 'string',
            pattern: '^MAT-\\d{4}-\\d{3}$',
            description: 'Número de matrícula profesional',
            example: 'MAT-2024-001'
          }
        }
      },
      FileUploadValidation: {
        type: 'object',
        properties: {
          maxSize: {
            type: 'integer',
            description: 'Tamaño máximo permitido en bytes',
            example: 5242880
          },
          allowedTypes: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Tipos MIME permitidos',
            example: ['image/jpeg', 'image/png', 'application/pdf']
          }
        }
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'usuario@ejemplo.com'
          },
          password: {
            type: 'string',
            format: 'password',
            example: 'Contraseña123!'
          }
        }
      },
      LoginResponse: {
        type: 'object',
        properties: {
          token: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
          },
          user: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 1 },
              email: { type: 'string', example: 'usuario@ejemplo.com' },
              rol: { type: 'string', example: 'COLABORADOR' }
            }
          }
        }
      },
      PasswordResetRequest: {
        type: 'object',
        required: ['email'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'usuario@ejemplo.com'
          }
        }
      },
      PasswordChangeRequest: {
              type: 'object',
        required: ['token', 'newPassword'],
              properties: {
          token: {
            type: 'string',
            example: 'reset-token-123'
          },
          newPassword: {
                type: 'string',
            format: 'password',
            example: 'NuevaContraseña123!'
          }
        }
              },
      Error: {
                type: 'object',
                properties: {
          message: { type: 'string' },
          errors: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          email: { type: 'string', format: 'email' },
          nombre: { type: 'string' },
          rol: { type: 'string', enum: ['ADMIN', 'COLABORADOR'] },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      UserList: {
        type: 'object',
        properties: {
          users: {
            type: 'array',
            items: { $ref: '#/components/schemas/User' }
          },
          total: { type: 'integer' },
          totalPages: { type: 'integer' },
          currentPage: { type: 'integer' }
        }
      },
      CreateUserRequest: {
        type: 'object',
        required: ['email', 'rol'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'nuevo.usuario@ejemplo.com'
                  },
          rol: {
            type: 'string',
            enum: ['ADMIN', 'COLABORADOR'],
            example: 'ADMIN'
          }
        }
      },
      ProfileStatus: {
        type: 'object',
        properties: {
          isCompleted: {
            type: 'boolean',
            description: 'Indica si el perfil está completo'
          },
          isFirstLogin: {
            type: 'boolean',
            description: 'Indica si es el primer inicio de sesión'
          },
          pendingFields: {
            type: 'array',
            items: { type: 'string' },
            description: 'Lista de campos pendientes por completar',
            example: ['nombre', 'cedula', 'universidad']
          }
        }
      },
      ProfileUpdateRequest: {
        type: 'object',
        required: ['nombre', 'cedula', 'telefono', 'nivelEstudios'],
        properties: {
          nombre: {
            type: 'string',
            minLength: 3,
            example: 'Juan Pérez'
          },
          cedula: {
            type: 'string',
            pattern: '^[0-9]{10}$',
            example: '1234567890'
          },
          telefono: {
            type: 'string',
            pattern: '^09[0-9]{8}$',
            example: '0912345678'
          },
          nivelEstudios: {
            type: 'string',
            enum: ['ESTUDIANTE', 'GRADUADO', 'MAESTRIA']
          },
          universidad: {
            type: 'string',
            description: 'Requerido solo para estudiantes'
          },
          matricula: {
            type: 'string',
            description: 'Requerido para graduados y maestría'
          },
          domicilio: { type: 'string' }
        }
      },
      ActivityLog: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          userId: { type: 'integer' },
          action: { type: 'string' },
          details: { type: 'string' },
          category: { 
            type: 'string',
            enum: ['AUTH', 'USER', 'PROFILE', 'DOCUMENT', 'SYSTEM']
          },
          createdAt: { type: 'string', format: 'date-time' },
          user: { $ref: '#/components/schemas/User' }
        }
      },
      ActivityLogList: {
        type: 'object',
        properties: {
          logs: {
            type: 'array',
            items: { $ref: '#/components/schemas/ActivityLog' }
          },
          total: { type: 'integer' },
          page: { type: 'integer' },
          totalPages: { type: 'integer' }
        }
      },
      ActivityStats: {
        type: 'object',
        properties: {
          totalActivities: { type: 'integer' },
          todayActivities: { type: 'integer' },
          topActions: {
            type: 'array',
                items: {
              type: 'object',
              properties: {
                action: { type: 'string' },
                count: { type: 'integer' }
              }
            }
          },
          activityByHour: {
            type: 'array',
            items: {
            type: 'object',
            properties: {
                hour: { type: 'integer' },
                count: { type: 'integer' }
              }
            }
          }
        }
      },
      UserStats: {
        type: 'object',
        properties: {
          totalUsers: {
            type: 'integer',
            description: 'Total de usuarios registrados'
          },
          activeUsers: {
            type: 'integer',
            description: 'Usuarios activos actualmente'
          },
          usersByRole: {
        type: 'object',
        properties: {
              ADMIN: { type: 'integer' },
              COLABORADOR: { type: 'integer' }
            },
            description: 'Distribución de usuarios por rol'
          },
          newUsersThisMonth: {
                type: 'integer',
            description: 'Nuevos usuarios registrados este mes'
          }
        }
      },
      SystemStats: {
        type: 'object',
        properties: {
          activityMetrics: {
            type: 'object',
            properties: {
              totalActivities: { type: 'integer' },
              dailyAverage: { type: 'number' },
              peakHour: { type: 'integer' }
            }
          },
          performanceMetrics: {
            type: 'object',
            properties: {
              averageResponseTime: { type: 'number' },
              uptime: { type: 'number' },
              errorRate: { type: 'number' }
            }
          }
        }
      },
      Notification: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          userId: { type: 'integer' },
          title: { type: 'string' },
          message: { type: 'string' },
          type: {
            type: 'string',
            enum: ['INFO', 'WARNING', 'ERROR', 'SUCCESS']
          },
          isRead: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          readAt: { type: 'string', format: 'date-time', nullable: true }
        }
      },
      NotificationList: {
        type: 'object',
        properties: {
          notifications: {
            type: 'array',
            items: { $ref: '#/components/schemas/Notification' }
            },
          unreadCount: { type: 'integer' },
          total: { type: 'integer' }
        }
      },
      Permissions: {
        type: 'object',
        properties: {
          userId: {
            type: 'number',
            description: 'ID del usuario'
          },
          rol: {
            type: 'string',
            enum: ['admin', 'colaborador'],
            description: 'Rol del usuario'
          },
          isActive: {
            type: 'boolean',
            description: 'Estado del usuario'
      },
          permissions: {
            type: 'object',
            properties: {
              canCreateUsers: {
                type: 'boolean',
                description: 'Permiso para crear usuarios'
              },
              canEditUsers: {
                type: 'boolean',
                description: 'Permiso para editar usuarios'
              },
              canDeleteUsers: {
                type: 'boolean',
                description: 'Permiso para eliminar usuarios'
              },
              canViewUsers: {
                type: 'boolean',
                description: 'Permiso para ver lista de usuarios'
              },
              canAssignRoles: {
                type: 'boolean',
                description: 'Permiso para asignar roles'
              },
              canViewOwnProfile: {
                type: 'boolean',
                description: 'Permiso para ver perfil propio'
              },
              canEditOwnProfile: {
                type: 'boolean',
                description: 'Permiso para editar perfil propio'
              },
              canCreateCases: {
                type: 'boolean',
                description: 'Permiso para crear casos legales'
              },
              canViewOwnCases: {
                type: 'boolean',
                description: 'Permiso para ver casos propios'
              }
            }
          }
        }
      },
      CantonPermission: {
        type: 'object',
        properties: {
          userId: {
                type: 'integer',
            description: 'ID del usuario'
              },
          cantonId: {
                type: 'integer',
            description: 'ID del cantón'
          },
          canView: {
            type: 'boolean',
            description: 'Permiso para ver información'
          },
          canCreate: {
                type: 'boolean',
            description: 'Permiso para crear registros'
          },
          canEdit: {
            type: 'boolean',
            description: 'Permiso para editar información'
          }
        }
      },
      PersonaPermission: {
        type: 'object',
        properties: {
          userId: {
            type: 'integer',
            description: 'ID del usuario'
          },
          personaId: {
            type: 'integer',
            description: 'ID de la persona'
          },
          cantonId: {
            type: 'integer',
            description: 'ID del cantón asociado'
          },
          canView: {
            type: 'boolean',
            description: 'Permiso para ver información'
          },
          canCreate: {
            type: 'boolean',
            description: 'Permiso para crear registros'
          },
          canEditOwn: {
            type: 'boolean',
            description: 'Permiso para editar registros propios'
          }
        }
      },
      PersonaBasica: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'ID único de la persona'
          },
          cedula: {
            type: 'string',
            pattern: '^[0-9]{10}$',
            description: 'Cédula ecuatoriana (10 dígitos)'
          },
          nombres: {
            type: 'string',
            description: 'Nombres completos'
          },
          apellidos: {
            type: 'string',
            description: 'Apellidos completos'
          },
          cantonId: {
            type: 'integer',
            description: 'ID del cantón al que pertenece'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Fecha de creación'
          }
        }
      },
      PersonaDetalle: {
        type: 'object',
        properties: {
          id: { 
            type: 'integer',
            description: 'ID único de la persona'
          },
          cedula: {
            type: 'string',
            pattern: '^[0-9]{10}$',
            description: 'Cédula ecuatoriana (10 dígitos)'
          },
          nombres: {
            type: 'string',
            description: 'Nombres completos'
          },
          apellidos: {
            type: 'string',
            description: 'Apellidos completos'
          },
          cantonId: {
            type: 'integer',
            description: 'ID del cantón al que pertenece'
          },
          telefono: {
            type: 'string',
            pattern: '^09[0-9]{8}$',
            description: 'Número de teléfono celular'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Correo electrónico'
          },
          direccion: {
            type: 'string',
            description: 'Dirección domiciliaria'
          },
          createdAt: {
              type: 'string',
            format: 'date-time',
            description: 'Fecha de creación'
            },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Última actualización'
          }
        }
      },
      CreatePersonaRequest: {
        type: 'object',
        required: ['cedula', 'nombres', 'apellidos', 'cantonId'],
        properties: {
          cedula: {
            type: 'string',
            pattern: '^[0-9]{10}$',
            description: 'Cédula ecuatoriana (10 dígitos)',
            example: '1234567890'
          },
          nombres: {
            type: 'string',
            minLength: 3,
            description: 'Nombres completos',
            example: 'Juan Carlos'
          },
          apellidos: {
            type: 'string',
            minLength: 3,
            description: 'Apellidos completos',
            example: 'Pérez González'
          },
          cantonId: {
            type: 'integer',
            description: 'ID del cantón al que pertenece',
            example: 1
          },
          telefono: {
            type: 'string',
            pattern: '^09[0-9]{8}$',
            description: 'Número de teléfono celular',
            example: '0912345678'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Correo electrónico',
            example: 'juan.perez@ejemplo.com'
          },
          direccion: {
            type: 'string',
            description: 'Dirección domiciliaria',
            example: 'Av. Principal 123'
          }
        }
      },
      Canton: {
        type: 'object',
        required: ['nombre', 'codigo'],
        properties: {
          id: { type: 'integer' },
          nombre: { type: 'string' },
          codigo: { type: 'string' },
          imagenUrl: { type: 'string' },
          isActive: { type: 'boolean' },
          jueces: {
            type: 'array',
            items: { $ref: '#/components/schemas/Juez' }
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Juez: {
        type: 'object',
        required: ['nombre'],
        properties: {
          id: { type: 'integer' },
          nombre: { type: 'string' },
          cantones: {
            type: 'array',
            items: { $ref: '#/components/schemas/Canton' }
          },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Persona: {
        type: 'object',
        required: ['cedula', 'telefono'],
        properties: {
          id: { type: 'integer' },
          cedula: { type: 'string', pattern: '^[0-9]{10}$' },
          telefono: { type: 'string' },
          contactoRef: { type: 'string' },
          email: { type: 'string', format: 'email' },
          domicilio: { type: 'string' },
          matriculasVehiculo: { type: 'array', items: { type: 'string' } },
          documentos: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
          nombre: { type: 'string' },
                url: { type: 'string' },
                tipo: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' }
              }
            }
          },
          isActive: { type: 'boolean' }
        }
      }
    }
  },
  paths: {
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Iniciar sesión',
        description: `
          Autenticar usuario y obtener token JWT.
          
          ### Rate Limiting:
          - 5 intentos por minuto por IP
          - Bloqueo temporal después de 5 intentos fallidos
          
          ### Seguridad:
          - No requiere autenticación
          - Protección contra fuerza bruta
          - Registro de intentos fallidos
        `,
        security: [{ rateLimiting: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/LoginRequest'
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Login exitoso',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LoginResponse'
          }
        }
      }
    },
          400: {
            description: 'Error de validación',
          content: {
            'application/json': {
              schema: {
                  $ref: '#/components/schemas/Error'
              }
            }
          }
        },
          401: {
            description: 'Credenciales inválidas'
          },
          429: {
            description: 'Demasiados intentos de inicio de sesión'
          }
        }
      }
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Registrar nuevo usuario',
        description: 'Crear una nueva cuenta de usuario',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateUserRequest'
          }
        }
      }
    },
        responses: {
          201: {
            description: 'Usuario registrado exitosamente',
          content: {
            'application/json': {
              schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Usuario creado exitosamente'
                    },
                    user: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          },
          400: {
            description: 'Error de validación'
                }
              }
            }
          },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Solicitar recuperación de contraseña',
        description: 'Envía un email con instrucciones para recuperar la contraseña',
        requestBody: {
            required: true,
          content: {
            'application/json': {
                schema: {
                $ref: '#/components/schemas/PasswordResetRequest'
                }
              }
            }
          },
        responses: {
          200: {
            description: 'Email enviado exitosamente'
          },
          400: {
            description: 'Email no encontrado'
          }
        }
      }
    },
    '/auth/keep-alive': {
      post: {
        tags: ['Auth'],
        summary: 'Mantener sesión activa',
        description: 'Actualiza el token de sesión para mantenerla activa',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Sesión actualizada exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: {
                      type: 'string',
                      description: 'Nuevo token JWT'
                    }
              }
            }
          }
        }
      },
          401: {
            description: 'No autorizado'
          }
        }
      }
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refrescar token',
        description: 'Obtiene un nuevo token de acceso usando el refresh token',
        requestBody: {
          required: true,
            content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: {
                    type: 'string'
              }
            }
          }
        }
      }
    },
        responses: {
          200: {
            description: 'Token refrescado exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    accessToken: {
                      type: 'string'
                    },
                    refreshToken: {
                      type: 'string'
              }
            }
          }
        }
      }
    },
          401: {
            description: 'Refresh token inválido o expirado'
                }
              }
            }
          },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Cerrar sesión',
        description: 'Cierra la sesión actual del usuario',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Sesión cerrada exitosamente'
          },
          401: {
            description: 'No autorizado'
            }
          }
        }
      },
    '/api/auth/complete-onboarding': {
      post: {
        tags: ['Auth'],
        summary: 'Completar proceso de onboarding',
        description: `
          Marca como completado el proceso inicial de configuración del usuario.
          
          ### Efectos:
          - Actualiza el estado de onboarding
          - Habilita acceso completo al sistema
          - Registra la fecha de completado
        `,
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Onboarding completado exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Proceso de onboarding completado'
                    },
                    completedAt: {
                      type: 'string',
                      format: 'date-time'
                    }
                  }
                }
              }
            }
          },
          401: {
            description: 'No autorizado'
      }
        }
      }
    },
    '/api/users/profile/status': {
      get: {
        tags: ['Profile'],
        summary: 'Obtener estado del perfil',
        description: `
          Obtiene el estado actual del perfil del usuario.
          
          ### Información retornada:
          - Campos completados
          - Campos pendientes
          - Estado de verificación
          - Estado de onboarding
        `,
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Estado del perfil obtenido exitosamente',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                    isComplete: {
                      type: 'boolean'
                    },
                    completedFields: {
                      type: 'array',
                      items: {
                        type: 'string'
                      }
                    },
                    pendingFields: {
                      type: 'array',
                      items: {
                        type: 'string'
                      }
                    },
                    verificationStatus: {
                      type: 'string',
                      enum: ['PENDING', 'IN_PROGRESS', 'VERIFIED', 'REJECTED']
                    },
                    onboardingCompleted: {
                      type: 'boolean'
                    }
                  }
                }
              }
            }
          },
          401: {
            description: 'No autorizado'
          }
        }
      }
    },
    '/api/users/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Restablecer contraseña',
        description: `
          Cambia la contraseña usando token de recuperación.
          
          ### Proceso:
          1. Usuario solicita recuperación (forgot-password)
          2. Recibe email con token
          3. Usa token para establecer nueva contraseña
          
          ### Validaciones de contraseña:
          - Mínimo 8 caracteres
          - Al menos una mayúscula
          - Al menos una minúscula
          - Al menos un número
          - Al menos un carácter especial
        `,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PasswordChangeRequest'
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Contraseña actualizada exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Contraseña actualizada exitosamente'
              }
            }
          }
        }
      }
    },
          400: {
            description: 'Error de validación',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    errors: {
                  type: 'array',
                      items: { type: 'string' },
                      example: [
                        'La contraseña debe tener al menos 8 caracteres',
                        'Debe incluir al menos una mayúscula'
                      ]
                    }
                  }
                }
              }
            }
          },
          401: {
            description: 'Token inválido o expirado'
          }
        }
      }
    },
    '/api/users/change-password': {
      post: {
        tags: ['Auth'],
        summary: 'Cambiar contraseña',
        description: `
          Permite al usuario cambiar su contraseña actual.
          
          ### Validaciones:
          - Requiere contraseña actual correcta
          - Nueva contraseña debe cumplir requisitos de seguridad
          - No puede ser igual a la contraseña actual
          - Se envía email de confirmación
        `,
        security: [{ bearerAuth: [] }],
        requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                    type: 'object',
                required: ['currentPassword', 'newPassword'],
                    properties: {
                  currentPassword: {
                        type: 'string',
                    format: 'password',
                    example: 'ContraseñaActual123!'
                  },
                  newPassword: {
                    type: 'string',
                    format: 'password',
                    example: 'NuevaContraseña123!'
              }
            }
          }
        }
      }
    },
        responses: {
          200: {
            description: 'Contraseña actualizada exitosamente',
            content: {
              'application/json': {
            schema: {
                  type: 'object',
                  properties: {
                    message: {
              type: 'string',
                      example: 'Contraseña actualizada exitosamente'
                    }
                  }
                }
              }
            }
          },
          400: {
            description: 'Error de validación',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    errors: {
                      type: 'array',
                      items: { type: 'string' },
                      example: [
                        'La nueva contraseña no cumple los requisitos de seguridad',
                        'La nueva contraseña no puede ser igual a la actual'
                      ]
                    }
                  }
                }
              }
            }
          },
          401: {
            description: 'Contraseña actual incorrecta'
          }
        }
      }
    },
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'Listar usuarios',
        description: 'Obtiene una lista paginada y filtrable de usuarios (requiere rol ADMIN)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'search',
            schema: { type: 'string' },
            description: 'Buscar por nombre o email'
          },
          {
            in: 'query',
            name: 'rol',
              schema: {
                    type: 'string',
              enum: ['ADMIN', 'COLABORADOR']
            },
            description: 'Filtrar por rol'
          },
          {
            in: 'query',
            name: 'isActive',
            schema: { type: 'boolean' },
            description: 'Filtrar por estado'
          },
          {
            in: 'query',
            name: 'page',
            schema: { 
              type: 'integer',
              default: 1
            },
            description: 'Número de página'
          },
          {
            in: 'query',
            name: 'limit',
            schema: { 
              type: 'integer',
              default: 10
            },
            description: 'Elementos por página'
          },
          {
            in: 'query',
            name: 'sortField',
            schema: { type: 'string' },
            description: 'Campo para ordenar'
          },
          {
            in: 'query',
            name: 'sortDirection',
            schema: { 
              type: 'string',
              enum: ['asc', 'desc'],
              default: 'desc'
            },
            description: 'Dirección del ordenamiento'
          }
        ],
        responses: {
          200: {
            description: 'Lista de usuarios obtenida exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserList' }
          }
        }
      },
          401: {
            description: 'No autorizado'
          },
          403: {
            description: 'Forbidden - Requiere rol ADMIN'
          }
        }
      }
    },
    '/api/admin/users': {
      get: {
        tags: ['Users'],
        summary: 'Listar todos los usuarios',
        description: `
          Obtiene la lista completa de usuarios con opciones de filtrado y paginación.
          Solo accesible para administradores.
          
          ### Funcionalidades:
          - Filtrado por rol
          - Filtrado por estado
          - Búsqueda por nombre/email
          - Paginación
          - Ordenamiento
        `,
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'rol',
            schema: {
              type: 'string',
              enum: ['ADMIN', 'COLABORADOR']
            }
          },
          {
            in: 'query',
            name: 'isActive',
            schema: { type: 'boolean' }
          },
          {
            in: 'query',
            name: 'search',
            schema: { type: 'string' }
          },
          {
            in: 'query',
            name: 'page',
            schema: { type: 'integer', default: 1 }
          },
          {
            in: 'query',
            name: 'limit',
            schema: { type: 'integer', default: 10 }
          }
        ],
        responses: {
          200: {
            description: 'Lista de usuarios obtenida exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    users: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/User' }
                    },
                    total: { type: 'integer' },
                    page: { type: 'integer' },
                    totalPages: { type: 'integer' }
                  }
                }
              }
            }
          },
          403: {
            description: 'Acceso denegado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Acceso permitido solo para administradores'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/admin/users/{id}/deactivate': {
      patch: {
        tags: ['Users'],
        summary: 'Desactivar usuario',
        description: `
          Desactiva un usuario del sistema.
          Solo administradores pueden realizar esta acción.
          
          ### Efectos:
          - Usuario no podrá iniciar sesión
          - Se mantienen todos los datos
          - Se registra en el log de actividades
          
          ### Restricciones:
          - No se puede desactivar al super admin
          - No se puede desactivar a uno mismo
        `,
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          200: {
            description: 'Usuario desactivado exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Usuario desactivado exitosamente'
                    },
                    user: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          },
          400: {
            description: 'Error de validación',
            content: {
              'application/json': {
                schema: {
                        type: 'object',
                        properties: {
                    message: {
                      type: 'string',
                      example: 'No se puede desactivar al super admin'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/admin/users/{id}/activate': {
      patch: {
        tags: ['Users'],
        summary: 'Activar usuario',
        description: `
          Activa un usuario previamente desactivado.
          Solo administradores pueden realizar esta acción.
          
          ### Efectos:
          - Usuario podrá iniciar sesión nuevamente
          - Se mantiene la configuración previa
          - Se registra en el log de actividades
        `,
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          200: {
            description: 'Usuario activado exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Usuario activado exitosamente'
                    },
                    user: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/users/{id}': {
      put: {
        tags: ['Users'],
        summary: 'Actualizar usuario',
        description: 'Actualiza la información de un usuario específico',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/User' }
            }
          }
        },
        responses: {
          200: {
            description: 'Usuario actualizado exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          },
      delete: {
        tags: ['Users'],
        summary: 'Eliminar usuario',
        description: 'Elimina un usuario del sistema',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          200: {
            description: 'Usuario eliminado exitosamente'
              }
            }
          }
        },
    '/users/me': {
      get: {
        tags: ['Profile'],
        summary: 'Obtener perfil propio',
        description: 'Obtiene los datos del usuario autenticado',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Datos del usuario',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' }
              }
            }
          },
          401: {
            description: 'No autorizado'
                }
              }
            }
          },
    '/users/me/profile': {
      put: {
        tags: ['Profile'],
        summary: 'Actualizar perfil personal',
        description: 'Permite a un usuario actualizar su información personal',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
            content: {
            'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                  nombre: {
                    type: 'string',
                    description: 'Nombre completo del usuario'
                  },
                  cedula: {
                    type: 'string',
                    description: 'Número de cédula (debe ser válido)',
                    pattern: '^[0-9]{10}$'
                  },
                  telefono: {
                    type: 'string',
                    description: 'Número de teléfono (formato: 09XXXXXXXX)',
                    pattern: '^09[0-9]{8}$'
                  },
                  domicilio: {
                    type: 'string',
                    description: 'Dirección de domicilio'
                  },
                  estadoProfesional: {
                    type: 'string',
                    description: 'Estado profesional del usuario',
                    enum: ['ESTUDIANTE', 'GRADUADO', 'MAESTRIA']
                  },
                  numeroMatricula: {
                    type: 'string',
                    description: 'Número de matrícula profesional'
                  },
                  universidad: {
                    type: 'string',
                    description: 'Universidad donde estudia o estudió'
                  },
                  photo: {
                    type: 'string',
                    format: 'binary',
                    description: 'Foto de perfil (JPG o PNG)'
                    }
                  }
                }
              }
            }
        },
        responses: {
          200: {
            description: 'Perfil actualizado exitosamente'
          },
          400: {
            description: 'Error de validación'
          },
          401: {
            description: 'No autorizado'
          }
        }
      }
    },
    '/users/me/photo': {
      post: {
        tags: ['Profile'],
        summary: 'Actualizar foto de perfil',
        description: 'Permite al usuario actualizar su foto de perfil',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['photo'],
                properties: {
                  photo: {
                    type: 'string',
                    format: 'binary',
                    description: 'Nueva foto de perfil (JPG o PNG)'
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Foto actualizada exitosamente'
          },
          400: {
            description: 'Error en el archivo subido'
          },
          401: {
            description: 'No autorizado'
          }
        }
      }
    },
    '/api/users/profile/complete': {
      post: {
        tags: ['Profile'],
        summary: 'Completar perfil de usuario',
        description: `
          Permite al usuario completar su perfil en el primer inicio de sesión.
          
          ### Reglas de Validación:
          - Nombre completo requerido
          - Cédula ecuatoriana válida (10 dígitos)
          - Teléfono válido
          - Contraseña segura
          
          ### Reglas por Nivel de Estudios:
          - ESTUDIANTE:
            * Requiere universidad
            * No permite matrícula
          - GRADUADO/MAESTRIA:
            * Requiere matrícula
            * No requiere universidad
        `,
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProfileUpdateRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Perfil actualizado exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    user: { $ref: '#/components/schemas/User' }
            }
          }
        }
      }
    },
          400: {
            description: 'Error de validación',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/users/me': {
      get: {
        tags: ['Profile'],
        summary: 'Obtener perfil propio',
        description: `
          Obtiene los datos del usuario autenticado.
          
          ### Seguridad:
          - Requiere autenticación
          - Token JWT válido
          - Sesión activa
        `,
        security: [
          { bearerAuth: [] },
          { rateLimiting: [] }
        ],
        responses: {
          200: {
            description: 'Perfil obtenido exitosamente',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                    user: { $ref: '#/components/schemas/User' }
                }
              }
            }
          }
        },
          401: {
            description: 'No autorizado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { 
                      type: 'string',
                      example: 'Token no proporcionado o inválido'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/activity-logs/user/{id}': {
      get: {
        tags: ['Activity'],
        summary: 'Obtener logs de un usuario específico',
        description: 'Obtiene el historial de actividades de un usuario específico',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          200: {
            description: 'Lista de logs de actividad',
          content: {
            'application/json': {
              schema: {
                      type: 'array',
                  items: { $ref: '#/components/schemas/ActivityLog' }
                    }
                }
              }
          }
        }
      }
    },
    '/api/activity/logs': {
      get: {
        tags: ['Activity'],
        summary: 'Obtener registro de actividades',
        description: 'Obtiene un listado paginado y filtrable de todas las actividades',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'userId',
            schema: { type: 'integer' },
            description: 'Filtrar por ID de usuario'
          },
          {
            in: 'query',
            name: 'action',
            schema: { type: 'string' },
            description: 'Filtrar por tipo de acción'
          },
          {
            in: 'query',
            name: 'startDate',
            schema: { type: 'string', format: 'date' },
            description: 'Fecha inicial para filtrar'
          },
          {
            in: 'query',
            name: 'endDate',
            schema: { type: 'string', format: 'date' },
            description: 'Fecha final para filtrar'
          },
          {
            in: 'query',
            name: 'page',
            schema: { type: 'integer', default: 1 },
            description: 'Número de página'
          },
          {
            in: 'query',
            name: 'limit',
            schema: { type: 'integer', default: 10 },
            description: 'Elementos por página'
          }
        ],
        responses: {
          200: {
            description: 'Lista de actividades',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ActivityLogList' }
              }
            }
          }
        }
      }
    },
    '/api/activity/user/{userId}/history': {
      get: {
        tags: ['Activity'],
        summary: 'Obtener historial de actividades de un usuario específico',
        description: 'Obtiene el historial completo de actividades de un usuario',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'userId',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          200: {
            description: 'Historial de actividades del usuario',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/ActivityLog' }
                }
                }
              }
            }
          }
        }
      },
    '/api/activity/stats': {
      get: {
        tags: ['Activity'],
        summary: 'Obtener estadísticas de actividad',
        description: `
          Obtiene estadísticas generales de actividad en el sistema.
          
          ### Incluye:
          - Total de actividades
          - Actividades del día
          - Acciones más frecuentes
          - Distribución por hora
        `,
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Estadísticas de actividad',
          content: {
            'application/json': {
                schema: { $ref: '#/components/schemas/ActivityStats' }
              }
            }
          }
        }
      }
    },
    '/api/activity/realtime': {
      get: {
        tags: ['Activity'],
        summary: 'Obtener actividades en tiempo real',
        description: 'Obtiene las actividades más recientes en tiempo real',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Actividades en tiempo real',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/ActivityLog' }
                }
              }
            }
          }
        }
      }
    },
    '/stats/users': {
      get: {
        tags: ['Stats'],
        summary: 'Estadísticas de usuarios',
        description: `
          Obtiene estadísticas generales sobre los usuarios del sistema.
          
          ### Métricas incluidas:
          - Total de usuarios registrados
          - Usuarios activos actualmente
          - Distribución por roles
          - Nuevos registros del mes actual
        `,
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Estadísticas obtenidas exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserStats' }
              }
            }
          },
          401: {
            description: 'No autorizado'
          },
          403: {
            description: 'Acceso denegado - Requiere permisos de administrador'
          }
        }
      }
    },
    '/stats/activity': {
      get: {
        tags: ['Stats'],
        summary: 'Estadísticas de actividad',
        description: `
          Obtiene métricas detalladas sobre la actividad del sistema.
          
          ### Métricas incluidas:
          - Actividad total y promedios
          - Horas pico de uso
          - Métricas de rendimiento
          - Tasas de error
        `,
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Estadísticas obtenidas exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SystemStats' }
              }
            }
          },
          401: {
            description: 'No autorizado'
          },
          403: {
            description: 'Acceso denegado - Requiere permisos de administrador'
          }
        }
      }
    },
    '/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'Obtener notificaciones',
        description: `
          Obtiene las notificaciones del usuario actual.
          
          ### Características:
          - Lista ordenada por fecha (más recientes primero)
          - Incluye contador de no leídas
          - Incluye estado de lectura
          - Incluye timestamp de lectura
        `,
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Lista de notificaciones',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/NotificationList' }
              }
            }
          },
          401: {
            description: 'No autorizado'
          }
        }
      }
    },
    '/notifications/{id}': {
      patch: {
        tags: ['Notifications'],
        summary: 'Marcar notificación como leída',
        description: `
          Actualiza el estado de una notificación a leída.
          
          ### Efectos:
          - Marca la notificación como leída
          - Actualiza el timestamp de lectura
          - Reduce el contador de no leídas
        `,
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'integer' },
            description: 'ID de la notificación'
          }
        ],
        responses: {
          200: {
            description: 'Notificación actualizada exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Notificación marcada como leída'
                    },
                    notification: { $ref: '#/components/schemas/Notification' }
                  }
                }
              }
            }
          },
          401: {
            description: 'No autorizado'
          },
          404: {
            description: 'Notificación no encontrada'
          }
        }
      }
    },
    '/api/permissions/user': {
      get: {
        tags: ['Permissions'],
        summary: 'Obtener permisos del usuario actual',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Permisos obtenidos exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Permissions' }
              }
            }
          },
          401: {
            description: 'No autorizado'
          }
        }
      }
    },
    '/api/permissions/canton/assign': {
      post: {
        tags: ['Permissions'],
        summary: 'Asignar permisos de cantón',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
            content: {
              'application/json': {
              schema: { $ref: '#/components/schemas/CantonPermission' }
              }
            }
          },
        responses: {
          201: {
            description: 'Permisos asignados exitosamente'
          },
          400: {
            description: 'Error de validación'
          },
          403: {
            description: 'No autorizado'
          }
        }
      }
    },
    '/api/permissions/canton/{userId}': {
      get: {
        tags: ['Permissions'],
        summary: 'Obtener permisos de cantón de un usuario',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'userId',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          200: {
            description: 'Permisos obtenidos exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/CantonPermission' }
                }
              }
            }
          },
          403: {
            description: 'No autorizado'
            }
          }
        }
      },
    '/api/permissions/canton/{cantonId}/permissions': {
      get: {
        tags: ['Permissions'],
        summary: 'Obtener todos los permisos de un cantón',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'cantonId',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          200: {
            description: 'Permisos obtenidos exitosamente',
            content: {
              'application/json': {
                schema: {
                      type: 'array',
                  items: { $ref: '#/components/schemas/CantonPermission' }
          }
        }
      }
    },
          403: {
            description: 'No autorizado'
                }
              }
            }
          },
    '/api/permissions/persona/assign': {
      post: {
        tags: ['Permissions'],
        summary: 'Asignar permisos de persona',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
            content: {
              'application/json': {
              schema: { $ref: '#/components/schemas/PersonaPermission' }
            }
          }
        },
        responses: {
          201: {
            description: 'Permisos asignados exitosamente'
          },
          400: {
            description: 'Error de validación'
          },
          403: {
            description: 'No autorizado'
          }
        }
      }
    },
    '/api/permissions/persona/{userId}': {
      get: {
        tags: ['Permissions'],
        summary: 'Obtener permisos de persona de un usuario',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'userId',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          200: {
            description: 'Permisos obtenidos exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/PersonaPermission' }
                    }
                  }
                }
          },
          403: {
            description: 'No autorizado'
                }
              }
            }
          },
    '/api/permissions/canton/revoke/{userId}/{cantonId}': {
      delete: {
        tags: ['Permissions'],
        summary: 'Revocar permisos de cantón',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'userId',
            required: true,
            schema: { type: 'integer' }
          },
          {
            in: 'path',
            name: 'cantonId',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          200: {
            description: 'Permisos revocados exitosamente'
          },
          403: {
            description: 'No autorizado'
          },
          404: {
            description: 'Usuario o cantón no encontrado'
          }
        }
      }
    },
    '/api/permissions/persona/revoke/{userId}/{personaId}': {
      delete: {
        tags: ['Permissions'],
        summary: 'Revocar permisos de persona',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'userId',
            required: true,
            schema: { type: 'integer' }
          },
          {
            in: 'path',
            name: 'personaId',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          200: {
            description: 'Permisos revocados exitosamente'
          },
          403: {
            description: 'No autorizado'
          },
          404: {
            description: 'Usuario o persona no encontrado'
          }
        }
      }
    },
    '/api/permissions/logs': {
      get: {
        tags: ['Permissions'],
        summary: 'Obtener historial de cambios de permisos',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'page',
            schema: { type: 'integer' },
            description: 'Número de página'
          },
          {
            in: 'query',
            name: 'limit',
            schema: { type: 'integer' },
            description: 'Registros por página'
          },
          {
            in: 'query',
            name: 'startDate',
            schema: { type: 'string', format: 'date' },
            description: 'Fecha inicial (YYYY-MM-DD)'
          },
          {
            in: 'query',
            name: 'endDate',
            schema: { type: 'string', format: 'date' },
            description: 'Fecha final (YYYY-MM-DD)'
          },
          {
            in: 'query',
            name: 'action',
            schema: { type: 'string' },
            description: 'Tipo de acción (GRANT_CANTON_ACCESS, REVOKE_CANTON_ACCESS, etc)'
          }
        ],
        responses: {
          200: {
            description: 'Lista de cambios obtenida exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    logs: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer' },
                          userId: { type: 'integer' },
                          action: { type: 'string' },
                          details: { type: 'string' },
                          createdAt: { type: 'string', format: 'date-time' }
                        }
                      }
                    },
                    total: { type: 'integer' },
                    page: { type: 'integer' },
                    totalPages: { type: 'integer' }
                    }
                  }
                }
              }
          },
          403: {
            description: 'No autorizado'
          }
        }
      }
    },
    '/api/colaborador/personas': {
      get: {
        tags: ['Colaborador'],
        summary: 'Ver lista de personas',
        description: 'Obtiene la lista de personas accesibles para el colaborador',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'page',
            schema: { type: 'integer', default: 1 },
            description: 'Número de página'
          },
          {
            in: 'query',
            name: 'limit',
            schema: { type: 'integer', default: 10 },
            description: 'Elementos por página'
          },
          {
            in: 'query',
            name: 'search',
            schema: { type: 'string' },
            description: 'Buscar por nombre o cédula'
          },
          {
            in: 'query',
            name: 'cantonId',
            schema: { type: 'integer' },
            description: 'Filtrar por cantón'
          }
        ],
        responses: {
          200: {
            description: 'Lista de personas',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    personas: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/PersonaBasica' }
                    },
                    total: { type: 'integer' },
                    page: { type: 'integer' },
                    totalPages: { type: 'integer' }
                }
              }
            }
          }
          },
          401: {
            description: 'No autorizado'
          },
          403: {
            description: 'Acceso denegado'
          }
      }
    },
      post: {
        tags: ['Colaborador'],
        summary: 'Crear nueva persona',
        description: 'Crea una nueva persona en el sistema',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreatePersonaRequest' }
            }
          }
        },
        responses: {
          201: {
            description: 'Persona creada exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Persona creada exitosamente'
                    },
                    persona: { $ref: '#/components/schemas/PersonaDetalle' }
                  }
                }
              }
            }
          },
          400: {
            description: 'Error de validación',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          401: {
            description: 'No autorizado'
          },
          403: {
            description: 'Acceso denegado'
              }
            }
          }
        },
    '/api/colaborador/personas/{id}': {
      get: {
        tags: ['Colaborador'],
        summary: 'Ver detalle de persona',
        description: 'Obtiene los detalles de una persona específica',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'integer' },
            description: 'ID de la persona'
          }
        ],
        responses: {
          200: {
            description: 'Detalles de la persona',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PersonaDetalle' }
              }
            }
          },
          401: {
            description: 'No autorizado'
          },
          403: {
            description: 'Acceso denegado'
          },
          404: {
            description: 'Persona no encontrada'
          }
        }
      }
    },
    '/cantones': {
      get: {
        tags: ['Cantones'],
        summary: 'Obtener lista de cantones',
        description: `
          Obtiene la lista completa de cantones.
          
          ### Funcionalidades:
          - Búsqueda por nombre o código
          - Filtrado por estado activo/inactivo
          - Incluye jueces asignados
          - Incluye URL de imagen
        `,
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'search',
            schema: { type: 'string' },
            description: 'Buscar por nombre o código'
          },
          {
            in: 'query',
            name: 'isActive',
            schema: { type: 'boolean' },
            description: 'Filtrar por estado activo/inactivo'
          }
        ],
        responses: {
          200: {
            description: 'Lista de cantones obtenida exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Canton' }
                }
              }
            }
          },
          401: {
            description: 'No autorizado'
          }
        }
      },
      post: {
        tags: ['Cantones'],
        summary: 'Crear un nuevo cantón',
        description: `
          Crea un nuevo cantón en el sistema.
          Requiere rol de administrador.
          
          ### Validaciones:
          - Nombre único
          - Código único
          - Imagen opcional (JPG/PNG)
          - Tamaño máximo de imagen: 5MB
        `,
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['nombre', 'codigo'],
                properties: {
                  nombre: { 
                    type: 'string',
                    description: 'Nombre del cantón'
                  },
                  codigo: { 
                    type: 'string',
                    description: 'Código único del cantón'
                  },
                  imagen: {
                    type: 'string',
                    format: 'binary',
                    description: 'Imagen del cantón (opcional)'
                  }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Cantón creado exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Canton' }
              }
            }
          },
          400: {
            description: 'Error de validación',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          401: {
            description: 'No autorizado'
          },
          403: {
            description: 'Acceso denegado - Requiere rol de administrador'
          }
        }
      }
    },
    '/jueces': {
      get: {
        tags: ['Jueces'],
        summary: 'Obtener lista de jueces',
        description: `
          Obtiene la lista completa de jueces.
          
          ### Funcionalidades:
          - Búsqueda por nombre
          - Filtrado por cantón
          - Incluye cantones asignados
          - Estado activo/inactivo
        `,
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'search',
            schema: { type: 'string' },
            description: 'Buscar por nombre'
          },
          {
            in: 'query',
            name: 'cantonId',
            schema: { type: 'integer' },
            description: 'Filtrar por cantón'
          },
          {
            in: 'query',
            name: 'isActive',
            schema: { type: 'boolean' },
            description: 'Filtrar por estado activo/inactivo'
          }
        ],
        responses: {
          200: {
            description: 'Lista de jueces obtenida exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Juez' }
                }
              }
            }
          },
          401: {
            description: 'No autorizado'
          }
        }
      },
      post: {
        tags: ['Jueces'],
        summary: 'Crear un nuevo juez',
        description: `
          Crea un nuevo juez en el sistema.
          Requiere rol de administrador.
          
          ### Validaciones:
          - Nombre requerido
          - Al menos un cantón asignado
          - No puede tener cantones duplicados
        `,
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                required: ['nombre', 'cantones'],
                  properties: {
                  nombre: { 
                    type: 'string',
                    description: 'Nombre completo del juez'
                  },
                    cantones: {
                      type: 'array',
                    items: { 
                      type: 'integer'
                    },
                    description: 'Array de IDs de cantones asignados'
              }
            }
          }
        }
      }
    },
        responses: {
          201: {
            description: 'Juez creado exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Juez' }
              }
            }
          },
          400: {
            description: 'Error de validación',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          401: {
            description: 'No autorizado'
          },
          403: {
            description: 'Acceso denegado - Requiere rol de administrador'
          }
        }
      }
    },
    '/personas': {
      get: {
        tags: ['Personas'],
        summary: 'Obtener lista de personas',
        description: `
          Obtiene la lista completa de personas registradas.
          
          ### Funcionalidades:
          - Búsqueda por cédula o teléfono
          - Filtrado por cantón
          - Incluye documentos asociados
          - Paginación de resultados
        `,
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'search',
            schema: { type: 'string' },
            description: 'Buscar por cédula o teléfono'
          },
          {
            in: 'query',
            name: 'cantonId',
            schema: { type: 'integer' },
            description: 'Filtrar por cantón'
          },
          {
            in: 'query',
            name: 'page',
            schema: { type: 'integer', default: 1 },
            description: 'Número de página'
          },
          {
            in: 'query',
            name: 'limit',
            schema: { type: 'integer', default: 10 },
            description: 'Elementos por página'
          }
        ],
        responses: {
          200: {
            description: 'Lista de personas obtenida exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    personas: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Persona' }
                    },
                    total: { type: 'integer' },
                    page: { type: 'integer' },
                    totalPages: { type: 'integer' }
                  }
                }
              }
            }
          },
          401: {
            description: 'No autorizado'
          }
        }
      },
      post: {
        tags: ['Personas'],
        summary: 'Crear una nueva persona',
        description: `
          Crea una nueva persona en el sistema.
          
          ### Validaciones:
          - Cédula ecuatoriana válida
          - Teléfono en formato correcto
          - Email opcional pero válido
          - Matrículas de vehículo opcionales
        `,
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                      type: 'object',
                required: ['cedula', 'telefono', 'cantonId'],
                      properties: {
                  cedula: { 
                    type: 'string', 
                    pattern: '^[0-9]{10}$',
                    description: 'Cédula ecuatoriana válida'
                  },
                  telefono: { 
                    type: 'string',
                    pattern: '^09[0-9]{8}$',
                    description: 'Número de teléfono celular'
                  },
                  cantonId: {
                          type: 'integer',
                    description: 'ID del cantón al que pertenece'
                  },
                  contactoRef: { 
                    type: 'string',
                    description: 'Nombre del contacto de referencia'
                  },
                  email: { 
                    type: 'string', 
                    format: 'email',
                    description: 'Correo electrónico'
                  },
                  domicilio: { 
                    type: 'string',
                    description: 'Dirección de domicilio'
                  },
                  matriculasVehiculo: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Lista de matrículas de vehículos'
                      }
                    }
                  }
                }
              }
        },
        responses: {
          201: {
            description: 'Persona creada exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Persona' }
              }
            }
          },
          400: {
            description: 'Error de validación',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          401: {
            description: 'No autorizado'
          }
        }
      }
    },
    '/cantones/stats': {
      get: {
        tags: ['Cantones'],
        summary: 'Estadísticas de cantones',
        description: 'Obtiene estadísticas generales de cantones y jueces',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Estadísticas obtenidas exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    totalCantones: { type: 'integer' },
                    cantonesActivos: { type: 'integer' },
                    totalJueces: { type: 'integer' },
                    juecesActivos: { type: 'integer' },
                    cantonesSinJueces: { type: 'integer' },
                    promedioJuecesPorCanton: { type: 'number' }
                    }
                }
              }
            }
          }
        }
      }
    },
    '/cantones/{id}/historial': {
      get: {
        tags: ['Cantones'],
        summary: 'Historial de cambios del cantón',
        description: 'Obtiene el registro histórico de cambios realizados al cantón',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          '200': {
            description: 'Historial obtenido exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                  type: 'object',
                  properties: {
                      id: { type: 'integer' },
                      accion: { 
                      type: 'string',
                        enum: ['CREACION', 'ACTUALIZACION', 'ELIMINACION', 'ASIGNACION_JUEZ', 'DESASIGNACION_JUEZ']
                      },
                      detalles: { type: 'object' },
                      usuario: { type: 'string' },
                      fecha: { type: 'string', format: 'date-time' }
                      }
                    }
                  }
                }
              }
            }
          }
      }
    },
    '/personas/validar/cedula': {
      post: {
        tags: ['Personas'],
        summary: 'Validar cédula',
        description: `
          Valida si una cédula ecuatoriana es válida y está disponible.
          
          ### Validaciones:
          - Formato (10 dígitos)
          - Algoritmo ecuatoriano
          - Disponibilidad en sistema
          
          ### Rate Limiting:
          - 10 validaciones por minuto por IP
        `,
        security: [{ rateLimiting: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['cedula'],
                properties: {
                  cedula: {
                    type: 'string',
                    pattern: '^[0-9]{10}$',
                    description: 'Cédula a validar',
                    example: '1234567890'
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Resultado de validación',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    isValid: { 
                      type: 'boolean',
                      description: 'Indica si la cédula es válida'
                    },
                    isAvailable: {
                      type: 'boolean',
                      description: 'Indica si la cédula está disponible'
                    },
                    message: { 
                      type: 'string',
                      description: 'Mensaje descriptivo del resultado'
                    }
                  }
                }
              }
            }
          },
          400: {
            description: 'Error de validación',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          429: {
            description: 'Demasiadas solicitudes',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Has excedido el límite de validaciones permitidas'
                    },
                    retryAfter: {
                      type: 'integer',
                      description: 'Segundos para volver a intentar',
                      example: 60
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/personas/export': {
      get: {
        tags: ['Personas'],
        summary: 'Exportar personas',
        description: 'Exporta la lista de personas en diferentes formatos',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'format',
            required: true,
            schema: {
                      type: 'string',
              enum: ['excel', 'pdf', 'csv']
            }
          }
        ],
        responses: {
          '200': {
            description: 'Archivo generado exitosamente',
          content: {
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
                schema: {
                  type: 'string',
                  format: 'binary'
                }
              },
              'application/pdf': {
              schema: {
                    type: 'string',
                  format: 'binary'
                }
              },
              'text/csv': {
                schema: {
                  type: 'string',
                  format: 'binary'
                }
              }
            }
          }
        }
      }
    },
    '/personas/{id}/historial': {
      get: {
        tags: ['Personas'],
        summary: 'Historial de cambios de la persona',
        description: 'Obtiene el registro histórico de cambios realizados a la persona',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          '200': {
            description: 'Historial obtenido exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                  type: 'object',
                  properties: {
                      id: { type: 'integer' },
                      accion: { 
                  type: 'string',
                        enum: ['CREACION', 'ACTUALIZACION', 'ELIMINACION', 'DOCUMENTO_AGREGADO', 'DOCUMENTO_ELIMINADO']
                      },
                      detalles: { type: 'object' },
                      usuario: { type: 'string' },
                      fecha: { type: 'string', format: 'date-time' }
                    }
                  }
                }
                    }
                  }
                }
              }
            }
          },
    '/cantones/{id}': {
      get: {
        tags: ['Cantones'],
        summary: 'Obtener cantón por ID',
        description: 'Obtiene los detalles de un cantón específico',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'integer' },
            description: 'ID del cantón'
          }
        ],
        responses: {
          200: {
            description: 'Cantón encontrado exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Canton' }
              }
            }
          },
          404: {
            description: 'Cantón no encontrado'
          }
        }
      },
      put: {
        tags: ['Cantones'],
        summary: 'Actualizar cantón',
        description: 'Actualiza la información de un cantón existente',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'integer' },
            description: 'ID del cantón'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  nombre: { type: 'string' },
                  codigo: { type: 'string' },
                  imagen: {
                    type: 'string',
                    format: 'binary'
                  },
                  isActive: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Cantón actualizado exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Canton' }
              }
            }
          },
          404: {
            description: 'Cantón no encontrado'
          }
        }
      },
      delete: {
        tags: ['Cantones'],
        summary: 'Eliminar cantón',
        description: 'Elimina un cantón del sistema',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'integer' },
            description: 'ID del cantón'
          }
        ],
        responses: {
          200: {
            description: 'Cantón eliminado exitosamente'
          },
          404: {
            description: 'Cantón no encontrado'
          }
        }
      }
    },
    '/cantones/{id}/jueces': {
      get: {
        tags: ['Cantones'],
        summary: 'Obtener jueces de un cantón',
        description: 'Obtiene la lista de jueces asignados a un cantón específico',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'integer' },
            description: 'ID del cantón'
          }
        ],
        responses: {
          200: {
            description: 'Lista de jueces obtenida exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Juez' }
                }
              }
            }
          },
          404: {
            description: 'Cantón no encontrado'
        }
      }
    },
      post: {
        tags: ['Cantones'],
        summary: 'Asignar juez a cantón',
        description: 'Asigna un juez existente a un cantón específico',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'integer' },
            description: 'ID del cantón'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['juezId'],
                properties: {
                  juezId: {
                    type: 'integer',
                    description: 'ID del juez a asignar'
                  }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Juez asignado exitosamente'
          },
          404: {
            description: 'Cantón o juez no encontrado'
          },
          409: {
            description: 'El juez ya está asignado a este cantón'
            }
          }
        }
      },
    '/cantones/{id}/jueces/{juezId}': {
      delete: {
        tags: ['Cantones'],
        summary: 'Desasignar juez de cantón',
        description: 'Elimina la asignación de un juez a un cantón específico',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'integer' },
            description: 'ID del cantón'
          },
          {
            in: 'path',
            name: 'juezId',
            required: true,
            schema: { type: 'integer' },
            description: 'ID del juez'
          }
        ],
        responses: {
          200: {
            description: 'Juez desasignado exitosamente'
          },
          404: {
            description: 'Cantón o juez no encontrado'
          }
        }
      }
    },
    '/jueces/{id}': {
      get: {
        tags: ['Jueces'],
        summary: 'Obtener juez por ID',
        description: 'Obtiene los detalles de un juez específico',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'integer' },
            description: 'ID del juez'
          }
        ],
        responses: {
          200: {
            description: 'Juez encontrado exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Juez' }
              }
            }
          },
          404: {
            description: 'Juez no encontrado'
          }
        }
      },
      put: {
        tags: ['Jueces'],
        summary: 'Actualizar juez',
        description: 'Actualiza la información de un juez existente',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'integer' },
            description: 'ID del juez'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  nombre: { type: 'string' },
                  cantones: {
                    type: 'array',
                    items: { type: 'integer' },
                    description: 'Array de IDs de cantones'
                  },
                  isActive: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Juez actualizado exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Juez' }
              }
            }
          },
          404: {
            description: 'Juez no encontrado'
          }
        }
      },
      delete: {
        tags: ['Jueces'],
        summary: 'Eliminar juez',
        description: 'Elimina un juez del sistema',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'integer' },
            description: 'ID del juez'
          }
        ],
        responses: {
          200: {
            description: 'Juez eliminado exitosamente'
          },
          404: {
            description: 'Juez no encontrado'
              }
            }
          }
        },
    '/personas/{id}': {
      get: {
        tags: ['Personas'],
        summary: 'Obtener persona por ID',
        description: 'Obtiene los detalles de una persona específica',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'integer' },
            description: 'ID de la persona'
          }
        ],
        responses: {
          200: {
            description: 'Persona encontrada exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Persona' }
              }
            }
          },
          404: {
            description: 'Persona no encontrada'
          }
        }
      },
      put: {
        tags: ['Personas'],
        summary: 'Actualizar persona',
        description: 'Actualiza la información de una persona existente',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'integer' },
            description: 'ID de la persona'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
            schema: {
                  type: 'object',
                  properties: {
                  cedula: { type: 'string', pattern: '^[0-9]{10}$' },
                  telefono: { type: 'string' },
                  contactoRef: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  domicilio: { type: 'string' },
                  matriculasVehiculo: {
                  type: 'array',
                    items: { type: 'string' }
                        }
                      }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Persona actualizada exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Persona' }
              }
            }
          },
          404: {
            description: 'Persona no encontrada'
          }
        }
      },
      delete: {
        tags: ['Personas'],
        summary: 'Eliminar persona',
        description: 'Elimina una persona del sistema',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
          required: true,
            schema: { type: 'integer' },
            description: 'ID de la persona'
          }
        ],
        responses: {
          200: {
            description: 'Persona eliminada exitosamente'
          },
          404: {
            description: 'Persona no encontrada'
          }
        }
      }
    },
    '/personas/{id}/documentos': {
      get: {
        tags: ['Personas'],
        summary: 'Obtener documentos de una persona',
        description: `
          Obtiene la lista de documentos asociados a una persona.
          
          ### Tipos de documentos:
          - Cédula
          - Matrícula vehicular
          - Comprobantes
          - Otros documentos legales
        `,
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'integer' },
            description: 'ID de la persona'
          }
        ],
        responses: {
          200: {
            description: 'Lista de documentos obtenida exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                  type: 'object',
                  properties: {
                      id: { type: 'integer' },
                      nombre: { type: 'string' },
                      url: { type: 'string' },
                      tipo: { type: 'string' },
                      createdAt: { type: 'string', format: 'date-time' }
                    }
                  }
                }
              }
            }
          },
          401: {
            description: 'No autorizado'
          },
          404: {
            description: 'Persona no encontrada'
        }
      }
    },
      post: {
        tags: ['Personas'],
        summary: 'Agregar documento a persona',
        description: `
          Agrega un nuevo documento a una persona.
          
          ### Validaciones:
          - Tamaño máximo: 10MB
          - Tipos permitidos: PDF, JPG, PNG
          - Nombre descriptivo requerido
          - Tipo de documento válido
        `,
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'integer' },
            description: 'ID de la persona'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
                schema: {
                type: 'object',
                required: ['documento', 'tipo', 'nombre'],
                properties: {
                  documento: {
                    type: 'string',
                    format: 'binary',
                    description: 'Archivo del documento'
                  },
                  tipo: {
                    type: 'string',
                    enum: ['CEDULA', 'MATRICULA', 'COMPROBANTE', 'OTRO'],
                    description: 'Tipo de documento'
                  },
                  nombre: {
                    type: 'string',
                    description: 'Nombre descriptivo del documento'
                  }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Documento agregado exitosamente',
          content: {
              'application/json': {
              schema: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    nombre: { type: 'string' },
                    url: { type: 'string' },
                    tipo: { type: 'string' },
                    createdAt: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          },
          400: {
            description: 'Error de validación',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          401: {
            description: 'No autorizado'
          },
          404: {
            description: 'Persona no encontrada'
          }
          }
        }
      },
    '/personas/{id}/documentos/{documentoId}': {
      delete: {
        tags: ['Personas'],
        summary: 'Eliminar documento de persona',
        description: 'Elimina un documento específico de una persona',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'integer' },
            description: 'ID de la persona'
          },
          {
            in: 'path',
            name: 'documentoId',
            required: true,
            schema: { type: 'integer' },
            description: 'ID del documento'
          }
        ],
        responses: {
          200: {
            description: 'Documento eliminado exitosamente'
          },
          404: {
            description: 'Persona o documento no encontrado'
          }
        }
      }
    },
    '/api/users/validate/email': {
      post: {
        tags: ['Validaciones'],
        summary: 'Validar email',
        description: `
          Valida si un email tiene formato correcto y está disponible.
          
          ### Validaciones:
          - Formato de email válido
          - Dominio existente
          - Disponibilidad en sistema
          
          ### Rate Limiting:
          - 10 validaciones por minuto por IP
        `,
        security: [{ rateLimiting: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
            schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: {
              type: 'string',
                    format: 'email',
                    description: 'Email a validar',
                    example: 'usuario@ejemplo.com'
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Resultado de validación',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    isValid: { 
                      type: 'boolean',
                      description: 'Indica si el formato es válido'
                    },
                    isAvailable: {
                      type: 'boolean',
                      description: 'Indica si el email está disponible'
                    },
                    message: { 
                  type: 'string',
                      description: 'Mensaje descriptivo del resultado'
                    }
                  }
                }
              }
            }
          },
          400: {
            description: 'Error de validación',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          429: {
            description: 'Demasiadas solicitudes',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Has excedido el límite de validaciones permitidas'
                    },
                    retryAfter: {
                      type: 'integer',
                      description: 'Segundos para volver a intentar',
                      example: 60
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/users/validate/matricula': {
      post: {
        tags: ['Validaciones'],
        summary: 'Validar matrícula profesional',
        description: `
          Valida el formato y disponibilidad de una matrícula profesional.
          
          ### Validaciones:
          - Formato: MAT-YYYY-XXX
          - Año debe ser válido
          - Número secuencial válido
          - Disponibilidad en sistema
          
          ### Rate Limiting:
          - 10 validaciones por minuto por IP
        `,
        security: [{ rateLimiting: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['matricula'],
                properties: {
                  matricula: {
                    type: 'string',
                    pattern: '^MAT-\\d{4}-\\d{3}$',
                    description: 'Matrícula a validar',
                    example: 'MAT-2024-001'
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Resultado de validación',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    isValid: { 
                      type: 'boolean',
                      description: 'Indica si el formato es válido'
                    },
                    isAvailable: {
                      type: 'boolean',
                      description: 'Indica si la matrícula está disponible'
                    },
                    message: { 
                      type: 'string',
                      description: 'Mensaje descriptivo del resultado'
                    }
                  }
                }
              }
            }
          },
          400: {
            description: 'Error de validación',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          429: {
            description: 'Demasiadas solicitudes',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Has excedido el límite de validaciones permitidas'
                    },
                    retryAfter: {
                      type: 'integer',
                      description: 'Segundos para volver a intentar',
                      example: 60
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};

export const setupSwagger = (app: Express): void => {
  app.get('/api-docs.json', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  const swaggerUiOptions = {
    explorer: true,
    swaggerOptions: {
      url: '/api-docs.json'
    }
  };

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
};

export { swaggerSpec }; 
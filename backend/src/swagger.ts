import { Express, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';

// Exportar la especificación de Swagger
export const specs = {
  openapi: '3.0.0',
  info: {
    title: 'Sistema de Gestión de Abogados API',
    version: '1.0.0',
    description: `
      API REST para el Sistema de Gestión de Abogados.
      
      ## Características Principales
      - Sistema completo de autenticación y autorización
      - Gestión de perfiles profesionales
      - Registro de actividades de usuario
      - Validaciones de datos ecuatorianos
      - Sistema de permisos basado en roles
      - Exportación de datos en múltiples formatos
      
      ## Flujos Principales
      1. Registro y Autenticación
         - Registro por administrador
         - Login con validación de estado
         - Recuperación de contraseña
      
      2. Gestión de Perfiles
         - Completado inicial de perfil
         - Validaciones específicas por nivel de estudios
         - Actualización de información profesional
      
      3. Administración
         - Gestión completa de usuarios
         - Control de permisos
         - Reportes y exportaciones
    `,
    contact: {
      name: 'Soporte Técnico',
      email: 'soporte@sistema-abogados.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000/api',
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
      description: 'Monitoreo y registro de actividades'
    },
    {
      name: 'Stats',
      description: 'Estadísticas y métricas del sistema'
    },
    {
      name: 'Notifications',
      description: 'Gestión de notificaciones'
    },
    {
      name: 'Permissions',
      description: 'Gestión de roles y permisos'
    },
    {
      name: 'Colaborador',
      description: 'Operaciones permitidas para colaboradores'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          email: { type: 'string', format: 'email' },
          nombre: { type: 'string' },
          cedula: { type: 'string', pattern: '^[0-9]{10}$' },
          telefono: { type: 'string' },
          rol: { 
            type: 'string',
            enum: ['ADMIN', 'COLABORADOR'],
            description: 'Rol del usuario en el sistema'
          },
          nivelEstudios: { 
            type: 'string',
            enum: ['ESTUDIANTE', 'GRADUADO', 'MAESTRIA'],
            description: 'Nivel de estudios del profesional'
          },
          universidad: { 
            type: 'string',
            description: 'Requerido solo para estudiantes'
          },
          matricula: { 
            type: 'string',
            description: 'Requerido para graduados y maestría'
          },
          domicilio: { type: 'string' },
          isActive: { 
            type: 'boolean',
            description: 'Estado de activación del usuario'
          },
          isTemporaryPassword: {
            type: 'boolean',
            description: 'Indica si el usuario tiene una contraseña temporal'
          },
          isProfileCompleted: { 
            type: 'boolean',
            description: 'Indica si el perfil está completo'
          },
          createdAt: { 
            type: 'string',
            format: 'date-time'
          },
          updatedAt: { 
            type: 'string',
            format: 'date-time'
          }
        }
      },
      ActivityLog: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          userId: { type: 'integer' },
          action: { 
            type: 'string',
            enum: [
              'LOGIN',
              'LOGOUT',
              'CREATE_USER',
              'UPDATE_USER',
              'DELETE_USER',
              'VIEW_USER',
              'EXPORT_DATA',
              'CHANGE_PASSWORD',
              'UPDATE_PROFILE',
              'DEACTIVATE_USER',
              'ACTIVATE_USER'
            ]
          },
          details: { 
            type: 'object',
            properties: {
              description: { type: 'string' },
              ipAddress: { type: 'string' },
              userAgent: { type: 'string' },
              metadata: { type: 'object' }
            }
          },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', format: 'password' }
        }
      },
      LoginResponse: {
        type: 'object',
        properties: {
          token: { type: 'string' },
          user: { $ref: '#/components/schemas/User' }
        }
      },
      UserFilters: {
        type: 'object',
        properties: {
          search: { type: 'string' },
          rol: { 
            type: 'string',
            enum: ['ADMIN', 'COLABORADOR']
          },
          isActive: { type: 'boolean' },
          createdAtStart: { type: 'string', format: 'date-time' },
          createdAtEnd: { type: 'string', format: 'date-time' },
          lastLoginStart: { type: 'string', format: 'date-time' },
          lastLoginEnd: { type: 'string', format: 'date-time' },
          page: { type: 'integer', minimum: 1 },
          limit: { type: 'integer', minimum: 1 },
          sortField: { type: 'string' },
          sortDirection: { 
            type: 'string',
            enum: ['asc', 'desc']
          }
        }
      },
      ProfileUpdate: {
        type: 'object',
        required: ['nombre', 'cedula', 'telefono', 'nivelEstudios'],
        properties: {
          nombre: { type: 'string' },
          cedula: { type: 'string', pattern: '^[0-9]{10}$' },
          telefono: { type: 'string' },
          nivelEstudios: {
            type: 'string',
            enum: ['ESTUDIANTE', 'GRADUADO', 'MAESTRIA']
          },
          universidad: { type: 'string' },
          matricula: { type: 'string' },
          domicilio: { type: 'string' }
        }
      },
      PasswordReset: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' }
        }
      },
      PasswordChange: {
        type: 'object',
        required: ['token', 'newPassword'],
        properties: {
          token: { type: 'string' },
          newPassword: { type: 'string', format: 'password', minLength: 8 }
        }
      },
      ValidationResponse: {
        type: 'object',
        properties: {
          isValid: { type: 'boolean' },
          message: { type: 'string' }
        }
      },
      Notification: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          title: { type: 'string' },
          message: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          isRead: { type: 'boolean' }
        }
      },
      UserUpdateData: {
        type: 'object',
        properties: {
          nombre: { type: 'string' },
          cedula: { type: 'string', pattern: '^[0-9]{10}$' },
          telefono: { type: 'string' },
          nivelEstudios: {
            type: 'string',
            enum: ['ESTUDIANTE', 'GRADUADO', 'MAESTRIA']
          },
          universidad: { type: 'string' },
          matricula: { type: 'string' },
          domicilio: { type: 'string' },
          isActive: { type: 'boolean' },
          isTemporaryPassword: { type: 'boolean' },
          isProfileCompleted: { type: 'boolean' }
        }
      },
      Canton: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          nombre: { type: 'string' },
          provincia: { type: 'string' }
        }
      },
      CantonCreate: {
        type: 'object',
        properties: {
          nombre: { type: 'string' },
          provincia: { type: 'string' }
        }
      },
      Persona: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          nombre: { type: 'string' },
          cedula: { type: 'string', pattern: '^[0-9]{10}$' },
          telefono: { type: 'string' },
          domicilio: { type: 'string' },
          cantones: {
            type: 'array',
            items: { $ref: '#/components/schemas/Canton' }
          }
        }
      },
      PersonaCreate: {
        type: 'object',
        properties: {
          nombre: { type: 'string' },
          cedula: { type: 'string', pattern: '^[0-9]{10}$' },
          telefono: { type: 'string' },
          domicilio: { type: 'string' }
        }
      },
      Proceso: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          nombre: { type: 'string' },
          descripcion: { type: 'string' },
          estado: { type: 'string' },
          fechaInicio: { type: 'string', format: 'date' },
          fechaFin: { type: 'string', format: 'date' },
          personas: {
            type: 'array',
            items: { $ref: '#/components/schemas/Persona' }
          }
        }
      },
      ProcesoCreate: {
        type: 'object',
        properties: {
          nombre: { type: 'string' },
          descripcion: { type: 'string' },
          estado: { type: 'string' },
          fechaInicio: { type: 'string', format: 'date' },
          fechaFin: { type: 'string', format: 'date' }
        }
      }
    }
  },
  paths: {
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Iniciar sesión',
        description: 'Autenticar usuario y obtener token JWT',
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
                $ref: '#/components/schemas/PasswordReset'
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Email enviado exitosamente'
          }
        }
      }
    },
    '/auth/complete-onboarding': {
      post: {
        tags: ['Auth'],
        summary: 'Completar proceso de onboarding',
        description: 'Finaliza el proceso inicial de configuración del usuario',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Onboarding completado exitosamente'
          }
        }
      }
    },
    '/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'Obtener notificaciones',
        description: 'Obtiene las notificaciones del usuario actual',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Lista de notificaciones',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Notification'
                  }
                }
              }
            }
          }
        }
      }
    },
    '/notifications/{id}': {
      patch: {
        tags: ['Notifications'],
        summary: 'Marcar notificación como leída',
        description: 'Actualiza el estado de una notificación a leída',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'integer'
            }
          }
        ],
        responses: {
          200: {
            description: 'Notificación actualizada exitosamente'
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
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'integer'
            }
          }
        ],
        responses: {
          200: {
            description: 'Lista de logs de actividad',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/ActivityLog'
                  }
                }
              }
            }
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
                schema: {
                  type: 'object',
                  properties: {
                    users: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/User'
                      }
                    },
                    total: { type: 'integer' },
                    totalPages: { type: 'integer' },
                    currentPage: { type: 'integer' }
                  }
                }
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
                schema: {
                  $ref: '#/components/schemas/User'
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
    '/api/users/profile/complete': {
      post: {
        tags: ['Profile'],
        summary: 'Completar perfil de usuario',
        security: [{ bearerAuth: [] }],
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
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ProfileUpdate'
              }
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
          }
        }
      }
    },
    '/api/auth/register': {
      post: {
        tags: ['Users'],
        summary: 'Crear nuevo usuario (admin o colaborador)',
        description: `
          Permite a un administrador crear un nuevo usuario en el sistema.
          
          ### Flujo del Proceso:
          1. Admin ingresa email y rol del nuevo usuario
          2. Sistema genera contraseña temporal (Temporal12345@)
          3. Se envía email al usuario con sus credenciales
          4. Usuario debe cambiar contraseña en primer login
          
          ### Consideraciones:
          - Solo administradores pueden crear usuarios
          - La contraseña temporal es estándar
          - El perfil queda incompleto hasta que el usuario lo complete
          - Se requiere verificación de email
        `,
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
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
                    description: 'Rol asignado al nuevo usuario'
                  }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Usuario creado exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Usuario creado exitosamente. Se han enviado las credenciales por email.'
                    },
                    user: {
                      $ref: '#/components/schemas/User'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/users/validate/cedula': {
      post: {
        tags: ['Validaciones'],
        summary: 'Validar cédula ecuatoriana',
        description: `
          Valida si una cédula ecuatoriana es válida y si está disponible en el sistema.
          
          ### Validaciones:
          - Formato correcto (10 dígitos)
          - Algoritmo de validación ecuatoriano
          - Disponibilidad en el sistema
          
          ### Consideraciones:
          - No requiere autenticación
          - Útil para validación en tiempo real
          - Retorna disponibilidad
        `,
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
                      example: 'Cédula válida y disponible'
                    }
                  }
                }
              }
            }
          },
          400: {
            description: 'Formato inválido',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    isValid: {
                      type: 'boolean',
                      example: false
                    },
                    message: {
                      type: 'string',
                      example: 'Formato de cédula inválido'
                    }
                  }
                }
              }
            }
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
          - Disponibilidad en el sistema
          
          ### Consideraciones:
          - No requiere autenticación
          - Validación en tiempo real
          - No verifica si el email existe realmente
        `,
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
                      example: 'Email válido y disponible'
                    }
                  }
                }
              }
            }
          },
          400: {
            description: 'Formato inválido',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    isValid: {
                      type: 'boolean',
                      example: false
                    },
                    message: {
                      type: 'string',
                      example: 'Formato de email inválido'
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
          
          ### Reglas de validación:
          - Formato: MAT-YYYY-XXX
          - Año debe ser válido
          - No debe estar registrada
          - Solo para graduados y maestría
        `,
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
                    example: 'MAT-2024-001'
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Matrícula validada exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    isValid: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Matrícula disponible' }
                  }
                }
              }
            }
          },
          400: {
            description: 'Formato inválido',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    isValid: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'Formato de matrícula inválido' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/admin/users': {
      get: {
        tags: ['Users'],
        summary: 'Listar todos los usuarios',
        security: [{ bearerAuth: [] }],
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
                      items: {
                        $ref: '#/components/schemas/User'
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
        security: [{ bearerAuth: [] }],
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
                    user: {
                      $ref: '#/components/schemas/User'
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
        security: [{ bearerAuth: [] }],
        description: `
          Activa un usuario previamente desactivado.
          Solo administradores pueden realizar esta acción.
          
          ### Efectos:
          - Usuario podrá iniciar sesión nuevamente
          - Se mantiene la configuración previa
          - Se registra en el log de actividades
        `,
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
                    user: {
                      $ref: '#/components/schemas/User'
                    }
                  }
                }
              }
            }
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
                      items: {
                        type: 'string'
                      },
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
        security: [{ bearerAuth: [] }],
        description: `
          Permite al usuario cambiar su contraseña actual.
          
          ### Validaciones:
          - Requiere contraseña actual correcta
          - Nueva contraseña debe cumplir requisitos de seguridad
          - No puede ser igual a la contraseña actual
          - Se envía email de confirmación
        `,
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
    '/api/users/me': {
      get: {
        tags: ['Profile'],
        summary: 'Obtener perfil propio',
        security: [{ bearerAuth: [] }],
        description: 'Obtiene los datos completos del usuario autenticado',
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
    '/api/users/profile/status': {
      get: {
        tags: ['Profile'],
        summary: 'Obtener estado del perfil',
        security: [{ bearerAuth: [] }],
        description: `
          Obtiene el estado actual del perfil del usuario y campos pendientes.
          
          ### Validaciones:
          - Perfil completo requiere todos los campos obligatorios
          - Campos específicos según nivel de estudios
          - Estado de primer inicio de sesión
        `,
        responses: {
          200: {
            description: 'Estado del perfil obtenido',
            content: {
              'application/json': {
                schema: {
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
                      items: {
                        type: 'string'
                      },
                      example: ['nombre', 'cedula', 'universidad']
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
    '/api/activity/logs': {
      get: {
        tags: ['Activity'],
        summary: 'Obtener registro de actividades',
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
            schema: { 
              type: 'string',
              enum: [
                'LOGIN',
                'LOGOUT',
                'CREATE_USER',
                'UPDATE_USER',
                'DELETE_USER',
                'VIEW_USER',
                'EXPORT_DATA',
                'CHANGE_PASSWORD',
                'UPDATE_PROFILE',
                'DEACTIVATE_USER',
                'ACTIVATE_USER'
              ]
            },
            description: 'Filtrar por tipo de acción'
          },
          {
            in: 'query',
            name: 'startDate',
            schema: { type: 'string', format: 'date' }
          },
          {
            in: 'query',
            name: 'endDate',
            schema: { type: 'string', format: 'date' }
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
            description: 'Lista de actividades',
            content: {
              'application/json': {
                schema: {
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
                }
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
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Estadísticas de actividad',
            content: {
              'application/json': {
                schema: {
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
                }
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
    '/api/admin/users/export/excel': {
      get: {
        tags: ['Permissions'],
        summary: 'Exportar usuarios a Excel',
        security: [{ bearerAuth: [] }],
        description: `
          Genera un archivo Excel con la lista completa de usuarios.
          Solo accesible para administradores.
          
          ### Contenido del Excel:
          - Datos personales (nombre, email, cédula)
          - Información de contacto
          - Rol y estado
          - Fechas importantes
          - Estadísticas de uso
          
          ### Filtros Disponibles:
          - Por rol
          - Por estado
          - Por fecha de registro
          - Por último acceso
        `,
        parameters: [
          {
            in: 'query',
            name: 'rol',
            schema: {
              type: 'string',
              enum: ['ADMIN', 'COLABORADOR']
            },
            description: 'Filtrar por rol de usuario'
          },
          {
            in: 'query',
            name: 'isActive',
            schema: { type: 'boolean' },
            description: 'Filtrar por estado de activación'
          },
          {
            in: 'query',
            name: 'createdAtStart',
            schema: { type: 'string', format: 'date' },
            description: 'Fecha inicial de registro'
          },
          {
            in: 'query',
            name: 'createdAtEnd',
            schema: { type: 'string', format: 'date' },
            description: 'Fecha final de registro'
          }
        ],
        responses: {
          200: {
            description: 'Excel generado exitosamente',
            content: {
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
                schema: {
                  type: 'string',
                  format: 'binary'
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
                      example: 'No tiene permisos para exportar usuarios'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/admin/users/export/pdf': {
      get: {
        tags: ['Permissions'],
        summary: 'Exportar usuarios a PDF',
        security: [{ bearerAuth: [] }],
        description: `
          Genera un reporte PDF con la lista de usuarios.
          Solo accesible para administradores.
          
          ### Características del PDF:
          - Encabezado con logo y título
          - Tabla formateada de usuarios
          - Pie de página con fecha y numeración
          - Resumen estadístico
          
          ### Contenido del Reporte:
          - Listado detallado de usuarios
          - Información de perfiles
          - Estado de cuentas
          - Métricas de actividad
          
          ### Opciones de Filtrado:
          - Por rol
          - Por estado
          - Por período de tiempo
        `,
        parameters: [
          {
            in: 'query',
            name: 'rol',
            schema: {
              type: 'string',
              enum: ['ADMIN', 'COLABORADOR']
            },
            description: 'Filtrar por rol de usuario'
          },
          {
            in: 'query',
            name: 'isActive',
            schema: { type: 'boolean' },
            description: 'Filtrar por estado de activación'
          },
          {
            in: 'query',
            name: 'createdAtStart',
            schema: { type: 'string', format: 'date' },
            description: 'Fecha inicial de registro'
          },
          {
            in: 'query',
            name: 'createdAtEnd',
            schema: { type: 'string', format: 'date' },
            description: 'Fecha final de registro'
          }
        ],
        responses: {
          200: {
            description: 'PDF generado exitosamente',
            content: {
              'application/pdf': {
                schema: {
                  type: 'string',
                  format: 'binary'
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
                      example: 'No tiene permisos para exportar usuarios'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/admin/permissions': {
      get: {
        tags: ['Permissions'],
        summary: 'Listar permisos del sistema',
        security: [{ bearerAuth: [] }],
        description: `
          Obtiene la lista de todos los permisos disponibles en el sistema.
          Solo accesible para administradores.
          
          ### Tipos de Permisos:
          - Gestión de usuarios
          - Exportación de datos
          - Administración del sistema
          - Acceso a módulos específicos
        `,
        responses: {
          200: {
            description: 'Lista de permisos obtenida exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      nombre: { type: 'string' },
                      descripcion: { type: 'string' },
                      modulo: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/admin/roles/{roleId}/permissions': {
      get: {
        tags: ['Permissions'],
        summary: 'Obtener permisos de un rol',
        security: [{ bearerAuth: [] }],
        description: 'Obtiene los permisos asignados a un rol específico',
        parameters: [
          {
            in: 'path',
            name: 'roleId',
            required: true,
            schema: { type: 'string' },
            description: 'ID del rol'
          }
        ],
        responses: {
          200: {
            description: 'Permisos del rol obtenidos exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      nombre: { type: 'string' },
                      asignado: { type: 'boolean' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      put: {
        tags: ['Permissions'],
        summary: 'Actualizar permisos de un rol',
        security: [{ bearerAuth: [] }],
        description: `
          Actualiza los permisos asignados a un rol.
          
          ### Consideraciones:
          - Solo administradores pueden modificar permisos
          - Los cambios afectan a todos los usuarios del rol
          - Se registra en el log de actividades
        `,
        parameters: [
          {
            in: 'path',
            name: 'roleId',
            required: true,
            schema: { type: 'string' },
            description: 'ID del rol'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  permissions: {
                    type: 'array',
                    items: {
                      type: 'integer'
                    },
                    description: 'IDs de los permisos a asignar'
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Permisos actualizados exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Permisos actualizados correctamente'
                    },
                    permissions: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer' },
                          nombre: { type: 'string' },
                          asignado: { type: 'boolean' }
                        }
                      }
                    }
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
                      example: 'No tiene permisos para modificar roles'
                    }
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
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'integer'
            }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UserUpdateData'
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Usuario actualizado exitosamente',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/User'
                }
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
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'integer'
            }
          }
        ],
        responses: {
          200: {
            description: 'Usuario eliminado exitosamente'
          }
        }
      }
    },
    '/stats/users': {
      get: {
        tags: ['Stats'],
        summary: 'Estadísticas de usuarios',
        description: 'Obtiene estadísticas generales sobre los usuarios del sistema',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Estadísticas obtenidas exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    totalUsers: { type: 'integer' },
                    activeUsers: { type: 'integer' },
                    usersByRole: {
                      type: 'object',
                      properties: {
                        ADMIN: { type: 'integer' },
                        COLABORADOR: { type: 'integer' }
                      }
                    },
                    newUsersThisMonth: { type: 'integer' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/stats/activity': {
      get: {
        tags: ['Stats'],
        summary: 'Estadísticas de actividad',
        description: 'Obtiene estadísticas sobre la actividad en el sistema',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Estadísticas obtenidas exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    totalLogins: { type: 'integer' },
                    activeUsersToday: { type: 'integer' },
                    topActions: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          action: { type: 'string' },
                          count: { type: 'integer' }
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
    },
    '/api/colaborador/cantones': {
      get: {
        tags: ['Colaborador'],
        summary: 'Ver lista de cantones',
        description: 'Obtiene la lista de cantones accesibles para el colaborador',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Lista de cantones',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Canton' }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Colaborador'],
        summary: 'Crear nuevo cantón',
        description: 'Crea un nuevo cantón en el sistema',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CantonCreate' }
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
        responses: {
          200: {
            description: 'Lista de personas',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Persona' }
                }
              }
            }
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
              schema: { $ref: '#/components/schemas/PersonaCreate' }
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
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          200: {
            description: 'Detalles de la persona',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Persona' }
              }
            }
          }
        }
      }
    },
    '/api/colaborador/procesos': {
      get: {
        tags: ['Colaborador'],
        summary: 'Ver lista de procesos',
        description: 'Obtiene la lista de procesos accesibles para el colaborador',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Lista de procesos',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Proceso' }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Colaborador'],
        summary: 'Crear nuevo proceso',
        description: 'Crea un nuevo proceso en el sistema',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProcesoCreate' }
            }
          }
        },
        responses: {
          201: {
            description: 'Proceso creado exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Proceso' }
              }
            }
          }
        }
      }
    },
    '/api/colaborador/procesos/{id}': {
      get: {
        tags: ['Colaborador'],
        summary: 'Ver detalle de proceso',
        description: 'Obtiene los detalles de un proceso específico',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          200: {
            description: 'Detalles del proceso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Proceso' }
              }
            }
          }
        }
      }
    },
    '/api/colaborador/dashboard': {
      get: {
        tags: ['Colaborador'],
        summary: 'Ver dashboard personal',
        description: 'Obtiene el dashboard personalizado del colaborador',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Dashboard del colaborador',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    cantones: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Canton' }
                    },
                    personas: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Persona' }
                    },
                    procesos: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Proceso' }
                    },
                    estadisticas: {
                      type: 'object',
                      properties: {
                        totalCantones: { type: 'integer' },
                        totalPersonas: { type: 'integer' },
                        totalProcesos: { type: 'integer' },
                        procesosActivos: { type: 'integer' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/colaborador/actividades': {
      get: {
        tags: ['Colaborador'],
        summary: 'Ver actividades propias',
        description: 'Obtiene el registro de actividades del colaborador',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Lista de actividades',
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
    }
  }
};

// Exportar la configuración de swagger-ui
export const swaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
  }
};

// Exportar la función de configuración
export const setupSwagger = (app: Express): void => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerUiOptions));
  
  app.get('/api-docs.json', (_req: Request, res: Response) => {
    res.json(specs);
  });
};

// Re-exportar swaggerUi si es necesario
export { swaggerUi }; 
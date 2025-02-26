// Definimos mejor los schemas
export const schemas = {
  User: {
    type: 'object',
    properties: {
      id: {
        type: 'integer',
        description: 'ID único del usuario'
      },
      nombre: {
        type: 'string',
        description: 'Nombre completo del usuario'
      },
      // ... otros campos
    }
  },
  LoginResponse: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: 'JWT token de autenticación'
      },
      // ... otros campos
    }
  }
}; 
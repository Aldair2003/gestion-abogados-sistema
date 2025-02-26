import rateLimit from 'express-rate-limit';

// Limitar intentos de login
export const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 20, // 20 intentos
  message: 'Demasiados intentos de inicio de sesión. Cuenta bloqueada temporalmente'
});

// Limitar creación de usuarios
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // 10 registros
  message: 'Límite de registros alcanzado. Intente más tarde'
}); 
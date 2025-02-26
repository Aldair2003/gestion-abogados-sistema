import { UserRole } from '../types/user';
import { CreateUserDTO } from '../types/user';

// Asegurarnos que al crear/actualizar usuarios, el rol se guarde correctamente
export const createUser = async (userData: CreateUserDTO) => {
  // Ya no necesitamos convertir a minúsculas porque usamos enum
  if (!Object.values(UserRole).includes(userData.rol)) {
    throw new Error('Rol inválido');
  }
  
  // ... resto del código
}; 
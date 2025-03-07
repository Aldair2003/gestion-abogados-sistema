import { User } from '../types/user';
import api from './api';

export const updateUser = async (id: number, data: Partial<User>): Promise<User> => {
  const response = await api.put(`/users/${id}`, data);
  return response.data;
}; 
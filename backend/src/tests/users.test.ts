import request from 'supertest';
import { app } from '../app';
import { prisma } from '../lib/prisma';
import jwt from 'jsonwebtoken';

let testUserId: number;
let adminToken: string;

beforeAll(async () => {
  // Crear un usuario de prueba
  const testUser = await prisma.user.create({
    data: {
      email: 'test@example.com',
      password: 'hashedPassword',
      rol: 'ADMIN',
      isFirstLogin: false,
      isProfileCompleted: true
    }
  });

  testUserId = testUser.id;

  // Crear token de administrador para pruebas
  adminToken = jwt.sign(
    { 
      id: testUser.id, 
      email: testUser.email, 
      rol: 'ADMIN' 
    },
    process.env.JWT_SECRET || 'test-secret'
  );
});

afterAll(async () => {
  // Limpiar datos de prueba
  await prisma.user.delete({
    where: { id: testUserId }
  });
});

describe('GET /api/users/:id/details', () => {
  it('should return user details with activities', async () => {
    const response = await request(app)
      .get(`/api/users/${testUserId}/details`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('activities');
    expect(Array.isArray(response.body.activities)).toBe(true);
  });
}); 
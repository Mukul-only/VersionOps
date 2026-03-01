import * as request from 'supertest';
import { App } from 'supertest/types';
import { UserRole } from '@prisma/client';
import { hashPassword } from 'src/common/utils/auth/password.util';
import { PrismaService } from 'src/prisma/prisma.service';

let globalAuthCookie: string[] = [];
export const getAuthCookie = () => globalAuthCookie;

/**
 * Runs once in beforeAll
 * Cleans users, creates ADMIN directly via prisma,
 * logs in and stores cookie
 */
export const setupTestAuth = async (server: any, prisma: PrismaService) => {
  const email = 'testadmin@example.com';
  const password = 'password123';

  // Clean users table
  await prisma.user.deleteMany({});

  // Create ADMIN directly (no controller, no seed service)
  const hashedPassword = await hashPassword(password);

  await prisma.user.create({
    data: {
      name: 'Test Admin',
      email,
      password: hashedPassword,
      role: UserRole.ADMIN,
    },
  });

  // Login via real endpoint
  const loginRes = await request(server as App)
    .post('/api/v1/auth/login')
    .send({ email, password })
    .expect(200);

  globalAuthCookie = loginRes.headers['set-cookie'] as unknown as string[];

  if (!globalAuthCookie) {
    throw new Error('❌ Failed to store global authentication cookie');
  }

  console.log('✅ Global auth cookie initialized');
};

/**
 * Authed request wrapper
 */
export const authedRequest = (server: any) => ({
  get: (url: string) =>
    request(server as App)
      .get(url)
      .set('Cookie', globalAuthCookie),
  post: (url: string) =>
    request(server as App)
      .post(url)
      .set('Cookie', globalAuthCookie),
  patch: (url: string) =>
    request(server as App)
      .patch(url)
      .set('Cookie', globalAuthCookie),
  delete: (url: string) =>
    request(server as App)
      .delete(url)
      .set('Cookie', globalAuthCookie),
});

import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './e2e-setup/app-setup';
import { Express } from 'express';
import {
  CollegeResponse,
  PaginatedCollegeResponse,
} from 'src/modules/college/types/college.types';
import { setupTestAuth, authedRequest } from './e2e-setup/auth-setup';

describe('College E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let httpServer: Express;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    httpServer = app.getHttpServer() as unknown as Express;

    await setupTestAuth(httpServer, prisma);
    // Cleanup before tests
    await prisma.collegeScore.deleteMany({});
    await prisma.college.deleteMany({});
  });

  afterAll(async () => {
    await prisma.collegeScore.deleteMany({});
    await prisma.college.deleteMany({});
    await prisma.$disconnect();
    await app.close();
  });

  describe('POST /api/v1/colleges', () => {
    it('should create a college successfully', async () => {
      const response = await authedRequest(httpServer)
        .post('/api/v1/colleges')
        .send({ code: 'IITB', name: 'Indian Institute of Technology Bombay' })
        .expect(201);
      const college: CollegeResponse = response.body as CollegeResponse;
      expect(college).toHaveProperty('id');
      expect(college.code).toBe('IITB');
      expect(college.name).toBe('Indian Institute of Technology Bombay');
    });

    it('should reject duplicate college code', async () => {
      await authedRequest(httpServer)
        .post('/api/v1/colleges')
        .send({ code: 'IITB', name: 'Duplicate College' })
        .expect(409);
    });

    it('should reject invalid data', async () => {
      await authedRequest(httpServer)
        .post('/api/v1/colleges')
        .send({ name: 'No Code Provided' })
        .expect(400);
    });
  });

  describe('GET /api/v1/colleges', () => {
    let collegeId: number;

    beforeAll(async () => {
      // Create via API instead of direct Prisma
      const response = await authedRequest(httpServer)
        .post('/api/v1/colleges')
        .send({ code: 'IITD', name: 'IIT Delhi' })
        .expect(201);

      collegeId = (response.body as CollegeResponse).id;
    });

    it('should fetch all colleges', async () => {
      const response = await authedRequest(httpServer)
        .get('/api/v1/colleges')
        .expect(200);

      const paginatedResponse: PaginatedCollegeResponse =
        response.body as PaginatedCollegeResponse;
      expect(paginatedResponse.items).toBeInstanceOf(Array);
      expect(paginatedResponse.total).toBeDefined();
      expect(paginatedResponse.items.length).toBeGreaterThan(0);
    });

    it('should fetch single college by id', async () => {
      const response = await authedRequest(httpServer)
        .get(`/api/v1/colleges/${collegeId}`)
        .expect(200);
      const college: CollegeResponse = response.body as CollegeResponse;
      expect(college.id).toBe(collegeId);
      expect(college.code).toBe('IITD');
      expect(college.score).toBeDefined();
      expect(college.participantCount).toBeDefined();
    });

    it('should return 404 for non-existent college', async () => {
      await authedRequest(httpServer).get('/api/v1/colleges/99999').expect(404);
    });
  });

  describe('PATCH /api/v1/colleges/:id', () => {
    let collegeId: number;

    beforeAll(async () => {
      // Create via API instead of direct Prisma
      const response = await authedRequest(httpServer)
        .post('/api/v1/colleges')
        .send({ code: 'IITK', name: 'IIT Kanpur' })
        .expect(201);

      collegeId = (response.body as CollegeResponse).id;
    });

    it('should update college name', async () => {
      const response = await authedRequest(httpServer)
        .patch(`/api/v1/colleges/${collegeId}`)
        .send({ name: 'Indian Institute of Technology Kanpur' })
        .expect(200);
      const college: CollegeResponse = response.body as CollegeResponse;
      expect(college.name).toBe('Indian Institute of Technology Kanpur');
    });

    it('should return 404 for non-existent college', async () => {
      await authedRequest(httpServer)
        .patch('/api/v1/colleges/99999')
        .send({ name: 'New Name' })
        .expect(404);
    });
  });

  describe('DELETE /api/v1/colleges/:id', () => {
    it('should delete college without participants', async () => {
      // Create via API instead of direct Prisma
      const createResponse = await authedRequest(httpServer)
        .post('/api/v1/colleges')
        .send({ code: 'IITG', name: 'IIT Guwahati' })
        .expect(201);

      const collegeId = (createResponse.body as CollegeResponse).id;

      const response = await authedRequest(httpServer)
        .delete(`/api/v1/colleges/${collegeId}`)
        .expect(200);

      const resp = response.body as { success: boolean };
      expect(resp.success).toBe(true);
    });

    it('should return 404 for non-existent college', async () => {
      await authedRequest(httpServer)
        .delete('/api/v1/colleges/99999')
        .expect(404);
    });
  });
});

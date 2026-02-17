import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './e2e-setup/app-setup';
import { Express } from 'express';
import {
  ParticipantResponse,
  PaginatedParticipantResponse,
} from 'src/modules/participant/types/participants.types';
import { Year, FestStatus } from '@prisma/client';

describe('Participant E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let httpServer: Express;
  let testCollegeId: number;
  let anotherCollegeId: number;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    httpServer = app.getHttpServer() as unknown as Express;

    // Cleanup before tests
    await prisma.eventResult.deleteMany({});
    await prisma.eventParticipation.deleteMany({});
    await prisma.participant.deleteMany({});
    await prisma.collegeScore.deleteMany({});
    await prisma.college.deleteMany({});

    // Create test colleges
    const college1 = await prisma.college.create({
      data: { code: 'IITB', name: 'IIT Bombay' },
    });
    const college2 = await prisma.college.create({
      data: { code: 'IITD', name: 'IIT Delhi' },
    });
    testCollegeId = college1.id;
    anotherCollegeId = college2.id;
  });

  afterAll(async () => {
    await prisma.eventResult.deleteMany({});
    await prisma.eventParticipation.deleteMany({});
    await prisma.participant.deleteMany({});
    await prisma.collegeScore.deleteMany({});
    await prisma.college.deleteMany({});
    await prisma.$disconnect();
    await app.close();
  });

  describe('POST /api/v1/participants', () => {
    it('should create a participant successfully', async () => {
      const response = await request(httpServer)
        .post('/api/v1/participants')
        .send({
          name: 'John Doe',
          email: 'john.doe@example.com',
          year: Year.ONE,
          collegeId: testCollegeId,
          hackerearthUser: '@johndoe',
          phone: '1234567890',
        })
        .expect(201);

      const participant: ParticipantResponse =
        response.body as ParticipantResponse;
      expect(participant).toHaveProperty('id');
      expect(participant.name).toBe('John Doe');
      expect(participant.email).toBe('john.doe@example.com');
      expect(participant.participantId).toMatch(/^IITB-1-\d{3}$/); // Format: IITB-1-001
      expect(participant.college.code).toBe('IITB');
      expect(participant.year).toBe(Year.ONE);
      expect(participant.hackerearthUser).toBe('@johndoe');
      expect(participant.phone).toBe('1234567890');
      expect(participant.festStatus).toBe(FestStatus.REGISTERED);
    });

    it('should reject duplicate email', async () => {
      await request(httpServer)
        .post('/api/v1/participants')
        .send({
          name: 'Jane Doe',
          email: 'john.doe@example.com', // Same email
          year: Year.TWO,
          collegeId: anotherCollegeId,
        })
        .expect(409);
    });

    it('should reject non-existent college', async () => {
      await request(httpServer)
        .post('/api/v1/participants')
        .send({
          name: 'Alice Smith',
          email: 'alice@example.com',
          year: Year.ONE,
          collegeId: 99999,
        })
        .expect(404);
    });

    it('should reject invalid year', async () => {
      await request(httpServer)
        .post('/api/v1/participants')
        .send({
          name: 'Bob Wilson',
          email: 'bob@example.com',
          year: 'FOUR', // Invalid year
          collegeId: testCollegeId,
        })
        .expect(400);
    });

    it('should reject missing required fields', async () => {
      await request(httpServer)
        .post('/api/v1/participants')
        .send({
          name: 'Charlie Brown',
          // Missing email, year, collegeId
        })
        .expect(400);
    });

    it('should create participant without optional fields', async () => {
      const response = await request(httpServer)
        .post('/api/v1/participants')
        .send({
          name: 'Eve Adams',
          email: 'eve@example.com',
          year: Year.TWO,
          collegeId: anotherCollegeId,
        })
        .expect(201);

      const participant: ParticipantResponse =
        response.body as ParticipantResponse;
      expect(participant.name).toBe('Eve Adams');
      expect(participant.hackerearthUser).toBeUndefined();
      expect(participant.phone).toBeUndefined();
      expect(participant.participantId).toMatch(/^IITD-2-\d{3}$/);
    });
  });

  describe('GET /api/v1/participants', () => {
    beforeAll(async () => {
      // Create additional participants for testing
      await request(httpServer).post('/api/v1/participants').send({
        name: 'Search Test User',
        email: 'search@example.com',
        year: Year.ONE,
        collegeId: testCollegeId,
        hackerearthUser: '@searchuser',
      });

      await request(httpServer).post('/api/v1/participants').send({
        name: 'Another User',
        email: 'another@example.com',
        year: Year.TWO,
        collegeId: anotherCollegeId,
      });
    });

    it('should fetch all participants with pagination', async () => {
      const response = await request(httpServer)
        .get('/api/v1/participants')
        .expect(200);

      const paginated: PaginatedParticipantResponse =
        response.body as PaginatedParticipantResponse;
      expect(paginated.items).toBeInstanceOf(Array);
      expect(paginated.total).toBeDefined();
      expect(paginated.items.length).toBeGreaterThan(0);

      // Check structure
      const firstParticipant = paginated.items[0];
      expect(firstParticipant).toHaveProperty('id');
      expect(firstParticipant).toHaveProperty('participantId');
      expect(firstParticipant).toHaveProperty('name');
      expect(firstParticipant).toHaveProperty('email');
      expect(firstParticipant).toHaveProperty('college');
    });

    it('should support pagination with skip and take', async () => {
      const response = await request(httpServer)
        .get('/api/v1/participants?skip=1&take=1')
        .expect(200);

      const paginated: PaginatedParticipantResponse =
        response.body as PaginatedParticipantResponse;
      expect(paginated.items.length).toBe(1);
      expect(paginated.total).toBeGreaterThan(1);
    });

    it('should search participants by name', async () => {
      const response = await request(httpServer)
        .get('/api/v1/participants?search=Search Test')
        .expect(200);

      const paginated: PaginatedParticipantResponse =
        response.body as PaginatedParticipantResponse;
      expect(paginated.items.length).toBe(1);
      expect(paginated.items[0].name).toBe('Search Test User');
    });

    it('should search participants by hackerearthUser', async () => {
      const response = await request(httpServer)
        .get('/api/v1/participants?search=@searchuser')
        .expect(200);

      const paginated: PaginatedParticipantResponse =
        response.body as PaginatedParticipantResponse;
      expect(paginated.items.length).toBe(1);
      expect(paginated.items[0].hackerearthUser).toBe('@searchuser');
    });

    it('should sort participants', async () => {
      const response = await request(httpServer)
        .get('/api/v1/participants?sortBy=name&order=asc')
        .expect(200);

      const paginated: PaginatedParticipantResponse =
        response.body as PaginatedParticipantResponse;
      const names = paginated.items.map((p) => p.name);
      const sortedNames = [...names].sort();
      expect(names).toEqual(sortedNames);
    });

    it('should include relations when flag is true', async () => {
      const response = await request(httpServer)
        .get('/api/v1/participants?includeRelations=true')
        .expect(200);

      const paginated: PaginatedParticipantResponse =
        response.body as PaginatedParticipantResponse;
      expect(paginated.items[0]).toHaveProperty('participations');
      expect(paginated.items[0]).toHaveProperty('results');
    });

    it('should not include relations by default', async () => {
      const response = await request(httpServer)
        .get('/api/v1/participants')
        .expect(200);

      const paginated: PaginatedParticipantResponse =
        response.body as PaginatedParticipantResponse;
      expect(paginated.items[0].participations).toBeUndefined();
      expect(paginated.items[0].results).toBeUndefined();
    });
  });

  describe('GET /api/v1/participants/:id', () => {
    let participantId: number;
    let participantWithRelationsId: number;

    beforeAll(async () => {
      // Create a participant
      const response = await request(httpServer)
        .post('/api/v1/participants')
        .send({
          name: 'Single Fetch User',
          email: 'single@example.com',
          year: Year.ONE,
          collegeId: testCollegeId,
        })
        .expect(201);
      participantId = (response.body as ParticipantResponse).id;

      // Create another for relations test
      const response2 = await request(httpServer)
        .post('/api/v1/participants')
        .send({
          name: 'Relations Test User',
          email: 'relations@example.com',
          year: Year.TWO,
          collegeId: anotherCollegeId,
        })
        .expect(201);
      participantWithRelationsId = (response2.body as ParticipantResponse).id;
    });

    it('should fetch single participant by id', async () => {
      const response = await request(httpServer)
        .get(`/api/v1/participants/${participantId}`)
        .expect(200);

      const participant: ParticipantResponse =
        response.body as ParticipantResponse;
      expect(participant.id).toBe(participantId);
      expect(participant.name).toBe('Single Fetch User');
      expect(participant.email).toBe('single@example.com');
    });

    it('should include relations when flag is true', async () => {
      const response = await request(httpServer)
        .get(
          `/api/v1/participants/${participantWithRelationsId}?includeRelations=true`,
        )
        .expect(200);

      const participant: ParticipantResponse =
        response.body as ParticipantResponse;
      expect(participant).toHaveProperty('participations');
      expect(participant).toHaveProperty('results');
    });

    it('should not include relations by default', async () => {
      const response = await request(httpServer)
        .get(`/api/v1/participants/${participantId}`)
        .expect(200);

      const participant: ParticipantResponse =
        response.body as ParticipantResponse;
      expect(participant.participations).toBeUndefined();
      expect(participant.results).toBeUndefined();
    });

    it('should return 404 for non-existent participant', async () => {
      await request(httpServer).get('/api/v1/participants/99999').expect(404);
    });
  });

  describe('PATCH /api/v1/participants/:id', () => {
    let participantId: number;

    beforeAll(async () => {
      const response = await request(httpServer)
        .post('/api/v1/participants')
        .send({
          name: 'Update Test User',
          email: 'update@example.com',
          year: Year.ONE,
          collegeId: testCollegeId,
          hackerearthUser: '@olduser',
          phone: '1111111111',
        })
        .expect(201);
      participantId = (response.body as ParticipantResponse).id;
    });

    it('should update participant name', async () => {
      const response = await request(httpServer)
        .patch(`/api/v1/participants/${participantId}`)
        .send({ name: 'Updated Name' })
        .expect(200);

      const participant: ParticipantResponse =
        response.body as ParticipantResponse;
      expect(participant.name).toBe('Updated Name');
    });

    it('should update participant year and regenerate participantId', async () => {
      const oldParticipantId = (
        (
          await request(httpServer)
            .get(`/api/v1/participants/${participantId}`)
            .expect(200)
        ).body as ParticipantResponse
      ).participantId;

      const response = await request(httpServer)
        .patch(`/api/v1/participants/${participantId}`)
        .send({ year: Year.TWO })
        .expect(200);

      const participant: ParticipantResponse =
        response.body as ParticipantResponse;
      expect(participant.year).toBe(Year.TWO);
      expect(participant.participantId).not.toBe(oldParticipantId);
      expect(participant.participantId).toMatch(/^IITB-2-\d{3}$/);
    });

    it('should update email and reject if duplicate', async () => {
      // Update to new email
      await request(httpServer)
        .patch(`/api/v1/participants/${participantId}`)
        .send({ email: 'newemail@example.com' })
        .expect(200);

      // Try to update to an existing email
      await request(httpServer)
        .patch(`/api/v1/participants/${participantId}`)
        .send({ email: 'eve@example.com' }) // Email from earlier test
        .expect(409);
    });

    it('should update optional fields', async () => {
      const response = await request(httpServer)
        .patch(`/api/v1/participants/${participantId}`)
        .send({
          hackerearthUser: '@newhandle',
          phone: '9999999999',
        })
        .expect(200);

      const participant: ParticipantResponse =
        response.body as ParticipantResponse;
      expect(participant.hackerearthUser).toBe('@newhandle');
      expect(participant.phone).toBe('9999999999');
    });

    it('should return 404 for non-existent participant', async () => {
      await request(httpServer)
        .patch('/api/v1/participants/99999')
        .send({ name: 'New Name' })
        .expect(404);
    });

    it('should reject invalid data', async () => {
      await request(httpServer)
        .patch(`/api/v1/participants/${participantId}`)
        .send({ year: 'INVALID' })
        .expect(400);
    });
  });

  describe('DELETE /api/v1/participants/:id', () => {
    it('should delete participant', async () => {
      // Create a participant to delete
      const createResponse = await request(httpServer)
        .post('/api/v1/participants')
        .send({
          name: 'Delete Test User',
          email: 'delete@example.com',
          year: Year.ONE,
          collegeId: testCollegeId,
        })
        .expect(201);

      const participantId = (createResponse.body as ParticipantResponse).id;

      const response = await request(httpServer)
        .delete(`/api/v1/participants/${participantId}`)
        .expect(200);

      expect(response.body).toEqual({ success: true });

      // Verify it's deleted
      await request(httpServer)
        .get(`/api/v1/participants/${participantId}`)
        .expect(404);
    });

    it('should return 404 for non-existent participant', async () => {
      await request(httpServer)
        .delete('/api/v1/participants/99999')
        .expect(404);
    });
  });

  describe('Edge Cases and Validation', () => {
    it('should handle special characters in names', async () => {
      const response = await request(httpServer)
        .post('/api/v1/participants')
        .send({
          name: "Jean-Luc O'Connor-Smith",
          email: 'special@example.com',
          year: Year.ONE,
          collegeId: testCollegeId,
        })
        .expect(201);

      expect((response.body as ParticipantResponse).name).toBe(
        "Jean-Luc O'Connor-Smith",
      );
    });

    it('should reject invalid email format', async () => {
      await request(httpServer)
        .post('/api/v1/participants')
        .send({
          name: 'Invalid Email',
          email: 'not-an-email',
          year: Year.ONE,
          collegeId: testCollegeId,
        })
        .expect(400);
    });

    it('should handle very long input gracefully', async () => {
      const longString = 'a'.repeat(300);
      await request(httpServer)
        .post('/api/v1/participants')
        .send({
          name: longString,
          email: 'long@example.com',
          year: Year.ONE,
          collegeId: testCollegeId,
        })
        .expect(400); // Should fail validation
    });
  });
});

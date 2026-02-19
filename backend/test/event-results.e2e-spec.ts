import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './e2e-setup/app-setup';
import { Express } from 'express';
import {
  EventResultResponse,
  PaginatedEventResultResponse,
} from 'src/modules/event-result/types/event-result.types';
import { Year, Position } from '@prisma/client';

describe('EventResult E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let httpServer: Express;

  // Test data
  let testEventId: number;
  let anotherEventId: number;
  let testParticipantId: number;
  let anotherParticipantId: number;
  let thirdParticipantId: number;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    httpServer = app.getHttpServer() as unknown as Express;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  // Helper to clean database
  const cleanDatabase = async () => {
    await prisma.eventResult.deleteMany({});
    await prisma.eventParticipation.deleteMany({});
    await prisma.participant.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.collegeScore.deleteMany({});
    await prisma.college.deleteMany({});
  };

  // Helper to setup fresh test data
  const setupTestData = async () => {
    await cleanDatabase();

    // Create college
    const college = await prisma.college.create({
      data: { code: 'IITB', name: 'IIT Bombay' },
    });

    // Create events
    const event1 = await prisma.event.create({
      data: { name: 'Coding Contest', teamSize: 1 },
    });
    const event2 = await prisma.event.create({
      data: { name: 'Hackathon', teamSize: 3 },
    });

    testEventId = event1.id;
    anotherEventId = event2.id;

    // Create participants
    const participant1 = await prisma.participant.create({
      data: {
        name: 'John Doe',
        email: 'john@example.com',
        year: Year.ONE,
        collegeId: college.id,
        participantId: 'IITB-1-001',
      },
    });
    const participant2 = await prisma.participant.create({
      data: {
        name: 'Jane Smith',
        email: 'jane@example.com',
        year: Year.TWO,
        collegeId: college.id,
        participantId: 'IITB-2-002',
      },
    });
    const participant3 = await prisma.participant.create({
      data: {
        name: 'Bob Wilson',
        email: 'bob@example.com',
        year: Year.ONE,
        collegeId: college.id,
        participantId: 'IITB-1-003',
      },
    });

    testParticipantId = participant1.id;
    anotherParticipantId = participant2.id;
    thirdParticipantId = participant3.id;

    // Create participations (required for results)
    await prisma.eventParticipation.createMany({
      data: [
        {
          eventId: testEventId,
          participantId: testParticipantId,
        },
        {
          eventId: testEventId,
          participantId: anotherParticipantId,
        },
        {
          eventId: anotherEventId,
          participantId: testParticipantId,
        },
        {
          eventId: anotherEventId,
          participantId: anotherParticipantId,
        },
        {
          eventId: anotherEventId,
          participantId: thirdParticipantId,
        },
      ],
    });
  };

  describe('POST /api/v1/event-results', () => {
    beforeEach(async () => {
      await setupTestData();
    });

    it('should create event result with FIRST position', async () => {
      const response = await request(httpServer)
        .post('/api/v1/event-results')
        .send({
          eventId: testEventId,
          participantId: testParticipantId,
          position: Position.FIRST,
        })
        .expect(201);

      const result = response.body as EventResultResponse;
      expect(result).toHaveProperty('id');
      expect(result.eventId).toBe(testEventId);
      expect(result.participantId).toBe(testParticipantId);
      expect(result.position).toBe(Position.FIRST);
    });

    it('should create event result with SECOND position', async () => {
      const response = await request(httpServer)
        .post('/api/v1/event-results')
        .send({
          eventId: testEventId,
          participantId: anotherParticipantId,
          position: Position.SECOND,
        })
        .expect(201);

      const result = response.body as EventResultResponse;
      expect(result.position).toBe(Position.SECOND);
    });

    it('should create event result with THIRD position', async () => {
      const response = await request(httpServer)
        .post('/api/v1/event-results')
        .send({
          eventId: anotherEventId,
          participantId: thirdParticipantId,
          position: Position.THIRD,
        })
        .expect(201);

      const result = response.body as EventResultResponse;
      expect(result.position).toBe(Position.THIRD);
    });

    it('should reject duplicate result for same event and participant', async () => {
      // Create first result
      await request(httpServer).post('/api/v1/event-results').send({
        eventId: testEventId,
        participantId: testParticipantId,
        position: Position.FIRST,
      });

      // Try to create duplicate
      await request(httpServer)
        .post('/api/v1/event-results')
        .send({
          eventId: testEventId,
          participantId: testParticipantId,
          position: Position.SECOND,
        })
        .expect(409);
    });

    it('should reject when participant not registered in event', async () => {
      await request(httpServer)
        .post('/api/v1/event-results')
        .send({
          eventId: testEventId,
          participantId: thirdParticipantId, // Not registered in testEventId
          position: Position.FIRST,
        })
        .expect(409);
    });

    it('should reject non-existent event', async () => {
      await request(httpServer)
        .post('/api/v1/event-results')
        .send({
          eventId: 99999,
          participantId: testParticipantId,
          position: Position.FIRST,
        })
        .expect(404);
    });

    it('should reject non-existent participant', async () => {
      await request(httpServer)
        .post('/api/v1/event-results')
        .send({
          eventId: testEventId,
          participantId: 99999,
          position: Position.FIRST,
        })
        .expect(404);
    });

    it('should reject invalid position value', async () => {
      await request(httpServer)
        .post('/api/v1/event-results')
        .send({
          eventId: testEventId,
          participantId: anotherParticipantId,
          position: 'INVALID_POSITION',
        })
        .expect(400);
    });
  });

  describe('GET /api/v1/event-results', () => {
    beforeEach(async () => {
      await setupTestData();

      // Create results for testing
      await request(httpServer).post('/api/v1/event-results').send({
        eventId: anotherEventId,
        participantId: testParticipantId,
        position: Position.FIRST,
      });
      await request(httpServer).post('/api/v1/event-results').send({
        eventId: anotherEventId,
        participantId: anotherParticipantId,
        position: Position.SECOND,
      });
      await request(httpServer).post('/api/v1/event-results').send({
        eventId: anotherEventId,
        participantId: thirdParticipantId,
        position: Position.THIRD,
      });
    });

    it('should fetch all results with pagination', async () => {
      const response = await request(httpServer)
        .get('/api/v1/event-results')
        .expect(200);

      const paginated = response.body as PaginatedEventResultResponse;
      expect(paginated.items).toBeInstanceOf(Array);
      expect(paginated.total).toBeGreaterThan(0);
    });

    it('should support pagination with skip and take', async () => {
      const response = await request(httpServer)
        .get('/api/v1/event-results?skip=1&take=2')
        .expect(200);

      const paginated = response.body as PaginatedEventResultResponse;
      expect(paginated.items.length).toBe(2);
    });

    it('should include relations when flag is true', async () => {
      const response = await request(httpServer)
        .get('/api/v1/event-results?includeRelations=true')
        .expect(200);

      const paginated = response.body as PaginatedEventResultResponse;
      if (paginated.items.length > 0) {
        expect(paginated.items[0]).toHaveProperty('event');
        expect(paginated.items[0]).toHaveProperty('participant');
      }
    });

    it('should filter by position', async () => {
      const response = await request(httpServer)
        .get(
          `/api/v1/event-results?filters=${JSON.stringify({ position: Position.FIRST })}`,
        )
        .expect(200);

      const paginated = response.body as PaginatedEventResultResponse;
      expect(paginated.items.every((r) => r.position === Position.FIRST)).toBe(
        true,
      );
    });

    it('should filter by eventId', async () => {
      const response = await request(httpServer)
        .get(
          `/api/v1/event-results?filters=${JSON.stringify({ eventId: anotherEventId })}`,
        )
        .expect(200);

      const paginated = response.body as PaginatedEventResultResponse;
      expect(paginated.items.every((r) => r.eventId === anotherEventId)).toBe(
        true,
      );
    });
  });

  describe('GET /api/v1/event-results/:id', () => {
    let resultId: number;

    beforeEach(async () => {
      await setupTestData();

      const response = await request(httpServer)
        .post('/api/v1/event-results')
        .send({
          eventId: testEventId,
          participantId: anotherParticipantId,
          position: Position.THIRD,
        });
      resultId = (response.body as EventResultResponse).id;
    });

    it('should fetch single result by id', async () => {
      const response = await request(httpServer)
        .get(`/api/v1/event-results/${resultId}`)
        .expect(200);

      const result = response.body as EventResultResponse;
      expect(result.id).toBe(resultId);
      expect(result.position).toBe(Position.THIRD);
    });

    it('should include relations when flag is true', async () => {
      const response = await request(httpServer)
        .get(`/api/v1/event-results/${resultId}?includeRelations=true`)
        .expect(200);

      const result = response.body as EventResultResponse;
      expect(result).toHaveProperty('event');
      expect(result).toHaveProperty('participant');
    });

    it('should return 404 for non-existent result', async () => {
      await request(httpServer).get('/api/v1/event-results/99999').expect(404);
    });
  });

  describe('PATCH /api/v1/event-results/:id', () => {
    let resultId: number;

    beforeEach(async () => {
      await setupTestData();

      const response = await request(httpServer)
        .post('/api/v1/event-results')
        .send({
          eventId: testEventId,
          participantId: anotherParticipantId,
          position: Position.SECOND,
        });
      resultId = (response.body as EventResultResponse).id;
    });

    it('should update position from SECOND to FIRST', async () => {
      const response = await request(httpServer)
        .patch(`/api/v1/event-results/${resultId}`)
        .send({ position: Position.FIRST })
        .expect(200);

      expect((response.body as EventResultResponse).position).toBe(
        Position.FIRST,
      );
    });

    it('should update event and participant', async () => {
      const response = await request(httpServer)
        .patch(`/api/v1/event-results/${resultId}`)
        .send({
          eventId: anotherEventId,
          participantId: thirdParticipantId,
        })
        .expect(200);

      const result = response.body as EventResultResponse;
      expect(result.eventId).toBe(anotherEventId);
      expect(result.participantId).toBe(thirdParticipantId);
    });

    it('should reject duplicate on update', async () => {
      // Create another result
      await request(httpServer).post('/api/v1/event-results').send({
        eventId: testEventId,
        participantId: testParticipantId,
        position: Position.FIRST,
      });

      // Try to update our result to conflict
      await request(httpServer)
        .patch(`/api/v1/event-results/${resultId}`)
        .send({
          eventId: testEventId,
          participantId: testParticipantId,
        })
        .expect(409);
    });

    it('should reject update to non-existent event', async () => {
      await request(httpServer)
        .patch(`/api/v1/event-results/${resultId}`)
        .send({ eventId: 99999 })
        .expect(404);
    });

    it('should reject update to non-existent participant', async () => {
      await request(httpServer)
        .patch(`/api/v1/event-results/${resultId}`)
        .send({ participantId: 99999 })
        .expect(404);
    });

    it('should return 404 for non-existent result', async () => {
      await request(httpServer)
        .patch('/api/v1/event-results/99999')
        .send({ position: Position.FIRST })
        .expect(404);
    });
  });

  describe('DELETE /api/v1/event-results/:id', () => {
    let resultId: number;

    beforeEach(async () => {
      await setupTestData();

      const createResponse = await request(httpServer)
        .post('/api/v1/event-results')
        .send({
          eventId: testEventId,
          participantId: testParticipantId,
          position: Position.FIRST,
        });

      resultId = (createResponse.body as EventResultResponse).id;
    });

    it('should delete result', async () => {
      await request(httpServer)
        .delete(`/api/v1/event-results/${resultId}`)
        .expect(200);

      await request(httpServer)
        .get(`/api/v1/event-results/${resultId}`)
        .expect(404);
    });

    it('should return 404 for non-existent result', async () => {
      await request(httpServer)
        .delete('/api/v1/event-results/99999')
        .expect(404);
    });
  });

  describe('Edge Cases', () => {
    beforeEach(async () => {
      await setupTestData();
    });

    it('should handle all three positions in same event', async () => {
      // Create FIRST
      await request(httpServer).post('/api/v1/event-results').send({
        eventId: anotherEventId,
        participantId: testParticipantId,
        position: Position.FIRST,
      });

      // Create SECOND
      await request(httpServer).post('/api/v1/event-results').send({
        eventId: anotherEventId,
        participantId: anotherParticipantId,
        position: Position.SECOND,
      });

      // Create THIRD
      const response = await request(httpServer)
        .post('/api/v1/event-results')
        .send({
          eventId: anotherEventId,
          participantId: thirdParticipantId,
          position: Position.THIRD,
        })
        .expect(201);

      expect((response.body as EventResultResponse).position).toBe(
        Position.THIRD,
      );
    });

    it('should allow same participant to get different positions in different events', async () => {
      // Create FIRST in testEventId
      await request(httpServer).post('/api/v1/event-results').send({
        eventId: testEventId,
        participantId: testParticipantId,
        position: Position.FIRST,
      });

      // Create SECOND in anotherEventId
      const response = await request(httpServer)
        .post('/api/v1/event-results')
        .send({
          eventId: anotherEventId,
          participantId: testParticipantId,
          position: Position.SECOND,
        })
        .expect(201);

      expect((response.body as EventResultResponse).position).toBe(
        Position.SECOND,
      );
    });
  });
});

import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './e2e-setup/app-setup';
import { Express } from 'express';
import {
  EventParticipationResponse,
  PaginatedEventParticipationResponse,
} from 'src/modules/event-participation/types/event-participation.types';
import { ParticipationStatus, Year } from '@prisma/client';

describe('EventParticipation E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let httpServer: Express;

  // Test data
  let soloEventId: number;
  let teamEventId: number;
  let anotherEventId: number;
  let testParticipantId: number;
  let anotherParticipantId: number;
  let thirdParticipantId: number;
  let fourthParticipantId: number;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    httpServer = app.getHttpServer() as unknown as Express;

    // Cleanup before tests
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
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

  // Helper to setup test data
  const setupTestData = async () => {
    await cleanDatabase();

    // Create test colleges
    const college = await prisma.college.create({
      data: { code: 'IITB', name: 'IIT Bombay' },
    });

    // Create test events with different team sizes
    const soloEvent = await prisma.event.create({
      data: { name: 'Solo Singing', teamSize: 1 },
    });
    const teamEvent = await prisma.event.create({
      data: { name: 'Hackathon', teamSize: 3 },
    });
    const anotherEvent = await prisma.event.create({
      data: { name: 'Quiz Competition', teamSize: 2 },
    });

    soloEventId = soloEvent.id;
    teamEventId = teamEvent.id;
    anotherEventId = anotherEvent.id;

    // Create test participants
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
    const participant4 = await prisma.participant.create({
      data: {
        name: 'Alice Brown',
        email: 'alice@example.com',
        year: Year.TWO,
        collegeId: college.id,
        participantId: 'IITB-2-004',
      },
    });

    testParticipantId = participant1.id;
    anotherParticipantId = participant2.id;
    thirdParticipantId = participant3.id;
    fourthParticipantId = participant4.id;
  };

  describe('Team Size Validation', () => {
    beforeEach(async () => {
      await setupTestData();
    });

    describe('Solo Event (teamSize: 1)', () => {
      it('should allow creating a solo participation without teamId', async () => {
        const response = await request(httpServer)
          .post('/api/v1/event-participations')
          .send({
            eventId: soloEventId,
            participantId: testParticipantId,
            dummyId: 'SOLO-001',
          })
          .expect(201);

        expect(
          (response.body as EventParticipationResponse).teamId,
        ).toBeUndefined();
      });

      it('should allow creating a solo participation with teamId', async () => {
        const response = await request(httpServer)
          .post('/api/v1/event-participations')
          .send({
            eventId: soloEventId,
            participantId: anotherParticipantId,
            dummyId: 'SOLO-002',
            teamId: 'INDIVIDUAL-1',
          })
          .expect(201);

        expect((response.body as EventParticipationResponse).teamId).toBe(
          'INDIVIDUAL-1',
        );
      });

      it('should allow multiple solo participations', async () => {
        await request(httpServer)
          .post('/api/v1/event-participations')
          .send({
            eventId: soloEventId,
            participantId: thirdParticipantId,
            dummyId: 'SOLO-003',
          })
          .expect(201);

        await request(httpServer)
          .post('/api/v1/event-participations')
          .send({
            eventId: soloEventId,
            participantId: fourthParticipantId,
            dummyId: 'SOLO-004',
          })
          .expect(201);
      });
    });

    describe('Team Event (teamSize: 3)', () => {
      const TEAM_ID = 'HACKATHON-TEAM-A';

      it('should allow creating team members up to the limit', async () => {
        // First member
        await request(httpServer)
          .post('/api/v1/event-participations')
          .send({
            eventId: teamEventId,
            participantId: testParticipantId,
            dummyId: 'TEAM-A-001',
            teamId: TEAM_ID,
          })
          .expect(201);

        // Second member
        await request(httpServer)
          .post('/api/v1/event-participations')
          .send({
            eventId: teamEventId,
            participantId: anotherParticipantId,
            dummyId: 'TEAM-A-002',
            teamId: TEAM_ID,
          })
          .expect(201);

        // Third member (reaches limit)
        await request(httpServer)
          .post('/api/v1/event-participations')
          .send({
            eventId: teamEventId,
            participantId: thirdParticipantId,
            dummyId: 'TEAM-A-003',
            teamId: TEAM_ID,
          })
          .expect(201);

        // Fourth member (exceeds limit)
        await request(httpServer)
          .post('/api/v1/event-participations')
          .send({
            eventId: teamEventId,
            participantId: fourthParticipantId,
            dummyId: 'TEAM-A-004',
            teamId: TEAM_ID,
          })
          .expect(409);
      });

      it('should allow multiple different teams to reach their limits', async () => {
        const TEAM_B = 'HACKATHON-TEAM-B';

        // Team A - 3 members
        await request(httpServer)
          .post('/api/v1/event-participations')
          .send({
            eventId: teamEventId,
            participantId: testParticipantId,
            dummyId: 'TEAM-A-001',
            teamId: TEAM_ID,
          })
          .expect(201);

        await request(httpServer)
          .post('/api/v1/event-participations')
          .send({
            eventId: teamEventId,
            participantId: anotherParticipantId,
            dummyId: 'TEAM-A-002',
            teamId: TEAM_ID,
          })
          .expect(201);

        await request(httpServer)
          .post('/api/v1/event-participations')
          .send({
            eventId: teamEventId,
            participantId: thirdParticipantId,
            dummyId: 'TEAM-A-003',
            teamId: TEAM_ID,
          })
          .expect(201);

        // Team B - 3 members
        await request(httpServer)
          .post('/api/v1/event-participations')
          .send({
            eventId: teamEventId,
            participantId: fourthParticipantId,
            dummyId: 'TEAM-B-001',
            teamId: TEAM_B,
          })
          .expect(201);

        // Try to add 4th to Team B (should fail)
        await request(httpServer)
          .post('/api/v1/event-participations')
          .send({
            eventId: teamEventId,
            participantId: testParticipantId, // Already in Team A
            dummyId: 'TEAM-B-002',
            teamId: TEAM_B,
          })
          .expect(409);
      });

      it('should allow participations without teamId (individual entries)', async () => {
        await request(httpServer)
          .post('/api/v1/event-participations')
          .send({
            eventId: teamEventId,
            participantId: testParticipantId,
            dummyId: 'INDIVIDUAL-1',
          })
          .expect(201);

        await request(httpServer)
          .post('/api/v1/event-participations')
          .send({
            eventId: teamEventId,
            participantId: anotherParticipantId,
            dummyId: 'INDIVIDUAL-2',
          })
          .expect(201);
      });
    });
  });

  describe('CRUD Operations', () => {
    beforeEach(async () => {
      await setupTestData();
    });

    describe('POST /api/v1/event-participations', () => {
      it('should create event participation successfully', async () => {
        const response = await request(httpServer)
          .post('/api/v1/event-participations')
          .send({
            eventId: anotherEventId,
            participantId: testParticipantId,
            dummyId: 'EC-001',
            teamId: 'TEAM-A',
            status: ParticipationStatus.REGISTERED,
          })
          .expect(201);

        const participation = response.body as EventParticipationResponse;
        expect(participation).toHaveProperty('id');
        expect(participation.eventId).toBe(anotherEventId);
        expect(participation.participantId).toBe(testParticipantId);
        expect(participation.dummyId).toBe('EC-001');
        expect(participation.teamId).toBe('TEAM-A');
        expect(participation.status).toBe(ParticipationStatus.REGISTERED);
      });

      it('should create with default status', async () => {
        const response = await request(httpServer)
          .post('/api/v1/event-participations')
          .send({
            eventId: anotherEventId,
            participantId: anotherParticipantId,
            dummyId: 'EC-002',
          })
          .expect(201);

        expect((response.body as EventParticipationResponse).status).toBe(
          ParticipationStatus.REGISTERED,
        );
      });

      it('should reject duplicate participant in same event', async () => {
        // First participation
        await request(httpServer).post('/api/v1/event-participations').send({
          eventId: anotherEventId,
          participantId: testParticipantId,
          dummyId: 'EC-001',
        });

        // Duplicate
        await request(httpServer)
          .post('/api/v1/event-participations')
          .send({
            eventId: anotherEventId,
            participantId: testParticipantId,
            dummyId: 'EC-002',
          })
          .expect(409);
      });

      it('should reject duplicate dummyId in same event', async () => {
        // First participation
        await request(httpServer).post('/api/v1/event-participations').send({
          eventId: anotherEventId,
          participantId: testParticipantId,
          dummyId: 'EC-001',
        });

        // Duplicate dummyId
        await request(httpServer)
          .post('/api/v1/event-participations')
          .send({
            eventId: anotherEventId,
            participantId: anotherParticipantId,
            dummyId: 'EC-001',
          })
          .expect(409);
      });

      it('should allow same dummyId in different events', async () => {
        // First event
        await request(httpServer).post('/api/v1/event-participations').send({
          eventId: anotherEventId,
          participantId: testParticipantId,
          dummyId: 'EC-001',
        });

        // Different event
        await request(httpServer)
          .post('/api/v1/event-participations')
          .send({
            eventId: soloEventId,
            participantId: anotherParticipantId,
            dummyId: 'EC-001',
          })
          .expect(201);
      });

      it('should reject non-existent event', async () => {
        await request(httpServer)
          .post('/api/v1/event-participations')
          .send({
            eventId: 99999,
            participantId: testParticipantId,
          })
          .expect(404);
      });

      it('should reject non-existent participant', async () => {
        await request(httpServer)
          .post('/api/v1/event-participations')
          .send({
            eventId: anotherEventId,
            participantId: 99999,
          })
          .expect(404);
      });
    });

    describe('GET /api/v1/event-participations', () => {
      beforeEach(async () => {
        // Create some test data
        await request(httpServer).post('/api/v1/event-participations').send({
          eventId: anotherEventId,
          participantId: testParticipantId,
          dummyId: 'GET-TEST-1',
        });
        await request(httpServer).post('/api/v1/event-participations').send({
          eventId: anotherEventId,
          participantId: anotherParticipantId,
          dummyId: 'GET-TEST-2',
        });
      });

      it('should fetch all participations with pagination', async () => {
        const response = await request(httpServer)
          .get('/api/v1/event-participations')
          .expect(200);

        const paginated = response.body as PaginatedEventParticipationResponse;
        expect(paginated.items).toBeInstanceOf(Array);
        expect(paginated.total).toBeGreaterThan(0);
      });

      it('should support pagination', async () => {
        const response = await request(httpServer)
          .get('/api/v1/event-participations?skip=1&take=1')
          .expect(200);

        const paginated = response.body as PaginatedEventParticipationResponse;
        expect(paginated.items.length).toBe(1);
      });

      it('should include relations when flag is true', async () => {
        const response = await request(httpServer)
          .get('/api/v1/event-participations?includeRelations=true')
          .expect(200);

        const paginated = response.body as PaginatedEventParticipationResponse;
        if (paginated.items.length > 0) {
          expect(paginated.items[0]).toHaveProperty('event');
          expect(paginated.items[0]).toHaveProperty('participant');
        }
      });
    });

    describe('GET /api/v1/event-participations/:id', () => {
      let participationId: number;

      beforeEach(async () => {
        const response = await request(httpServer)
          .post('/api/v1/event-participations')
          .send({
            eventId: anotherEventId,
            participantId: anotherParticipantId,
            dummyId: 'FETCH-TEST',
          });
        participationId = (response.body as EventParticipationResponse).id;
      });

      it('should fetch single participation by id', async () => {
        const response = await request(httpServer)
          .get(`/api/v1/event-participations/${participationId}`)
          .expect(200);

        const participation = response.body as EventParticipationResponse;
        expect(participation.id).toBe(participationId);
        expect(participation.dummyId).toBe('FETCH-TEST');
      });

      it('should include relations when flag is true', async () => {
        const response = await request(httpServer)
          .get(
            `/api/v1/event-participations/${participationId}?includeRelations=true`,
          )
          .expect(200);

        const participation = response.body as EventParticipationResponse;
        expect(participation).toHaveProperty('event');
        expect(participation).toHaveProperty('participant');
      });

      it('should return 404 for non-existent participation', async () => {
        await request(httpServer)
          .get('/api/v1/event-participations/99999')
          .expect(404);
      });
    });

    describe('PATCH /api/v1/event-participations/:id', () => {
      let participationId: number;

      beforeEach(async () => {
        const response = await request(httpServer)
          .post('/api/v1/event-participations')
          .send({
            eventId: anotherEventId,
            participantId: thirdParticipantId,
            dummyId: 'UPDATE-TEST',
            teamId: 'OLD-TEAM',
            status: ParticipationStatus.REGISTERED,
          });
        participationId = (response.body as EventParticipationResponse).id;
      });

      it('should update status', async () => {
        const response = await request(httpServer)
          .patch(`/api/v1/event-participations/${participationId}`)
          .send({ status: ParticipationStatus.CHECKED_IN })
          .expect(200);

        expect((response.body as EventParticipationResponse).status).toBe(
          ParticipationStatus.CHECKED_IN,
        );
      });

      it('should update teamId', async () => {
        const response = await request(httpServer)
          .patch(`/api/v1/event-participations/${participationId}`)
          .send({ teamId: 'NEW-TEAM' })
          .expect(200);

        expect((response.body as EventParticipationResponse).teamId).toBe(
          'NEW-TEAM',
        );
      });

      it('should update dummyId', async () => {
        const response = await request(httpServer)
          .patch(`/api/v1/event-participations/${participationId}`)
          .send({ dummyId: 'UPDATED-DUMMY' })
          .expect(200);

        expect((response.body as EventParticipationResponse).dummyId).toBe(
          'UPDATED-DUMMY',
        );
      });

      it('should reject duplicate dummyId in same event', async () => {
        // Create another participation with a dummyId
        await request(httpServer).post('/api/v1/event-participations').send({
          eventId: anotherEventId,
          participantId: testParticipantId,
          dummyId: 'DUPLICATE-TEST',
        });

        // Try to update to that dummyId
        await request(httpServer)
          .patch(`/api/v1/event-participations/${participationId}`)
          .send({ dummyId: 'DUPLICATE-TEST' })
          .expect(409);
      });

      it('should return 404 for non-existent participation', async () => {
        await request(httpServer)
          .patch('/api/v1/event-participations/99999')
          .send({ status: ParticipationStatus.CHECKED_IN })
          .expect(404);
      });
    });

    describe('DELETE /api/v1/event-participations/:id', () => {
      it('should delete participation', async () => {
        const createResponse = await request(httpServer)
          .post('/api/v1/event-participations')
          .send({
            eventId: soloEventId,
            participantId: testParticipantId,
            dummyId: 'DELETE-TEST',
          })
          .expect(201);

        const participationId = (
          createResponse.body as EventParticipationResponse
        ).id;

        await request(httpServer)
          .delete(`/api/v1/event-participations/${participationId}`)
          .expect(200);

        await request(httpServer)
          .get(`/api/v1/event-participations/${participationId}`)
          .expect(404);
      });

      it('should return 404 for non-existent participation', async () => {
        await request(httpServer)
          .delete('/api/v1/event-participations/99999')
          .expect(404);
      });
    });
  });

  describe('Edge Cases', () => {
    beforeEach(async () => {
      await setupTestData();
    });

    it('should handle very long dummyId', async () => {
      const longDummyId = 'A'.repeat(45);

      const response = await request(httpServer)
        .post('/api/v1/event-participations')
        .send({
          eventId: soloEventId,
          participantId: fourthParticipantId,
          dummyId: longDummyId,
        })
        .expect(201);

      expect((response.body as EventParticipationResponse).dummyId).toBe(
        longDummyId,
      );
    });

    it('should handle special characters in dummyId', async () => {
      const response = await request(httpServer)
        .post('/api/v1/event-participations')
        .send({
          eventId: soloEventId,
          participantId: testParticipantId,
          dummyId: 'AC-@#$%-001',
        })
        .expect(201);

      expect((response.body as EventParticipationResponse).dummyId).toBe(
        'AC-@#$%-001',
      );
    });

    it('should handle null values for optional fields', async () => {
      const response = await request(httpServer)
        .post('/api/v1/event-participations')
        .send({
          eventId: soloEventId,
          participantId: anotherParticipantId,
          dummyId: null,
          teamId: null,
        })
        .expect(201);

      expect(
        (response.body as EventParticipationResponse).dummyId,
      ).toBeUndefined();
      expect(
        (response.body as EventParticipationResponse).teamId,
      ).toBeUndefined();
    });
  });
});

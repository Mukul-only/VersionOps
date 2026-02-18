import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './e2e-setup/app-setup';
import { Express } from 'express';
import {
  EventResponse,
  PaginatedEventResponse,
} from 'src/modules/event/types/event.types';

describe('Event E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let httpServer: Express;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    httpServer = app.getHttpServer() as unknown as Express;

    // Cleanup before tests
    await prisma.eventResult.deleteMany({});
    await prisma.eventParticipation.deleteMany({});
    await prisma.event.deleteMany({});
  });

  afterAll(async () => {
    await prisma.eventResult.deleteMany({});
    await prisma.eventParticipation.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.$disconnect();
    await app.close();
  });

  describe('POST /api/v1/events', () => {
    it('should create an event successfully', async () => {
      const response = await request(httpServer)
        .post('/api/v1/events')
        .send({
          name: 'Coding Challenge',
          teamSize: 2,
          participationPoints: 10,
          firstPrizePoints: 100,
          secondPrizePoints: 50,
          thirdPrizePoints: 25,
        })
        .expect(201);

      const event: EventResponse = response.body as EventResponse;
      expect(event).toHaveProperty('id');
      expect(event.name).toBe('Coding Challenge');
      expect(event.teamSize).toBe(2);
      expect(event.participationPoints).toBe(10);
      expect(event.firstPrizePoints).toBe(100);
      expect(event.secondPrizePoints).toBe(50);
      expect(event.thirdPrizePoints).toBe(25);
    });

    it('should create event with default values for optional fields', async () => {
      const response = await request(httpServer)
        .post('/api/v1/events')
        .send({
          name: 'Quiz Competition',
          // Only required fields
        })
        .expect(201);

      const event: EventResponse = response.body as EventResponse;
      expect(event.name).toBe('Quiz Competition');
      expect(event.teamSize).toBeDefined();
      expect(event.participationPoints).toBeDefined();
    });

    it('should reject duplicate event name', async () => {
      await request(httpServer)
        .post('/api/v1/events')
        .send({
          name: 'Coding Challenge', // Same name as first test
          teamSize: 3,
        })
        .expect(409); // Assuming name is unique
    });

    it('should reject invalid team size', async () => {
      await request(httpServer)
        .post('/api/v1/events')
        .send({
          name: 'Invalid Event',
          teamSize: 0, // Team size must be at least 1
        })
        .expect(400);
    });

    it('should reject negative points', async () => {
      await request(httpServer)
        .post('/api/v1/events')
        .send({
          name: 'Negative Points Event',
          participationPoints: -10,
        })
        .expect(400);
    });

    it('should reject missing required fields', async () => {
      await request(httpServer)
        .post('/api/v1/events')
        .send({
          // Missing name
          teamSize: 2,
        })
        .expect(400);
    });
  });

  describe('GET /api/v1/events', () => {
    beforeAll(async () => {
      // Create additional events for testing
      await request(httpServer)
        .post('/api/v1/events')
        .send({ name: 'Hackathon', teamSize: 4, participationPoints: 20 })
        .expect(201);

      await request(httpServer)
        .post('/api/v1/events')
        .send({
          name: 'Paper Presentation',
          teamSize: 2,
          participationPoints: 15,
        })
        .expect(201);
    });

    it('should fetch all events with pagination', async () => {
      const response = await request(httpServer)
        .get('/api/v1/events')
        .expect(200);

      const paginated: PaginatedEventResponse =
        response.body as PaginatedEventResponse;
      expect(paginated.items).toBeInstanceOf(Array);
      expect(paginated.total).toBeDefined();
      expect(paginated.items.length).toBeGreaterThan(0);

      // Check structure
      const firstEvent = paginated.items[0];
      expect(firstEvent).toHaveProperty('id');
      expect(firstEvent).toHaveProperty('name');
      expect(firstEvent).toHaveProperty('teamSize');
      expect(firstEvent).toHaveProperty('participationPoints');
    });

    it('should support pagination with skip and take', async () => {
      const response = await request(httpServer)
        .get('/api/v1/events?skip=1&take=1')
        .expect(200);

      const paginated: PaginatedEventResponse =
        response.body as PaginatedEventResponse;
      expect(paginated.items.length).toBe(1);
      expect(paginated.total).toBeGreaterThan(1);
    });

    it('should search events by name', async () => {
      const response = await request(httpServer)
        .get('/api/v1/events?search=Hackathon')
        .expect(200);

      const paginated: PaginatedEventResponse =
        response.body as PaginatedEventResponse;
      expect(paginated.items.length).toBe(1);
      expect(paginated.items[0].name).toBe('Hackathon');
    });

    it('should sort events', async () => {
      const response = await request(httpServer)
        .get('/api/v1/events?sortBy=name&order=asc')
        .expect(200);

      const paginated: PaginatedEventResponse =
        response.body as PaginatedEventResponse;
      const names = paginated.items.map((e) => e.name);
      const sortedNames = [...names].sort();
      expect(names).toEqual(sortedNames);
    });

    it('should include relations when flag is true', async () => {
      const response = await request(httpServer)
        .get('/api/v1/events?includeRelations=true')
        .expect(200);

      const paginated: PaginatedEventResponse =
        response.body as PaginatedEventResponse;
      expect(paginated.items[0]).toHaveProperty('participations');
      expect(paginated.items[0]).toHaveProperty('results');
    });

    it('should not include relations by default', async () => {
      const response = await request(httpServer)
        .get('/api/v1/events')
        .expect(200);

      const paginated: PaginatedEventResponse =
        response.body as PaginatedEventResponse;
      expect(paginated.items[0].participations).toBeUndefined();
      expect(paginated.items[0].results).toBeUndefined();
    });
  });

  describe('GET /api/v1/events/:id', () => {
    let eventId: number;
    let eventWithRelationsId: number;

    beforeAll(async () => {
      // Create an event
      const response = await request(httpServer)
        .post('/api/v1/events')
        .send({
          name: 'Single Event',
          teamSize: 3,
          participationPoints: 10,
          firstPrizePoints: 100,
        })
        .expect(201);
      eventId = (response.body as EventResponse).id;

      // Create another for relations test
      const response2 = await request(httpServer)
        .post('/api/v1/events')
        .send({
          name: 'Relations Test Event',
          teamSize: 2,
          participationPoints: 5,
        })
        .expect(201);
      eventWithRelationsId = (response2.body as EventResponse).id;
    });

    it('should fetch single event by id', async () => {
      const response = await request(httpServer)
        .get(`/api/v1/events/${eventId}`)
        .expect(200);

      const event: EventResponse = response.body as EventResponse;
      expect(event.id).toBe(eventId);
      expect(event.name).toBe('Single Event');
      expect(event.teamSize).toBe(3);
      expect(event.firstPrizePoints).toBe(100);
    });

    it('should include relations when flag is true', async () => {
      const response = await request(httpServer)
        .get(`/api/v1/events/${eventWithRelationsId}?includeRelations=true`)
        .expect(200);

      const event: EventResponse = response.body as EventResponse;
      expect(event).toHaveProperty('participations');
      expect(event).toHaveProperty('results');
    });

    it('should not include relations by default', async () => {
      const response = await request(httpServer)
        .get(`/api/v1/events/${eventId}`)
        .expect(200);

      const event: EventResponse = response.body as EventResponse;
      expect(event.participations).toBeUndefined();
      expect(event.results).toBeUndefined();
    });

    it('should return 404 for non-existent event', async () => {
      await request(httpServer).get('/api/v1/events/99999').expect(404);
    });
  });

  describe('PATCH /api/v1/events/:id', () => {
    let eventId: number;

    beforeAll(async () => {
      const response = await request(httpServer)
        .post('/api/v1/events')
        .send({
          name: 'Update Test Event',
          teamSize: 2,
          participationPoints: 10,
          firstPrizePoints: 50,
          secondPrizePoints: 25,
          thirdPrizePoints: 10,
        })
        .expect(201);
      eventId = (response.body as EventResponse).id;
    });

    it('should update event name', async () => {
      const response = await request(httpServer)
        .patch(`/api/v1/events/${eventId}`)
        .send({ name: 'Updated Event Name' })
        .expect(200);

      const event: EventResponse = response.body as EventResponse;
      expect(event.name).toBe('Updated Event Name');
    });

    it('should update team size', async () => {
      const response = await request(httpServer)
        .patch(`/api/v1/events/${eventId}`)
        .send({ teamSize: 4 })
        .expect(200);

      const event: EventResponse = response.body as EventResponse;
      expect(event.teamSize).toBe(4);
    });

    it('should update prize points', async () => {
      const response = await request(httpServer)
        .patch(`/api/v1/events/${eventId}`)
        .send({
          firstPrizePoints: 200,
          secondPrizePoints: 100,
          thirdPrizePoints: 50,
        })
        .expect(200);

      const event: EventResponse = response.body as EventResponse;
      expect(event.firstPrizePoints).toBe(200);
      expect(event.secondPrizePoints).toBe(100);
      expect(event.thirdPrizePoints).toBe(50);
    });

    it('should update multiple fields at once', async () => {
      const response = await request(httpServer)
        .patch(`/api/v1/events/${eventId}`)
        .send({
          name: 'Completely Updated',
          teamSize: 3,
          participationPoints: 15,
        })
        .expect(200);

      const event: EventResponse = response.body as EventResponse;
      expect(event.name).toBe('Completely Updated');
      expect(event.teamSize).toBe(3);
      expect(event.participationPoints).toBe(15);
    });

    it('should return 404 for non-existent event', async () => {
      await request(httpServer)
        .patch('/api/v1/events/99999')
        .send({ name: 'New Name' })
        .expect(404);
    });

    it('should reject invalid data', async () => {
      await request(httpServer)
        .patch(`/api/v1/events/${eventId}`)
        .send({ teamSize: 0 }) // Invalid team size
        .expect(400);
    });
  });

  describe('DELETE /api/v1/events/:id', () => {
    it('should delete event without participations', async () => {
      // Create an event to delete
      const createResponse = await request(httpServer)
        .post('/api/v1/events')
        .send({
          name: 'Delete Test Event',
          teamSize: 2,
        })
        .expect(201);

      const eventId = (createResponse.body as EventResponse).id;

      const response = await request(httpServer)
        .delete(`/api/v1/events/${eventId}`)
        .expect(200);

      expect(response.body).toEqual({ success: true });

      // Verify it's deleted
      await request(httpServer).get(`/api/v1/events/${eventId}`).expect(404);
    });

    it('should return 404 for non-existent event', async () => {
      await request(httpServer).delete('/api/v1/events/99999').expect(404);
    });
  });

  describe('Edge Cases and Validation', () => {
    it('should handle very long event names', async () => {
      const longName = 'A'.repeat(100);
      const response = await request(httpServer)
        .post('/api/v1/events')
        .send({
          name: longName,
          teamSize: 2,
        })
        .expect(201);

      expect((response.body as EventResponse).name).toBe(longName);
    });

    it('should handle special characters in names', async () => {
      const response = await request(httpServer)
        .post('/api/v1/events')
        .send({
          name: "Code & 'Fun' @2024!",
          teamSize: 2,
        })
        .expect(201);

      expect((response.body as EventResponse).name).toBe("Code & 'Fun' @2024!");
    });

    it('should handle large team sizes', async () => {
      const response = await request(httpServer)
        .post('/api/v1/events')
        .send({
          name: 'Mass Participation Event',
          teamSize: 100,
        })
        .expect(201);

      expect((response.body as EventResponse).teamSize).toBe(100);
    });

    it('should handle zero points', async () => {
      const response = await request(httpServer)
        .post('/api/v1/events')
        .send({
          name: 'Zero Points Event',
          participationPoints: 0,
          firstPrizePoints: 0,
        })
        .expect(201);

      expect((response.body as EventResponse).participationPoints).toBe(0);
      expect((response.body as EventResponse).firstPrizePoints).toBe(0);
    });
  });
});

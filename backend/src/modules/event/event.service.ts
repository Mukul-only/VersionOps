import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoggerService } from 'src/logger/logger.service';
import {
  Prisma,
  Event,
  EventParticipation,
  EventResult,
  Participant,
  College,
} from '@prisma/client';
import { PaginatedParticipantResponse } from '../participant/types/participants.types';
import { CreateEventDto, UpdateEventDto } from './dto';
import { QueryOptionsDto } from 'src/common/dto/query-options.dto';
import { buildQueryArgs } from 'src/common/utils/query-builder.util';
import { EventResponse, PaginatedEventResponse } from './types/event.types';

@Injectable()
export class EventService {
  private readonly entity = 'Event';

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  // ─────────────────────────────
  // CREATE EVENT
  // ─────────────────────────────
  async create(dto: CreateEventDto): Promise<EventResponse> {
    const ctx = { entity: this.entity, action: 'create', additional: { dto } };
    this.logger.debug('Creating event', ctx);
    const existingEvent = await this.prisma.event.findUnique({
      where: { name: dto.name },
    });

    if (existingEvent) {
      this.logger.warn(`Event with name "${dto.name}" already exists`, ctx);
      throw new ConflictException(
        `Event with name "${dto.name}" already exists`,
      );
    }
    const event = await this.prisma.event.create({
      data: {
        name: dto.name,
        teamSize: dto.teamSize,
        participationPoints: dto.participationPoints,
        firstPrizePoints: dto.firstPrizePoints,
        secondPrizePoints: dto.secondPrizePoints,
        thirdPrizePoints: dto.thirdPrizePoints,
      },
    });

    this.logger.info(`Event created: ${event.name}`, ctx);
    return this.mapToResponse(event);
  }

  // ─────────────────────────────
  // GET ALL EVENTS
  // ─────────────────────────────
  async findAll(query: QueryOptionsDto): Promise<PaginatedEventResponse> {
    const ctx = { entity: this.entity, action: 'fetch', additional: { query } };
    this.logger.debug('Fetching events', ctx);

    const includeRelations = query.includeRelations || false;

    const queryArgs = buildQueryArgs<Event, Prisma.EventWhereInput>(query, [
      'name',
    ]);

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where: queryArgs.where,
        skip: queryArgs.skip,
        take: queryArgs.take,
        orderBy: queryArgs.orderBy,
        include: {
          participations: includeRelations,
          results: includeRelations,
        },
      }),
      this.prisma.event.count({ where: queryArgs.where }),
    ]);

    this.logger.info('Fetched events', {
      ...ctx,
      additional: { fetched: events.length, total },
    });

    return {
      items: events.map((e) => this.mapToResponse(e, includeRelations)),
      total,
    };
  }

  // ─────────────────────────────
  // GET ONE EVENT
  // ─────────────────────────────
  async findOne(
    id: number,
    includeRelations: boolean = false,
  ): Promise<EventResponse> {
    const ctx = { entity: this.entity, action: 'fetchOne', additional: { id } };
    this.logger.debug('Fetching event by id', ctx);

    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        participations: includeRelations,
        results: includeRelations,
      },
    });

    if (!event) {
      this.logger.warn(`Event not found: id=${id}`, ctx);
      throw new NotFoundException('Event not found');
    }

    this.logger.info(`Fetched event: ${event.name}`, ctx);
    return this.mapToResponse(event, includeRelations);
  }

  // ─────────────────────────────
  // UPDATE EVENT
  // ─────────────────────────────
  async update(id: number, dto: UpdateEventDto): Promise<EventResponse> {
    const ctx = { entity: this.entity, action: 'update', additional: { id } };
    this.logger.debug('Updating event', ctx);

    const existing = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!existing) {
      this.logger.warn(`Event not found: id=${id}`, ctx);
      throw new NotFoundException('Event not found');
    }

    // Check if name is being updated and if it's unique
    if (dto.name && dto.name !== existing.name) {
      const nameExists = await this.prisma.event.findUnique({
        where: { name: dto.name },
      });

      if (nameExists) {
        this.logger.warn(`Event with name "${dto.name}" already exists`, ctx);
        throw new ConflictException(
          `Event with name "${dto.name}" already exists`,
        );
      }
    }

    const updated = await this.prisma.event.update({
      where: { id },
      data: {
        name: dto.name,
        teamSize: dto.teamSize,
        participationPoints: dto.participationPoints,
        firstPrizePoints: dto.firstPrizePoints,
        secondPrizePoints: dto.secondPrizePoints,
        thirdPrizePoints: dto.thirdPrizePoints,
      },
    });

    this.logger.info(`Event updated: ${updated.name}`, ctx);
    return this.mapToResponse(updated);
  }
  // ─────────────────────────────
  // DELETE EVENT
  // ─────────────────────────────
  async remove(id: number): Promise<{ success: boolean }> {
    const ctx = { entity: this.entity, action: 'delete', additional: { id } };
    this.logger.debug('Deleting event', ctx);

    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        participations: true,
        results: true,
      },
    });

    if (!event) {
      this.logger.warn(`Event not found: id=${id}`, ctx);
      throw new NotFoundException('Event not found');
    }

    if (event.participations.length > 0 || event.results.length > 0) {
      throw new ConflictException(
        'Cannot delete event with participations or results',
      );
    }

    await this.prisma.event.delete({ where: { id } });

    this.logger.info(`Event deleted: ${event.name}`, ctx);
    return { success: true };
  }

  // ─────────────────────────────
  // GET PARTICIPANTS FOR EVENT
  // ─────────────────────────────
  async getParticipantsForEvent(
    eventId: number,
    query: QueryOptionsDto,
  ): Promise<PaginatedParticipantResponse> {
    const ctx = {
      entity: this.entity,
      action: 'fetchEventParticipants',
      additional: { eventId, query },
    };

    this.logger.debug('Fetching participants for event', ctx);

    // Ensure event exists
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Build query args for participant search
    const queryArgs = buildQueryArgs<Participant, Prisma.ParticipantWhereInput>(
      query,
      ['participantId', 'name', 'hackerearthUser'],
    );

    const whereClause: Prisma.ParticipantWhereInput = {
      ...queryArgs.where,

      // Must have participation in this event
      participations: {
        some: {
          eventId,
        },
      },
    };

    const [participants, total] = await Promise.all([
      this.prisma.participant.findMany({
        where: whereClause,
        skip: queryArgs.skip,
        take: queryArgs.take,
        orderBy: queryArgs.orderBy,
        include: {
          college: true,
        },
      }),
      this.prisma.participant.count({
        where: whereClause,
      }),
    ]);

    this.logger.info('Fetched event participants', {
      ...ctx,
      additional: { fetched: participants.length, total },
    });

    return {
      items: participants.map((p) => this.mapParticipantToResponse(p)),
      total,
    };
  }

  private mapParticipantToResponse(
    participant: Participant & { college: College },
  ) {
    return {
      id: participant.id,
      participantId: participant.participantId,
      name: participant.name,
      email: participant.email,
      year: participant.year,
      festStatus: participant.festStatus,
      hackerearthUser: participant.hackerearthUser || undefined,
      phone: participant.phone || undefined,
      college: {
        id: participant.college.id,
        code: participant.college.code,
        name: participant.college.name,
      },
      createdAt: participant.createdAt.toISOString(),
    };
  }

  // ─────────────────────────────
  // MAP TO RESPONSE
  // ─────────────────────────────
  private mapToResponse(
    event: Event & {
      participations?: EventParticipation[];
      results?: EventResult[];
    },
    includeRelations = false,
  ): EventResponse {
    return {
      id: event.id,
      name: event.name,
      teamSize: event.teamSize,
      participationPoints: event.participationPoints,
      firstPrizePoints: event.firstPrizePoints,
      secondPrizePoints: event.secondPrizePoints,
      thirdPrizePoints: event.thirdPrizePoints,
      participations: includeRelations ? event.participations : undefined,
      results: includeRelations ? event.results : undefined,
      createdAt: event.createdAt.toISOString(),
    };
  }
}

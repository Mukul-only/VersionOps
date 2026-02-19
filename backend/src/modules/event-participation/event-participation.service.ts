import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoggerService } from 'src/logger/logger.service';
import { Prisma, EventParticipation, Event, Participant } from '@prisma/client';

import {
  CreateEventParticipationDto,
  UpdateEventParticipationDto,
} from './dto';
import { QueryOptionsDto } from 'src/common/dto/query-options.dto';
import { buildQueryArgs } from 'src/common/utils/query-builder.util';
import {
  EventParticipationResponse,
  PaginatedEventParticipationResponse,
} from './types/event-participation.types';

@Injectable()
export class EventParticipationService {
  private readonly entity = 'EventParticipation';

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  // ─────────────────────────────
  // CREATE
  // ─────────────────────────────
  async create(
    dto: CreateEventParticipationDto,
  ): Promise<EventParticipationResponse> {
    const ctx = { entity: this.entity, action: 'create', additional: { dto } };
    this.logger.debug('Creating event participation', ctx);

    // Validate event
    const event = await this.prisma.event.findUnique({
      where: { id: dto.eventId },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Validate participant
    const participant = await this.prisma.participant.findUnique({
      where: { id: dto.participantId },
    });
    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    // Unique (eventId + participantId)
    const existingParticipation =
      await this.prisma.eventParticipation.findUnique({
        where: {
          eventId_participantId: {
            eventId: dto.eventId,
            participantId: dto.participantId,
          },
        },
      });

    if (existingParticipation) {
      throw new ConflictException(
        'Participant already registered for this event',
      );
    }

    // Unique (eventId + dummyId)
    if (dto.dummyId) {
      const existingDummy = await this.prisma.eventParticipation.findUnique({
        where: {
          eventId_dummyId: {
            eventId: dto.eventId,
            dummyId: dto.dummyId,
          },
        },
      });

      if (existingDummy) {
        throw new ConflictException('Dummy ID already used in this event');
      }
    }

    // Enforce team size constraint
    if (dto.teamId) {
      const teamCount = await this.prisma.eventParticipation.count({
        where: {
          eventId: dto.eventId,
          teamId: dto.teamId,
        },
      });

      if (teamCount >= event.teamSize) {
        throw new ConflictException(
          `Team already has maximum allowed members (${event.teamSize}) for this event`,
        );
      }
    }

    const participation = await this.prisma.eventParticipation.create({
      data: {
        eventId: dto.eventId,
        participantId: dto.participantId,
        dummyId: dto.dummyId,
        teamId: dto.teamId,
      },
      include: {
        event: true,
        participant: true,
      },
    });

    this.logger.info(`Participation created: id=${participation.id}`, ctx);
    return this.mapToResponse(participation, true);
  }

  // ─────────────────────────────
  // GET ALL
  // ─────────────────────────────
  async findAll(
    query: QueryOptionsDto,
  ): Promise<PaginatedEventParticipationResponse> {
    const ctx = { entity: this.entity, action: 'fetch', additional: { query } };
    this.logger.debug('Fetching event participations', ctx);

    const includeRelations = query.includeRelations || false;

    const queryArgs = buildQueryArgs<
      EventParticipation,
      Prisma.EventParticipationWhereInput
    >(query, []);

    const [items, total] = await Promise.all([
      this.prisma.eventParticipation.findMany({
        where: queryArgs.where,
        skip: queryArgs.skip,
        take: queryArgs.take,
        orderBy: queryArgs.orderBy,
        include: {
          event: includeRelations,
          participant: includeRelations,
        },
      }),
      this.prisma.eventParticipation.count({ where: queryArgs.where }),
    ]);

    return {
      items: items.map((i) => this.mapToResponse(i, includeRelations)),
      total,
    };
  }

  // ─────────────────────────────
  // GET ONE
  // ─────────────────────────────
  async findOne(
    id: number,
    includeRelations: boolean = false,
  ): Promise<EventParticipationResponse> {
    const participation = await this.prisma.eventParticipation.findUnique({
      where: { id },
      include: {
        event: includeRelations,
        participant: includeRelations,
      },
    });

    if (!participation) {
      throw new NotFoundException('Event participation not found');
    }

    return this.mapToResponse(participation, includeRelations);
  }

  // ─────────────────────────────
  // UPDATE
  // ─────────────────────────────
  async update(
    id: number,
    dto: UpdateEventParticipationDto,
  ): Promise<EventParticipationResponse> {
    const existing = await this.prisma.eventParticipation.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Event participation not found');
    }

    const eventId = dto.eventId ?? existing.eventId;
    const participantId = dto.participantId ?? existing.participantId;
    const dummyId = dto.dummyId ?? existing.dummyId;
    const teamId = dto.teamId ?? existing.teamId;

    // Validate event (always fetch because we need teamSize)
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Validate participant if changed
    if (dto.participantId) {
      const participant = await this.prisma.participant.findUnique({
        where: { id: participantId },
      });
      if (!participant) {
        throw new NotFoundException('Participant not found');
      }
    }

    // Unique (eventId + participantId)
    const duplicateParticipation =
      await this.prisma.eventParticipation.findFirst({
        where: {
          eventId,
          participantId,
          NOT: { id },
        },
      });

    if (duplicateParticipation) {
      throw new ConflictException(
        'Participant already registered for this event',
      );
    }

    // Unique (eventId + dummyId)
    if (dummyId) {
      const duplicateDummy = await this.prisma.eventParticipation.findFirst({
        where: {
          eventId,
          dummyId,
          NOT: { id },
        },
      });

      if (duplicateDummy) {
        throw new ConflictException('Dummy ID already used in this event');
      }
    }

    // Enforce team size constraint
    if (teamId) {
      const teamCount = await this.prisma.eventParticipation.count({
        where: {
          eventId,
          teamId,
          NOT: { id }, // exclude self
        },
      });

      if (teamCount >= event.teamSize) {
        throw new ConflictException(
          `Team already has maximum allowed members (${event.teamSize}) for this event`,
        );
      }
    }

    const updated = await this.prisma.eventParticipation.update({
      where: { id },
      data: {
        eventId,
        participantId,
        dummyId,
        teamId,
      },
      include: {
        event: true,
        participant: true,
      },
    });

    return this.mapToResponse(updated, true);
  }

  // ─────────────────────────────
  // DELETE
  // ─────────────────────────────
  async remove(id: number): Promise<{ success: boolean }> {
    const existing = await this.prisma.eventParticipation.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Event participation not found');
    }

    await this.prisma.eventParticipation.delete({ where: { id } });

    return { success: true };
  }

  // ─────────────────────────────
  // MAP
  // ─────────────────────────────
  private mapToResponse(
    entity: EventParticipation & {
      event?: Event;
      participant?: Participant;
    },
    includeRelations = false,
  ): EventParticipationResponse {
    return {
      id: entity.id,
      eventId: entity.eventId,
      participantId: entity.participantId,
      dummyId: entity.dummyId ?? undefined,
      teamId: entity.teamId ?? undefined,
      event: includeRelations ? entity.event : undefined,
      participant: includeRelations ? entity.participant : undefined,
      createdAt: entity.createdAt.toISOString(),
    };
  }
}

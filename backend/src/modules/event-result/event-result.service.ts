import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoggerService } from 'src/logger/logger.service';
import { Prisma, EventResult, Event, Participant } from '@prisma/client';

import { CreateEventResultDto, UpdateEventResultDto } from './dto';
import { QueryOptionsDto } from 'src/common/dto/query-options.dto';
import { buildQueryArgs } from 'src/common/utils/query-builder.util';
import {
  EventResultResponse,
  PaginatedEventResultResponse,
} from './types/event-result.types';

@Injectable()
export class EventResultService {
  private readonly entity = 'EventResult';

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  // ─────────────────────────────
  // CREATE
  // ─────────────────────────────
  async create(dto: CreateEventResultDto): Promise<EventResultResponse> {
    const ctx = { entity: this.entity, action: 'create', additional: { dto } };
    this.logger.debug('Creating event result', ctx);

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

    // Validate participation exists
    const participation = await this.prisma.eventParticipation.findUnique({
      where: {
        eventId_participantId: {
          eventId: dto.eventId,
          participantId: dto.participantId,
        },
      },
    });

    if (!participation) {
      throw new ConflictException(
        'Participant is not registered in this event',
      );
    }

    // Unique (eventId + participantId)
    const existing = await this.prisma.eventResult.findUnique({
      where: {
        eventId_participantId: {
          eventId: dto.eventId,
          participantId: dto.participantId,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        'Result already exists for this participant in this event',
      );
    }

    const result = await this.prisma.eventResult.create({
      data: dto,
      include: {
        event: true,
        participant: true,
      },
    });

    return this.mapToResponse(result, true);
  }

  // ─────────────────────────────
  // GET ALL
  // ─────────────────────────────
  async findAll(query: QueryOptionsDto): Promise<PaginatedEventResultResponse> {
    const ctx = { entity: this.entity, action: 'fetch', additional: { query } };
    this.logger.debug('Fetching event results', ctx);

    const includeRelations = query.includeRelations || false;

    const queryArgs = buildQueryArgs<EventResult, Prisma.EventResultWhereInput>(
      query,
      [],
    );

    const [items, total] = await Promise.all([
      this.prisma.eventResult.findMany({
        where: queryArgs.where,
        skip: queryArgs.skip,
        take: queryArgs.take,
        orderBy: queryArgs.orderBy,
        include: {
          event: includeRelations,
          participant: includeRelations,
        },
      }),
      this.prisma.eventResult.count({ where: queryArgs.where }),
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
  ): Promise<EventResultResponse> {
    const result = await this.prisma.eventResult.findUnique({
      where: { id },
      include: {
        event: includeRelations,
        participant: includeRelations,
      },
    });

    if (!result) {
      throw new NotFoundException('Event result not found');
    }

    return this.mapToResponse(result, includeRelations);
  }

  // ─────────────────────────────
  // UPDATE
  // ─────────────────────────────
  async update(
    id: number,
    dto: UpdateEventResultDto,
  ): Promise<EventResultResponse> {
    const existing = await this.prisma.eventResult.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Event result not found');
    }

    const eventId = dto.eventId ?? existing.eventId;
    const participantId = dto.participantId ?? existing.participantId;

    // Validate event
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Validate participant
    const participant = await this.prisma.participant.findUnique({
      where: { id: participantId },
    });
    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    // Validate participation exists
    const participation = await this.prisma.eventParticipation.findFirst({
      where: {
        eventId,
        participantId,
      },
    });

    if (!participation) {
      throw new ConflictException(
        'Participant is not registered in this event',
      );
    }

    // Enforce uniqueness
    const duplicate = await this.prisma.eventResult.findFirst({
      where: {
        eventId,
        participantId,
        NOT: { id },
      },
    });

    if (duplicate) {
      throw new ConflictException(
        'Another result already exists for this participant in this event',
      );
    }

    const updated = await this.prisma.eventResult.update({
      where: { id },
      data: dto,
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
    const existing = await this.prisma.eventResult.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Event result not found');
    }

    await this.prisma.eventResult.delete({
      where: { id },
    });

    return { success: true };
  }

  // ─────────────────────────────
  // MAP
  // ─────────────────────────────
  private mapToResponse(
    entity: EventResult & {
      event?: Event;
      participant?: Participant;
    },
    includeRelations = false,
  ): EventResultResponse {
    return {
      id: entity.id,
      eventId: entity.eventId,
      participantId: entity.participantId,
      position: entity.position,
      event: includeRelations ? entity.event : undefined,
      participant: includeRelations ? entity.participant : undefined,
      createdAt: entity.createdAt.toISOString(),
    };
  }
}

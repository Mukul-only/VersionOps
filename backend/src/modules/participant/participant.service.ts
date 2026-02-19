import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from 'src/config/config.service';
import { LoggerService } from 'src/logger/logger.service';
import {
  Prisma,
  Participant,
  Year,
  EventParticipation,
  EventResult,
} from '@prisma/client';

import { CreateParticipantDto, UpdateParticipantDto } from './dto';
import { QueryOptionsDto } from 'src/common/dto/query-options.dto';
import { buildQueryArgs } from 'src/common/utils/query-builder.util';
import {
  ParticipantResponse,
  PaginatedParticipantResponse,
} from './types/participants.types';
import { CollegeResponse } from '../college/types/college.types';

@Injectable()
export class ParticipantService {
  private readonly entity = 'Participant';

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  // ─────────────────────────────
  // CREATE PARTICIPANT
  // ─────────────────────────────
  async create(dto: CreateParticipantDto): Promise<ParticipantResponse> {
    const ctx = { entity: this.entity, action: 'create', additional: { dto } };
    this.logger.debug('Creating participant', ctx);

    // Verify college exists
    const college = await this.prisma.college.findUnique({
      where: { id: dto.collegeId },
    });
    if (!college) {
      this.logger.warn(`College not found: id=${dto.collegeId}`, ctx);
      throw new NotFoundException('College not found');
    }

    const existingEmail = await this.prisma.participant.findUnique({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new ConflictException('Email already registered');
    }

    if (dto.hackerearthUser) {
      const existingHackerearthUser = await this.prisma.participant.findUnique({
        where: { hackerearthUser: dto.hackerearthUser },
      });
      if (existingHackerearthUser) {
        throw new ConflictException('HackerEarth username already registered');
      }
    }

    const count = await this.prisma.participant.count({
      where: { collegeId: dto.collegeId },
    });

    // Generate participantId
    const yearNumber = dto.year === Year.ONE ? 1 : 2;
    const participantId = `${college.code}-${yearNumber}-${String(count + 1).padStart(3, '0')}`;

    // Check uniqueness of participantId globally
    const existing = await this.prisma.participant.findUnique({
      where: { participantId },
    });
    if (existing) {
      this.logger.warn(
        `Generated participantId already exists: ${participantId}`,
        ctx,
      );
      throw new ConflictException('Participant ID collision, try again');
    }

    // Create participant
    const participant = await this.prisma.participant.create({
      data: {
        participantId,
        name: dto.name,
        year: dto.year,
        email: dto.email,
        collegeId: dto.collegeId,
        hackerearthUser: dto.hackerearthUser,
        phone: dto.phone,
      },
      include: { college: true },
    });

    this.logger.info(`Participant created: ${participant.participantId}`, ctx);

    return this.mapToResponse(participant);
  }

  // ─────────────────────────────
  // GET ALL PARTICIPANTS
  // ─────────────────────────────
  async findAll(query: QueryOptionsDto): Promise<PaginatedParticipantResponse> {
    const ctx = { entity: this.entity, action: 'fetch', additional: { query } };
    this.logger.debug('Fetching participants', ctx);

    const includeRelations = query.includeRelations || false;

    const queryArgs = buildQueryArgs<Participant, Prisma.ParticipantWhereInput>(
      query,
      ['participantId', 'name', 'hackerearthUser'],
    );

    const [participants, total] = await Promise.all([
      this.prisma.participant.findMany({
        where: queryArgs.where,
        skip: queryArgs.skip,
        take: queryArgs.take,
        orderBy: queryArgs.orderBy,
        include: {
          college: true,
          participations: includeRelations,
          results: includeRelations,
        },
      }),
      this.prisma.participant.count({ where: queryArgs.where }),
    ]);

    this.logger.info('Fetched participants', {
      ...ctx,
      additional: { fetched: participants.length, total },
    });

    return {
      items: participants.map((p) => this.mapToResponse(p, includeRelations)),
      total,
    };
  }

  // ─────────────────────────────
  // GET ONE PARTICIPANT
  // ─────────────────────────────
  async findOne(
    id: number,
    includeRelations: boolean = false,
  ): Promise<ParticipantResponse> {
    const ctx = { entity: this.entity, action: 'fetchOne', additional: { id } };
    this.logger.debug('Fetching participant by id', ctx);

    const participant = await this.prisma.participant.findUnique({
      where: { id },
      include: {
        college: true,
        participations: includeRelations,
        results: includeRelations,
      },
    });

    if (!participant) {
      this.logger.warn(`Participant not found: id=${id}`, ctx);
      throw new NotFoundException('Participant not found');
    }

    this.logger.info(`Fetched participant: ${participant.participantId}`, ctx);
    return this.mapToResponse(participant, includeRelations);
  }

  async update(
    id: number,
    dto: UpdateParticipantDto,
  ): Promise<ParticipantResponse> {
    const ctx = { entity: this.entity, action: 'update', additional: { id } };
    this.logger.debug('Updating participant', ctx);

    // Fetch current participant
    const participant = await this.prisma.participant.findUnique({
      where: { id },
    });
    if (!participant) {
      this.logger.warn(`Participant not found: id=${id}`, ctx);
      throw new NotFoundException('Participant not found');
    }

    // Check email uniqueness if changed
    if (dto.email && dto.email !== participant.email) {
      const emailExists = await this.prisma.participant.findUnique({
        where: { email: dto.email },
      });
      if (emailExists) {
        throw new ConflictException('Email already registered');
      }
    }

    if (
      dto.hackerearthUser !== undefined &&
      dto.hackerearthUser !== participant.hackerearthUser
    ) {
      // If setting to null, no need to check uniqueness
      if (dto.hackerearthUser !== null) {
        const hackerearthExists = await this.prisma.participant.findUnique({
          where: { hackerearthUser: dto.hackerearthUser },
        });
        if (hackerearthExists) {
          throw new ConflictException(
            'HackerEarth username already registered',
          );
        }
      }
    }

    // Update participantId if year changed
    let participantId = participant.participantId;
    if (dto.year && dto.year !== participant.year) {
      const parts = participant.participantId.split('-'); // ["NITT", "1", "002"]
      const yearNumber = dto.year === Year.ONE ? '1' : '2';
      parts[1] = yearNumber;
      participantId = parts.join('-');

      // Ensure new participantId is globally unique
      const existing = await this.prisma.participant.findUnique({
        where: { participantId },
      });
      if (existing) {
        throw new ConflictException('Participant ID already exists');
      }
    }

    // Update participant
    const updated = await this.prisma.participant.update({
      where: { id },
      data: {
        name: dto.name,
        year: dto.year,
        hackerearthUser: dto.hackerearthUser,
        phone: dto.phone,
        email: dto.email,
        participantId, // updated if year changed
      },
      include: { college: true },
    });

    this.logger.info(`Participant updated: ${updated.participantId}`, ctx);
    return this.mapToResponse(updated);
  }

  // ─────────────────────────────
  // DELETE PARTICIPANT
  // ─────────────────────────────
  async remove(id: number): Promise<{ success: boolean }> {
    const ctx = { entity: this.entity, action: 'delete', additional: { id } };
    this.logger.debug('Deleting participant', ctx);

    const participant = await this.prisma.participant.findUnique({
      where: { id },
    });

    if (!participant) {
      this.logger.warn(`Participant not found: id=${id}`, ctx);
      throw new NotFoundException('Participant not found');
    }

    await this.prisma.participant.delete({ where: { id } });

    this.logger.info(`Participant deleted: ${participant.participantId}`, ctx);
    return { success: true };
  }

  // ─────────────────────────────
  // MAP TO RESPONSE
  // ─────────────────────────────
  private mapToResponse(
    participant: Participant & {
      college: CollegeResponse;
      participations?: EventParticipation[];
      results?: EventResult[];
    },
    includeRelations = false,
  ): ParticipantResponse {
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
      participations: includeRelations ? participant.participations : undefined,
      results: includeRelations ? participant.results : undefined,
      createdAt: participant.createdAt.toISOString(),
    };
  }
}

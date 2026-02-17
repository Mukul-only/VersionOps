import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from 'src/config/config.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoggerService } from 'src/logger/logger.service';
import { Prisma, College } from '@prisma/client';

import { CreateCollegeDto, UpdateCollegeDto } from './dto';
import { QueryOptionsDto } from 'src/common/dto/query-options.dto';
import { buildQueryArgs } from 'src/common/utils/query-builder.util';
import {
  CollegeResponse,
  PaginatedCollegeResponse,
} from './types/college.types';

@Injectable()
export class CollegeService {
  private readonly entity = 'College';

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  // CREATE
  async create(dto: CreateCollegeDto): Promise<CollegeResponse> {
    const { code, name } = dto;
    const ctx = { entity: this.entity, action: 'create', additional: { code } };
    this.logger.debug('Creating college', ctx);

    const existing = await this.prisma.college.findUnique({ where: { code } });
    if (existing) {
      this.logger.warn(`Duplicate college code: ${code}`, ctx);
      throw new ConflictException('College code already exists');
    }

    const college = await this.prisma.$transaction(async (tx) => {
      const createdCollege = await tx.college.create({ data: { code, name } });
      await tx.collegeScore.create({
        data: {
          collegeId: createdCollege.id,
          totalPoints: 0,
          firstPrizes: 0,
          secondPrizes: 0,
          thirdPrizes: 0,
        },
      });
      return createdCollege;
    });

    this.logger.info(`College created: ${college.code}`, ctx);

    return { ...college, score: null, participantCount: 0 };
  }

  // GET ALL
  async findAll(query: QueryOptionsDto): Promise<PaginatedCollegeResponse> {
    const ctx = { entity: this.entity, action: 'fetch', additional: { query } };
    this.logger.debug('Fetching colleges', ctx);

    const queryArgs = buildQueryArgs<College, Prisma.CollegeWhereInput>(query, [
      'code',
      'name',
    ]);

    const [colleges, total] = await Promise.all([
      this.prisma.college.findMany({
        where: queryArgs.where,
        skip: queryArgs.skip,
        take: queryArgs.take,
        orderBy: queryArgs.orderBy,
        include: {
          score: true,
          participants: query.includeRelations || false,
        },
      }),
      this.prisma.college.count({ where: queryArgs.where }),
    ]);

    const items: CollegeResponse[] = colleges.map((c) => ({
      ...c,
      participantCount: c.participants?.length || 0,
      score: c.score,
      participants: query.includeRelations ? c.participants : undefined,
    }));

    this.logger.info('Fetched colleges', {
      ...ctx,
      additional: { fetched: items.length, total },
    });
    return { items, total };
  }

  // GET ONE
  async findOne(
    id: number,
    includeRelations: boolean = false,
  ): Promise<CollegeResponse> {
    const ctx = { entity: this.entity, action: 'fetchOne', additional: { id } };
    this.logger.debug('Fetching college by id', ctx);

    const college = await this.prisma.college.findUnique({
      where: { id },
      include: {
        score: true,
        participants: includeRelations,
        _count: { select: { participants: true } },
      },
    });

    if (!college) {
      this.logger.warn(`College not found: id=${id}`, ctx);
      throw new NotFoundException('College not found');
    }

    const response: CollegeResponse = {
      id: college.id,
      code: college.code,
      name: college.name,
      createdAt: college.createdAt,
      score: college.score,
      participantCount: college._count.participants,
      participants: includeRelations ? college.participants : undefined,
    };

    this.logger.info('Fetched college successfully', ctx);
    return response;
  }

  // UPDATE
  async update(id: number, dto: UpdateCollegeDto): Promise<CollegeResponse> {
    const ctx = { entity: this.entity, action: 'update', additional: { id } };
    this.logger.debug('Updating college', ctx);

    const college = await this.prisma.college.findUnique({ where: { id } });
    if (!college) {
      this.logger.warn(`College not found: id=${id}`, ctx);
      throw new NotFoundException('College not found');
    }

    const updated = await this.prisma.college.update({
      where: { id },
      data: { name: dto.name },
      include: { score: true, _count: { select: { participants: true } } },
    });

    const response: CollegeResponse = {
      id: updated.id,
      code: updated.code,
      name: updated.name,
      createdAt: updated.createdAt,
      score: updated.score,
      participantCount: updated._count.participants,
    };

    this.logger.info(`College updated: ${college.code}`, ctx);
    return response;
  }

  // DELETE
  async remove(id: number): Promise<{ success: boolean }> {
    const ctx = { entity: this.entity, action: 'delete', additional: { id } };
    this.logger.debug('Deleting college', ctx);

    const college = await this.prisma.college.findUnique({
      where: { id },
      include: { _count: { select: { participants: true } } },
    });

    if (!college) {
      this.logger.warn(`College not found: id=${id}`, ctx);
      throw new NotFoundException('College not found');
    }

    if (college._count.participants > 0) {
      this.logger.warn(
        `Attempt to delete college with participants: ${college.code}`,
        ctx,
      );
      throw new BadRequestException(
        'Cannot delete college with registered participants',
      );
    }

    await this.prisma.$transaction([
      this.prisma.collegeScore.delete({ where: { collegeId: id } }),
      this.prisma.college.delete({ where: { id } }),
    ]);

    this.logger.info(`College deleted: ${college.code}`, ctx);
    return { success: true };
  }
}

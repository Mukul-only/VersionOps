import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Position } from '@prisma/client';
import {
  PaginatedLeaderboardResponse,
  LeaderboardResponse,
} from './types/leaderboard.types';
import { QueryOptionsDto } from 'src/common/dto/query-options.dto';
import { buildQueryArgs } from 'src/common/utils/query-builder.util';
import { CollegeScore, College, Prisma } from '@prisma/client';

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────
  // RECALCULATE LEADERBOARD
  // ─────────────────────────────
  async recalculate(): Promise<{ success: boolean }> {
    return this.prisma.$transaction(async (tx) => {
      await tx.collegeScore.deleteMany();

      const colleges = await tx.college.findMany({
        select: { id: true },
      });

      for (const college of colleges) {
        const collegeId = college.id;

        const participations = await tx.eventParticipation.findMany({
          where: { participant: { collegeId } },
          include: { event: true },
        });

        const participationPoints = participations.reduce(
          (sum, p) => sum + p.event.participationPoints,
          0,
        );

        const results = await tx.eventResult.findMany({
          where: { participant: { collegeId } },
          include: { event: true },
        });

        let prizePoints = 0;
        let firstPrizes = 0;
        let secondPrizes = 0;
        let thirdPrizes = 0;

        for (const r of results) {
          switch (r.position) {
            case Position.FIRST:
              prizePoints += r.event.firstPrizePoints;
              firstPrizes++;
              break;
            case Position.SECOND:
              prizePoints += r.event.secondPrizePoints;
              secondPrizes++;
              break;
            case Position.THIRD:
              prizePoints += r.event.thirdPrizePoints;
              thirdPrizes++;
              break;
          }
        }

        const totalPoints = participationPoints + prizePoints;

        await tx.collegeScore.create({
          data: {
            collegeId,
            totalPoints,
            firstPrizes,
            secondPrizes,
            thirdPrizes,
          },
        });
      }

      return { success: true };
    });
  }

  // ─────────────────────────────
  // GET LEADERBOARD
  // ─────────────────────────────
  // ─────────────────────────────
  // GET LEADERBOARD
  // ─────────────────────────────
  async getLeaderboard(
    query: QueryOptionsDto,
  ): Promise<PaginatedLeaderboardResponse> {
    const includeRelations = query.includeRelations || false;

    const queryArgs = buildQueryArgs<
      CollegeScore,
      Prisma.CollegeScoreWhereInput
    >(query, []);

    const [items, total] = await Promise.all([
      this.prisma.collegeScore.findMany({
        where: queryArgs.where,
        skip: queryArgs.skip,
        take: queryArgs.take,
        orderBy: [
          { totalPoints: 'desc' },
          { firstPrizes: 'desc' },
          { secondPrizes: 'desc' },
          { thirdPrizes: 'desc' },
        ],
        include: {
          college: includeRelations,
        },
      }),
      this.prisma.collegeScore.count({
        where: queryArgs.where,
      }),
    ]);

    return {
      items: items.map((i) => this.mapToResponse(i, includeRelations)),
      total,
    };
  }
  private mapToResponse(
    score: CollegeScore & { college?: College },
    includeRelations: boolean,
  ): LeaderboardResponse {
    return {
      collegeId: score.collegeId,
      college: includeRelations ? score.college! : undefined,
      totalPoints: score.totalPoints,
      firstPrizes: score.firstPrizes,
      secondPrizes: score.secondPrizes,
      thirdPrizes: score.thirdPrizes,
      updatedAt: score.updatedAt.toISOString(),
    };
  }
}

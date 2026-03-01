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
import { AdjustScoreDto } from './adjust-score.dto';

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

      // Initialize score map
      const scoreMap = new Map<
        number,
        {
          totalPoints: number;
          firstPrizes: number;
          secondPrizes: number;
          thirdPrizes: number;
        }
      >();

      for (const college of colleges) {
        scoreMap.set(college.id, {
          totalPoints: 0,
          firstPrizes: 0,
          secondPrizes: 0,
          thirdPrizes: 0,
        });
      }

      const participations = await tx.eventParticipation.findMany({
        include: {
          event: true,
          participant: true,
        },
      });

      for (const p of participations) {
        const collegeScore = scoreMap.get(p.participant.collegeId);
        if (!collegeScore) continue;

        collegeScore.totalPoints += p.event.participationPoints;
      }

      const results = await tx.eventResult.findMany({
        include: {
          event: true,
          participant: true,
        },
      });

      for (const r of results) {
        const event = r.event;

        let prizeValue = 0;

        switch (r.position) {
          case Position.FIRST:
            prizeValue = event.firstPrizePoints;
            break;
          case Position.SECOND:
            prizeValue = event.secondPrizePoints;
            break;
          case Position.THIRD:
            prizeValue = event.thirdPrizePoints;
            break;
        }

        // ───────── TEAM EVENT ─────────
        if (event.teamSize > 1) {
          const winningParticipation = await tx.eventParticipation.findUnique({
            where: {
              eventId_participantId: {
                eventId: r.eventId,
                participantId: r.participantId,
              },
            },
          });

          if (!winningParticipation?.teamId) continue;

          const teamMembers = await tx.eventParticipation.findMany({
            where: {
              eventId: r.eventId,
              teamId: winningParticipation.teamId,
            },
            include: {
              participant: true,
            },
          });

          const perMemberPrize = prizeValue / event.teamSize;

          const uniqueColleges = new Set<number>();

          for (const member of teamMembers) {
            const collegeId = member.participant.collegeId;
            const collegeScore = scoreMap.get(collegeId);
            if (!collegeScore) continue;

            // Add prize points per participant
            collegeScore.totalPoints += perMemberPrize;

            uniqueColleges.add(collegeId);
          }

          // Increment prize count once per unique college
          for (const collegeId of uniqueColleges) {
            const collegeScore = scoreMap.get(collegeId);
            if (!collegeScore) continue;

            switch (r.position) {
              case Position.FIRST:
                collegeScore.firstPrizes++;
                break;
              case Position.SECOND:
                collegeScore.secondPrizes++;
                break;
              case Position.THIRD:
                collegeScore.thirdPrizes++;
                break;
            }
          }
        }

        // ───────── INDIVIDUAL EVENT ─────────
        else {
          const collegeId = r.participant.collegeId;
          const collegeScore = scoreMap.get(collegeId);
          if (!collegeScore) continue;

          collegeScore.totalPoints += prizeValue;

          switch (r.position) {
            case Position.FIRST:
              collegeScore.firstPrizes++;
              break;
            case Position.SECOND:
              collegeScore.secondPrizes++;
              break;
            case Position.THIRD:
              collegeScore.thirdPrizes++;
              break;
          }
        }
      }

      const adjustments = await tx.manualScoreAdjustment.findMany();

      for (const adj of adjustments) {
        const collegeScore = scoreMap.get(adj.collegeId);
        if (!collegeScore) continue;

        collegeScore.totalPoints += adj.points;
      }

      for (const [collegeId, stats] of scoreMap.entries()) {
        await tx.collegeScore.create({
          data: {
            collegeId,
            totalPoints: stats.totalPoints,
            firstPrizes: stats.firstPrizes,
            secondPrizes: stats.secondPrizes,
            thirdPrizes: stats.thirdPrizes,
          },
        });
      }

      return { success: true };
    });
  }

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

  adjustScore(dto: AdjustScoreDto) {
    return this.prisma.manualScoreAdjustment.create({
      data: {
        collegeId: dto.collegeId,
        points: dto.points,
        reason: dto.reason ?? null,
      },
    });
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

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Position } from '@prisma/client';

import {
  CollegeReportResponse,
  EventBreakdown,
  ParticipantContribution,
} from './types/report.types';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCollegeReport(collegeId: number): Promise<CollegeReportResponse> {
    const [
      college,
      participants,
      participations,
      results,
      adjustments,
      leaderboard,
    ] = await Promise.all([
      this.prisma.college.findUnique({
        where: { id: collegeId },
      }),

      this.prisma.participant.findMany({
        where: { collegeId },
      }),

      this.prisma.eventParticipation.findMany({
        include: {
          event: true,
          participant: true,
        },
      }),

      this.prisma.eventResult.findMany({
        include: {
          event: true,
          participant: true,
        },
      }),

      this.prisma.manualScoreAdjustment.findMany({
        where: { collegeId },
      }),

      this.prisma.collegeScore.findMany({
        orderBy: [
          { totalPoints: 'desc' },
          { firstPrizes: 'desc' },
          { secondPrizes: 'desc' },
          { thirdPrizes: 'desc' },
        ],
        include: {
          college: true,
        },
      }),
    ]);

    if (!college) throw new NotFoundException('College not found');

    // ===============================
    // Leaderboard Rank
    // ===============================

    const rank = leaderboard.findIndex((c) => c.collegeId === collegeId) + 1;

    const current = leaderboard[rank - 1];
    const prev = leaderboard[rank - 2];
    const next = leaderboard[rank];

    // ===============================
    // Event Breakdown
    // ===============================

    const eventMap = new Map<number, EventBreakdown>();

    let participationPoints = 0;
    let prizePoints = 0;
    let totalWins = 0;

    for (const p of participations) {
      if (p.participant.collegeId !== collegeId) continue;

      participationPoints += p.event.participationPoints;

      const existing = eventMap.get(p.eventId) ?? {
        eventId: p.eventId,
        eventName: p.event.name,
        participationPoints: 0,
        prizePoints: 0,
        total: 0,
        participants: [],
        winners: [],
      };

      existing.participationPoints += p.event.participationPoints;

      existing.participants.push({
        participantId: p.participantId,
        name: p.participant.name,
        teamId: p.teamId,
      });

      eventMap.set(p.eventId, existing);
    }

    // ===============================
    // Results Calculation
    // ===============================

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

      if (event.teamSize > 1) {
        const winningParticipation =
          await this.prisma.eventParticipation.findUnique({
            where: {
              eventId_participantId: {
                eventId: r.eventId,
                participantId: r.participantId,
              },
            },
          });

        if (!winningParticipation?.teamId) continue;

        const teamMembers = await this.prisma.eventParticipation.findMany({
          where: {
            eventId: r.eventId,
            teamId: winningParticipation.teamId,
          },
          include: { participant: true },
        });

        const perMember = prizeValue / event.teamSize;

        for (const member of teamMembers) {
          if (member.participant.collegeId !== collegeId) continue;

          const e = eventMap.get(r.eventId);
          if (!e) continue;

          e.prizePoints += perMember;
          prizePoints += perMember;
          totalWins++;

          e.winners.push({
            participantId: member.participantId,
            name: member.participant.name,
            position: r.position,
            points: perMember,
          });
        }
      } else {
        if (r.participant.collegeId !== collegeId) continue;

        const e = eventMap.get(r.eventId);
        if (!e) continue;

        e.prizePoints += prizeValue;
        prizePoints += prizeValue;
        totalWins++;

        e.winners.push({
          participantId: r.participantId,
          name: r.participant.name,
          position: r.position,
          points: prizeValue,
        });
      }
    }

    const eventBreakdown = Array.from(eventMap.values()).map((e) => ({
      ...e,
      total: e.participationPoints + e.prizePoints,
    }));

    // ===============================
    // Participant Breakdown
    // ===============================

    const participantMap = new Map<number, ParticipantContribution>();

    for (const p of participants) {
      participantMap.set(p.id, {
        id: p.id,
        name: p.name,
        participationPoints: 0,
        prizePoints: 0,
        total: 0,
      });
    }

    for (const event of eventBreakdown) {
      const perParticipant =
        event.participationPoints / event.participants.length;

      for (const p of event.participants) {
        const item = participantMap.get(p.participantId);
        if (!item) continue;

        item.participationPoints += perParticipant;
      }

      for (const w of event.winners) {
        const item = participantMap.get(w.participantId);
        if (!item) continue;

        item.prizePoints += w.points;
      }
    }

    const participantBreakdown = Array.from(participantMap.values()).map(
      (p) => ({
        ...p,
        total: p.participationPoints + p.prizePoints,
      }),
    );

    // ===============================
    // Adjustments
    // ===============================

    const adjustmentPoints = adjustments.reduce((a, b) => a + b.points, 0);

    // ===============================
    // Insights
    // ===============================

    const topPerformer = [...participantBreakdown].sort(
      (a, b) => b.total - a.total,
    )[0];

    const bestEvent = [...eventBreakdown].sort((a, b) => b.total - a.total)[0];

    const worstEvent = [...eventBreakdown].sort((a, b) => a.total - b.total)[0];
    // ===============================
    // Final Response
    // ===============================

    return {
      college: {
        id: college.id,
        name: college.name,
        code: college.code,
        totalParticipants: participants.length,
      },

      leaderboard: {
        rank,
        totalColleges: leaderboard.length,
        pointsToRankAbove: prev
          ? prev.totalPoints - current.totalPoints
          : undefined,
        pointsAheadOfNext: next
          ? current.totalPoints - next.totalPoints
          : undefined,
      },

      scoreBreakdown: {
        participationPoints,
        prizePoints,
        adjustmentPoints,
        total: participationPoints + prizePoints + adjustmentPoints,
      },

      eventBreakdown,

      participantBreakdown,

      adjustments: adjustments.map((a) => ({
        id: a.id,
        points: a.points,
        reason: a.reason,
        createdAt: a.createdAt.toISOString(),
      })),

      insights: {
        topPerformer,
        bestEvent,
        worstEvent,
        totalEventsParticipated: eventBreakdown.length,
        totalWins,
      },
    };
  }

  async getMyCollegeReport(userId: string): Promise<CollegeReportResponse> {
    const participant = await this.prisma.participant.findUnique({
      where: {
        userId: userId,
      },
    });

    if (!participant) {
      throw new ForbiddenException('User is not linked to a participant');
    }

    return this.getCollegeReport(participant.collegeId);
  }
}

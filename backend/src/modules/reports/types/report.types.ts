import { Position } from '@prisma/client';

export interface CollegeReportResponse {
  college: CollegeInfo;
  leaderboard: LeaderboardInfo;
  scoreBreakdown: ScoreBreakdown;
  eventBreakdown: EventBreakdown[];
  participantBreakdown: ParticipantContribution[];
  adjustments: AdjustmentInfo[];
  insights: ReportInsights;
}

export interface CollegeInfo {
  id: number;
  name: string;
  code: string;
  totalParticipants: number;
}

export interface LeaderboardInfo {
  rank: number;
  totalColleges: number;
  pointsToRankAbove?: number;
  pointsAheadOfNext?: number;
}

export interface ScoreBreakdown {
  participationPoints: number;
  prizePoints: number;
  adjustmentPoints: number;
  total: number;
}

export interface EventBreakdown {
  eventId: number;
  eventName: string;
  participationPoints: number;
  prizePoints: number;
  total: number;
  participants: EventParticipant[];
  winners: EventWinner[];
}

export interface EventParticipant {
  participantId: number;
  name: string;
  teamId?: string | null;
}

export interface EventWinner {
  participantId: number;
  name: string;
  position: Position;
  points: number;
}

export interface ParticipantContribution {
  id: number;
  name: string;
  participationPoints: number;
  prizePoints: number;
  total: number;
}

export interface AdjustmentInfo {
  id: number;
  points: number;
  reason?: string | null;
  createdAt: string;
}

export interface ReportInsights {
  topPerformer?: ParticipantContribution;
  bestEvent?: EventBreakdown;
  worstEvent?: EventBreakdown;
  totalEventsParticipated: number;
  totalWins: number;
}

import { College } from '@prisma/client';

export interface LeaderboardResponse {
  collegeId: number;
  college?: College;
  totalPoints: number;
  firstPrizes: number;
  secondPrizes: number;
  thirdPrizes: number;
  updatedAt: string;
}

export interface PaginatedLeaderboardResponse {
  items: LeaderboardResponse[];
  total: number;
}

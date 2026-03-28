import { EventParticipation, EventResult } from '@prisma/client';

export interface EventResponse {
  id: number;
  name: string;
  teamSize: number;

  participationPoints: number;
  firstPrizePoints: number;
  secondPrizePoints: number;
  thirdPrizePoints: number;

  participations?: EventParticipation[];
  results?: EventResult[];

  createdAt: string;
}

export interface PaginatedEventResponse {
  items: EventResponse[];
  total: number;
}

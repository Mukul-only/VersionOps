import { Event, Participant, College } from '@prisma/client';

export type ParticipantWithCollege = Participant & { college?: College };

export interface EventParticipationResponse {
  id: number;

  eventId: number;
  participantId: number;

  dummyId?: string;
  teamId?: string;
  event?: Event;
  participant?: ParticipantWithCollege;

  createdAt: string;
}

export interface PaginatedEventParticipationResponse {
  items: EventParticipationResponse[];
  total: number;
}

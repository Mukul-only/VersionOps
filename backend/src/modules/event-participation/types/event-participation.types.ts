import { Event, Participant } from '@prisma/client';

export interface EventParticipationResponse {
  id: number;

  eventId: number;
  participantId: number;

  dummyId?: string;
  teamId?: string;
  event?: Event;
  participant?: Participant;

  createdAt: string;
}

export interface PaginatedEventParticipationResponse {
  items: EventParticipationResponse[];
  total: number;
}

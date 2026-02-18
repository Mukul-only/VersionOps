import { Event, Participant, Position } from '@prisma/client';

export interface EventResultResponse {
  id: number;

  eventId: number;
  participantId: number;

  event?: Event;
  participant?: Participant;

  position: Position;
  createdAt: string;
}

export interface PaginatedEventResultResponse {
  items: EventResultResponse[];
  total: number;
}

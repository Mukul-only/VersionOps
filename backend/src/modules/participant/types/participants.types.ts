import {
  Year,
  FestStatus,
  EventParticipation,
  EventResult,
} from '@prisma/client';
import { CollegeResponse } from 'src/modules/college/types/college.types';

export interface ParticipantResponse {
  id: number;
  participantId: string;
  name: string;
  college: CollegeResponse;
  year: Year;
  email: string;
  festStatus: FestStatus;
  hackerearthUser?: string;
  phone?: string;

  participations?: EventParticipation[];
  results?: EventResult[];
  createdAt: string;
}

export interface PaginatedParticipantResponse {
  items: ParticipantResponse[];
  total: number;
}

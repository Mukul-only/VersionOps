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

export interface BulkParticipantInput {
  name: string;
  email: string;
  collegeCode: string;
  year: Year;
  hackerearthUser?: string;
  phone?: string;
}

export interface BulkImportError {
  index: number;
  email?: string;
  reason: string;
}

export interface BulkImportResult {
  total: number;
  inserted: number;
  failed: number;
  errors: BulkImportError[];
}

export interface BulkParticipantResolved {
  name: string;
  email: string;
  collegeId: number;
  year: Year;
  hackerearthUser?: string;
  phone?: string;
}

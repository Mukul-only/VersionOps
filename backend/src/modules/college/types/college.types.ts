import { CollegeScore, Participant } from '@prisma/client';

/**
 * College info for API responses.
 * Includes optional participants list or count.
 */
export interface CollegeResponse {
  id: number;
  code: string;
  name: string;
  createdAt: Date;
  score: CollegeScore | null;
  participants?: Participant[]; // optional, full list
  participantCount?: number; // optional, count
}

/**
 * Paginated list of colleges.
 */
export interface PaginatedCollegeResponse {
  items: CollegeResponse[];
  total: number;
}

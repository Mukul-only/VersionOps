export interface ApiError {
  success: boolean;
  statusCode: number;
  message: string | string[];
  path: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
}

export interface PaginationParams {
  skip?: number;
  take?: number;
  search?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
  filters?: string;
  includeRelations?: boolean;
}

export interface College {
  id: number;
  code: string;
  name: string;
  score?: any; // Object in contract
  participants?: Participant[];
  createdAt: string;
  participantCount: number;
}

export interface Participant {
  id: number;
  participantId: string;
  name: string;
  email: string;
  year: string;
  festStatus: string;
  hackerearthUser?: string;
  phone?: string;
  college: College;
  participations?: EventParticipation[];
  results?: EventResult[];
  createdAt: string;
}

export interface FestEvent {
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

export interface EventParticipation {
  id: number;
  eventId: number;
  participantId: number;
  dummyId?: string;
  teamId?: string;
  event?: FestEvent;
  participant?: Participant;
  createdAt: string;
}

export interface EventResult {
  id: number;
  eventId: number;
  participantId: number;
  position: 'FIRST' | 'SECOND' | 'THIRD';
  event?: FestEvent;
  participant?: Participant;
  createdAt: string;
}

export interface LeaderboardEntry {
  collegeId: number;
  college?: College;
  totalPoints: number;
  firstPrizes: number;
  secondPrizes: number;
  thirdPrizes: number;
  updatedAt: string;
}

export interface LoginPayload {
  email: string;
  password?: string;
}

export interface AuthResponse {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'OPERATOR' | 'DESK' | 'PARTICIPANT';
}

export interface CollegeReport {
  college: {
    id: number;
    name: string;
    code: string;
    totalParticipants: number;
  };
  leaderboard: {
    rank: number;
    totalColleges: number;
    pointsToRankAbove?: number;
    pointsAheadOfNext?: number;
  };
  scoreBreakdown: {
    participationPoints: number;
    prizePoints: number;
    adjustmentPoints: number;
    total: number;
  };
  eventBreakdown: Array<{
    eventId: number;
    eventName: string;
    participationPoints: number;
    prizePoints: number;
    total: number;
    participants: Array<{
      participantId: number;
      name: string;
      teamId: string | null;
    }>;
    winners: Array<{
      participantId: number;
      name: string;
      position: 'FIRST' | 'SECOND' | 'THIRD';
      points: number;
    }>;
  }>;
  participantBreakdown: Array<{
    id: number;
    name: string;
    participationPoints: number;
    prizePoints: number;
    total: number;
  }>;
  adjustments: Array<{
    id: number;
    points: number;
    reason: string | null;
    createdAt: string;
  }>;
  insights: {
    topPerformer?: {
      id: number;
      name: string;
      participationPoints: number;
      prizePoints: number;
      total: number;
    };
    bestEvent?: {
      eventId: number;
      eventName: string;
      participationPoints: number;
      prizePoints: number;
      total: number;
      participants: any[];
      winners: any[];
    };
    worstEvent?: {
      eventId: number;
      eventName: string;
      participationPoints: number;
      prizePoints: number;
      total: number;
      participants: any[];
      winners: any[];
    };
    totalEventsParticipated: number;
    totalWins: number;
  };
}

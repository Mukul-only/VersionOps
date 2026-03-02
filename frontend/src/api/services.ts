import { FetchApiOptions, fetchApi } from './client';
import {
  College,
  FestEvent,
  Participant,
  EventParticipation,
  EventResult,
  LeaderboardEntry,
  PaginatedResponse,
  PaginationParams as BasePaginationParams,
  AuthResponse,
  LoginPayload,
} from './types';

export interface PaginationParams extends BasePaginationParams {
  suppressRedirect?: boolean;
  suppressForbiddenRedirect?: boolean;
}

function buildQueryString(params: PaginationParams): string {
  const query = new URLSearchParams();
  if (params.skip !== undefined) query.append('skip', params.skip.toString());
  if (params.take !== undefined) query.append('take', params.take.toString());
  if (params.search) query.append('search', params.search);
  if (params.sortBy) query.append('sortBy', params.sortBy);
  if (params.order) query.append('order', params.order);
  if (params.filters) query.append('filters', params.filters);
  if (params.includeRelations !== undefined) query.append('includeRelations', params.includeRelations.toString());
  return query.toString() ? `?${query.toString()}` : '';
}

const getFetchOptions = (params: PaginationParams): FetchApiOptions => ({
  suppressRedirect: params.suppressRedirect,
  suppressForbiddenRedirect: params.suppressForbiddenRedirect,
});

// Events
export const eventService = {
  getAll: (params: PaginationParams = {}) =>
    fetchApi<PaginatedResponse<FestEvent>>(`/events${buildQueryString(params)}`, getFetchOptions(params)),

  getById: (id: number, includeRelations = false, options: FetchApiOptions = {}) =>
    fetchApi<FestEvent>(`/events/${id}?includeRelations=${includeRelations}`, options),

  getParticipants: (id: number, params: PaginationParams = {}) =>
    fetchApi<PaginatedResponse<Participant>>(`/events/${id}/participants${buildQueryString(params)}`, getFetchOptions(params)),

  create: (data: Partial<FestEvent>, options: FetchApiOptions = {}) =>
    fetchApi<FestEvent>('/events', {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    }),

  update: (id: number, data: Partial<FestEvent>, options: FetchApiOptions = {}) =>
    fetchApi<FestEvent>(`/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...options,
    }),

  delete: (id: number, options: FetchApiOptions = {}) =>
    fetchApi<{ success: boolean }>(`/events/${id}`, {
      method: 'DELETE',
      ...options,
    }),
};

// Colleges
export const collegeService = {
  getAll: (params: PaginationParams = {}) =>
    fetchApi<PaginatedResponse<College>>(`/colleges${buildQueryString(params)}`, getFetchOptions(params)),

  getById: (id: number, includeRelations = false, options: FetchApiOptions = {}) =>
    fetchApi<College>(`/colleges/${id}?includeRelations=${includeRelations}`, options),

  create: (data: { code: string; name: string }, options: FetchApiOptions = {}) =>
    fetchApi<College>('/colleges', {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    }),

  update: (id: number, data: { name: string }, options: FetchApiOptions = {}) =>
    fetchApi<College>(`/colleges/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...options,
    }),

  delete: (id: number, options: FetchApiOptions = {}) =>
    fetchApi<{ success: boolean }>(`/colleges/${id}`, {
      method: 'DELETE',
      ...options,
    }),
};

// Participants
export const participantService = {
  getAll: (params: PaginationParams = {}) =>
    fetchApi<PaginatedResponse<Participant>>(`/participants${buildQueryString(params)}`, getFetchOptions(params)),

  getById: (id: number, includeRelations = false, options: FetchApiOptions = {}) =>
    fetchApi<Participant>(`/participants/${id}?includeRelations=${includeRelations}`, options),

  create: (data: any, options: FetchApiOptions = {}) =>
    fetchApi<Participant>('/participants', {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    }),

  bulkImport: (data: any[], options: FetchApiOptions = {}) =>
    fetchApi<any>('/participants/bulk-import', {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    }),

  checkIn: (id: number, options: FetchApiOptions = {}) =>
    fetchApi<Participant>(`/participants/${id}/check-in`, {
      method: 'POST',
      ...options,
    }),

  noShow: (id: number, options: FetchApiOptions = {}) =>
    fetchApi<Participant>(`/participants/${id}/no-show`, {
      method: 'POST',
      ...options,
    }),

  resetStatus: (id: number, options: FetchApiOptions = {}) =>
    fetchApi<Participant>(`/participants/${id}/registered`, {
      method: 'POST',
      ...options,
    }),

  update: (id: number, data: any, options: FetchApiOptions = {}) =>
    fetchApi<Participant>(`/participants/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...options,
    }),

  delete: (id: number, options: FetchApiOptions = {}) =>
    fetchApi<{ success: boolean }>(`/participants/${id}`, {
      method: 'DELETE',
      ...options,
    }),
};

// Leaderboard
export const leaderboardService = {
  get: (params: PaginationParams = {}) =>
    fetchApi<PaginatedResponse<LeaderboardEntry>>(`/leaderboard${buildQueryString(params)}`, getFetchOptions(params)),

  recalculate: (options: FetchApiOptions = {}) =>
    fetchApi<{ success: boolean }>('/leaderboard/recalculate', {
      method: 'POST',
      ...options,
    }),

  adjust: (collegeId: number, points: number, reason?: string, options: FetchApiOptions = {}) =>
    fetchApi<{ success: boolean }>('/leaderboard/adjust', {
      method: 'POST',
      body: JSON.stringify({ collegeId, points, reason }),
      ...options,
    }),
};

// Event Participations
export const eventParticipationService = {
  getAll: (params: PaginationParams = {}) =>
    fetchApi<PaginatedResponse<EventParticipation>>(`/event-participations${buildQueryString(params)}`, getFetchOptions(params)),

  getById: (id: number, includeRelations = false, options: FetchApiOptions = {}) =>
    fetchApi<EventParticipation>(`/event-participations/${id}?includeRelations=${includeRelations}`, options),

  create: (data: { eventId: number; participantId: number; dummyId?: string; teamId?: string }, options: FetchApiOptions = {}) =>
    fetchApi<EventParticipation>('/event-participations', {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    }),

  bulkCopy: (data: { fromEventId: number; toEventId: number; participantIds?: number[] }, options: FetchApiOptions = {}) =>
    fetchApi<{ copied: number }>('/event-participations/bulk-copy', {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    }),

  update: (id: number, data: Partial<EventParticipation>, options: FetchApiOptions = {}) =>
    fetchApi<EventParticipation>(`/event-participations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...options,
    }),

  delete: (id: number, options: FetchApiOptions = {}) =>
    fetchApi<{ success: boolean }>(`/event-participations/${id}`, {
      method: 'DELETE',
      ...options,
    }),
};

// Event Results
export const eventResultService = {
  getAll: (params: PaginationParams = {}) =>
    fetchApi<PaginatedResponse<EventResult>>(`/event-results${buildQueryString(params)}`, getFetchOptions(params)),

  getById: (id: number, includeRelations = false, options: FetchApiOptions = {}) =>
    fetchApi<EventResult>(`/event-results/${id}?includeRelations=${includeRelations}`, options),

  create: (data: { eventId: number; participantId: number; position: 'FIRST' | 'SECOND' | 'THIRD' }, options: FetchApiOptions = {}) =>
    fetchApi<EventResult>('/event-results', {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    }),

  update: (id: number, data: Partial<EventResult>, options: FetchApiOptions = {}) =>
    fetchApi<EventResult>(`/event-results/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...options,
    }),

  delete: (id: number, options: FetchApiOptions = {}) =>
    fetchApi<{ success: boolean }>(`/event-results/${id}`, {
      method: 'DELETE',
      ...options,
    }),
};

// Auth
export const authService = {
  login: async (credentials: LoginPayload): Promise<AuthResponse> => {
    return await fetchApi<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  logout: async (): Promise<void> => {
    await fetchApi<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
  },

  getCurrentUser: async (): Promise<AuthResponse> => {
    try {
      return await fetchApi<AuthResponse>('/auth/me');
    } catch (error: any) {
      if (error.message.includes('401') || error.message.toLowerCase().includes('unauthorized')) {
        throw new Error('Unauthorized');
      }
      throw error;
    }
  },
};

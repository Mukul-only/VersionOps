import { fetchApi } from './client';
import {
  College,
  FestEvent,
  Participant,
  EventParticipation,
  EventResult,
  LeaderboardEntry,
  PaginatedResponse,
  PaginationParams,
} from './types';

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

// Events
export const eventService = {
  getAll: (params: PaginationParams = {}) =>
    fetchApi<PaginatedResponse<FestEvent>>(`/events${buildQueryString(params)}`),

  getById: (id: number, includeRelations = false) =>
    fetchApi<FestEvent>(`/events/${id}?includeRelations=${includeRelations}`),

  getParticipants: (id: number, params: PaginationParams = {}) =>
    fetchApi<PaginatedResponse<Participant>>(`/events/${id}/participants${buildQueryString(params)}`),

  create: (data: Partial<FestEvent>) =>
    fetchApi<FestEvent>('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<FestEvent>) =>
    fetchApi<FestEvent>(`/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    fetchApi<{ success: boolean }>(`/events/${id}`, {
      method: 'DELETE',
    }),
};

// Colleges
export const collegeService = {
  getAll: (params: PaginationParams = {}) =>
    fetchApi<PaginatedResponse<College>>(`/colleges${buildQueryString(params)}`),

  getById: (id: number, includeRelations = false) =>
    fetchApi<College>(`/colleges/${id}?includeRelations=${includeRelations}`),

  create: (data: { code: string; name: string }) =>
    fetchApi<College>('/colleges', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: { name: string }) =>
    fetchApi<College>(`/colleges/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    fetchApi<{ success: boolean }>(`/colleges/${id}`, {
      method: 'DELETE',
    }),
};

// Participants
export const participantService = {
  getAll: (params: PaginationParams = {}) =>
    fetchApi<PaginatedResponse<Participant>>(`/participants${buildQueryString(params)}`),

  getById: (id: number, includeRelations = false) =>
    fetchApi<Participant>(`/participants/${id}?includeRelations=${includeRelations}`),

  create: (data: any) =>
    fetchApi<Participant>('/participants', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  bulkImport: (data: any[]) =>
    fetchApi<any>('/participants/bulk-import', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  checkIn: (id: number) =>
    fetchApi<Participant>(`/participants/${id}/check-in`, {
      method: 'POST',
    }),

  update: (id: number, data: any) =>
    fetchApi<Participant>(`/participants/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    fetchApi<{ success: boolean }>(`/participants/${id}`, {
      method: 'DELETE',
    }),
};

// Leaderboard
export const leaderboardService = {
  get: (params: PaginationParams = {}) =>
    fetchApi<PaginatedResponse<LeaderboardEntry>>(`/leaderboard${buildQueryString(params)}`),

  recalculate: () =>
    fetchApi<{ success: boolean }>('/leaderboard/recalculate', {
      method: 'POST',
    }),
};

// Event Participations
export const eventParticipationService = {
  getAll: (params: PaginationParams = {}) =>
    fetchApi<PaginatedResponse<EventParticipation>>(`/event-participations${buildQueryString(params)}`),

    //todo
  getById: (id: number, includeRelations = false) =>
    fetchApi<EventParticipation>(`/event-participations/${id}?includeRelations=${includeRelations}`),

  create: (data: { eventId: number; participantId: number; dummyId?: string; teamId?: string }) =>
    fetchApi<EventParticipation>('/event-participations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  bulkCopy: (data: { fromEventId: number; toEventId: number; participantIds?: number[] }) =>
    fetchApi<{ copied: number }>('/event-participations/bulk-copy', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<EventParticipation>) =>
    fetchApi<EventParticipation>(`/event-participations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    fetchApi<{ success: boolean }>(`/event-participations/${id}`, {
      method: 'DELETE',
    }),
};

// Event Results
export const eventResultService = {
  getAll: (params: PaginationParams = {}) =>
    fetchApi<PaginatedResponse<EventResult>>(`/event-results${buildQueryString(params)}`),

  getById: (id: number, includeRelations = false) =>
    fetchApi<EventResult>(`/event-results/${id}?includeRelations=${includeRelations}`),

  create: (data: { eventId: number; participantId: number; position: 'FIRST' | 'SECOND' | 'THIRD' }) =>
    fetchApi<EventResult>('/event-results', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<EventResult>) =>
    fetchApi<EventResult>(`/event-results/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    fetchApi<{ success: boolean }>(`/event-results/${id}`, {
      method: 'DELETE',
    }),
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api/v1';

// --- DUMMY DATA ---
const dummyColleges = [
  { id: 1, code: 'IITB', name: 'IIT Bombay', participantCount: 150, score: { totalPoints: 1250, firstPlaceCount: 5, secondPlaceCount: 3, thirdPlaceCount: 2 } },
  { id: 2, code: 'IITD', name: 'IIT Delhi', participantCount: 120, score: { totalPoints: 1100, firstPlaceCount: 3, secondPlaceCount: 4, thirdPlaceCount: 5 } },
  { id: 3, code: 'BITS', name: 'BITS Pilani', participantCount: 95, score: { totalPoints: 850, firstPlaceCount: 2, secondPlaceCount: 2, thirdPlaceCount: 3 } },
  { id: 4, code: 'NITK', name: 'NIT Surathkal', participantCount: 80, score: { totalPoints: 720, firstPlaceCount: 1, secondPlaceCount: 3, thirdPlaceCount: 1 } },
];

const dummyParticipants = [
  { id: 101, name: 'Alice Smith', email: 'alice@iitb.ac.in', participantId: 'IITB-1-001', festStatus: 'CHECKED_IN', college: { code: 'IITB' } },
  { id: 102, name: 'Bob Johnson', email: 'bob@iitd.ac.in', participantId: 'IITD-2-005', festStatus: 'REGISTERED', college: { code: 'IITD' } },
  { id: 103, name: 'Charlie Brown', email: 'charlie@bits.ac.in', participantId: 'BITS-1-012', festStatus: 'REGISTERED', college: { code: 'BITS' } },
  { id: 104, name: 'David Wilson', email: 'david@nitk.ac.in', participantId: 'NITK-2-003', festStatus: 'CHECKED_IN', college: { code: 'NITK' } },
];

const dummyEvents = [
  { id: 1, name: 'Coding Contest', participationPoints: 10, firstPlacePoints: 50, secondPlacePoints: 30, thirdPlacePoints: 20 },
  { id: 2, name: 'Hackathon', participationPoints: 20, firstPlacePoints: 100, secondPlacePoints: 60, thirdPlacePoints: 40 },
  { id: 3, name: 'RoboRace', participationPoints: 15, firstPlacePoints: 75, secondPlacePoints: 45, thirdPlacePoints: 30 },
];

const USE_DUMMY = false; // Toggle this to switch between real and dummy data

async function fetcher(url: string, options?: RequestInit) {
  if (USE_DUMMY) {
    console.log(`[DUMMY API] ${options?.method || 'GET'} ${url}`);
    
    // Simulate list endpoints
    if (url.startsWith('/colleges') && !url.includes('/', 10)) {
      return { items: dummyColleges, total: dummyColleges.length };
    }
    if (url.startsWith('/participants') && !url.includes('/', 14)) {
      return { items: dummyParticipants, total: dummyParticipants.length };
    }
    if (url.startsWith('/events') && !url.includes('/', 8)) {
      return { items: dummyEvents, total: dummyEvents.length };
    }
    
    // Simulate GET single resource
    if (url.startsWith('/colleges/')) {
      const id = parseInt(url.split('/')[2]);
      const college = dummyColleges.find(c => c.id === id);
      if (college) return college;
    }
    if (url.startsWith('/participants/')) {
      const id = parseInt(url.split('/')[2]);
      const participant = dummyParticipants.find(p => p.id === id);
      if (participant) return participant;
    }
    if (url.startsWith('/events/')) {
      const id = parseInt(url.split('/')[2]);
      const event = dummyEvents.find(e => e.id === id);
      if (event) return event;
    }

    // Default response for other dummy endpoints
    return { success: true, message: 'Dummy response' };
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export const api = {
  colleges: {
    list: (params?: string) => fetcher(`/colleges${params ? `?${params}` : ''}`),
    get: (id: string | number, includeRelations = false) => fetcher(`/colleges/${id}?includeRelations=${includeRelations}`),
    create: (data: { code: string; name: string }) => fetcher('/colleges', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string | number, data: { name: string }) => fetcher(`/colleges/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string | number) => fetcher(`/colleges/${id}`, { method: 'DELETE' }),
  },
  participants: {
    list: (params?: string) => fetcher(`/participants${params ? `?${params}` : ''}`),
    get: (id: string | number, includeRelations = false) => fetcher(`/participants/${id}?includeRelations=${includeRelations}`),
    create: (data: any) => fetcher('/participants', { method: 'POST', body: JSON.stringify(data) }),
    bulkImport: (data: any[]) => fetcher('/participants/bulk-import', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string | number, data: any) => fetcher(`/participants/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string | number) => fetcher(`/participants/${id}`, { method: 'DELETE' }),
    checkIn: (id: string | number) => fetcher(`/participants/${id}/check-in`, { method: 'POST' }),
  },
  events: {
    list: (params?: string) => fetcher(`/events${params ? `?${params}` : ''}`),
    get: (id: string | number) => fetcher(`/events/${id}`),
    create: (data: any) => fetcher('/events', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string | number, data: any) => fetcher(`/events/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string | number) => fetcher(`/events/${id}`, { method: 'DELETE' }),
    participations: {
      list: (eventId: string | number) => fetcher(`/event-participations?eventId=${eventId}`),
      register: (data: { eventId: number; participantId: number; teamId?: string; dummyId?: string }) => 
        fetcher('/event-participations', { method: 'POST', body: JSON.stringify(data) }),
      bulkCopy: (data: { fromEventId: number; toEventId: number; participantIds?: number[] }) =>
        fetcher('/event-participations/bulk-copy', { method: 'POST', body: JSON.stringify(data) }),
      delete: (id: string | number) => fetcher(`/event-participations/${id}`, { method: 'DELETE' }),
    },
    results: {
      list: (eventId: string | number) => fetcher(`/event-results?eventId=${eventId}`),
      add: (data: { eventId: number; participantId: number; position: 'FIRST' | 'SECOND' | 'THIRD' }) =>
        fetcher('/event-results', { method: 'POST', body: JSON.stringify(data) }),
      delete: (id: string | number) => fetcher(`/event-results/${id}`, { method: 'DELETE' }),
    }
  },
};

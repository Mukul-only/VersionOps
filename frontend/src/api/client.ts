  
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

async function handleApiResponse<T>(
    response: Response,
    options: { suppressRedirect?: boolean; suppressForbiddenRedirect?: boolean } = {}
): Promise<T> {

  if (response.status === 204) {
    return {} as T;
  }

  if (response.ok) {
    return response.json();
  }

  if (response.status === 401) {
    if (!options.suppressRedirect && window.location.pathname !== '/login') {
      window.location.href = '/login';
      throw new Error('Redirecting to login');
    }

    const error = new Error('Unauthorized');
    (error as any).response = response;
    throw error;
  }

  if (response.status === 403) {
    const error = new Error('Forbidden');
    (error as any).response = response;
    throw error;
  }

  const errorData = await response.json().catch(() => ({
    message: 'Unknown error'
  }));

  const message =
      (Array.isArray(errorData.message)
          ? errorData.message.join(', ')
          : errorData.message) ||
      errorData.detail ||
      `HTTP ${response.status}`;

  const error = new Error(message);
  (error as any).response = response;

  throw error;
}


export interface FetchApiOptions extends RequestInit {
  suppressRedirect?: boolean;
  suppressForbiddenRedirect?: boolean;
  suppressErrorToast?: boolean;
}

export async function fetchApi<T>(
    endpoint: string,
    options: FetchApiOptions = {}
): Promise<T> {

  const url = `${BASE_URL}${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
    cache: 'no-cache'
  });

  return handleApiResponse(response, {
    suppressRedirect: options.suppressRedirect,
    suppressForbiddenRedirect: options.suppressForbiddenRedirect
  });
}
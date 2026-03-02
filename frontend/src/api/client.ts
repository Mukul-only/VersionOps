import { apiInterceptor } from './interceptor';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

async function handleApiResponse<T>(
  response: Response,
  options: { suppressRedirect?: boolean; suppressForbiddenRedirect?: boolean }
): Promise<T> {
  if (response.status === 401) {
    if (!options.suppressRedirect) {
      apiInterceptor.handleUnauthorized();
    }
    const error = new Error('Unauthorized');
    (error as any).response = response;
    throw error;
  }

  if (response.status === 403) {
    if (!options.suppressForbiddenRedirect) {
      apiInterceptor.handleForbidden();
    }
    const error = new Error('Forbidden');
    (error as any).response = response;
    throw error;
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: 'An unknown error occurred',
    }));
    const errorMessage = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : (errorData.message || `HTTP error! status: ${response.status}`);
    const error = new Error(errorMessage);
    (error as any).response = response;
    throw error;
  }

  if (response.status === 204) {
    return {} as T;
  }

  return await response.json();
}

export interface FetchApiOptions extends RequestInit {
  suppressRedirect?: boolean;
  suppressForbiddenRedirect?: boolean;
}

export async function fetchApi<T>(
  endpoint: string,
  options: FetchApiOptions = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(url, { 
      ...options, 
      headers, 
      credentials: 'include',
      cache: 'no-cache' 
    });

    return await handleApiResponse(response, { 
      suppressRedirect: options.suppressRedirect,
      suppressForbiddenRedirect: options.suppressForbiddenRedirect 
    });
  } catch (error) {
    console.error(`API call failed: ${endpoint}`, error);
    throw error;
  }
}

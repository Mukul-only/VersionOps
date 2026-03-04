  
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

async function handleApiResponse<T>(
    response: Response,
    options: { suppressRedirect?: boolean; suppressForbiddenRedirect?: boolean; suppressErrorToast?: boolean } = {}
): Promise<T> {
  // Handle No Content explicitly
  if (response.status === 204) {
    return {} as T;
  }

  // Handle OK responses
  if (response.ok) {
    return response.json();
  }

  // Handle Unauthorized
  if (response.status === 401) {
    if (!options.suppressRedirect && window.location.pathname !== '/login') {
      window.location.href = '/login';
      return Promise.reject(new Error('Redirecting to login'));
    }
    const error = new Error('Unauthorized');
    (error as any).response = response;
    throw error;
  }

  // Handle Forbidden
  if (response.status === 403) {
    if (!options.suppressForbiddenRedirect && !options.suppressErrorToast) {
      console.error('You are not allowed to access this page');
    }
    const error = new Error('Forbidden');
    (error as any).response = response;
    throw error;
  }

  // Handle other errors
  const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
  const errorMessage =
      (Array.isArray(errorData.message) ? errorData.message.join(', ') :
          errorData.message) ||
      errorData.detail ||
      `HTTP error! status: ${response.status}`;

  if (!options.suppressErrorToast) {
    console.error(errorMessage);
  }

  const error = new Error(errorMessage);
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
      suppressForbiddenRedirect: options.suppressForbiddenRedirect,
      suppressErrorToast: options.suppressErrorToast
    });
  } catch (error) {
    if (!options.suppressErrorToast && !(error instanceof Error && error.message === 'Forbidden')) {
      console.error(error instanceof Error ? error.message : 'An unknown error occurred');
    }
    throw error;
  }
}

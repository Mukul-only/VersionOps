import { apiInterceptor } from './interceptor';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
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

    if (response.status === 401) {
      if (endpoint === '/auth/me') {
        // Prevent redirect loop
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      } else {
        apiInterceptor.handleUnauthorized();
      }
      throw new Error('Unauthorized');
    }

    if (response.status === 403) {
      apiInterceptor.handleForbidden();
      throw new Error('Forbidden');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: 'An unknown error occurred',
      }));
      const errorMessage = Array.isArray(errorData.message) 
        ? errorData.message.join(', ') 
        : (errorData.message || `HTTP error! status: ${response.status}`);
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (error) {
    console.error(`API call failed: ${endpoint}`, error);
    throw error;
  }
}

import { ApiError } from './types';

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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: 'An unknown error occurred',
      }));
      const errorMessage = Array.isArray(errorData.message) 
        ? errorData.message.join(', ') 
        : (errorData.message || `HTTP error! status: ${response.status}`);
      throw new Error(errorMessage);
    }

    // Handle 204 No Content or empty responses if necessary, though contract implies JSON responses
    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (error) {
    console.error(`API call failed: ${endpoint}`, error);
    throw error;
  }
}

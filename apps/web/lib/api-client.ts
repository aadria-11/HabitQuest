import { getSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

let sessionCache: { session: any; timestamp: number } | null = null;
const SESSION_CACHE_TTL = 5000;

function isTokenValid(session: any): boolean {
  if (!session?.apiToken) return false;

  try {
    const parts = session.apiToken.split('.');
    if (parts.length !== 3) return false;

    const decoded = JSON.parse(atob(parts[1]));
    const expiresAt = (decoded.exp || 0) * 1000;
    const buffer = 120 * 1000;

    return Date.now() + buffer < expiresAt;
  } catch {
    return false;
  }
}

async function getCachedSession() {
  const now = Date.now();
  if (sessionCache && now - sessionCache.timestamp < SESSION_CACHE_TTL) {
    if (isTokenValid(sessionCache.session)) {
      return sessionCache.session;
    }
    sessionCache = null;
  }

  const session = await getSession();
  if (session && isTokenValid(session)) {
    sessionCache = { session, timestamp: now };
  }
  return session;
}

export function invalidateSessionCache() {
  sessionCache = null;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { params, ...fetchOptions } = options;

  let url = `${API_URL}${endpoint}`;

  if (params) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      query.append(key, String(value));
    });
    url += `?${query.toString()}`;
  }

  const session = await getCachedSession();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(session?.apiToken && { 'Authorization': `Bearer ${session.apiToken}` }),
    ...fetchOptions.headers,
  };

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as any;
  }

  return response.json();
}

export const api = {
  get: <T,>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T,>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T,>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T,>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};

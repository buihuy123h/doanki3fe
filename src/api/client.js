// Nexus API Client - HTTP Client thuần JavaScript dùng Fetch API
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function request(endpoint, options = {}, params = null) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  let fullUrl = BASE_URL ? `${BASE_URL}${cleanEndpoint}` : cleanEndpoint;

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined && value !== '') {
        searchParams.append(key, String(value));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryString;
    }
  }

  const defaultHeaders = {
    'Accept': 'application/json',
  };

  if (options.body && !(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const mergedOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  };

  try {
    const response = await fetch(fullUrl, mergedOptions);

    if (!response.ok) {
      let errorData = null;
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      try {
        errorData = await response.json();
        if (errorData && typeof errorData === 'object') {
          errorMessage = errorData.message || errorData.title || errorData.error || JSON.stringify(errorData);
        }
      } catch {
        const text = await response.text().catch(() => '');
        if (text) errorMessage = text;
      }

      throw new ApiError(errorMessage, response.status, errorData);
    }

    if (response.status === 204) {
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await response.json();
    }

    return await response.text();
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(err?.message || 'Lỗi kết nối máy chủ', 0);
  }
}

export const apiClient = {
  get: (endpoint, params, options) =>
    request(endpoint, { method: 'GET', ...options }, params),

  post: (endpoint, body, options) =>
    request(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),

  put: (endpoint, body, options) =>
    request(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),

  patch: (endpoint, body, options) =>
    request(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),

  delete: (endpoint, options) =>
    request(endpoint, { method: 'DELETE', ...options }),
};

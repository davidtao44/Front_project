// Exportar URL base
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

// Helper function to build full URLs
export const buildUrl = (endpoint) => `${API_BASE_URL}${endpoint}`;

// Simple API client
export const api = {
  get: async (endpoint) => {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (e) {
        // If we can't parse the error response, use the default message
      }
      throw new Error(errorMessage);
    }

    return response;
  },

  post: async (endpoint, data, options = {}) => {
    const token = localStorage.getItem('access_token');
    const headers = {
      'Authorization': token ? `Bearer ${token}` : '',
      ...options.headers,
    };

    // Don't set Content-Type for FormData, let the browser set it
    if (!(data instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: data instanceof FormData ? data : JSON.stringify(data),
    });

    if (response.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (e) {
        // If we can't parse the error response, use the default message
      }
      throw new Error(errorMessage);
    }

    return response;
  },
};

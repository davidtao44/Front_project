// Exportar URL base
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Helper function to build full URLs
export const buildUrl = (endpoint) => `${API_BASE_URL}${endpoint}`;

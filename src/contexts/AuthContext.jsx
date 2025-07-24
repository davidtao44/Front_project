import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// URL base del backend - usando tu URL de Cloudflare Tunnel
const API_BASE_URL = 'https://marijuana-sq-zambia-sites.trycloudflare.com';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar si hay un token guardado en localStorage al cargar la app
  useEffect(() => {
    const savedToken = localStorage.getItem('access_token');
    if (savedToken) {
      verifyToken(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  // Función para verificar si el token es válido
  const verifyToken = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser({
          ...data.user,
          token: token
        });
      } else {
        // Token inválido, limpiar localStorage
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.error('Error verificando token:', error);
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    } finally {
      setIsLoading(false);
    }
  };

  // Función de login que se conecta al backend
  const login = async (username, password) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: password
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error en el login');
      }

      const data = await response.json();
      
      // Guardar token y datos del usuario
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setUser({
        ...data.user,
        token: data.access_token
      });

      return data;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Función de registro
  const register = async (username, email, password) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          email: email,
          password: password
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error en el registro');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en registro:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  };

  const isAuthenticated = () => {
    return user !== null && user.token;
  };

  const isTokenValid = () => {
    return user !== null && user.token;
  };

  // Función helper para hacer requests autenticados
  const authenticatedFetch = async (url, options = {}) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Token expirado o inválido
      logout();
      throw new Error('Sesión expirada');
    }

    return response;
  };

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated,
    isTokenValid,
    authenticatedFetch, // Nueva función para requests autenticados
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
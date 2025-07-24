import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

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

  // Verificar si hay un usuario guardado en localStorage al cargar la app
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        console.error('Error al parsear usuario guardado:', error);
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (userData) => {
    try {
      // Aquí se haría la llamada al backend
      // Por ahora solo guardamos los datos simulados
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    // Aquí se podría hacer una llamada al backend para invalidar el token
  };

  const isAuthenticated = () => {
    return user !== null;
  };

  // Función para verificar si el token es válido (simulada por ahora)
  const isTokenValid = () => {
    if (!user || !user.token) return false;
    
    // Por ahora siempre retorna true
    // Cuando se conecte al backend, aquí se verificaría la validez del token
    return true;
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated,
    isTokenValid
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
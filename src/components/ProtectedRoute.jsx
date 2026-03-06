import { useAuth } from '../contexts/AuthContext';
import Login from './auth/Login';

const ProtectedRoute = ({ children }) => {
  const { user, isLoading, login } = useAuth();

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: 'var(--color-bg-body)'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid var(--color-border)',
            borderTop: '4px solid var(--color-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{
            color: 'var(--color-text-main)',
            fontSize: '16px',
            margin: 0
          }}>
            Cargando...
          </p>
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      </div>
    );
  }

  // Si no hay usuario autenticado, mostrar login
  if (!user) {
    return <Login onLogin={login} />;
  }

  // Si hay usuario autenticado, mostrar el contenido protegido
  return children;
};

export default ProtectedRoute;

import { useState } from 'react';
import styles from './Login.module.css';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error cuando el usuario empiece a escribir
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Por ahora usamos credenciales quemadas
      // Cuando se conecte al backend, reemplazar esta lógica
      if (formData.username === 'admin' && formData.password === 'admin123') {
        // Simular delay de red
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const userData = {
          id: 1,
          username: 'admin',
          email: 'admin@uptc.edu.co',
          role: 'administrator',
          token: 'fake-jwt-token-12345' // Token simulado
        };
        
        onLogin(userData);
      } else {
        throw new Error('Credenciales incorrectas');
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.logoSection}>
          <img 
            src="/Logo_de_la_UPTC.svg.png" 
            alt="Logo UPTC" 
            className={styles.logo}
          />
          <h1 className={styles.title}>CNN-VHDL Studio: Implementación y Validación de Tolerancia a Fallos</h1>
          <p className={styles.subtitle}>Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.errorMessage}>
              <span className={styles.errorIcon}>⚠️</span>
              {error}
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="username" className={styles.label}>
              Usuario
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={styles.input}
              placeholder="Ingresa tu usuario"
              required
              disabled={isLoading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={styles.input}
              placeholder="Ingresa tu contraseña"
              required
              disabled={isLoading}
            />
          </div>

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className={styles.spinner}></span>
                Iniciando sesión...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        <div className={styles.demoCredentials}>
          <h4>Credenciales de prueba:</h4>
          <p><strong>Usuario:</strong> admin</p>
          <p><strong>Contraseña:</strong> admin123</p>
        </div>

        <div className={styles.footer}>
          <img 
            src="/logo_gira.png" 
            alt="Logo GIRA" 
            className={styles.footerLogo}
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
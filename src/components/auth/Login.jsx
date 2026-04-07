import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import GoogleLoginButton from './GoogleLoginButton';
import styles from './Login.module.css';

const Login = () => {
  const { login } = useAuth();
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
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Call the login function from the context with username and password
      await login(formData.username, formData.password);
      // Successful login will be handled automatically by the AuthContext
    } catch (error) {
      setError(error.message || 'Error logging in');
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
          <h1 className={styles.title}>GIRA crosslayer-FI</h1>
          <p className={styles.subtitle}>Sign in to continue</p>
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
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={styles.input}
              placeholder="Enter your username"
              required
              disabled={isLoading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={styles.input}
              placeholder="Enter your password"
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
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className={styles.divider}>
          <span>o</span>
        </div>

        <GoogleLoginButton 
          onSuccess={() => {
            // Success will be handled automatically by the AuthContext
          }}
          onError={(error) => {
            setError(error.message || 'Error logging in with Google');
          }}
        />

        {/* <div className={styles.demoCredentials}>
          <h4>🔗 Conectado al Backend</h4>
          <p>Usa las credenciales proporcionadas por el administrador del sistema.</p>
        </div> */}

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
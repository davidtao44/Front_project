import { useAuth } from '../contexts/AuthContext';
import styles from './Header.module.css';

const Header = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      logout();
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.logoSection}>
        <img 
          src="/Logo_de_la_UPTC.svg.png" 
          alt="Logo UPTC" 
          className={styles.logo}
        />
        <h1 className={styles.title}>Generador de CNN</h1>
        <img 
          src="/logo_gira.png" 
          alt="Logo GIRA" 
          className={styles.logo}
        />
      </div>
      
      <div className={styles.userSection}>
        <div className={styles.userInfo}>
          <div className={styles.userAvatar}>
            {user?.picture ? (
              <img 
                src={user.picture} 
                alt="Foto de perfil" 
                className={styles.userAvatarImage}
              />
            ) : (
              (user?.name || user?.username || 'Usuario').charAt(0).toUpperCase()
            )}
          </div>
          <div className={styles.userDetails}>
            <span className={styles.username}>{user?.name || user?.username || 'Usuario'}</span>
            <span className={styles.userRole}>{user?.role || 'user'}</span>
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className={styles.logoutButton}
          title="Cerrar sesión"
        >
          <span className={styles.logoutIcon}>🚪</span>
          Salir
        </button>
      </div>
    </header>
  );
};

export default Header;
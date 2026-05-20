import { useAuth } from '../contexts/AuthContext';
import styles from './Header.module.css';
import { LogOut } from 'lucide-react';

const Header = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
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
        <h1 className={styles.title}>GIRA - HURA</h1>
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
                alt="Profile picture" 
                className={styles.userAvatarImage}
              />
            ) : (
              (user?.name || user?.username || 'User').charAt(0).toUpperCase()
            )}
          </div>
          <div className={styles.userDetails}>
            <span className={styles.username}>{user?.name || user?.username || 'User'}</span>
            <span className={styles.userRole}>{user?.role || 'user'}</span>
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className={styles.logoutButton}
          title="Log out"
        >
          <LogOut size={18} className={styles.logoutIcon} />
          Log out
        </button>
      </div>
    </header>
  );
};

export default Header;
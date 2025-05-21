import { Link, Outlet, useNavigate } from "react-router-dom";
import styles from './styles.module.css';
import { useAuth } from "../../../hooks";
import { Sun, Moon, Shield, LogOutIcon } from "lucide-react";
import { useTheme } from "../../../contexts/ThemeContext";

export function AppLayout() {
  const navigate = useNavigate();
  const isLoggedIn = useAuth();
  const { isDark, setColorScheme } = useTheme();

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/");
  }

  function toggleTheme() {
    setColorScheme(isDark ? 'light' : 'dark');
  }

  function isAdmin() {
    const token = localStorage.getItem("token");
    if (!token) return false;

    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));

      // Admin tem ID 2
      return payload.role === 'admin' || payload.role === 2;
    } catch (e) {
      return false;
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.headerContainer}>
        <div className={styles.headerContent}>
          <Link to="/reports" className={styles.naming}>
            <h1>Reporta</h1>
          </Link>
          <nav>
            <div className={styles.iconButton} onClick={toggleTheme}>
              {isDark ? <Sun size={22} /> : <Moon size={22} />}
            </div>

            {isLoggedIn && isAdmin() && (
              <Link to="/admin/users" className={styles.iconButton} title="Administração">
                <p>Admin</p>
                <Shield size={22} />
              </Link>
            )}
            {isLoggedIn && (
              <button className={styles.logoutButton} onClick={handleLogout}>
                <p>Sair</p>
                <LogOutIcon size={22} />
              </button>

            )}
          </nav>
        </div>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} Reporta - Todos os direitos reservados</p>
      </footer>
    </div>
  );
}

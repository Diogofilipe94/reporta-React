import { Link, Outlet, useNavigate } from "react-router-dom";
import styles from './styles.module.css';
import { useAuth } from "../../../hooks";
import { LogOutIcon, Sun, Moon, BarChart3 } from "lucide-react";
import { useTheme } from "../../../contexts/ThemeContext";
import { RiAdminLine } from "react-icons/ri";
// Importe o componente Switch
import Switch from "react-switch";

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
      return payload.role === 'admin' || payload.role === 2;
    } catch (e) {
      return false;
    }
  }

  function isAdminOrCurator() {
    const token = localStorage.getItem("token");
    if (!token) return false;

    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      return payload.role === 'admin' || payload.role === 'curator' || payload.role === 2 || payload.role === 3;
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
            {/* Switch do tema */}
            <label className={styles.switchLabel}>
              <Switch
                onChange={toggleTheme}
                checked={isDark}
                offColor="#fff"
                onColor="#2c2c2c"
                offHandleColor="#878672"
                onHandleColor="#d9d7b6"
                height={24}
                width={48}
                uncheckedIcon={
                  <Sun
                    size={16}
                    color="#545333"
                    style={{
                      position: 'absolute',
                      top: '4px',
                      left: '4px'
                    }}
                  />
                }
                checkedIcon={
                  <Moon
                    size={16}
                    color="#fdfbd4"
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px'
                    }}
                  />
                }
                className={styles.themeSwitch}
              />
            </label>

            {/* Dashboard - para admins e curadores */}
            {isLoggedIn && isAdminOrCurator() && (
              <Link to="/admin/dashboard" className={styles.iconButton} title="Dashboard">
                <p>Dashboard</p>
                <BarChart3 size={22} />
              </Link>
            )}

            {/* Admin Users - apenas para admins */}
            {isLoggedIn && isAdmin() && (
              <Link to="/admin/users" className={styles.iconButton} title="Administração">
                <p>Admin</p>
                <RiAdminLine size={22} />
              </Link>
            )}

            {/* Logout */}
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

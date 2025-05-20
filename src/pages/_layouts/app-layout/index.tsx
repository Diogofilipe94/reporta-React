import { Link, Outlet, useNavigate } from "react-router-dom";
import styles from './styles.module.css';
import { useAuth } from "../../../hooks";
import { CircleUser, Sun, Moon } from "lucide-react";
import { useTheme } from "../../../contexts/ThemeContext";

export function AppLayout() {
  const navigate = useNavigate();
  const isLoggedIn = useAuth();
  const { isDark, setColorScheme } = useTheme();

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/");
  }

  function handleUserClick() {
    if (!isLoggedIn) {
      navigate("/");
    } else {
      navigate("/user");
    }
  }

  function toggleTheme() {
    setColorScheme(isDark ? 'light' : 'dark');
  }

  return (
    <div className={styles.container}>
      <header className={styles.headerContainer}>
        <div className={styles.headerContent}>
          <Link to="/" className={styles.naming}>
            <h1>Reporta</h1>
          </Link>
          <nav>
            <div className={styles.iconButton} onClick={toggleTheme}>
              {isDark ? <Sun size={22} /> : <Moon size={22} />}
            </div>
            <div className={styles.iconButton} onClick={handleUserClick}>
              <CircleUser size={24} />
            </div>
            {isLoggedIn && (
              <button className={styles.logoutButton} onClick={handleLogout}>
                Sair
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

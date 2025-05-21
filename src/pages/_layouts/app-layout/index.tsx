import { Link, Outlet, useNavigate } from "react-router-dom";
import styles from './styles.module.css';
import { useAuth } from "../../../hooks";
import { CircleUser, Sun, Moon, Shield } from "lucide-react";
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

  // Função para verificar se o utilizador tem o papel de admin
  function isAdmin() {
    const token = localStorage.getItem("token");
    if (!token) return false;

    try {
      // Decode JWT sem validação (apenas para verificar payload)
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));

      return payload.role === 'admin';
    } catch (e) {
      return false;
    }
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

            {isLoggedIn && isAdmin() && (
              <Link to="/admin/users" className={styles.iconButton} title="Administração">
                <Shield size={22} />
              </Link>
            )}
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

import { Link, Outlet, useNavigate } from "react-router-dom";
import styles from './styles.module.css';
import { useAuth } from "../../../hooks";
import { CircleUser } from "lucide-react";

export function AppLayout() {
  const navigate = useNavigate();
  const isLoggedIn = useAuth();

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

  return (
    <div className={styles.container}>
      <header className={styles.headerContainer}>
        <div className={styles.headerContent}>
          <Link to="/" className={styles.naming}>
            <h1>Reporta</h1>
          </Link>
          <nav>
            <div onClick={handleUserClick}>
              <CircleUser size={24} />
            </div>
            {isLoggedIn && (
              <button onClick={handleLogout}>
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

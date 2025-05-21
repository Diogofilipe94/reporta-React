// src/pages/home/index.tsx
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./styles.module.css";
import { useTheme } from "../../contexts/ThemeContext";

export function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { isDark } = useTheme();

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!email.includes('@')) {
      setError("Email inválido");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password deve ter pelo menos 6 caracteres");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("https://reporta.up.railway.app/api/login", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Verificar a role do utilizador antes de permitir o login
        const token = data.token;
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));

        const userRole = payload.role;

        // Apenas permitir login se for admin (2) ou curator (3)
        if (userRole === 'admin' || userRole === 'curator' || userRole === 2 || userRole === 3) {
          localStorage.setItem("token", token);
          navigate("/reports");
        } else {
          // Utilizador sem permissão - limpa qualquer token existente
          localStorage.removeItem("token");
          setError("Esta aplicação é exclusiva para administradores e curadores. Utilizadores normais devem utilizar a aplicação móvel.");
        }
      } else {
        setError(data.error || "Credenciais inválidas");
      }
    } catch (error) {
      setError("Erro de autenticação, tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.pageContainer}>
      <div className={`${styles.signInHeader} ${isDark ? styles.darkMode : ''}`}>
        <h2>Entrar</h2>
        <p className={styles.platformInfo}>
          Plataforma de administração exclusiva para administradores e curadores.
        </p>

        <form onSubmit={handleSignIn}>
          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={isLoading ? styles.loadingButton : ''}
          >
            {isLoading ? 'A processar...' : 'Entrar'}
          </button>
        </form>

        <div className={styles.mobileInfo}>
          <p>
            Utilizadores comuns devem usar a aplicação móvel <strong>Reporta</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}

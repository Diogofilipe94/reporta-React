import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./styles.module.css";
import { useAuth } from "../../hooks";

export function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const isLoggedIn = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) {
      navigate("/reports");
    }
  }, [isLoggedIn, navigate]);

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!email.includes('@')) {
      setError("Email inválido");
      return;
    }

    if (password.length < 6) {
      setError("Password deve ter pelo menos 6 caracteres");
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
        localStorage.setItem("token", data.token);
        navigate("/reports");
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError("Erro de autenticação, tente novamente.");
    }
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.signInHeader}>
        <h2>Entrar</h2>
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
            />
          </div>

          <button type="submit">Entrar</button>
        </form>
      </div>
    </div>
  );
}

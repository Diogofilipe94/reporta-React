// src/pages/admin/users/index.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './styles.module.css';

type Role = {
  id: number;
  role: string;
};

type User = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  telephone: string;
  role: Role;
  created_at: string;
  updated_at: string;
};

const BACKEND_BASE_URL = 'https://reporta.up.railway.app';

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roles, setRoles] = useState<Record<number, number>>({});
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Use a rota com o prefixo 'admin'
      const response = await fetch(`${BACKEND_BASE_URL}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          setError("Não tem permissões de administrador");
          return;
        }
        throw new Error("Erro ao buscar utilizadores");
      }

      const data = await response.json();
      setUsers(data.users);

      const initialRoles: Record<number, number> = {};
      data.users.forEach((user: User) => {
        initialRoles[user.id] = user.role.id;
      });
      setRoles(initialRoles);

    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId: number, roleId: number) {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${BACKEND_BASE_URL}/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role_id: roleId })
      });

      if (!response.ok) {
        throw new Error("Erro ao atualizar o role do utlizador");
      }

      fetchUsers();

    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro desconhecido");
    }
  }

  async function handleDeleteUser(userId: number) {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${BACKEND_BASE_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Erro ao eliminar o utilizador");
      }

      setUsers(users.filter(user => user.id !== userId));
      setConfirmDelete(null);

    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro desconhecido");
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('pt-PT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  if (loading) {
    return <div className={styles.loadingContainer}>A carregar...</div>;
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorText}>{error}</p>
        <button
          className={styles.goBackButton}
          onClick={() => navigate('/')}
        >
          Voltar ao Início
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Gestão de Utilizadores</h1>
        <span className={styles.label}>Total: {users.length}</span>
      </div>

      <div className={styles.content}>
        {users.map((user) => (
          <div key={user.id} className={styles.userCard}>
            <div className={styles.userHeader}>
              <div className={styles.userInfo}>
                <div className={styles.userAvatar}>
                  {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                </div>
                <div>
                  <h2 className={styles.userName}>{user.first_name} {user.last_name}</h2>
                  <p className={styles.userEmail}>{user.email}</p>
                </div>
              </div>
              <div className={styles.userActions}>
                <select
                  value={roles[user.id]}
                  onChange={(e) => handleRoleChange(user.id, Number(e.target.value))}
                  className={styles.roleSelect}
                >
                  <option value="1">Utilizador</option>
                  <option value="2">Curador</option>
                  <option value="3">Admin</option>
                </select>
                <button
                  className={styles.deleteButton}
                  onClick={() => setConfirmDelete(user.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>

            <div className={styles.userDetails}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Telefone:</span>
                <span className={styles.detailValue}>{user.telephone}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Papel:</span>
                <span className={`${styles.roleBadge} ${styles[`role-${user.role.id}`]}`}>
                  {user.role.role}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Criado em:</span>
                <span className={styles.detailValue}>{formatDate(user.created_at)}</span>
              </div>
            </div>

            {confirmDelete === user.id && (
              <div className={styles.confirmDeleteContainer}>
                <p className={styles.confirmText}>Tem certeza que deseja eliminar este utilizador?</p>
                <div className={styles.confirmButtons}>
                  <button
                    className={styles.cancelButton}
                    onClick={() => setConfirmDelete(null)}
                  >
                    Cancelar
                  </button>
                  <button
                    className={styles.confirmButton}
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

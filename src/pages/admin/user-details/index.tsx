// src/pages/admin/user-details/index.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './styles.module.css';

type User = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  telephone: string;
  address: {
    street: string;
    number: string;
    cp: string;
    city: string;
  } | null;
  role: {
    id: number;
    role: string;
  };
  created_at: string;
  updated_at: string;
};

type ConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
};

const BACKEND_BASE_URL = 'https://reporta.up.railway.app';

function ConfirmModal({ isOpen, onClose, onConfirm, title, message }: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h3 className={styles.modalTitle}>{title}</h3>
        <p className={styles.modalText}>{message}</p>
        <div className={styles.modalActions}>
          <button onClick={onClose} className={styles.cancelButton}>
            Cancelar
          </button>
          <button onClick={onConfirm} className={styles.confirmButton}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminUserDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<number>(0);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchUserDetails();
  }, [id]);

  async function fetchUserDetails() {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch(`${BACKEND_BASE_URL}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao buscar detalhes do utilizador");
      }

      const data = await response.json();
      const foundUser = data.users.find((u: User) => u.id === Number(id));

      if (!foundUser) {
        throw new Error("Utilizador não encontrado");
      }

      setUser(foundUser);
      setSelectedRole(foundUser.role.id);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleUpdate() {
    if (!user || selectedRole === user.role.id) {
      setShowRoleModal(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${BACKEND_BASE_URL}/api/admin/users/${id}/role`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role_id: selectedRole })
      });

      if (!response.ok) {
        throw new Error("Erro ao atualizar papel do utilizador");
      }

      const updatedUser = await response.json();
      setUser(updatedUser.user);
      setShowRoleModal(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro desconhecido");
    }
  }

  async function handleDeleteUser() {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${BACKEND_BASE_URL}/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Erro ao excluir usuário");
      }

      navigate('/admin/users');
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro desconhecido");
    }
  }

  if (loading) {
    return <div className={styles.loadingContainer}>A carregar...</div>;
  }

  if (error || !user) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorText}>Erro: {error}</p>
        <button
          className={styles.goBackButton}
          onClick={() => navigate('/admin/users')}
        >
          Voltar à Lista de Utilizadores
        </button>
      </div>
    );
  }

  // Formatação de data
  const formattedCreatedDate = new Date(user.created_at).toLocaleDateString('pt-PT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className={styles.minimalContainer}>
      <div className={styles.minimalHeader}>
        <div className={styles.headerLeft}>
          <button
            onClick={() => navigate('/admin/users')}
            className={styles.minimalBackButton}
          >
            ←
          </button>
          <h1 className={styles.minimalTitle}>Utilizador</h1>
        </div>

        <div className={styles.actionButtons}>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(Number(e.target.value))}
            className={styles.roleSelect}
          >
            <option value="1">Utilizador</option>
            <option value="2">Curador</option>
            <option value="3">Admin</option>
          </select>
          <button
            className={styles.updateRoleButton}
            onClick={() => setShowRoleModal(true)}
            disabled={selectedRole === user.role.id}
          >
            Atualizar Papel
          </button>
          <button
            className={styles.deleteUserButton}
            onClick={() => setShowDeleteModal(true)}
          >
            Eliminar Conta
          </button>
        </div>
      </div>

      <div className={styles.minimalContent}>
        <div className={styles.userProfileCard}>
          <div className={styles.userHeader}>
            <div className={styles.largeAvatar}>
              {user.first_name.charAt(0)}{user.last_name.charAt(0)}
            </div>
            <div className={styles.userMainInfo}>
              <h2 className={styles.userName}>{user.first_name} {user.last_name}</h2>
              <p className={styles.userEmail}>{user.email}</p>
              <div className={styles.roleBadgeContainer}>
                <span className={`${styles.roleBadge} ${styles[`role-${user.role.id}`]}`}>
                  {user.role.role}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.infoSection}>
            <h3 className={styles.sectionTitle}>Informações de Contato</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <h4>Email</h4>
                <p>{user.email}</p>
              </div>
              <div className={styles.infoItem}>
                <h4>Telefone</h4>
                <p>{user.telephone}</p>
              </div>
            </div>
          </div>

          {user.address && (
            <div className={styles.infoSection}>
              <h3 className={styles.sectionTitle}>Morada</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <h4>Rua</h4>
                  <p>{user.address.street}</p>
                </div>
                <div className={styles.infoItem}>
                  <h4>Número</h4>
                  <p>{user.address.number}</p>
                </div>
                <div className={styles.infoItem}>
                  <h4>Código Postal</h4>
                  <p>{user.address.cp}</p>
                </div>
                <div className={styles.infoItem}>
                  <h4>Cidade</h4>
                  <p>{user.address.city}</p>
                </div>
              </div>
            </div>
          )}

          <div className={styles.infoSection}>
            <h3 className={styles.sectionTitle}>Informações da Conta</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <h4>ID</h4>
                <p>{user.id}</p>
              </div>
              <div className={styles.infoItem}>
                <h4>Data de Registo</h4>
                <p>{formattedCreatedDate}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        onConfirm={handleRoleUpdate}
        title="Atualizar Papel do Utilizador"
        message={`Tem certeza que deseja alterar o papel do utilizador de "${user.role.role}" para "${selectedRole === 1 ? 'Utilizador' : selectedRole === 2 ? 'Curador' : 'Admin'}"?`}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteUser}
        title="Eliminar Conta de Utilizador"
        message={`Tem certeza que deseja eliminar permanentemente a conta do utilizador ${user.first_name} ${user.last_name}? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
}

// src/pages/admin/users/index.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './styles.module.css';
import { Search, X } from 'lucide-react';

type Role = {
  id: number;
  role: string;
};

type Address = {
  street: string;
  number: string;
  cp: string;
  city: string;
} | null;

type User = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  telephone: string;
  role: Role;
  address: Address;
  created_at: string;
  updated_at: string;
};

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

type ConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
};

const BACKEND_BASE_URL = 'https://reporta.up.railway.app';

function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{title}</h3>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={18} />
          </button>
        </div>
        <div className={styles.modalBody}>
          {children}
        </div>
      </div>
    </div>
  );
}

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

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roles, setRoles] = useState<Record<number, number>>({});
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [pendingRoleChange, setPendingRoleChange] = useState<{userId: number, roleId: number} | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, roleFilter, users]);

  async function fetchUsers() {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

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
        throw new Error("Erro ao buscar utilizadors");
      }

      const data = await response.json();
      setUsers(data.users);

      // Inicializa o estado dos roles com os valores atuais
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

  function applyFilters() {
    let result = [...users];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(user =>
        user.first_name.toLowerCase().includes(term) ||
        user.last_name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
      );
    }

    // Filtro por role
    if (roleFilter !== null) {
      result = result.filter(user => user.role.id === roleFilter);
    }

    setFilteredUsers(result);
  }

  function handleOpenUserModal(user: User) {
    setSelectedUser(user);
    setShowUserModal(true);
  }

  function handleRoleChangeRequest(userId: number, roleId: number) {
    setPendingRoleChange({ userId, roleId });
    setShowRoleModal(true);
  }

  async function confirmRoleChange() {
    if (!pendingRoleChange) return;

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${BACKEND_BASE_URL}/api/admin/users/${pendingRoleChange.userId}/role`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role_id: pendingRoleChange.roleId })
      });

      if (!response.ok) {
        throw new Error("Erro ao atualizar as permissões do utilizador");
      }

      // Atualiza o utilizador na lista
      await fetchUsers();

      // Atualiza o utilizador selecionado
      if (selectedUser && selectedUser.id === pendingRoleChange.userId) {
        const updatedUser = users.find(u => u.id === pendingRoleChange.userId);
        if (updatedUser) {
          setSelectedUser(updatedUser);
        }
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro desconhecido");
    } finally {
      setShowRoleModal(false);
      setPendingRoleChange(null);
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
        throw new Error("Erro ao excluir utilizador");
      }

      // Remove o utilizador da lista
      setUsers(users.filter(user => user.id !== userId));
      setConfirmDelete(null);

      // Fecha o modal se o utilizador excluído estiver a ser visualizado
      if (selectedUser && selectedUser.id === userId) {
        setShowUserModal(false);
      }

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

  function clearFilters() {
    setSearchTerm('');
    setRoleFilter(null);
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
        <span className={styles.label}>Total: {filteredUsers.length} de {users.length}</span>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchContainer}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome ou email..."
            className={styles.searchInput}
          />
          {searchTerm && (
            <button
              className={styles.clearButton}
              onClick={() => setSearchTerm('')}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className={styles.roleFilterContainer}>
          <select
            value={roleFilter === null ? '' : roleFilter}
            onChange={(e) => setRoleFilter(e.target.value ? Number(e.target.value) : null)}
            className={styles.roleFilterSelect}
          >
            <option value="">Todos os papéis</option>
            <option value="1">Utilizador</option>
            <option value="3">Curador</option>
            <option value="2">Admin</option>
          </select>

          {roleFilter !== null && (
            <button
              className={styles.clearFiltersButton}
              onClick={clearFilters}
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      <div className={styles.content}>
        {filteredUsers.length === 0 ? (
          <div className={styles.noResults}>
            <p>Nenhum utilizador encontrado com os filtros atuais.</p>
            <button
              className={styles.clearFiltersButton}
              onClick={clearFilters}
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          filteredUsers.map((user) => (
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
                    onChange={(e) => handleRoleChangeRequest(user.id, Number(e.target.value))}
                    className={styles.roleSelect}
                  >
                    <option value="1">Utilizador</option>
                    <option value="3">Curador</option>
                    <option value="2">Admin</option>
                  </select>
                  <button
                    className={styles.viewButton}
                    onClick={() => handleOpenUserModal(user)}
                  >
                    Ver Detalhes
                  </button>
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
                  <span className={styles.detailLabel}>Permissões:</span>
                  <span className={`${styles.roleBadge} ${styles[`role-${user.role.id}`]}`}>
                    {user.role.role.charAt(0).toUpperCase() + user.role.role.slice(1)}
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
          ))
        )}
      </div>

      {/* Modal para visualizar detalhes do utilizador */}
      <Modal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title="Detalhes do Utilizador"
      >
        {selectedUser && (
          <div className={styles.userDetailContainer}>
            <div className={styles.userProfileHeader}>
              <div className={styles.largeAvatar}>
                {selectedUser.first_name.charAt(0)}{selectedUser.last_name.charAt(0)}
              </div>
              <div className={styles.userMainInfo}>
                <h2 className={styles.userFullName}>
                  {selectedUser.first_name} {selectedUser.last_name}
                </h2>
                <p className={styles.userEmail}>{selectedUser.email}</p>
                <div className={styles.roleBadgeContainer}>
                  <span className={`${styles.roleBadge} ${styles[`role-${selectedUser.role.id}`]}`}>
                    {selectedUser.role.role.charAt(0).toUpperCase() + selectedUser.role.role.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.userDetailDivider}></div>

            <div className={styles.userDetailSection}>
              <h3 className={styles.sectionTitle}>Informações de Contato</h3>
              <div className={styles.userDetailGrid}>
                <div className={styles.detailGridItem}>
                  <span className={styles.detailGridLabel}>Email</span>
                  <span className={styles.detailGridValue}>{selectedUser.email}</span>
                </div>
                <div className={styles.detailGridItem}>
                  <span className={styles.detailGridLabel}>Telefone</span>
                  <span className={styles.detailGridValue}>{selectedUser.telephone}</span>
                </div>
              </div>
            </div>

            {selectedUser.address && (
              <div className={styles.userDetailSection}>
                <h3 className={styles.sectionTitle}>Morada</h3>
                <div className={styles.userDetailGrid}>
                  <div className={styles.detailGridItem}>
                    <span className={styles.detailGridLabel}>Rua</span>
                    <span className={styles.detailGridValue}>{selectedUser.address.street}</span>
                  </div>
                  <div className={styles.detailGridItem}>
                    <span className={styles.detailGridLabel}>Número</span>
                    <span className={styles.detailGridValue}>{selectedUser.address.number}</span>
                  </div>
                  <div className={styles.detailGridItem}>
                    <span className={styles.detailGridLabel}>Código Postal</span>
                    <span className={styles.detailGridValue}>{selectedUser.address.cp}</span>
                  </div>
                  <div className={styles.detailGridItem}>
                    <span className={styles.detailGridLabel}>Cidade</span>
                    <span className={styles.detailGridValue}>{selectedUser.address.city}</span>
                  </div>
                </div>
              </div>
            )}

            <div className={styles.userDetailSection}>
              <h3 className={styles.sectionTitle}>Informações da Conta</h3>
              <div className={styles.userDetailGrid}>
                <div className={styles.detailGridItem}>
                  <span className={styles.detailGridLabel}>ID</span>
                  <span className={styles.detailGridValue}>{selectedUser.id}</span>
                </div>
                <div className={styles.detailGridItem}>
                  <span className={styles.detailGridLabel}>Data de Registo</span>
                  <span className={styles.detailGridValue}>{formatDate(selectedUser.created_at)}</span>
                </div>
                <div className={styles.detailGridItem}>
                  <span className={styles.detailGridLabel}>Última Atualização</span>
                  <span className={styles.detailGridValue}>{formatDate(selectedUser.updated_at)}</span>
                </div>
              </div>
            </div>

            <div className={styles.userDetailActions}>
              <div className={styles.actionGroup}>
                <select
                  value={roles[selectedUser.id]}
                  onChange={(e) => handleRoleChangeRequest(selectedUser.id, Number(e.target.value))}
                  className={styles.roleSelect}
                >
                  <option value="1">Utilizador</option>
                  <option value="3">Curador</option>
                  <option value="2">Admin</option>
                </select>
                <button
                  className={styles.updateRoleButton}
                  onClick={() => handleRoleChangeRequest(selectedUser.id, roles[selectedUser.id])}
                  disabled={roles[selectedUser.id] === selectedUser.role.id}
                >
                  Atualizar permissões
                </button>
              </div>

              <button
                className={styles.deleteUserButton}
                onClick={() => {
                  setShowUserModal(false);
                  setConfirmDelete(selectedUser.id);
                }}
              >
                Eliminar Conta
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de confirmação para alteração de permissões */}
      <ConfirmModal
        isOpen={showRoleModal}
        onClose={() => {
          setShowRoleModal(false);
          setPendingRoleChange(null);
        }}
        onConfirm={confirmRoleChange}
        title="Atualizar permissões do Utilizador"
        message={
          pendingRoleChange
            ? `Tem certeza que deseja alterar as permissões do utilizador para "${
                pendingRoleChange.roleId === 1
                  ? 'Utilizador'
                  : pendingRoleChange.roleId === 2
                    ? 'Admin'
                    : 'Curador'
              }"?`
            : ""
        }
      />
    </div>
  );
}

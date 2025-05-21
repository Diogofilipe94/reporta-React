import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './styles.module.css';

type ReportDetail = {
  technical_description: string;
  priority: string;
  resolution_notes: string;
  estimated_cost: number;
};

type Report = {
  id: number;
  location: string;
  photo: string;
  photo_url?: string;
  date: string;
  status: {
    id: number;
    status: string;
  };
  categories: Array<{
    id: number;
    category: string;
  }>;
  detail?: ReportDetail;
  user: User;
};

type StatusOption = {
  id: number;
  label: string;
};

type StatusConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentStatus: string;
  newStatus: string;
};

type User = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  telephone: string;
}

const statusOptions: StatusOption[] = [
  { id: 1, label: 'Pendente' },
  { id: 2, label: 'Em análise' },
  { id: 3, label: 'Resolvido' }
];

function StatusConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  currentStatus,
  newStatus
}: StatusConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h3 className={styles.modalTitle}>Confirmar Alteração de Status</h3>
        <p className={styles.modalText}>
          Deseja alterar o status do report de <strong>{currentStatus}</strong> para <strong>{newStatus}</strong>?
        </p>
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

const BACKEND_BASE_URL = 'https://reporta.up.railway.app';

const getPhotoUrl = (photo: string | null | undefined, photoUrl?: string) => {
  if (photoUrl) return photoUrl;

  if (!photo) return null;

  if (photo.startsWith('http')) {
    return photo;
  }

  // Senão, montamos o URL completo
  return `${BACKEND_BASE_URL}/storage/reports/${photo}`;
};

export function ReportDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingDetails, setEditingDetails] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [pendingStatusId, setPendingStatusId] = useState<number | null>(null);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const [formData, setFormData] = useState<ReportDetail>({
    technical_description: '',
    priority: '',
    resolution_notes: '',
    estimated_cost: 0
  });

  useEffect(() => {
    fetchReportDetails();
  }, [id]);

  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [report]);

  async function fetchReportDetails() {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const reportResponse = await fetch(`${BACKEND_BASE_URL}/api/reports/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!reportResponse.ok) {
        throw new Error("Erro ao buscar detalhes do report");
      }

      const reportData = await reportResponse.json();
      setReport(reportData);

      const detailsResponse = await fetch(`${BACKEND_BASE_URL}/api/reports/${id}/details`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (detailsResponse.ok) {
        const detailsData = await detailsResponse.json();
        setFormData(detailsData);
        setReport(prev => prev ? { ...prev, detail: detailsData } : null);
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro desconhecido");
      console.error('Erro ao buscar relatório:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleStatusChange(statusId: string) {
    setPendingStatusId(Number(statusId));
    setShowStatusModal(true);
    console.log("Modal deve abrir, showStatusModal =", true);
  }

  async function confirmStatusUpdate() {
    if (pendingStatusId === null || !report) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BACKEND_BASE_URL}/api/reports/${id}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status_id: pendingStatusId }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar status');
      }

      await fetchReportDetails();

    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    } finally {
      setShowStatusModal(false);
      setPendingStatusId(null);
    }
  }

  function cancelStatusUpdate() {
    setShowStatusModal(false);
    setPendingStatusId(null);
  }

  async function handleSubmitDetails(e: React.FormEvent) {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      const method = report?.detail ? 'PATCH' : 'POST';
      const response = await fetch(`${BACKEND_BASE_URL}/api/reports/${id}/details`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Erro ao guardar detalhes');
      }

      const updatedDetails = await response.json();
      setReport(prev => prev ? { ...prev, detail: updatedDetails } : null);
      setEditingDetails(false);
      await fetchReportDetails();

    } catch (error) {
      console.error('Erro ao guardar detalhes:', error);
    }
  }

  if (loading) {
    return <div className={styles.loadingContainer}>A carregar...</div>;
  }

  if (error || !report) {
    return <div className={styles.errorText}>Erro: {error}</div>;
  }

  const photoUrl = getPhotoUrl(report.photo, report.photo_url);

  // Formatação de data para um formato mais elegante
  const formattedDate = new Date(report.date).toLocaleDateString('pt-PT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className={styles.minimalContainer}>
      <div className={styles.minimalHeader}>
        <div className={styles.headerLeft}>
          <button
            onClick={() => navigate(-1)}
            className={styles.minimalBackButton}
          >
            ←
          </button>
          <h1 className={styles.minimalTitle}>Report <span className={styles.reportId}>#{report.id}</span></h1>
        </div>

        <div className={styles.statusContainer}>
          <select
            value={report.status.id}
            onChange={(e) => handleStatusChange(e.target.value)}
            className={`${styles.minimalStatusSelect}`}
          >
            {statusOptions.map(status => (
              <option key={status.id} value={status.id} className={styles[`status-${status.id}`]}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.minimalContent}>
        <div className={styles.minimalGrid}>
          <div className={styles.imageColumn}>
            {photoUrl ? (
              <div className={styles.minimalPhotoContainer}>
                {imageError ? (
                  <div className={styles.minimalImagePlaceholder}>
                    <div className={styles.placeholderContent}>
                      <i className="fas fa-image" style={{ fontSize: '32px' }}></i>
                      <p>Imagem indisponível</p>
                    </div>
                  </div>
                ) : !imageLoaded ? (
                  <div className={styles.minimalImageLoading}>
                    <div className={styles.minimalSpinner}></div>
                  </div>
                ) : null}

                <img
                  src={photoUrl}
                  alt={`Report ${report.id}`}
                  className={`${styles.minimalPhoto} ${imageLoaded ? '' : styles.hiddenImage}`}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                />
              </div>
            ) : (
              <div className={styles.minimalImagePlaceholder}>
                <div className={styles.placeholderContent}>
                  <i className="fas fa-image" style={{ fontSize: '32px' }}></i>
                  <p>Sem imagem</p>
                </div>
              </div>
            )}
          </div>

          {/* Coluna de informações */}
          <div className={styles.infoColumn}>
            <div className={styles.minimalInfoSection}>
              <div className={styles.minimalInfoItem}>
                <h3>Morada</h3>
                <p>{report.location.split("- Coordenadas", 1)}</p>
              </div>

              <div className={styles.minimalInfoItem}>
                <h3>Coordenadas</h3>
                <p>{report.location.split("- Coordenadas:")[1]?.trim() || 'Não disponível'}</p>
              </div>

              <div className={styles.minimalInfoItem}>
                <h3>Data</h3>
                <p>{formattedDate}</p>
              </div>

              <div className={styles.minimalInfoItem}>
                <h3>Categorias</h3>
                <div className={styles.minimalCategoriesList}>
                  {report.categories.map((category) => (
                    <span key={category.id} className={styles.minimalCategoryChip}>
                      {category.category}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detalhes técnicos */}
        <div className={styles.minimalSection}>
          <div className={styles.minimalSectionHeader}>
            <h2>Detalhes Técnicos</h2>
            <button
              onClick={() => setEditingDetails(!editingDetails)}
              className={styles.minimalActionButton}
            >
              {editingDetails ? 'Cancelar' : report.detail ? 'Editar' : 'Adicionar'}
            </button>
          </div>

          {editingDetails ? (
            <form onSubmit={handleSubmitDetails} className={styles.minimalForm}>
              <div className={styles.formGrid}>
                <div className={styles.minimalFormGroup}>
                  <label htmlFor="technical_description">Descrição Técnica</label>
                  <textarea
                    id="technical_description"
                    value={formData.technical_description}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      technical_description: e.target.value
                    }))}
                    required
                    className={styles.minimalTextarea}
                    placeholder="Descrição técnica do problema..."
                  />
                </div>

                <div className={styles.minimalFormGroup}>
                  <label htmlFor="estimated_cost">Custo Estimado (€)</label>
                  <input
                    type="number"
                    id="estimated_cost"
                    value={formData.estimated_cost}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      estimated_cost: Number(e.target.value)
                    }))}
                    required
                    className={styles.minimalInput}
                    placeholder="0"
                  />
                </div>

                <div className={styles.minimalFormGroup}>
                  <label htmlFor="priority">Prioridade</label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      priority: e.target.value
                    }))}
                    required
                    className={styles.minimalSelect}
                  >
                    <option value="">Selecione</option>
                    <option value="baixa">Baixa</option>
                    <option value="média">Média</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>


                <div className={styles.minimalFormGroup}>
                  <label htmlFor="resolution_notes">Notas de Resolução</label>
                  <textarea
                    id="resolution_notes"
                    value={formData.resolution_notes}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      resolution_notes: e.target.value
                    }))}
                    required
                    className={styles.minimalTextarea}
                    placeholder="Notas sobre a resolução..."
                  />
                </div>
              </div>

              <div className={styles.formActions}>
                <button type="submit" className={styles.minimalSubmitButton}>
                  Guardar
                </button>
              </div>
            </form>
          ) : report.detail ? (
            <div className={styles.detailsGrid}>
              <div className={styles.detailCard}>
                <h3>Prioridade</h3>
                <p className={`${styles.priorityBadge} ${styles[`priority-${report.detail.priority}`]}`}>
                  {report.detail.priority}
                </p>
              </div>

              <div className={styles.detailCard}>
                <h3>Custo Estimado</h3>
                <p className={styles.costValue}>€{report.detail.estimated_cost}</p>
              </div>

              <div className={styles.detailCard}>
                <h3>Descrição Técnica</h3>
                <p>{report.detail.technical_description}</p>
              </div>

              <div className={styles.detailCard}>
                <h3>Notas de Resolução</h3>
                <p>{report.detail.resolution_notes}</p>
              </div>
            </div>
          ) : (
            <div className={styles.minimalNoDetails}>
              <p>Sem detalhes técnicos</p>
              <button
                onClick={() => setEditingDetails(true)}
                className={styles.minimalAddButton}
              >
                + Adicionar detalhes
              </button>
            </div>
          )}
        </div>

        {/* Informações do Utilizador */}
        <div className={styles.minimalSection}>
          <div className={styles.minimalSectionHeader}>
            <h2>Utilizador</h2>
          </div>

          <div className={styles.userCard}>
            <div className={styles.userAvatar}>
              {report.user.first_name.charAt(0)}{report.user.last_name.charAt(0)}
            </div>

            <div className={styles.userDetails}>
              <h3>{report.user.first_name} {report.user.last_name}</h3>

              <div className={styles.userContact}>
                <div className={styles.contactItem}>
                  <span className={styles.contactLabel}>Email:</span>
                  <span>{report.user.email}</span>
                </div>

                <div className={styles.contactItem}>
                  <span className={styles.contactLabel}>Telefone:</span>
                  <span>{report.user.telephone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <StatusConfirmationModal
        isOpen={showStatusModal}
        onClose={cancelStatusUpdate}
        onConfirm={confirmStatusUpdate}
        currentStatus={report?.status.status || ''}
        newStatus={statusOptions.find(s => s.id === pendingStatusId)?.label || ''}
      />
    </div>
  );
}

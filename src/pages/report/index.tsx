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

const statusOptions: StatusOption[] = [
  { id: 1, label: 'pendente' },
  { id: 2, label: 'em resolução' },
  { id: 3, label: 'resolvido' }
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

export function ReportDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingDetails, setEditingDetails] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [pendingStatusId, setPendingStatusId] = useState<number | null>(null);

  const [formData, setFormData] = useState<ReportDetail>({
    technical_description: '',
    priority: '',
    resolution_notes: '',
    estimated_cost: 0
  });

  useEffect(() => {
    fetchReportDetails();
  }, [id]);

  async function fetchReportDetails() {
    try {
      setLoading(true);
      const reportResponse = await fetch(`http://localhost:8000/api/reports/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!reportResponse.ok) {
        throw new Error("Erro ao buscar detalhes do report");
      }

      const reportData = await reportResponse.json();
      setReport(reportData);

      const detailsResponse = await fetch(`http://localhost:8000/api/reports/${id}/details`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (detailsResponse.ok) {
        const detailsData = await detailsResponse.json();
        setFormData(detailsData);
        setReport(prev => prev ? { ...prev, detail: detailsData } : null);
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  function handleStatusChange(statusId: string) {
    setPendingStatusId(Number(statusId));
    setShowStatusModal(true);
  }

  async function confirmStatusUpdate() {
    if (pendingStatusId === null || !report) return;

    try {
      const response = await fetch(`http://localhost:8000/api/reports/${id}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
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
      const method = report?.detail ? 'PATCH' : 'POST';
      const response = await fetch(`http://localhost:8000/api/reports/${id}/details`, {
        method,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar detalhes');
      }

      const updatedDetails = await response.json();
      setReport(prev => prev ? { ...prev, detail: updatedDetails } : null);
      setEditingDetails(false);
      await fetchReportDetails();

    } catch (error) {
      console.error('Erro ao salvar detalhes:', error);
    }
  }

  if (loading) {
    return <div className={styles.loadingContainer}>Carregando...</div>;
  }

  if (error || !report) {
    return <div className={styles.errorText}>Erro: {error}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button
          onClick={() => navigate(-1)}
          className={styles.backButton}
        >
          Voltar
        </button>
        <h1 className={styles.title}>Report #{report.id}</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Informações Gerais</h2>

          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <strong>Localização:</strong>
              <p>{report.location}</p>
            </div>

            <div className={styles.infoItem}>
              <strong>Data:</strong>
              <p>{new Date(report.date).toLocaleDateString()}</p>
            </div>

            <div className={styles.infoItem}>
              <strong>Status:</strong>
              <select
                value={report.status.id}
                onChange={(e) => handleStatusChange(e.target.value)}
                className={styles.statusSelect}
              >
                {statusOptions.map(status => (
                  <option key={status.id} value={status.id}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {report.photo && (
            <div className={styles.photoContainer}>
              <img
                src={`http://localhost:8000/storage/${report.photo}`}
                alt={`Report ${report.id}`}
                className={styles.photo}
              />
            </div>
          )}

          <div className={styles.categoriesContainer}>
            <strong>Categorias:</strong>
            <div className={styles.categoriesList}>
              {report.categories.map((category) => (
                <span key={category.id} className={styles.categoryChip}>
                  {category.category}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Detalhes Técnicos</h2>
            <button
              onClick={() => setEditingDetails(!editingDetails)}
              className={styles.editButton}
            >
              {editingDetails ? 'Cancelar' : report.detail ? 'Editar' : 'Adicionar'}
            </button>
          </div>

          {editingDetails ? (
            <form onSubmit={handleSubmitDetails} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="technical_description">Descrição Técnica</label>
                <textarea
                  id="technical_description"
                  value={formData.technical_description}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    technical_description: e.target.value
                  }))}
                  required
                  className={styles.textarea}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="priority">Prioridade</label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    priority: e.target.value
                  }))}
                  required
                  className={styles.select}
                >
                  <option value="">Selecione</option>
                  <option value="baixa">Baixa</option>
                  <option value="média">Média</option>
                  <option value="alta">Alta</option>
                  <option value="crítica">Crítica</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="resolution_notes">Notas de Resolução</label>
                <textarea
                  id="resolution_notes"
                  value={formData.resolution_notes}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    resolution_notes: e.target.value
                  }))}
                  required
                  className={styles.textarea}
                />
              </div>

              <div className={styles.formGroup}>
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
                  className={styles.input}
                />
              </div>

              <button type="submit" className={styles.submitButton}>
                Salvar
              </button>
            </form>
          ) : report.detail ? (
            <div className={styles.detailsInfo}>
              <div className={styles.infoItem}>
                <strong>Prioridade:</strong>
                <p>{report.detail.priority}</p>
              </div>

              <div className={styles.infoItem}>
                <strong>Custo Estimado:</strong>
                <p>€{report.detail.estimated_cost}</p>
              </div>

              <div className={styles.infoItem}>
                <strong>Descrição Técnica:</strong>
                <p>{report.detail.technical_description}</p>
              </div>

              <div className={styles.infoItem}>
                <strong>Notas de Resolução:</strong>
                <p>{report.detail.resolution_notes}</p>
              </div>
            </div>
          ) : (
            <p className={styles.noDetails}>
              Nenhum detalhe técnico adicionado ainda.
            </p>
          )}
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

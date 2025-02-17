import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './styles.module.css';

type Category = {
  id: number;
  category: string;
};

type Status = {
  id: number;
  status: string;
};

type Report = {
  id: number;
  location: string;
  photo: string;
  date: string;
  status: Status;
  categories: Category[];
};

type ApiResponse = {
  current_page: number;
  data: Report[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
};

function getStatusClassName(status: string): string {
  switch (status.toLowerCase()) {
    case 'pendente':
      return styles.statusPending;
    case 'em resolução':
      return styles.statusInProgress;
    case 'resolvido':
      return styles.statusResolved;
    default:
      return '';
  }
}

export function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReports, setTotalReports] = useState(0);

  useEffect(() => {
    fetchReports(currentPage);
  }, [currentPage]);

  async function fetchReports(page: number) {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/reports?page=${page}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao buscar os reports");
      }

      const data: ApiResponse = await response.json();
      setReports(data.data);
      setTotalPages(data.last_page);
      setTotalReports(data.total);
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  function handlePreviousPage() {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }

  function handleNextPage() {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev - 1);
    }
  }

  if (loading) {
    return <div className={styles.loadingContainer}>Carregando...</div>;
  }

  if (error) {
    return <div className={styles.errorText}>Erro: {error}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Reports</h1>
        <span className={styles.label}>Total: {totalReports}</span>
      </div>

      <div className={styles.content}>
        {reports.map((report) => (
          <div key={report.id} className={styles.reportCard}>
            <div className={styles.reportHeader}>
              <div className={styles.reportTitleContainer}>
                <h2 className={styles.reportTitle}>Report #{report.id}</h2>
                <span className={`${styles.statusBadge} ${getStatusClassName(report.status.status)}`}>
                  {report.status.status}
                </span>
              </div>
              <Link
                to={`/report/${report.id}`}
                className={styles.detailsButton}
              >
                Ver Detalhes
              </Link>
            </div>

            <div className={styles.reportInfo}>
              <div className={styles.infoColumn}>
                <p className={styles.infoItem}>
                  <strong>Localização:</strong>
                  <span>{report.location}</span>
                </p>

                <p className={styles.infoItem}>
                  <strong>Data:</strong>
                  <span>{new Date(report.date).toLocaleDateString()}</span>
                </p>
              </div>

              {report.photo && (
                <div className={styles.photoContainer}>
                  <img
                    src={`http://localhost:8000/storage/${report.photo}`}
                    alt={`Report ${report.id}`}
                    className={styles.reportPhoto}
                  />
                </div>
              )}
            </div>

            {report.categories.length > 0 && (
              <div className={styles.categoriesContainer}>
                <div className={styles.categoriesList}>
                  {report.categories.map((category) => (
                    <span key={category.id} className={styles.categoryChip}>
                      {category.category}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              className={styles.paginationButton}
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              Anterior
            </button>

            <span className={styles.paginationInfo}>
              Página {currentPage} de {totalPages}
            </span>

            <button
              className={styles.paginationButton}
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Próxima
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

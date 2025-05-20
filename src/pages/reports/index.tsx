import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './styles.module.css';
import { useTheme } from '../../contexts/ThemeContext';

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
  photo_url?: string;
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

const BACKEND_BASE_URL = 'https://reporta.up.railway.app';

function getStatusClassName(status: string): string {
  switch (status.toLowerCase()) {
    case 'pendente':
      return styles.statusPending;
    case 'em resolução':
    case 'em análise':
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
  // State for image loading errors by report
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  const { isDark } = useTheme();

  useEffect(() => {
    fetchReports(currentPage);
  }, [currentPage]);

  async function fetchReports(page: number) {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_BASE_URL}/api/reports?page=${page}`, {
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

      // Reset image errors when loading new reports
      setImageErrors({});
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
      setCurrentPage(prev => prev + 1);
    }
  }

  // Function to get full image URL
  const getPhotoUrl = (report: Report) => {
    // If photo_url exists, use it directly
    if (report.photo_url) {
      return report.photo_url;
    }

    // If photo exists but isn't a complete URL, build the URL
    if (report.photo) {
      if (report.photo.startsWith('http')) {
        return report.photo;
      }
      return `${BACKEND_BASE_URL}/storage/reports/${report.photo}`;
    }

    return null;
  };

  // Function to handle image loading errors
  const handleImageError = (reportId: number) => {
    console.error(`Erro ao carregar imagem do report ${reportId}`);
    setImageErrors(prev => ({
      ...prev,
      [reportId]: true
    }));
  };

  if (loading) {
    return <div className={styles.loadingContainer}>A carregar...</div>;
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
        {reports.map((report) => {
          const photoUrl = getPhotoUrl(report);
          const hasImageError = imageErrors[report.id];

          return (
            <div key={report.id} className={styles.reportCard}>
              <div className={styles.reportHeader}>
                <div className={styles.reportTitleContainer}>
                  <h2 className={styles.reportTitle}>Report Nº {report.id}</h2>
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
                    <span>{report.location.split('- Coordenadas')[0]}</span>
                  </p>

                  <p className={styles.infoItem}>
                    <strong>Data:</strong>
                    <span>{new Date(report.date).toLocaleDateString()}</span>
                  </p>
                </div>

                {photoUrl && (
                  <div className={styles.photoContainer}>
                    {hasImageError ? (
                      <div className={styles.imagePlaceholder}>
                        <p style={{ fontSize: '12px', color: isDark ? '#909090' : '#666', marginTop: '5px' }}>Imagem indisponível</p>
                      </div>
                    ) : (
                      <img
                        src={photoUrl}
                        alt={`Report ${report.id}`}
                        className={styles.reportPhoto}
                        onError={() => handleImageError(report.id)}
                        loading="lazy"
                      />
                    )}
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
          );
        })}

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

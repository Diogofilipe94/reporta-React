import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './styles.module.css';
import { useTheme } from '../../contexts/ThemeContext';
import { Search, X, Filter, Calendar } from 'lucide-react';

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
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReports, setTotalReports] = useState(0);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  // Estados para filtragem
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Estado para armazenar todas as categorias e status únicos
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [availableStatuses, setAvailableStatuses] = useState<Status[]>([]);

  const { isDark } = useTheme();

  useEffect(() => {
    fetchReports(currentPage);
  }, [currentPage]);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, statusFilter, categoryFilter, startDateFilter, endDateFilter, reports]);

  // Extrair todas as categorias e status únicos dos reports
  useEffect(() => {
    if (reports.length > 0) {
      // Extrair categorias únicas
      const categoriesSet = new Set<string>();
      const categoriesList: Category[] = [];

      reports.forEach(report => {
        report.categories.forEach(category => {
          if (!categoriesSet.has(category.category)) {
            categoriesSet.add(category.category);
            categoriesList.push(category);
          }
        });
      });

      setAvailableCategories(categoriesList);

      // Extrair status únicos
      const statusesSet = new Set<string>();
      const statusesList: Status[] = [];

      reports.forEach(report => {
        if (!statusesSet.has(report.status.status)) {
          statusesSet.add(report.status.status);
          statusesList.push(report.status);
        }
      });

      setAvailableStatuses(statusesList);
    }
  }, [reports]);

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
      setFilteredReports(data.data); // Inicializa os relatórios filtrados
      setTotalPages(data.last_page);
      setTotalReports(data.total);
      setError(null);

      setImageErrors({});
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let result = [...reports];

    // Filtrar por termo de pesquisa (localização)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(report =>
        report.location.toLowerCase().includes(term)
      );
    }

    // Filtrar por status
    if (statusFilter !== null) {
      result = result.filter(report => report.status.id === statusFilter);
    }

    // Filtrar por categoria
    if (categoryFilter !== null) {
      result = result.filter(report =>
        report.categories.some(category => category.id === categoryFilter)
      );
    }

    // Filtrar por data de início
    if (startDateFilter) {
      const startDate = new Date(startDateFilter);
      result = result.filter(report => new Date(report.date) >= startDate);
    }

    // Filtrar por data de fim
    if (endDateFilter) {
      const endDate = new Date(endDateFilter);
      // Ajustando o limite para o final do dia
      endDate.setHours(23, 59, 59, 999);
      result = result.filter(report => new Date(report.date) <= endDate);
    }

    setFilteredReports(result);
  }

  function clearFilters() {
    setSearchTerm('');
    setStatusFilter(null);
    setCategoryFilter(null);
    setStartDateFilter('');
    setEndDateFilter('');
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

  const getPhotoUrl = (report: Report) => {
    if (report.photo_url) {
      return report.photo_url;
    }

    if (report.photo) {
      if (report.photo.startsWith('http')) {
        return report.photo;
      }
      return `${BACKEND_BASE_URL}/storage/reports/${report.photo}`;
    }

    return null;
  };

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

  const hasActiveFilters = searchTerm || statusFilter !== null || categoryFilter !== null || startDateFilter || endDateFilter;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Reports</h1>
        <div className={styles.headerInfo}>
          <span className={styles.label}>
            Total: {filteredReports.length} de {totalReports}
          </span>
          <button
            className={styles.filtersToggleButton}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            {showFilters ? 'Ocultar Filtros' : 'Filtrar'}
          </button>
        </div>
      </div>

      {/* Sistema de Filtragem */}
      {showFilters && (
        <div className={styles.filters}>
          <div className={styles.searchContainer}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por localização..."
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

          <div className={styles.filterContainer}>
            <select
              value={statusFilter === null ? '' : statusFilter}
              onChange={(e) => setStatusFilter(e.target.value ? Number(e.target.value) : null)}
              className={styles.filterSelect}
            >
              <option value="">Todos os status</option>
              {availableStatuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.status}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterContainer}>
            <select
              value={categoryFilter === null ? '' : categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value ? Number(e.target.value) : null)}
              className={styles.filterSelect}
            >
              <option value="">Todas as categorias</option>
              {availableCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.category}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.dateFilterContainer}>
            <p>Inicio</p>
            <div className={styles.dateInputWrapper}>
              <Calendar size={22} className={styles.calendarIcon} />
              <input
                type="date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                className={styles.dateInput}
                placeholder="Data inicial"
                
              />
              {startDateFilter && (
                <button
                  className={styles.clearButton}
                  onClick={() => setStartDateFilter('')}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <p>Fim</p>
            <div className={styles.dateInputWrapper}>
              <Calendar size={22} className={styles.calendarIcon} />
              <input
                type="date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
                className={styles.dateInput}
                placeholder="Data final"
              />
              {endDateFilter && (
                <button
                  className={styles.clearButton}
                  onClick={() => setEndDateFilter('')}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {hasActiveFilters && (
            <button
              className={styles.clearFiltersButton}
              onClick={clearFilters}
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Resultados ou mensagem de nenhum resultado */}
      <div className={styles.content}>
        {filteredReports.length === 0 ? (
          <div className={styles.noResults}>
            <p>Nenhum report encontrado com os filtros atuais.</p>
            <button
              className={styles.clearFiltersButton}
              onClick={clearFilters}
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          filteredReports.map((report) => {
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
          })
        )}

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

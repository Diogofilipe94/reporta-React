import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './styles.module.css';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  BarChart3,
  Users,
  ,
  Download,
  RefreshCw,
  AlertTriangle,
  Clock,
  Target,
  Activity,
} from 'lucide-react';

// Importar Chart.js
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';

import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import { FaEuroSign } from 'react-icons/fa';

// Registar componentes Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

// Types para os dados do dashboard
type OverviewMetrics = {
  total_reports: number;
  total_users: number;
  total_categories: number;
  reports_by_status: Record<string, number>;
  reports_last_30_days: number;
  resolution_rate: number;
  resolved_reports: number;
  pending_reports: number;
};

type ResolutionMetrics = {
  average_resolution_time_days: number;
  resolved_by_month: Array<{
    month: string;
    count: number;
  }>;
  resolution_time_distribution: Record<string, number>;
};

type CategoryMetrics = {
  reports_by_category: Array<{
    name: string;
    count: number;
  }>;
  resolution_rate_by_category: Array<{
    name: string;
    total: number;
    resolved: number;
    resolution_rate: number;
  }>;
};

type UserMetrics = {
  top_users_by_reports: Array<{
    id: number;
    name: string;
    email: string;
    reports_count: number;
    points: number;
  }>;
  active_users_last_30_days: Array<{
    id: number;
    name: string;
    email: string;
    recent_reports: number;
  }>;
  points_distribution: Record<string, number>;
};

type FinancialMetrics = {
  total_estimated_cost: number;
  average_cost_per_report: number;
};

type DashboardData = {
  overview: OverviewMetrics | null;
  resolution: ResolutionMetrics | null;
  categories: CategoryMetrics | null;
  users: UserMetrics | null;
  financial: FinancialMetrics | null;
};

const BACKEND_BASE_URL = 'https://reporta.up.railway.app';

// Componente para KPI Cards grandes
type KPICardProps = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'red';
  subtitle?: string;
};

function KPICard({ title, value, icon, trend, color, subtitle }: KPICardProps) {
  const { isDark } = useTheme();

  return (
    <div className={`${styles.kpiCard} ${styles[`kpi-${color}`]} ${isDark ? styles.darkMode : ''}`}>
      <div className={styles.kpiIcon}>
        {icon}
      </div>
      <div className={styles.kpiContent}>
        <h3 className={styles.kpiTitle}>{title}</h3>
        <div className={styles.kpiValue}>{value}</div>
        {subtitle && <p className={styles.kpiSubtitle}>{subtitle}</p>}
        {trend && <div className={styles.kpiTrend}>{trend}</div>}
      </div>
    </div>
  );
}

// Componente para gráficos
type ChartCardProps = {
  title: string;
  children: React.ReactNode;
  height?: string;
};

function ChartCard({ title, children, height = '400px' }: ChartCardProps) {
  const { isDark } = useTheme();

  return (
    <div className={`${styles.chartCard} ${isDark ? styles.darkMode : ''}`}>
      <div className={styles.chartHeader}>
        <h3 className={styles.chartTitle}>{title}</h3>
      </div>
      <div className={styles.chartContainer} style={{ height }}>
        {children}
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    overview: null,
    resolution: null,
    categories: null,
    users: null,
    financial: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingErrors, setLoadingErrors] = useState<string[]>([]);

  const navigate = useNavigate();
  const { isDark } = useTheme();

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  const checkAdminAccess = () => {
    const token = localStorage.getItem("token");
    if (!token) return false;

    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      return payload.role === 'admin' || payload.role === 'curator' || payload.role === 2 || payload.role === 3;
    } catch (e) {
      return false;
    }
  };

  const fetchEndpoint = async (endpoint: string) => {
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/admin/dashboard/${endpoint}`, getAuthHeaders());

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Acesso negado. Apenas administradores e curadores podem aceder ao dashboard.');
        }

        // Para erros 500, tentar obter detalhes do erro
        let errorMessage = `Erro ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage += `: ${errorData.error}`;
          }
          if (errorData.debug) {
            console.error(`Debug info for ${endpoint}:`, errorData.debug);
          }
        } catch (e) {
          // Se não conseguir parsear o erro, usar mensagem genérica
        }

        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error(`Erro ao carregar ${endpoint}:`, error);
      throw error;
    }
  };

  const fetchDashboardData = async () => {
    if (!checkAdminAccess()) {
      setError('Acesso negado. Apenas administradores e curadores podem aceder ao dashboard.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setLoadingErrors([]);

      const endpoints = ['overview', 'resolution', 'categories', 'users', 'financial'];
      const results: any[] = [];
      const errors: string[] = [];

      // Tentar carregar cada endpoint individualmente
      for (const endpoint of endpoints) {
        try {
          const data = await fetchEndpoint(endpoint);
          results.push(data);
        } catch (error) {
          console.error(`Erro ao carregar ${endpoint}:`, error);
          errors.push(`${endpoint}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
          results.push(null); // Adicionar null para manter ordem
        }
      }

      // Atualizar estado com os dados carregados
      setDashboardData({
        overview: results[0],
        resolution: results[1],
        categories: results[2],
        users: results[3],
        financial: results[4]
      });

      // Se há erros mas alguns dados foram carregados, mostrar warnings
      if (errors.length > 0) {
        setLoadingErrors(errors);
        console.warn('Alguns dados não puderam ser carregados:', errors);
      }

      // Se todos falharam, mostrar erro principal
      if (results.every(result => result === null)) {
        setError('Não foi possível carregar nenhum dado do dashboard. Verifique os logs do servidor.');
      }

    } catch (error) {
      console.error('Erro geral ao carregar dashboard:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido ao carregar dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
    setIsRefreshing(false);
  };

  const exportData = async () => {
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/admin/dashboard/export`, getAuthHeaders());

      if (!response.ok) {
        throw new Error('Erro ao exportar dados');
      }

      const data = await response.json();

      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `dashboard-report-${new Date().toISOString().split('T')[0]}.json`;
      link.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      setError('Erro ao exportar dados');
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: isDark ? '#d9d7b6' : '#545333',
          font: {
            family: 'system-ui, -apple-system, sans-serif'
          }
        }
      },
      tooltip: {
        backgroundColor: isDark ? '#2c2c2c' : '#ffffff',
        titleColor: isDark ? '#d9d7b6' : '#545333',
        bodyColor: isDark ? '#d9d7b6' : '#545333',
        borderColor: isDark ? '#878672' : '#d9d7b6',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        ticks: {
          color: isDark ? '#d9d7b6' : '#545333'
        },
        grid: {
          color: isDark ? '#383838' : '#e5e5e5'
        }
      },
      y: {
        ticks: {
          color: isDark ? '#d9d7b6' : '#545333'
        },
        grid: {
          color: isDark ? '#383838' : '#e5e5e5'
        }
      }
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: isDark ? '#d9d7b6' : '#545333',
          font: {
            family: 'system-ui, -apple-system, sans-serif'
          }
        }
      },
      tooltip: {
        backgroundColor: isDark ? '#2c2c2c' : '#ffffff',
        titleColor: isDark ? '#d9d7b6' : '#545333',
        bodyColor: isDark ? '#d9d7b6' : '#545333',
        borderColor: isDark ? '#878672' : '#d9d7b6',
        borderWidth: 1
      }
    }
  };

  if (!checkAdminAccess()) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorContent}>
          <AlertTriangle size={48} className={styles.errorIcon} />
          <h2>Acesso Negado</h2>
          <p>Apenas administradores e curadores podem aceder ao dashboard.</p>
          <button
            className={styles.goBackButton}
            onClick={() => navigate('/reports')}
          >
            Voltar aos Reports
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>A carregar dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorContent}>
          <AlertTriangle size={48} className={styles.errorIcon} />
          <h2>Erro</h2>
          <p>{error}</p>
          <button
            className={styles.retryButton}
            onClick={fetchDashboardData}
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const { overview, resolution, categories, users, financial } = dashboardData;

  // Preparar dados para gráficos com verificações de segurança
  const statusChartData = overview && overview.reports_by_status && Object.keys(overview.reports_by_status).length > 0 ? {
    labels: Object.keys(overview.reports_by_status),
    datasets: [{
      data: Object.values(overview.reports_by_status),
      backgroundColor: [
        '#f39c12', // pendente
        '#3498db', // em resolução
        '#27ae60'  // resolvido
      ],
      borderColor: isDark ? '#2c2c2c' : '#ffffff',
      borderWidth: 2
    }]
  } : null;

  const categoryChartData = categories && categories.reports_by_category && categories.reports_by_category.length > 0 ? {
    labels: categories.reports_by_category.map(cat => cat.name),
    datasets: [{
      label: 'Reports por Categoria',
      data: categories.reports_by_category.map(cat => cat.count),
      backgroundColor: '#878672',
      borderColor: '#545333',
      borderWidth: 1
    }]
  } : null;

  const monthlyChartData = resolution && resolution.resolved_by_month && resolution.resolved_by_month.length > 0 ? {
    labels: resolution.resolved_by_month.map(item => item.month),
    datasets: [{
      label: 'Reports Resolvidos',
      data: resolution.resolved_by_month.map(item => item.count),
      borderColor: '#27ae60',
      backgroundColor: 'rgba(39, 174, 96, 0.1)',
      fill: true,
      tension: 0.4
    }]
  } : null;

  const pointsDistributionData = users && users.points_distribution && Object.keys(users.points_distribution).length > 0 ? {
    labels: Object.keys(users.points_distribution),
    datasets: [{
      data: Object.values(users.points_distribution),
      backgroundColor: [
        '#e74c3c',
        '#f39c12',
        '#f1c40f',
        '#27ae60',
        '#8e44ad'
      ],
      borderColor: isDark ? '#2c2c2c' : '#ffffff',
      borderWidth: 2
    }]
  } : null;

  return (
    <div className={`${styles.container} ${isDark ? styles.darkMode : ''}`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Dashboard Analítico</h1>
          <p className={styles.subtitle}>Análise estatística e métricas de performance</p>
          {loadingErrors.length > 0 && (
            <div className={styles.warningBanner}>
              <AlertTriangle size={16} />
              <span>Alguns dados não puderam ser carregados</span>
            </div>
          )}
        </div>
        <div className={styles.headerActions}>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={styles.refreshButton}
          >
            <RefreshCw size={16} className={isRefreshing ? styles.spinning : ''} />
            {isRefreshing ? 'A atualizar...' : 'Atualizar'}
          </button>
          <button
            onClick={exportData}
            className={styles.exportButton}
          >
            <Download size={16} />
            Exportar
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {overview && (
        <div className={styles.kpiGrid}>
          <KPICard
            title="Total de Reports"
            value={overview.total_reports.toLocaleString()}
            icon={<BarChart3 size={32} />}
            color="blue"
            subtitle="Total no sistema"
          />
          <KPICard
            title="Taxa de Resolução"
            value={`${overview.resolution_rate}%`}
            icon={<Target size={32} />}
            color="green"
            subtitle={`${overview.resolved_reports} resolvidos`}
          />
          <KPICard
            title="Atividade (30 dias)"
            value={overview.reports_last_30_days}
            icon={<Activity size={32} />}
            color="orange"
            subtitle="Novos reports"
          />
          <KPICard
            title="Utilizadores Ativos"
            value={overview.total_users}
            icon={<Users size={32} />}
            color="purple"
            subtitle="Total registados"
          />
          {resolution && (
            <KPICard
              title="Tempo Médio Resolução"
              value={`${resolution.average_resolution_time_days}`}
              icon={<Clock size={32} />}
              color="blue"
              subtitle="dias em média"
            />
          )}
          {financial && (
            <KPICard
              title="Custo Total Estimado"
              value={`€${financial.total_estimated_cost.toLocaleString()}`}
              icon={<FaEuroSign size={32} />}
              color="green"
              subtitle={`€${financial.average_cost_per_report.toFixed(0)} por report`}
            />
          )}
        </div>
      )}

      {/* Charts Grid */}
      <div className={styles.chartsGrid}>
        {/* Status Distribution */}
        {statusChartData && (
          <ChartCard title="Distribuição por Status" height="350px">
            <Doughnut data={statusChartData} options={pieOptions} />
          </ChartCard>
        )}

        {/* Categories */}
        {categoryChartData && (
          <ChartCard title="Reports por Categoria">
            <Bar data={categoryChartData} options={chartOptions} />
          </ChartCard>
        )}

        {/* Monthly Resolution Trend */}
        {monthlyChartData && (
          <ChartCard title="Evolução de Reports Resolvidos">
            <Line data={monthlyChartData} options={chartOptions} />
          </ChartCard>
        )}

        {/* Points Distribution */}
        {pointsDistributionData && (
          <ChartCard title="Distribuição de Pontos dos Utilizadores" height="350px">
            <Pie data={pointsDistributionData} options={pieOptions} />
          </ChartCard>
        )}

        {/* Resolution Time Distribution */}
        {resolution && resolution.resolution_time_distribution && Object.keys(resolution.resolution_time_distribution).length > 0 && (
          <ChartCard title="Distribuição por Tempo de Resolução">
            <Bar
              data={{
                labels: Object.keys(resolution.resolution_time_distribution),
                datasets: [{
                  label: 'Número de Reports',
                  data: Object.values(resolution.resolution_time_distribution),
                  backgroundColor: '#3498db',
                  borderColor: '#2980b9',
                  borderWidth: 1
                }]
              }}
              options={chartOptions}
            />
          </ChartCard>
        )}

        {/* Top Users */}
        {users && users.top_users_by_reports && users.top_users_by_reports.length > 0 && (
          <ChartCard title="Top Utilizadores por Reports">
            <Bar
              data={{
                labels: users.top_users_by_reports.slice(0, 8).map(user =>
                  user.name.split(' ')[0] || 'Utilizador'
                ),
                datasets: [{
                  label: 'Número de Reports',
                  data: users.top_users_by_reports.slice(0, 8).map(user => user.reports_count),
                  backgroundColor: '#9b59b6',
                  borderColor: '#8e44ad',
                  borderWidth: 1
                }]
              }}
              options={chartOptions}
            />
          </ChartCard>
        )}

        {/* Placeholder para dados em falta */}
        {!statusChartData && !categoryChartData && !monthlyChartData && (
          <ChartCard title="Dados Não Disponíveis">
            <div className={styles.noDataMessage}>
              <AlertTriangle size={48} />
              <p>Não há dados suficientes para gerar gráficos</p>
              <p>Verifique se existem reports no sistema</p>
            </div>
          </ChartCard>
        )}
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <button
          className={styles.actionButton}
          onClick={() => navigate('/admin/users')}
        >
          <Users size={20} />
          Gerir Utilizadores
        </button>
        <button
          className={styles.actionButton}
          onClick={() => navigate('/reports')}
        >
          <BarChart3 size={20} />
          Ver Reports
        </button>
      </div>

      {/* Debug info se há erros */}
      {loadingErrors.length > 0 && (
        <div className={styles.debugInfo}>
          <h3>Informações de Debug:</h3>
          <ul>
            {loadingErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

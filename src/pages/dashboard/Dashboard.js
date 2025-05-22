import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getChatHistory } from '../../services/negotiationService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
// Add import for the subscription banner component
import SubscriptionBanner from '../../components/subscription/SubscriptionBanner';
import { 
  FiPlusCircle, FiTrendingUp, FiDollarSign, FiClock, 
  FiBarChart2, FiActivity, FiPieChart, FiCheckCircle,
  FiCalendar, FiPercent, FiRefreshCw, FiShoppingCart
} from 'react-icons/fi';
import './Dashboard.scss';

// Import chart components (you'll need to install react-chartjs-2)
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend 
} from 'chart.js';
import { logDebug, logError, LOG_TYPES } from '../../services/debugService';
import NegotiationStats from '../../components/dashboard/NegotiationStats';
import { migrateNegotiationData } from '../../utils/migrateNegotiations';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [negotiations, setNegotiations] = useState([]);
  const [metrics, setMetrics] = useState({
    totalNegotiations: 0,
    totalSavings: 0,
    successRate: 0,
    averageSavings: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [migrating, setMigrating] = useState(false);
  
  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [chartPeriod, setChartPeriod] = useState('month'); // week, month, year

  // Define the missing fetchNegotiations function
  const fetchNegotiations = async () => {
    try {
      // Fetch negotiations
      const chatHistory = await getChatHistory();
      setNegotiations(chatHistory);
      
      // Calculate metrics
      if (chatHistory.length > 0) {
        const totalSavings = chatHistory.reduce((sum, chat) => {
          const finalPrice = chat.final_price || chat.target_price;
          const saving = chat.mode === 'BUYING'
            ? chat.initial_price - finalPrice
            : finalPrice - chat.initial_price;
          return sum + Math.max(0, saving);
        }, 0);
        
        const completedNegotiations = chatHistory.filter(chat => chat.final_price);
        const successRate = completedNegotiations.length / chatHistory.length;
        
        setMetrics({
          totalNegotiations: chatHistory.length,
          totalSavings,
          successRate: Math.round(successRate * 100),
          averageSavings: totalSavings / chatHistory.length
        });
      }
    } catch (err) {
      logError(err, 'Error loading dashboard data');
      setError('Failed to load dashboard data. Please try again later.');
    }
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      // Only fetch data when auth is finished loading and user is authenticated
      if (authLoading || !user) {
        if (!authLoading && !user) {
          setError('Please log in to view your dashboard');
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        logDebug('Loading dashboard data', LOG_TYPES.COMPONENT);
        
        // Fetch negotiations
        await fetchNegotiations();
        
        setLoading(false);
      } catch (err) {
        logError(err, 'Error loading dashboard data');
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user, authLoading]);

  const handleMigrateData = async () => {
    setMigrating(true);
    try {
      await migrateNegotiationData();
      // Refresh data after migration
      await fetchNegotiations();
    } catch (error) {
      console.error('Migration failed:', error);
    } finally {
      setMigrating(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (percentage) => {
    return `${percentage.toFixed(1)}%`;
  };
  
  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Chart data preparation
  const barChartData = {
    labels: ['Total', 'Active', 'Completed'],
    datasets: [
      {
        label: 'Negotiations',
        data: [
          metrics.totalNegotiations, 
          metrics.totalNegotiations - metrics.totalNegotiations, 
          metrics.totalNegotiations
        ],
        backgroundColor: [
          'rgba(76, 111, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(75, 192, 192, 0.6)'
        ],
        borderColor: [
          'rgb(76, 111, 255)',
          'rgb(255, 159, 64)',
          'rgb(75, 192, 192)'
        ],
        borderWidth: 1,
      }
    ]
  };

  const doughnutData = {
    labels: ['Buying', 'Selling'],
    datasets: [
      {
        data: [
          negotiations.filter(n => n.mode === 'BUYING').length,
          negotiations.filter(n => n.mode === 'SELLING').length
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(75, 192, 192, 0.6)'
        ],
        borderColor: [
          'rgb(54, 162, 235)',
          'rgb(75, 192, 192)'
        ],
        borderWidth: 1,
      }
    ]
  };

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentNegotiations = negotiations.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(negotiations.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-title">
          <h1>Dashboard</h1>
          <p>Welcome back, {user?.full_name || 'User'}! Here's an overview of your negotiation activity.</p>
        </div>
        <div className="header-actions">
          <Link to="/negotiator" className="btn btn-primary">
            <FiPlusCircle /> Start New Negotiation
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="page-content">
          <div className="loading-state">Loading your dashboard...</div>
        </div>
      ) : error ? (
        <div className="page-content">
          <div className="error-state">{error}</div>
        </div>
      ) : (
        <div className="page-content">
          {/* Add the subscription banner near the top of the content */}
          <SubscriptionBanner currentPlan="free" />
          
          <section className="metrics-section">
            <div className="grid-layout grid-4">
              <div className="metric-card">
                <div className="metric-icon blue">
                  <FiBarChart2 />
                </div>
                <div className="metric-content">
                  <h3>Total Negotiations</h3>
                  <p className="metric-value">{metrics.totalNegotiations}</p>
                </div>
              </div>
              
              <div className="metric-card">
                <div className="metric-icon green">
                  <FiDollarSign />
                </div>
                <div className="metric-content">
                  <h3>Total Savings</h3>
                  <p className="metric-value">{formatCurrency(metrics.totalSavings)}</p>
                </div>
              </div>
              
              <div className="metric-card">
                <div className="metric-icon orange">
                  <FiCheckCircle />
                </div>
                <div className="metric-content">
                  <h3>Success Rate</h3>
                  <p className="metric-value">{metrics.successRate}%</p>
                </div>
              </div>
              
              <div className="metric-card">
                <div className="metric-icon blue">
                  <FiTrendingUp />
                </div>
                <div className="metric-content">
                  <h3>Avg Savings per Deal</h3>
                  <p className="metric-value">{formatCurrency(metrics.averageSavings)}</p>
                </div>
              </div>
            </div>
          </section>
          
          <section className="charts-section">
            <div className="grid-layout grid-2">
              <div className="content-card">
                <div className="card-header">
                  <h2>Negotiations Overview</h2>
                  <div className="card-actions">
                    <button 
                      className={`btn ${chartPeriod === 'week' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setChartPeriod('week')}
                    >
                      Week
                    </button>
                    <button 
                      className={`btn ${chartPeriod === 'month' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setChartPeriod('month')}
                    >
                      Month
                    </button>
                    <button 
                      className={`btn ${chartPeriod === 'year' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setChartPeriod('year')}
                    >
                      Year
                    </button>
                  </div>
                </div>
                <div className="card-content chart-container">
                  <Bar data={barChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>
              
              <div className="content-card">
                <div className="card-header">
                  <h2>Buying vs Selling</h2>
                </div>
                <div className="card-content chart-container">
                  <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>
            </div>
          </section>
          
          <section className="recent-negotiations">
            <div className="content-card">
              <div className="card-header">
                <h2>Recent Negotiations</h2>
                <div className="card-actions">
                  <Link to="/history" className="btn btn-secondary">
                    View All
                  </Link>
                </div>
              </div>
              <div className="card-content">
                <div className="table-container">
                  <table className="negotiations-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Date</th>
                        <th>Mode</th>
                        <th>Initial Price</th>
                        <th>Final Price</th>
                        <th>Savings</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentNegotiations.length > 0 ? (
                        currentNegotiations.map((negotiation, index) => {
                          const finalPrice = negotiation.final_price || negotiation.target_price;
                          const saving = negotiation.mode === 'BUYING'
                            ? negotiation.initial_price - finalPrice
                            : finalPrice - negotiation.initial_price;
                          
                          return (
                            <tr key={index}>
                              <td>{negotiation.product || 'Unknown item'}</td>
                              <td>{formatDate(negotiation.timestamp)}</td>
                              <td>
                                <span className={`status-badge ${negotiation.mode === 'BUYING' ? 'info' : 'success'}`}>
                                  {negotiation.mode === 'BUYING' ? 'Buying' : 'Selling'}
                                </span>
                              </td>
                              <td>{formatCurrency(negotiation.initial_price)}</td>
                              <td>{formatCurrency(finalPrice)}</td>
                              <td className="savings-cell">
                                {formatCurrency(Math.max(0, saving))}
                              </td>
                              <td>
                                <span className={`status-badge ${negotiation.final_price ? 'success' : 'warning'}`}>
                                  {negotiation.final_price ? 'Completed' : 'In Progress'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="7" className="no-data">
                            No negotiations found. Start your first negotiation!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Add pagination */}
                {negotiations.length > itemsPerPage && (
                  <div className="pagination">
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => paginate(i + 1)}
                        className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
          
          {user?.role === 'admin' && (
            <section className="admin-section">
              <div className="content-card">
                <div className="card-header">
                  <h2>Admin Tools</h2>
                </div>
                <div className="card-content">
                  <button 
                    className="btn btn-secondary"
                    onClick={handleMigrateData}
                    disabled={migrating}
                  >
                    <FiRefreshCw className={migrating ? 'icon-spin' : ''} />
                    {migrating ? 'Migrating...' : 'Migrate Negotiation Data'}
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard; 
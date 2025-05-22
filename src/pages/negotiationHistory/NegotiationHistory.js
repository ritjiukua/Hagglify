import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getChatHistory } from '../../services/negotiationService';
import { logDebug, logError, LOG_TYPES } from '../../services/debugService';
import { FiMessageSquare, FiDollarSign, FiClock, FiSearch, FiFilter, FiChevronDown, FiArrowRight } from 'react-icons/fi';
import './NegotiationHistory.scss';

const NegotiationHistory = () => {
  const { user, loading: authLoading } = useAuth();
  const [negotiations, setNegotiations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'buying', 'selling'
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'savings'

  useEffect(() => {
    const fetchNegotiations = async () => {
      // Only fetch when auth is ready and user is logged in
      if (authLoading) return;
      
      if (!user) {
        setError('Please log in to view your negotiation history');
        setLoading(false);
        return;
      }
      
      try {
        logDebug('Fetching negotiation history', LOG_TYPES.COMPONENT);
        setLoading(true);
        const chats = await getChatHistory();
        setNegotiations(chats);
        setLoading(false);
      } catch (err) {
        logError(err, 'Error fetching negotiations');
        setError('Failed to load your negotiation history');
        setLoading(false);
      }
    };

    fetchNegotiations();
  }, [user, authLoading]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Calculate potential savings
  const calculateSavings = (negotiation) => {
    const finalPrice = negotiation.final_price || negotiation.target_price;
    
    if (negotiation.mode === 'BUYING') {
      return negotiation.initial_price - finalPrice;
    } else {
      return finalPrice - negotiation.initial_price;
    }
  };

  // Filter and sort negotiations
  const filteredNegotiations = negotiations
    .filter(negotiation => {
      // Filter by search query
      const matchesSearch = negotiation.item_name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filter by mode
      const matchesFilter = filter === 'all' || 
        (filter === 'buying' && negotiation.mode === 'BUYING') ||
        (filter === 'selling' && negotiation.mode === 'SELLING');
        
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      // Sort by selected criteria
      if (sortBy === 'newest') {
        return new Date(b.updated_at?.toDate?.() || b.updated_at) - new Date(a.updated_at?.toDate?.() || a.updated_at);
      } else if (sortBy === 'oldest') {
        return new Date(a.updated_at?.toDate?.() || a.updated_at) - new Date(b.updated_at?.toDate?.() || b.updated_at);
      } else if (sortBy === 'savings') {
        return Math.abs(calculateSavings(b)) - Math.abs(calculateSavings(a));
      }
      return 0;
    });

  return (
    <div className="negotiation-history-page">
      <div className="page-header">
        <h1>Negotiation History</h1>
        <p className="page-subtitle">Review and continue your past negotiations</p>
      </div>

      <div className="history-controls">
        <div className="search-bar">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search negotiations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="filter-controls">
          <div className="filter-dropdown">
            <button className="filter-button">
              <FiFilter /> <span>Filter</span> <FiChevronDown />
            </button>
            <div className="dropdown-content">
              <button 
                className={filter === 'all' ? 'active' : ''} 
                onClick={() => setFilter('all')}
              >
                All Negotiations
              </button>
              <button 
                className={filter === 'buying' ? 'active' : ''} 
                onClick={() => setFilter('buying')}
              >
                Buying
              </button>
              <button 
                className={filter === 'selling' ? 'active' : ''} 
                onClick={() => setFilter('selling')}
              >
                Selling
              </button>
            </div>
          </div>
          
          <div className="sort-dropdown">
            <button className="sort-button">
              <span>Sort: {sortBy === 'newest' ? 'Newest First' : sortBy === 'oldest' ? 'Oldest First' : 'Highest Savings'}</span> <FiChevronDown />
            </button>
            <div className="dropdown-content">
              <button 
                className={sortBy === 'newest' ? 'active' : ''} 
                onClick={() => setSortBy('newest')}
              >
                Newest First
              </button>
              <button 
                className={sortBy === 'oldest' ? 'active' : ''} 
                onClick={() => setSortBy('oldest')}
              >
                Oldest First
              </button>
              <button 
                className={sortBy === 'savings' ? 'active' : ''} 
                onClick={() => setSortBy('savings')}
              >
                Highest Savings
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your negotiation history...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <p>{error}</p>
          <button 
            className="retry-button"
            onClick={() => {
              setLoading(true);
              setError(null);
              getChatHistory()
                .then(chats => {
                  setNegotiations(chats);
                  setLoading(false);
                })
                .catch(err => {
                  console.error('Error retrying fetch:', err);
                  setError('Failed to load your negotiation history');
                  setLoading(false);
                });
            }}
          >
            Try Again
          </button>
        </div>
      ) : filteredNegotiations.length > 0 ? (
        <div className="negotiations-list">
          {filteredNegotiations.map((negotiation) => (
            <div className="negotiation-card" key={negotiation.id}>
              <div className="negotiation-header">
                <h3>{negotiation.item_name}</h3>
                <span className={`mode-badge ${negotiation.mode.toLowerCase()}`}>
                  {negotiation.mode === 'BUYING' ? 'Buying' : 'Selling'}
                </span>
              </div>
              
              <div className="negotiation-details">
                <div className="detail-column">
                  <div className="detail">
                    <FiDollarSign className="detail-icon" />
                    <div>
                      <span className="detail-label">Initial Price</span>
                      <span className="detail-value">{formatCurrency(negotiation.initial_price)}</span>
                    </div>
                  </div>
                  
                  <div className="detail">
                    <FiDollarSign className="detail-icon" />
                    <div>
                      <span className="detail-label">Target Price</span>
                      <span className="detail-value">{formatCurrency(negotiation.target_price)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="detail-column">
                  <div className="detail">
                    <FiMessageSquare className="detail-icon" />
                    <div>
                      <span className="detail-label">Messages</span>
                      <span className="detail-value">{negotiation.messages_count || 0}</span>
                    </div>
                  </div>
                  
                  <div className="detail">
                    <FiClock className="detail-icon" />
                    <div>
                      <span className="detail-label">Last Updated</span>
                      <span className="detail-value">{formatDate(negotiation.updated_at)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="savings-indicator">
                  <div className="savings-label">Potential Savings</div>
                  <div className="savings-value">
                    {formatCurrency(Math.abs(calculateSavings(negotiation)))}
                  </div>
                </div>
              </div>
              
              <div className="negotiation-actions">
                <Link to={`/negotiator?chatId=${negotiation.id}`} className="continue-button">
                  Continue Negotiation <FiArrowRight />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-illustration"></div>
          <h3>No negotiations found</h3>
          <p>
            {searchQuery || filter !== 'all' 
              ? 'Try changing your search or filter criteria.'
              : 'Start your first negotiation to build your history.'}
          </p>
          <Link to="/negotiator" className="start-button">
            Start a New Negotiation
          </Link>
        </div>
      )}
    </div>
  );
};

export default NegotiationHistory; 
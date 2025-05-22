import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getChatHistory } from '../../services/negotiationService';
import { FiClock, FiDollarSign, FiArrowRight, FiLoader } from 'react-icons/fi';
import './PastNegotiations.scss';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// Calculate savings
const calculateSavings = (negotiation) => {
  const finalPrice = negotiation.final_price || negotiation.target_price;
  
  if (negotiation.mode === 'BUYING') {
    return negotiation.initial_price - finalPrice;
  } else {
    return finalPrice - negotiation.initial_price;
  }
};

const PastNegotiations = () => {
  const [negotiations, setNegotiations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchNegotiations = async () => {
      try {
        setLoading(true);
        const data = await getChatHistory();
        setNegotiations(data || []);
      } catch (err) {
        console.error('Failed to fetch negotiations:', err);
        setError('Failed to load your past negotiations');
      } finally {
        setLoading(false);
      }
    };
    
    fetchNegotiations();
  }, []);
  
  if (loading) {
    return (
      <div className="past-negotiations loading">
        <FiLoader className="loading-icon" />
        <p>Loading your negotiation history...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="past-negotiations error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }
  
  if (!negotiations || negotiations.length === 0) {
    return (
      <div className="past-negotiations empty">
        <h3>No Past Negotiations</h3>
        <p>Start a new negotiation to build your history.</p>
        <Link to="/negotiator" className="start-button">Start Negotiating</Link>
      </div>
    );
  }
  
  return (
    <div className="past-negotiations">
      <div className="negotiations-header">
        <h3>Your Past Negotiations</h3>
        <Link to="/history" className="view-all">View All</Link>
      </div>
      
      <div className="negotiations-list">
        {negotiations.slice(0, 5).map(negotiation => (
          <Link 
            to={`/negotiator?chatId=${negotiation.id}`} 
            className="negotiation-card" 
            key={negotiation.id}
          >
            <div className="negotiation-title">
              <h4>{negotiation.item_name}</h4>
              <span className={`mode ${negotiation.mode?.toLowerCase() || 'buying'}`}>
                {negotiation.mode || 'Buying'}
              </span>
            </div>
            
            <div className="negotiation-details">
              <div className="price-range">
                <FiDollarSign />
                <span>${negotiation.initial_price || 0}</span>
                <FiArrowRight className="arrow" />
                <span>${negotiation.final_price || negotiation.target_price || 0}</span>
              </div>
              
              <div className="savings-info">
                <span>Savings: {formatCurrency(Math.abs(calculateSavings(negotiation)))}</span>
              </div>
              
              <div className="date-info">
                <FiClock />
                <span>{negotiation.created_at ? new Date(negotiation.created_at).toLocaleDateString() : 'No date'}</span>
              </div>
              
              <div className="message-count">
                {negotiation.messages?.length || 0} messages
              </div>
            </div>
            
            <div className="negotiation-status">
              <span className="continue-button">Continue</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default PastNegotiations; 
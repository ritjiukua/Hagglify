import React, { useState, useEffect } from 'react';
import { FiCheck, FiX, FiDollarSign, FiTrendingUp, FiTarget } from 'react-icons/fi';
import './EndNegotiationModal.scss';

const EndNegotiationModal = ({ 
  negotiationData, 
  isOpen, 
  isAnimating = true,
  onClose, 
  onComplete 
}) => {
  const [finalPrice, setFinalPrice] = useState('');
  const [successfulNegotiation, setSuccessfulNegotiation] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Reset state when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      // When opening, initialize with default values
      setFinalPrice('');
      setSuccessfulNegotiation(true);
      setError(null);
    }
  }, [isOpen]);
  
  // Don't render if modal shouldn't be shown
  if (!isOpen) return null;
  
  const mode = negotiationData?.mode || 'BUYING';
  const initialPrice = parseFloat(negotiationData?.initialPrice) || 0;
  const targetPrice = parseFloat(negotiationData?.targetPrice) || 0;
  
  // Calculate savings/profit if finalPrice is entered
  const calculateOutcome = () => {
    if (!finalPrice) return { amount: 0, percentage: 0 };
    
    const finalPriceNum = parseFloat(finalPrice);
    if (isNaN(finalPriceNum)) return { amount: 0, percentage: 0 };
    
    let amountSaved = 0;
    let percentageSaved = 0;
    
    if (mode === 'BUYING') {
      // For buying, savings is initialPrice - finalPrice
      amountSaved = initialPrice - finalPriceNum;
      percentageSaved = (amountSaved / initialPrice) * 100;
    } else {
      // For selling, profit is finalPrice - initialPrice
      amountSaved = finalPriceNum - targetPrice;
      percentageSaved = (amountSaved / targetPrice) * 100;
    }
    
    return {
      amount: amountSaved,
      percentage: percentageSaved
    };
  };
  
  const outcome = calculateOutcome();
  
  // Determine if target was met
  const isTargetMet = () => {
    if (!finalPrice) return false;
    
    const finalPriceNum = parseFloat(finalPrice);
    if (isNaN(finalPriceNum)) return false;
    
    if (mode === 'BUYING') {
      return finalPriceNum <= targetPrice;
    } else {
      return finalPriceNum >= targetPrice;
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      if (!finalPrice || isNaN(parseFloat(finalPrice))) {
        throw new Error('Please enter a valid final price');
      }
      
      // Call parent component's complete handler
      await onComplete({
        finalPrice: parseFloat(finalPrice),
        successful: successfulNegotiation,
        targetMet: isTargetMet(),
        savings: outcome.amount,
        savingsPercentage: outcome.percentage
      });
      
      // We don't need to call onClose here as it will be handled by the parent
    } catch (err) {
      console.error('Error ending negotiation:', err);
      setError(err.message || 'Failed to end negotiation');
      setLoading(false); // Only set loading to false on error
    }
    // No finally block to avoid state updates after unmounting
  };
  
  return (
    <div className={`modal-overlay ${isAnimating ? 'visible' : 'hiding'}`}>
      <div className={`modal-content end-negotiation-modal ${isAnimating ? 'visible' : 'hiding'}`}>
        <div className="modal-header">
          <h2>End Negotiation</h2>
          <button className="close-button" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="negotiation-summary">
              <div className="summary-item">
                <span className="label">Item:</span>
                <span className="value">{negotiationData?.itemName || 'Item'}</span>
              </div>
              
              <div className="summary-item">
                <span className="label">Initial Price:</span>
                <span className="value">
                  ${initialPrice.toFixed(2)}
                </span>
              </div>
              
              <div className="summary-item">
                <span className="label">Target Price:</span>
                <span className="value">
                  ${targetPrice.toFixed(2)}
                </span>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="finalPrice">
                <FiDollarSign />
                What was the final agreed price?
              </label>
              <div className="price-input-wrapper">
                <span className="currency-symbol">$</span>
                <input
                  type="number"
                  id="finalPrice"
                  value={finalPrice}
                  onChange={(e) => setFinalPrice(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>
            
            {finalPrice && (
              <div className="outcome-preview">
                <div className={`outcome-card ${outcome.amount >= 0 ? 'positive' : 'negative'}`}>
                  <div className="outcome-icon">
                    <FiTrendingUp />
                  </div>
                  <div className="outcome-data">
                    <span className="outcome-label">
                      {mode === 'BUYING' ? 'You saved:' : 'You gained:'}
                    </span>
                    <span className="outcome-value">
                      ${Math.abs(outcome.amount).toFixed(2)} ({Math.abs(outcome.percentage).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="target-indicator">
                    <div className="target-icon">
                      <FiTarget />
                    </div>
                    <span className={`target-status ${isTargetMet() ? 'met' : 'not-met'}`}>
                      {isTargetMet() ? 'Target met!' : 'Target not met'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="success-toggle">
              <span className="toggle-label">Was this negotiation successful?</span>
              <div className="toggle-buttons">
                <button
                  type="button"
                  className={`toggle-btn ${successfulNegotiation ? 'active' : ''}`}
                  onClick={() => setSuccessfulNegotiation(true)}
                >
                  <FiCheck /> Yes
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${!successfulNegotiation ? 'active' : ''}`}
                  onClick={() => setSuccessfulNegotiation(false)}
                >
                  <FiX /> No
                </button>
              </div>
            </div>
            
            {error && <div className="error-message">{error}</div>}
          </div>
          
          <div className="modal-footer">
            <button
              type="button"
              className="secondary-btn"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-btn"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'End Negotiation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EndNegotiationModal;
import React from 'react';
import { FiShoppingBag, FiTrendingUp } from 'react-icons/fi';
import { useNegotiation } from '../../../../context/NegotiationContext';

const ModeSelection = () => {
  const { formData, updateFormData } = useNegotiation();

  const handleModeToggle = (mode) => {
    if (mode === formData.mode) return;
    updateFormData({ mode, targetPrice: '' });
  };

  return (
    <div className="step-content mode-selection">
      <h2 className="step-title">What are you trying to do?</h2>
      <p className="step-description">Select your negotiation mode</p>
      
      <div className="mode-options">
        <div 
          className={`mode-option ${formData.mode === 'BUYING' ? 'selected' : ''}`}
          onClick={() => handleModeToggle('BUYING')}
        >
          <div className="option-icon">
            <FiShoppingBag />
          </div>
          <div className="option-content">
            <h3>I'm Buying</h3>
            <p>I want to pay less for something</p>
          </div>
          <div className="option-indicator"></div>
        </div>
        
        {/* Similar structure for SELLING option */}
      </div>
    </div>
  );
};

export default ModeSelection; 
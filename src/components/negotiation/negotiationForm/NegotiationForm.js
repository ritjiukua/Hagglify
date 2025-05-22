import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiHelpCircle, FiCheck, FiX, FiArrowLeft, FiArrowRight, FiChevronRight, FiDollarSign, FiMessageSquare, FiShield, FiTarget, FiTrendingUp, FiUser } from 'react-icons/fi';
import { IconContext } from 'react-icons';
import './NegotiationForm.scss';

const NegotiationForm = ({ onSubmit, initialData = null, loading = false, error = null }) => {
  // State for form data
  const [formData, setFormData] = useState({
    mode: initialData?.mode || 'assistant',
    negotiationType: initialData?.negotiationType || 'salary',
    currentAmount: initialData?.currentAmount || 50000,
    goalAmount: initialData?.goalAmount || 65000,
    minAcceptable: initialData?.minAcceptable || 58000,
    industry: initialData?.industry || '',
    experience: initialData?.experience || '',
    location: initialData?.location || '',
    companySize: initialData?.companySize || '',
    constraints: initialData?.constraints || '',
    keyPoints: initialData?.keyPoints || '',
    strategy: initialData?.strategy || 'balanced',
    acceptAutoRecommend: initialData?.acceptAutoRecommend || true,
  });
  
  // State for current step, loading, error, and animations
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(loading);
  const [formError, setFormError] = useState(error);
  const [animation, setAnimation] = useState('');
  const [formStatus, setFormStatus] = useState('editing'); // editing, submitting, success, error
  
  const formRef = useRef(null);
  const sliderRef = useRef(null);
  const isDragging = useRef(false);
  
  // Handle mode toggling
  const handleModeSelect = (mode) => {
    setFormData({
      ...formData,
      mode,
    });
  };
  
  // Handle form data changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  // Handle slider adjustment
  const handleSliderChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  // Move to next step with animation
  const handleNextStep = () => {
    if (currentStep < 5) {
      setAnimation('slide-out');
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setAnimation('slide-in');
      }, 300);
    }
  };
  
  // Move to previous step with animation
  const handlePrevStep = () => {
    if (currentStep > 1) {
      setAnimation('slide-out-reverse');
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setAnimation('slide-in-reverse');
      }, 300);
    }
  };
  
  // Jump to a specific step
  const jumpToStep = (step) => {
    if (step < currentStep) {
      setAnimation('slide-out-reverse');
      setTimeout(() => {
        setCurrentStep(step);
        setAnimation('slide-in-reverse');
      }, 300);
    } else if (step > currentStep) {
      setAnimation('slide-out');
      setTimeout(() => {
        setCurrentStep(step);
        setAnimation('slide-in');
      }, 300);
    }
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setFormStatus('submitting');
    setIsLoading(true);
    
    // Simulating API call delay
    setTimeout(() => {
      try {
        onSubmit(formData);
        setFormStatus('success');
      } catch (error) {
        setFormError('There was an error submitting your negotiation. Please try again.');
        setFormStatus('error');
      } finally {
        setIsLoading(false);
      }
    }, 1500);
  };
  
  // Validate current step before proceeding
  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return true; // Mode selection is always valid
      case 2:
        return formData.negotiationType && formData.currentAmount > 0 && formData.goalAmount > 0;
      case 3:
        return formData.industry && formData.experience;
      case 4:
        return formData.keyPoints;
      default:
        return true;
    }
  };
  
  // Format currency values
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  // Determine if user can proceed to next step
  const canProceed = validateCurrentStep();
  
  // Slider interaction logic
  const handleSliderMouseDown = (e, name) => {
    isDragging.current = name;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current || !sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const position = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    
    if (isDragging.current === 'currentAmount') {
      const value = Math.round(position * 100000);
      setFormData(prev => ({
        ...prev,
        currentAmount: value
      }));
    } else if (isDragging.current === 'goalAmount') {
      const value = Math.round(position * 150000);
      setFormData(prev => ({
        ...prev,
        goalAmount: value
      }));
    } else if (isDragging.current === 'minAcceptable') {
      const value = Math.round(position * 150000);
      setFormData(prev => ({
        ...prev,
        minAcceptable: value
      }));
    }
  }, []);
  
  const handleMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  
  // Initialize component
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [initialData, handleMouseMove]);
  
  // Update loading and error states from props
  useEffect(() => {
    setIsLoading(loading);
    setFormError(error);
  }, [loading, error]);
  
  return (
    <div className="negotiation-form-container">
      <div className="form-background">
        <div className="bg-accent accent-1"></div>
        <div className="bg-accent accent-2"></div>
      </div>
      
      <form ref={formRef} onSubmit={handleSubmit}>
        {currentStep < 5 && (
          <div className="form-progress">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`progress-step ${currentStep === step ? 'active' : ''} ${
                  step < currentStep ? 'completed' : ''
                }`}
                onClick={() => step < currentStep && jumpToStep(step)}
              >
                <div className="step-number">
                  {step < currentStep ? <FiCheck size={12} /> : step}
                </div>
                <div className="step-label">
                  {step === 1 ? 'Mode' : step === 2 ? 'Details' : step === 3 ? 'Context' : 'Strategy'}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="form-card">
          {/* Step 1: Mode Selection */}
          {currentStep === 1 && (
            <div className={`form-step ${animation}`}>
              <div className="step-content mode-selection">
                <h2 className="step-title">Choose Your Negotiation Mode</h2>
                <p className="step-description">
                  Select how you'd like the AI to assist with your negotiation.
                </p>
                
                <div className="mode-options">
                  <div
                    className={`mode-option ${formData.mode === 'assistant' ? 'selected' : ''}`}
                    onClick={() => handleModeSelect('assistant')}
                  >
                    <div className="option-icon">
                      <FiMessageSquare />
                    </div>
                    <div className="option-content">
                      <h3>AI Assistant</h3>
                      <p>Get guidance and suggestions during your negotiation in real-time.</p>
                    </div>
                  </div>
                  
                  <div
                    className={`mode-option ${formData.mode === 'simulation' ? 'selected' : ''}`}
                    onClick={() => handleModeSelect('simulation')}
                  >
                    <div className="option-icon">
                      <FiTarget />
                    </div>
                    <div className="option-content">
                      <h3>Simulation</h3>
                      <p>Practice your negotiation with an AI that simulates realistic responses.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="form-actions">
                <div></div>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleNextStep}
                >
                  Continue <FiChevronRight />
                </button>
              </div>
            </div>
          )}
          
          {/* Step 2: Negotiation Details */}
          {currentStep === 2 && (
            <div className={`form-step ${animation}`}>
              <div className="step-content">
                <h2 className="step-title">What Are You Negotiating?</h2>
                <p className="step-description">
                  Tell us about the specifics of your negotiation.
                </p>
                
                <div className="form-fields">
                  <div className="section-title with-info">
                    Negotiation Type
                    <span className="info-icon">
                      <FiHelpCircle />
                    </span>
                  </div>
                  
                  <div className="radio-group">
                    <div className="radio-options">
                      <div
                        className={`radio-option ${formData.negotiationType === 'salary' ? 'selected' : ''}`}
                        onClick={() => handleInputChange({ target: { name: 'negotiationType', value: 'salary' } })}
                      >
                        <div className="radio-indicator"></div>
                        <div className="radio-label">Salary</div>
                      </div>
                      
                      <div
                        className={`radio-option ${formData.negotiationType === 'job-offer' ? 'selected' : ''}`}
                        onClick={() => handleInputChange({ target: { name: 'negotiationType', value: 'job-offer' } })}
                      >
                        <div className="radio-indicator"></div>
                        <div className="radio-label">Job Offer</div>
                      </div>
                      
                      <div
                        className={`radio-option ${formData.negotiationType === 'raise' ? 'selected' : ''}`}
                        onClick={() => handleInputChange({ target: { name: 'negotiationType', value: 'raise' } })}
                      >
                        <div className="radio-indicator"></div>
                        <div className="radio-label">Raise</div>
                      </div>
                      
                      <div
                        className={`radio-option ${formData.negotiationType === 'benefits' ? 'selected' : ''}`}
                        onClick={() => handleInputChange({ target: { name: 'negotiationType', value: 'benefits' } })}
                      >
                        <div className="radio-indicator"></div>
                        <div className="radio-label">Benefits</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="slider-control">
                    <div className="slider-header">
                      <span className="slider-label">
                        Current Amount
                        <span className="info-icon">
                          <FiHelpCircle />
                        </span>
                      </span>
                      <span className="slider-value">{formatCurrency(formData.currentAmount)}</span>
                    </div>
                    
                    <div className="slider-container" ref={sliderRef}>
                      <div
                        className="slider-progress"
                        style={{ width: `${(formData.currentAmount / 100000) * 100}%` }}
                      ></div>
                      <div
                        className="slider-thumb"
                        style={{ left: `${(formData.currentAmount / 100000) * 100}%` }}
                        onMouseDown={(e) => handleSliderMouseDown(e, 'currentAmount')}
                      ></div>
                    </div>
                    
                    <div className="slider-ticks">
                      <span className="tick">$0</span>
                      <span className="tick">$25k</span>
                      <span className="tick">$50k</span>
                      <span className="tick">$75k</span>
                      <span className="tick">$100k</span>
                    </div>
                  </div>
                  
                  <div className="slider-control">
                    <div className="slider-header">
                      <span className="slider-label">
                        Goal Amount
                        <span className="info-icon">
                          <FiHelpCircle />
                        </span>
                      </span>
                      <span className="slider-value">{formatCurrency(formData.goalAmount)}</span>
                    </div>
                    
                    <div className="slider-container">
                      <div
                        className="slider-progress"
                        style={{ width: `${(formData.goalAmount / 150000) * 100}%` }}
                      ></div>
                      <div
                        className="slider-thumb"
                        style={{ left: `${(formData.goalAmount / 150000) * 100}%` }}
                        onMouseDown={(e) => handleSliderMouseDown(e, 'goalAmount')}
                      ></div>
                    </div>
                    
                    <div className="slider-ticks">
                      <span className="tick">$0</span>
                      <span className="tick">$37.5k</span>
                      <span className="tick">$75k</span>
                      <span className="tick">$112.5k</span>
                      <span className="tick">$150k</span>
                    </div>
                  </div>
                  
                  <div className="slider-control">
                    <div className="slider-header">
                      <span className="slider-label">
                        Minimum Acceptable
                        <span className="info-icon">
                          <FiHelpCircle />
                        </span>
                      </span>
                      <span className="slider-value">{formatCurrency(formData.minAcceptable)}</span>
                    </div>
                    
                    <div className="slider-container">
                      <div
                        className="slider-progress"
                        style={{ width: `${(formData.minAcceptable / 150000) * 100}%` }}
                      ></div>
                      <div
                        className="slider-thumb"
                        style={{ left: `${(formData.minAcceptable / 150000) * 100}%` }}
                        onMouseDown={(e) => handleSliderMouseDown(e, 'minAcceptable')}
                      ></div>
                    </div>
                    
                    <div className="slider-ticks">
                      <span className="tick">$0</span>
                      <span className="tick">$37.5k</span>
                      <span className="tick">$75k</span>
                      <span className="tick">$112.5k</span>
                      <span className="tick">$150k</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={handlePrevStep}>
                  <FiArrowLeft /> Back
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleNextStep}
                  disabled={!canProceed}
                >
                  Continue <FiArrowRight />
                </button>
              </div>
            </div>
          )}
          
          {/* Step 3: Context Information */}
          {currentStep === 3 && (
            <div className={`form-step ${animation}`}>
              <div className="step-content">
                <h2 className="step-title">Additional Context</h2>
                <p className="step-description">
                  Provide more information to help tailor the negotiation strategy.
                </p>
                
                <div className="form-fields">
                  <div className="form-row">
                    <div className="form-col">
                      <div className="floating-input">
                        <select
                          id="industry"
                          name="industry"
                          value={formData.industry}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="" disabled>Select Industry</option>
                          <option value="technology">Technology</option>
                          <option value="healthcare">Healthcare</option>
                          <option value="finance">Finance</option>
                          <option value="education">Education</option>
                          <option value="manufacturing">Manufacturing</option>
                          <option value="retail">Retail</option>
                          <option value="other">Other</option>
                        </select>
                        <label htmlFor="industry">Industry</label>
                      </div>
                    </div>
                    
                    <div className="form-col">
                      <div className="floating-input">
                        <select
                          id="experience"
                          name="experience"
                          value={formData.experience}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="" disabled>Select Experience</option>
                          <option value="entry">Entry Level (0-2 years)</option>
                          <option value="mid">Mid Level (3-5 years)</option>
                          <option value="senior">Senior (6-10 years)</option>
                          <option value="expert">Expert (10+ years)</option>
                        </select>
                        <label htmlFor="experience">Experience Level</label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-col">
                      <div className="floating-input">
                        <input
                          type="text"
                          id="location"
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          placeholder=" "
                        />
                        <label htmlFor="location">Location</label>
                      </div>
                    </div>
                    
                    <div className="form-col">
                      <div className="floating-input">
                        <select
                          id="companySize"
                          name="companySize"
                          value={formData.companySize}
                          onChange={handleInputChange}
                        >
                          <option value="" disabled>Select Company Size</option>
                          <option value="startup">Startup (1-50)</option>
                          <option value="small">Small (51-200)</option>
                          <option value="medium">Medium (201-1000)</option>
                          <option value="large">Large (1000+)</option>
                        </select>
                        <label htmlFor="companySize">Company Size</label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="floating-input">
                    <textarea
                      id="constraints"
                      name="constraints"
                      value={formData.constraints}
                      onChange={handleInputChange}
                      placeholder=" "
                      rows="3"
                    ></textarea>
                    <label htmlFor="constraints">Any Constraints or Deadlines</label>
                  </div>
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={handlePrevStep}>
                  <FiArrowLeft /> Back
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleNextStep}
                  disabled={!canProceed}
                >
                  Continue <FiArrowRight />
                </button>
              </div>
            </div>
          )}
          
          {/* Step 4: Strategy */}
          {currentStep === 4 && (
            <div className={`form-step ${animation}`}>
              <div className="step-content">
                <h2 className="step-title">Negotiation Strategy</h2>
                <p className="step-description">
                  Define your approach and key points for the negotiation.
                </p>
                
                <div className="form-fields">
                  <div className="floating-input">
                    <textarea
                      id="keyPoints"
                      name="keyPoints"
                      value={formData.keyPoints}
                      onChange={handleInputChange}
                      placeholder=" "
                      rows="4"
                      required
                    ></textarea>
                    <label htmlFor="keyPoints">Key Points & Strengths</label>
                  </div>
                  
                  <div className="section-title with-info">
                    Negotiation Style
                    <span className="info-icon">
                      <FiHelpCircle />
                    </span>
                  </div>
                  
                  <div className="radio-group">
                    <div className="radio-options">
                      <div
                        className={`radio-option ${formData.strategy === 'aggressive' ? 'selected' : ''}`}
                        onClick={() => handleInputChange({ target: { name: 'strategy', value: 'aggressive' } })}
                      >
                        <div className="radio-indicator"></div>
                        <div className="radio-label">Assertive</div>
                      </div>
                      
                      <div
                        className={`radio-option ${formData.strategy === 'balanced' ? 'selected' : ''}`}
                        onClick={() => handleInputChange({ target: { name: 'strategy', value: 'balanced' } })}
                      >
                        <div className="radio-indicator"></div>
                        <div className="radio-label">Balanced</div>
                      </div>
                      
                      <div
                        className={`radio-option ${formData.strategy === 'collaborative' ? 'selected' : ''}`}
                        onClick={() => handleInputChange({ target: { name: 'strategy', value: 'collaborative' } })}
                      >
                        <div className="radio-indicator"></div>
                        <div className="radio-label">Collaborative</div>
                      </div>
                    </div>
                  </div>
                  
                  <div
                    className="checkbox-field"
                    onClick={() =>
                      handleInputChange({
                        target: { name: 'acceptAutoRecommend', value: !formData.acceptAutoRecommend },
                      })
                    }
                  >
                    <div className={`custom-checkbox ${formData.acceptAutoRecommend ? 'checked' : ''}`}></div>
                    <div className="checkbox-label">
                      Receive AI-recommended negotiation angles based on my information
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={handlePrevStep}>
                  <FiArrowLeft /> Back
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleNextStep}
                  disabled={!canProceed}
                >
                  Review <FiArrowRight />
                </button>
              </div>
            </div>
          )}
          
          {/* Step 5: Review */}
          {currentStep === 5 && (
            <div className={`form-step ${animation}`}>
              <div className="step-content">
                <h2 className="step-title">Review Your Negotiation</h2>
                <p className="step-description">
                  Please review your information before starting the negotiation.
                </p>
                
                <div className="review-section">
                  <div className="review-summary">
                    <div className="summary-title">Negotiation Summary</div>
                    
                    <div className="summary-row">
                      <div className="row-label">Mode</div>
                      <div className="row-value">
                        {formData.mode === 'assistant' ? 'AI Assistant' : 'Simulation'}
                      </div>
                    </div>
                    
                    <div className="summary-row">
                      <div className="row-label">Type</div>
                      <div className="row-value">
                        {formData.negotiationType.charAt(0).toUpperCase() + formData.negotiationType.slice(1)}
                      </div>
                    </div>
                    
                    <div className="summary-row">
                      <div className="row-label">Current Amount</div>
                      <div className="row-value">{formatCurrency(formData.currentAmount)}</div>
                    </div>
                    
                    <div className="summary-row">
                      <div className="row-label">Goal Amount</div>
                      <div className="row-value highlight">{formatCurrency(formData.goalAmount)}</div>
                    </div>
                    
                    <div className="summary-row">
                      <div className="row-label">Minimum Acceptable</div>
                      <div className="row-value">{formatCurrency(formData.minAcceptable)}</div>
                    </div>
                    
                    <div className="summary-row">
                      <div className="row-label">Industry</div>
                      <div className="row-value">
                        {formData.industry.charAt(0).toUpperCase() + formData.industry.slice(1)}
                      </div>
                    </div>
                    
                    <div className="summary-row">
                      <div className="row-label">Experience</div>
                      <div className="row-value">
                        {formData.experience === 'entry'
                          ? 'Entry Level (0-2 years)'
                          : formData.experience === 'mid'
                          ? 'Mid Level (3-5 years)'
                          : formData.experience === 'senior'
                          ? 'Senior (6-10 years)'
                          : 'Expert (10+ years)'}
                      </div>
                    </div>
                    
                    <div className="summary-row">
                      <div className="row-label">Strategy</div>
                      <div className="row-value">
                        {formData.strategy.charAt(0).toUpperCase() + formData.strategy.slice(1)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={handlePrevStep}>
                  <FiArrowLeft /> Back
                </button>
                <button type="submit" className="btn-primary" disabled={isLoading}>
                  Start Negotiation <FiChevronRight />
                </button>
              </div>
            </div>
          )}
          
          {/* Success message */}
          {formStatus === 'success' && (
            <div className="form-step fade-in">
              <div className="success-message">
                <div className="success-icon">
                  <FiCheck />
                </div>
                <h2 className="success-title">Negotiation Started!</h2>
                <p className="success-text">
                  Your negotiation has been set up successfully. The AI is now ready to assist you.
                </p>
                <button type="button" className="success-action">
                  Continue to Chat <FiArrowRight className="action-icon" />
                </button>
              </div>
            </div>
          )}
          
          {/* Loading overlay */}
          {isLoading && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
              <div className="loading-text">Setting up your negotiation...</div>
            </div>
          )}
          
          {/* Error message */}
          {formError && (
            <div className="form-error">
              <FiX />
              <span>{formError}</span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default NegotiationForm; 
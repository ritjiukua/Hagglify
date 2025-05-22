import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FiArrowRight, 
  FiDollarSign, 
  FiSend, 
  FiAlertCircle, 
  FiSettings,
  FiX,
  FiMessageSquare,
  FiTag,
  FiTarget,
  FiClock,
  FiTrendingUp,
  FiTrendingDown,
  FiInfo,
  FiCheckCircle,
  FiFileText
} from 'react-icons/fi';
import { getChatById, createNewChat, saveMessage } from '../../../services/negotiationService';
import { generateNegotiationResponse, generateSuggestions, generateWelcomeMessage } from '../../../services/gptService';
import { logDebug, logError, LOG_TYPES } from '../../../services/debugService';
import EndNegotiationModal from '../endNegotiationModel/EndNegotiationModal';
import LoadingSpinner from '../../common/LoadingSpinner';
import './Negotiator.scss';

const Negotiator = () => {
  // Add a mounted ref to track component mount state
  const isMountedRef = useRef(true);
  
  // States for chat data
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  
  // States for negotiation data
  const [negotiationData, setNegotiationData] = useState({
    itemName: '',
    initialPrice: '',
    targetPrice: '',
    mode: 'BUYING',
    notes: ''
  });
  
  // States for UI controls
  const [isSettingUp, setIsSettingUp] = useState(true);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [chatCompleted, setChatCompleted] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  
  // Refs
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const timerRef = useRef(null);
  
  // Hooks
  const navigate = useNavigate();
  const location = useLocation();

  // Add these state variables near your other state declarations
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Add these functions for step navigation
  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Start timer when chat begins
  useEffect(() => {
    if (!isSettingUp && !chatCompleted) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSettingUp, chatCompleted]);
  
  // Format elapsed time
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Generate negotiation suggestions
  useEffect(() => {
    if (!isSettingUp && messages.length > 0) {
      generateSuggestions();
    }
  }, [messages, isSettingUp]);
  
  const generateSuggestions = () => {
    // Simple suggestion generation based on negotiation mode and progress
    const defaultSuggestions = [
      "Ask about the condition or specifics of the item",
      "Mention that you've seen similar items at a different price",
      "Request more details before discussing price further"
    ];
    
    const buyingSuggestions = [
      `Offer ${((parseFloat(negotiationData.initialPrice) + parseFloat(negotiationData.targetPrice)) / 2).toFixed(2)} as a compromise`,
      `Ask if they can include any extras or bonuses at the current price`,
      `Mention that you're considering other options at lower prices`
    ];
    
    const sellingSuggestions = [
      `Emphasize the quality and condition of your ${negotiationData.itemName}`,
      `Mention that you have other interested buyers`,
      `Suggest a small discount if they can pay immediately`
    ];
    
    setSuggestions([
      ...defaultSuggestions,
      ...(negotiationData.mode === 'BUYING' ? buyingSuggestions : sellingSuggestions)
    ]);
  };

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Check for chat ID in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('chatId');
    
    if (id) {
      setChatId(id);
      setIsSettingUp(false);
    } else {
      setIsLoading(false);
    }
  }, [location]);
  
  // Load chat data if chat ID exists
  useEffect(() => {
    if (!chatId) return;
    
    const loadChatData = async () => {
      try {
        setIsLoading(true);
        const chatData = await getChatById(chatId);
        
        if (!chatData) {
          throw new Error('Chat not found');
        }
        
        if (isMountedRef.current) {
          setMessages(chatData.messages || []);
          setChatCompleted(chatData.completed || false);
          
          setNegotiationData({
            itemName: chatData.item_name || '',
            initialPrice: chatData.initial_price || '',
            targetPrice: chatData.target_price || '',
            mode: chatData.mode || 'BUYING',
            notes: chatData.notes || ''
          });
        }
        
      } catch (err) {
        console.error('Error loading chat:', err);
        if (isMountedRef.current) {
          setError('Failed to load conversation. Please try again.');
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };
    
    loadChatData();
  }, [chatId]);
  
  // Handle form submission for starting a new negotiation
  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      logDebug('Starting new negotiation', LOG_TYPES.COMPONENT, negotiationData);
      
      // Validate form inputs
      if (!negotiationData.itemName.trim()) {
        throw new Error('Please enter an item name');
      }
      
      if (!negotiationData.initialPrice || isNaN(parseFloat(negotiationData.initialPrice))) {
        throw new Error('Please enter a valid initial price');
      }
      
      if (!negotiationData.targetPrice || isNaN(parseFloat(negotiationData.targetPrice))) {
        throw new Error('Please enter a valid target price');
      }
      
      // Create a new chat with client-side timestamp
      const newChatData = {
        item_name: negotiationData.itemName,
        initial_price: parseFloat(negotiationData.initialPrice),
        target_price: parseFloat(negotiationData.targetPrice),
        mode: negotiationData.mode,
        notes: negotiationData.notes
      };
      
      const newChatId = await createNewChat(newChatData);
      
      if (isMountedRef.current) {
        // Add system message
        const systemMessage = {
          sender: 'system',
          content: `New negotiation started for ${negotiationData.itemName}. ${
            negotiationData.mode === 'BUYING' 
              ? `You're buying at target price: $${negotiationData.targetPrice} (initial: $${negotiationData.initialPrice}).` 
              : `You're selling at target price: $${negotiationData.targetPrice} (initial: $${negotiationData.initialPrice}).`
          } ${negotiationData.notes ? `Notes: ${negotiationData.notes}` : ''}`,
          timestamp: new Date().toISOString()
        };
        
        // Generate GPT welcome message
        let welcomeContent;
        try {
          logDebug('Generating welcome message from GPT', LOG_TYPES.API, negotiationData);
          welcomeContent = await generateWelcomeMessage(negotiationData);
        } catch (apiError) {
          logError(apiError, 'Failed to generate welcome message');
          welcomeContent = negotiationData.mode === 'BUYING'
            ? `Hello there! I'm selling this ${negotiationData.itemName} for $${negotiationData.initialPrice}. What's your offer?`
            : `Hi! I'm interested in your ${negotiationData.itemName}. You're asking $${negotiationData.initialPrice}, right?`;
        }
        
        // Add first assistant message
        const welcomeMessage = {
          sender: 'assistant',
          content: welcomeContent,
          timestamp: new Date().toISOString()
        };
        
        setMessages([systemMessage, welcomeMessage]);
        setChatId(newChatId);
        setIsSettingUp(false);
        
        // Update URL with new chatId without page reload
        navigate(`/negotiator?chatId=${newChatId}`, { replace: true });
        
        // Save messages with client-side timestamp
        await saveMessage(newChatId, {
          sender: 'system',
          message: systemMessage.content,
          timestamp: new Date().toISOString()
        });
        
        await saveMessage(newChatId, {
          sender: 'assistant',
          message: welcomeMessage.content,
          timestamp: new Date().toISOString()
        });
      }
      
    } catch (err) {
      logError(err, 'Error starting negotiation');
      if (isMountedRef.current) {
        setError(err.message || 'Failed to start negotiation. Please try again.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };
  
  // Check if a message is a system message
  const isSystemMessage = (message) => {
    return message.role === 'system' || message.sender === 'system';
  };
  
  // Add this state to track AI price mentions
  const [aiPriceMentions, setAiPriceMentions] = useState([]);
  
  // Send a new message in the chat
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    
    if (!inputMessage.trim() || isSending) return;
    
    try {
      setIsSending(true);
      logDebug('Sending user message', LOG_TYPES.COMPONENT, { message: inputMessage });
      
      // Create user message
      const userMessage = {
        sender: 'user',
        content: inputMessage.trim(),
        timestamp: new Date().toISOString()
      };
      
      // Add message to local state immediately for UI
      setMessages(prevMessages => [...prevMessages, userMessage]);
      setInputMessage('');
      
      // Save user message to Firebase
      await saveMessage(chatId, userMessage);
      
      // Prepare existing messages for GPT
      const messageHistory = messages
        .filter(msg => !isSystemMessage(msg))
        .map(msg => ({
          sender: msg.sender || msg.role,
          text: msg.content || msg.message
        }));
      
      // Add the user's new message to history
      messageHistory.push({
        sender: 'user',
        text: userMessage.content
      });
      
      // API call to get AI response
      let aiResponseText;
      try {
        logDebug('Calling GPT API for response', LOG_TYPES.API, { negotiationData, messageHistory });
        aiResponseText = await generateNegotiationResponse(messageHistory, negotiationData);
        
        // Extract prices from the AI response
        const priceMatches = aiResponseText.match(/\$(\d+(?:\.\d+)?)/g);
        if (priceMatches) {
          const newPrices = priceMatches.map(match => parseFloat(match.replace('$', '')))
            .filter(price => !isNaN(price));
          
          if (newPrices.length > 0) {
            setAiPriceMentions(prev => [...prev, ...newPrices]);
          }
        }
        
        // Generate suggestions separately and safely
        if (isMountedRef.current) {
          try {
            logDebug('Generating suggestions from AI response', LOG_TYPES.API);
            const suggestionsResult = await generateSuggestions(userMessage.content, negotiationData);
            if (isMountedRef.current && suggestionsResult && Array.isArray(suggestionsResult)) {
              setSuggestions(suggestionsResult);
            }
          } catch (suggestionError) {
            logError(suggestionError, 'Failed to generate suggestions');
            // Don't let suggestion errors affect the main flow
          }
        }
        
      } catch (apiError) {
        logError(apiError, 'GPT API Error', { negotiationData });
        // Fallback to simple response if API fails
        aiResponseText = getFallbackResponse(negotiationData);
      }
      
      // Create AI response object
      const aiResponse = {
        sender: 'assistant',
        content: aiResponseText,
        timestamp: new Date().toISOString()
      };
      
      // Add AI response to local state
      if (isMountedRef.current) {
        setMessages(prevMessages => [...prevMessages, aiResponse]);
      }
      
      // Save AI response to Firebase
      await saveMessage(chatId, aiResponse);
      
      if (isMountedRef.current) {
        setIsSending(false);
      }
    } catch (error) {
      logError(error, 'Error sending message');
      if (isMountedRef.current) {
        setError('Failed to send message. Please try again.');
        setIsSending(false);
      }
    }
  };
  
  // Fallback function for when API fails
  const getFallbackResponse = (negotiationData) => {
    const isBuying = negotiationData.mode === 'BUYING';
    const initialPrice = parseFloat(negotiationData.initialPrice);
    const targetPrice = parseFloat(negotiationData.targetPrice);
    
    const responses = isBuying ? [
      `I appreciate your interest in the ${negotiationData.itemName}, but I can't go below $${(initialPrice * 0.9).toFixed(2)}.`,
      `Thank you for your offer. I can come down to $${(initialPrice * 0.85).toFixed(2)} if you can pay today.`,
      `The best I can do is $${(targetPrice * 1.1).toFixed(2)}. This is a quality item worth every penny.`,
      `I understand your budget constraints. Let's meet in the middle at $${((initialPrice + targetPrice) / 2).toFixed(2)}.`
    ] : [
      `Thanks for your interest. I'm looking to get at least $${(targetPrice * 0.95).toFixed(2)} for my ${negotiationData.itemName}.`,
      `I've had several interested buyers. Could you go up to $${(initialPrice * 1.1).toFixed(2)}?`,
      `Given the condition of the item, I think $${targetPrice.toFixed(2)} is a fair price.`,
      `I need to cover my costs. How about $${((initialPrice + targetPrice) / 2).toFixed(2)}?`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };
  
  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
  };
  
  // Add this state to track modal animation
  const [modalAnimating, setModalAnimating] = useState(false);
  
  // Update the handleEndNegotiation function to manage animation
  const handleEndNegotiation = () => {
    setModalAnimating(true);
    setIsEndModalOpen(true);
  };
  
  // Update the modal close handler
  const handleCloseEndModal = () => {
    setModalAnimating(false);
    setTimeout(() => {
      setIsEndModalOpen(false);
    }, 300); // Match animation duration
  };
  
  // Update the complete negotiation handler to manage animation
  const handleCompleteNegotiation = async (finalData) => {
    try {
      setModalAnimating(false);
      
      // Add a small delay to allow the modal close animation to play
      setTimeout(async () => {
        // Close modal
        setIsEndModalOpen(false);
        
        // Update chat status
        setChatCompleted(true);
        
        // Show completion message
        const completionMessage = {
          role: 'system',
          content: `Negotiation completed. Final price: $${finalData.finalPrice}`,
          timestamp: new Date().toISOString()
        };
        
        if (isMountedRef.current) {
          setMessages(prev => [...prev, completionMessage]);
        }
        
        // Update backend with final price if you have an API for this
        // await updateNegotiationStatus(chatId, true, finalData);
        
      }, 300);
      
    } catch (err) {
      console.error('Error completing negotiation:', err);
      if (isMountedRef.current) {
        setError('Failed to complete negotiation. Please try again.');
      }
    }
  };
  
  // Set up cleanup for the component
  useEffect(() => {
    // Set mounted flag to true when component mounts
    isMountedRef.current = true;
    
    // Cleanup function to run when component unmounts
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Simplify this calculation function
  const calculateSavingsOrProfit = () => {
    if (!negotiationData.initialPrice || !negotiationData.targetPrice) return 0;
    
    const initial = parseFloat(negotiationData.initialPrice);
    const target = parseFloat(negotiationData.targetPrice);
    
    if (negotiationData.mode === 'BUYING') {
      // For buying: how much you save
      return (initial - target).toFixed(2);
    } else {
      // For selling: difference between minimum and asking
      return (initial - target).toFixed(2);
    }
  };

  // Add this state to track slider interaction
  const [sliderFocused, setSliderFocused] = useState(false);
  
  // Add this state for controlling animation
  const [chatVisible, setChatVisible] = useState(false);
  
  // Add this useEffect to handle animation timing when chat starts
  useEffect(() => {
    if (!isSettingUp && !chatCompleted) {
      // Small delay to ensure smooth transition
      setTimeout(() => {
        setChatVisible(true);
        document.body.classList.add('negotiation-active');
      }, 300);
    }
    
    return () => {
      document.body.classList.remove('negotiation-active');
    };
  }, [isSettingUp, chatCompleted]);
  
  // Render setup form
  if (isSettingUp) {
    return (
      <div className="negotiation-setup">
        <div className="setup-container">
          <h2>Set Up Your Negotiation</h2>
          <p className="setup-description">
            Enter the details of what you're negotiating to get personalized assistance.
          </p>
          
          {error && (
            <div className="error-message">
              <FiAlertCircle />
              <span>{error}</span>
            </div>
          )}
          
          <div className="stepper-progress">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div 
                key={index}
                className={`step-indicator ${currentStep >= index + 1 ? 'active' : ''} ${currentStep > index + 1 ? 'completed' : ''}`}
                onClick={() => currentStep > index + 1 && setCurrentStep(index + 1)}
              >
                <div className="step-number">
                  {currentStep > index + 1 ? <FiCheckCircle className="check-icon" /> : index + 1}
                </div>
                <div className="step-label">
                  {index === 0 ? 'Item' : index === 1 ? 'Price' : 'Review'}
                </div>
                {index < totalSteps - 1 && <div className="step-connector"></div>}
              </div>
            ))}
          </div>
          
          <form className="setup-form stepper-form" onSubmit={handleSetupSubmit}>
            <div className="form-step-container">
              {/* Step 1: Item Information */}
              <div className={`form-step ${currentStep === 1 ? 'active' : ''}`}>
                <h3 className="step-title">
                  <span className="step-title-number">1</span>
                  <span className="step-title-text">Item Details</span>
                </h3>
                
                <div className="form-section">
                  <div className="form-group">
                    <label htmlFor="itemName">
                      <FiTag className="field-icon" />
                      Item Name
                    </label>
                    <input
                      type="text"
                      id="itemName"
                      className="modern-input"
                      placeholder="e.g. iPhone 13, Car, Consulting Services"
                      value={negotiationData.itemName}
                      onChange={(e) => setNegotiationData(prev => ({ ...prev, itemName: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="mode-selection">
                    <label>I am:</label>
                    <div className="mode-buttons">
                      <button
                        type="button"
                        className={`mode-btn ${negotiationData.mode === 'BUYING' ? 'active' : ''}`}
                        onClick={() => setNegotiationData(prev => ({ ...prev, mode: 'BUYING' }))}
                      >
                        <FiTrendingDown className="mode-icon" />
                        <span>Buying</span>
                      </button>
                      <button
                        type="button"
                        className={`mode-btn ${negotiationData.mode === 'SELLING' ? 'active' : ''}`}
                        onClick={() => setNegotiationData(prev => ({ ...prev, mode: 'SELLING' }))}
                      >
                        <FiTrendingUp className="mode-icon" />
                        <span>Selling</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Step 2: Price Information */}
              <div className={`form-step ${currentStep === 2 ? 'active' : ''}`}>
                <h3 className="step-title">
                  <span className="step-title-number">2</span>
                  <span className="step-title-text">Price Information</span>
                </h3>
                
                <div className="form-section">
                  <div className="price-inputs-container">
                    <div className="form-group">
                      <label htmlFor="initialPrice">
                        <FiDollarSign className="field-icon" />
                        {negotiationData.mode === 'BUYING' ? 'Current Asking Price' : 'Your Asking Price'}
                      </label>
                      <div className="price-input">
                        <span className="currency">$</span>
                        <input
                          type="number"
                          id="initialPrice"
                          className="modern-input"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          value={negotiationData.initialPrice}
                          onChange={(e) => {
                            const value = e.target.value;
                            setNegotiationData(prev => ({ ...prev, initialPrice: value }));
                            
                            // If target price is not set yet and this is first price entered
                            if (!negotiationData.targetPrice && value) {
                              const parsedValue = parseFloat(value);
                              // Set a default target price as 10% better than initial
                              const defaultTarget = negotiationData.mode === 'BUYING' 
                                ? (parsedValue * 0.9).toFixed(2) 
                                : (parsedValue * 0.9).toFixed(2);
                              setNegotiationData(prev => ({ ...prev, targetPrice: defaultTarget }));
                            }
                          }}
                          required
                        />
                      </div>
                      {negotiationData.mode === 'BUYING' && (
                        <div className="price-hint">The price currently being asked</div>
                      )}
                      {negotiationData.mode === 'SELLING' && (
                        <div className="price-hint">The price you'd like to get</div>
                      )}
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="targetPrice">
                        <FiTarget className="field-icon" />
                        {negotiationData.mode === 'BUYING' ? 'Your Target Price' : 'Your Minimum Price'}
                      </label>
                      <div className="price-input">
                        <span className="currency">$</span>
                        <input
                          type="number"
                          id="targetPrice"
                          className="modern-input"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          value={negotiationData.targetPrice}
                          onChange={(e) => setNegotiationData(prev => ({ ...prev, targetPrice: e.target.value }))}
                          required
                        />
                      </div>
                      {negotiationData.mode === 'BUYING' && (
                        <div className="price-hint">The price you're hoping to pay</div>
                      )}
                      {negotiationData.mode === 'SELLING' && (
                        <div className="price-hint">The lowest price you'll accept</div>
                      )}
                    </div>
                  </div>
                  
                  {negotiationData.initialPrice && negotiationData.targetPrice && (
                    <div className="simple-price-visual">
                      <div className="price-visual-header">
                        <h4>Your Negotiation at a Glance</h4>
                      </div>
                      
                      <div className="price-bar-container">
                        {negotiationData.mode === 'BUYING' ? (
                          <>
                            <div className="price-endpoint target">
                              <div className="endpoint-amount">${parseFloat(negotiationData.targetPrice).toFixed(2)}</div>
                              <div className="endpoint-label">Your Target</div>
                            </div>
                            
                            <div className="price-difference-bar buying">
                              <div className="difference-amount">
                                ${Math.abs(parseFloat(negotiationData.initialPrice) - parseFloat(negotiationData.targetPrice)).toFixed(2)}
                              </div>
                              <div className="difference-label">
                                Potential Savings
                              </div>
                            </div>
                            
                            <div className="price-endpoint asking">
                              <div className="endpoint-amount">${parseFloat(negotiationData.initialPrice).toFixed(2)}</div>
                              <div className="endpoint-label">Asking Price</div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="price-endpoint asking">
                              <div className="endpoint-amount">${parseFloat(negotiationData.initialPrice).toFixed(2)}</div>
                              <div className="endpoint-label">Your Ask</div>
                            </div>
                            
                            <div className="price-difference-bar selling">
                              <div className="difference-amount">
                                ${Math.abs(parseFloat(negotiationData.initialPrice) - parseFloat(negotiationData.targetPrice)).toFixed(2)}
                              </div>
                              <div className="difference-label">
                                Your Flexibility
                              </div>
                            </div>
                            
                            <div className="price-endpoint target">
                              <div className="endpoint-amount">${parseFloat(negotiationData.targetPrice).toFixed(2)}</div>
                              <div className="endpoint-label">Your Minimum</div>
                            </div>
                          </>
                        )}
                      </div>
                      
                      <div className="price-explanation">
                        {negotiationData.mode === 'BUYING' ? (
                          <p>
                            You're trying to save <strong>${Math.abs(parseFloat(negotiationData.initialPrice) - parseFloat(negotiationData.targetPrice)).toFixed(2)}</strong> from the current asking price.
                          </p>
                        ) : (
                          <p>
                            You have <strong>${Math.abs(parseFloat(negotiationData.initialPrice) - parseFloat(negotiationData.targetPrice)).toFixed(2)}</strong> of room to negotiate between your asking price and your minimum.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Step 3: Review and Submit */}
              <div className={`form-step ${currentStep === 3 ? 'active' : ''}`}>
                <h3 className="step-title">
                  <span className="step-title-number">3</span>
                  <span className="step-title-text">Additional Details & Review</span>
                </h3>
                
                <div className="form-section">
                  <div className="form-group">
                    <label htmlFor="notes">
                      <FiFileText className="field-icon" />
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      id="notes"
                      className="modern-input"
                      placeholder="Add any details that might help with the negotiation..."
                      value={negotiationData.notes}
                      onChange={(e) => setNegotiationData(prev => ({ ...prev, notes: e.target.value }))}
                      rows="3"
                    />
                  </div>
                  
                  <div className="review-summary">
                    <h4>Negotiation Summary</h4>
                    <div className="summary-item">
                      <span className="summary-label">Item:</span>
                      <span className="summary-value">{negotiationData.itemName || '-'}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Mode:</span>
                      <span className="summary-value">{negotiationData.mode === 'BUYING' ? 'Buying' : 'Selling'}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">{negotiationData.mode === 'BUYING' ? 'Asking Price:' : 'Your Price:'}</span>
                      <span className="summary-value">${negotiationData.initialPrice || '0.00'}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">{negotiationData.mode === 'BUYING' ? 'Your Target:' : 'Minimum:'}</span>
                      <span className="summary-value">${negotiationData.targetPrice || '0.00'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="stepper-navigation">
              {currentStep > 1 && (
                <button 
                  type="button" 
                  className="prev-button" 
                  onClick={prevStep}
                >
                  <FiArrowRight className="prev-icon" /> Back
                </button>
              )}
              
              {currentStep < totalSteps ? (
                <button 
                  type="button" 
                  className="next-button" 
                  onClick={nextStep}
                  disabled={
                    (currentStep === 1 && !negotiationData.itemName) || 
                    (currentStep === 2 && (!negotiationData.initialPrice || !negotiationData.targetPrice))
                  }
                >
                  Continue <FiArrowRight className="next-icon" />
                </button>
              ) : (
                <button 
                  type="submit" 
                  className="submit-button" 
                  disabled={isLoading || !negotiationData.itemName || !negotiationData.initialPrice || !negotiationData.targetPrice}
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="small" /> Creating...
                    </>
                  ) : (
                    <>
                      Start Negotiating <FiArrowRight />
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  }
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="loading-container">
        <LoadingSpinner />
        <p>Loading your negotiation...</p>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="error-container-wrapper">
        <div className="error-container">
          <h3>Something went wrong</h3>
          <p>{error}</p>
          <button 
            className="primary-btn" 
            onClick={() => navigate('/negotiator', { replace: true })}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  // Render main chat interface
  return (
    <div className="negotiator-main-container">
      {!isSettingUp && (
        <>
          <div className="negotiation-backdrop"></div>
          <div className={`negotiation-chat-container ${chatVisible ? 'visible' : ''}`}>
            <div className="chat-header">
              <div className="chat-title">
                <h3>
                  {negotiationData.itemName}
                  {!chatCompleted && <span className="live-indicator"></span>}
                </h3>
                <div className="chat-meta">
                  <span className={`mode-badge ${negotiationData.mode.toLowerCase()}`}>
                    {negotiationData.mode === 'BUYING' ? 'Buying' : 'Selling'}
                  </span>
                  <span className="time-info">
                    <FiClock />
                    {formatTime(elapsedTime)}
                  </span>
                </div>
              </div>
              <div className="chat-actions">
                {!chatCompleted && (
                  <button 
                    className="end-chat-button" 
                    onClick={handleEndNegotiation}
                  >
                    <FiX />
                    <span>End</span>
                  </button>
                )}
              </div>
            </div>
            
            <div className="price-summary">
              <div className="price-endpoint">
                {negotiationData.mode === 'BUYING' ? (
                  <>
                    <div className="endpoint-label">Asking Price</div>
                    <div className="endpoint-amount">${parseFloat(negotiationData.initialPrice).toFixed(2)}</div>
                  </>
                ) : (
                  <>
                    <div className="endpoint-label">Your Ask</div>
                    <div className="endpoint-amount">${parseFloat(negotiationData.initialPrice).toFixed(2)}</div>
                  </>
                )}
              </div>
              
              <div className={`price-difference-bar ${negotiationData.mode.toLowerCase()}`}>
                <div className="difference-amount">
                  ${Math.abs(parseFloat(negotiationData.initialPrice) - parseFloat(negotiationData.targetPrice)).toFixed(2)}
                </div>
                <div className="difference-label">
                  {negotiationData.mode === 'BUYING' ? 'Target Savings' : 'Flexibility'}
                </div>
              </div>
              
              <div className="price-endpoint">
                {negotiationData.mode === 'BUYING' ? (
                  <>
                    <div className="endpoint-label">Your Target</div>
                    <div className="endpoint-amount">${parseFloat(negotiationData.targetPrice).toFixed(2)}</div>
                  </>
                ) : (
                  <>
                    <div className="endpoint-label">Your Minimum</div>
                    <div className="endpoint-amount">${parseFloat(negotiationData.targetPrice).toFixed(2)}</div>
                  </>
                )}
              </div>
            </div>
            
            <div 
              ref={chatContainerRef}
              className="chat-messages-container"
            >
              {messages.length === 0 ? (
                <div className="empty-chat">
                  <div className="empty-chat-icon">
                    <FiMessageSquare />
                  </div>
                  <p>Your negotiation is ready to begin. Send a message to start the conversation.</p>
                </div>
              ) : (
                <div className="messages-list">
                  {messages.map((message, index) => (
                    <div 
                      key={index} 
                      className={`message-row ${message.role === 'user' || message.sender === 'user' ? 'user' : 'ai'}`}
                    >
                      <div className="message-bubble">
                        <p>{message.content || message.message}</p>
                        {message.timestamp && (
                          <span className="timestamp">
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
              
              {isSending && (
                <div className="message-row ai">
                  <div className="message-bubble typing">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Input area */}
            <div className="chat-input-area">
              {chatCompleted ? (
                <div className="negotiation-completed">
                  <p>This negotiation has been completed.</p>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="message-form">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type your message..."
                    disabled={isSending}
                    className="message-input"
                  />
                  <button 
                    type="submit" 
                    disabled={!inputMessage.trim() || isSending}
                    className="send-button"
                  >
                    <FiSend />
                  </button>
                </form>
              )}
            </div>
            
            {!chatCompleted && suggestions.length > 0 && (
              <div className="suggestion-list">
                {suggestions.slice(0, 3).map((suggestion, index) => (
                  <div 
                    key={index} 
                    className="suggestion-item"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
      
      {/* End negotiation modal */}
      {isEndModalOpen && (
        <EndNegotiationModal
          negotiationData={negotiationData}
          isOpen={isEndModalOpen}
          isAnimating={modalAnimating}
          onClose={handleCloseEndModal}
          onComplete={handleCompleteNegotiation}
        />
      )}
    </div>
  );
};

export default Negotiator; 
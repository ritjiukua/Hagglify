import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  FiSend, 
  FiDollarSign, 
  FiTag, 
  FiTrendingUp, 
  FiTrendingDown,
  FiTarget,
  FiCheck, 
  FiX, 
  FiSettings, 
  FiInfo, 
  FiArrowRight,
  FiAlertCircle
} from 'react-icons/fi';
import { useAuth } from '../../../context/AuthContext';
import EndNegotiationModal from '../endNegotiationModel/EndNegotiationModal';
import LoadingSpinner from '../../common/LoadingSpinner';
import { getChatById, createChat, saveMessage, completeNegotiation } from '../../../services/negotiationService';
import './NegotiationChat2.scss';

const NegotiationChat2 = () => {
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
  
  // Refs
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  
  // Hooks
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract chatId from URL query params on component mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const chatIdParam = params.get('chatId');
    
    if (chatIdParam) {
      setChatId(chatIdParam);
      setIsSettingUp(false);
    } else {
      setIsLoading(false);
    }
  }, [location]);
  
  // Load existing chat when chatId is available
  useEffect(() => {
    const loadChatData = async () => {
      if (!chatId) return;
      
      try {
        setIsLoading(true);
        const chatData = await getChatById(chatId);
        
        if (!chatData) {
          throw new Error('Chat not found');
        }
        
        setMessages(chatData.messages || []);
        setChatCompleted(chatData.completed || false);
        
        setNegotiationData({
          itemName: chatData.item_name || '',
          initialPrice: chatData.initial_price || '',
          targetPrice: chatData.target_price || '',
          mode: chatData.mode || 'BUYING',
          notes: chatData.notes || ''
        });
        
      } catch (err) {
        console.error('Error loading chat:', err);
        setError('Failed to load conversation. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadChatData();
  }, [chatId]);
  
  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNegotiationData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Submit the setup form to create a new negotiation
  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      // Validate form data
      if (!negotiationData.itemName || !negotiationData.initialPrice || !negotiationData.targetPrice) {
        throw new Error('Please fill in all required fields');
      }
      
      // Create new chat in database
      const newChatData = {
        item_name: negotiationData.itemName,
        initial_price: parseFloat(negotiationData.initialPrice),
        target_price: parseFloat(negotiationData.targetPrice),
        mode: negotiationData.mode,
        notes: negotiationData.notes,
        userId: user?.uid
      };
      
      const newChatResult = await createChat(newChatData);
      const newChatId = newChatResult.id; // Adjust based on your API response structure
      
      // Update URL with new chatId without page reload
      navigate(`/negotiator?chatId=${newChatId}`, { replace: true });
      
      setChatId(newChatId);
      setIsSettingUp(false);
      
      // Generate AI's first message
      const initialSystemMessage = {
        role: 'system',
        content: `You are now helping the user negotiate for ${negotiationData.itemName}. They are ${negotiationData.mode === 'BUYING' ? 'buying' : 'selling'} this item. The initial price is $${negotiationData.initialPrice} and their target price is $${negotiationData.targetPrice}.`
      };
      
      const initialAIMessage = {
        role: 'assistant',
        content: `I'm your AI negotiation assistant, and I'll help you ${negotiationData.mode === 'BUYING' ? 'buy' : 'sell'} your ${negotiationData.itemName}. Let's work toward your target price of $${negotiationData.targetPrice}. What specific negotiation advice are you looking for?`
      };
      
      setMessages([initialSystemMessage, initialAIMessage]);
      
      // Save initial messages
      await saveMessage(newChatId, {
        sender: 'system',
        message: initialSystemMessage.content,
        timestamp: new Date().toISOString()
      });
      
      await saveMessage(newChatId, {
        sender: 'assistant',
        message: initialAIMessage.content,
        timestamp: new Date().toISOString()
      });
      
    } catch (err) {
      console.error('Error creating negotiation:', err);
      setError(err.message || 'Failed to create negotiation');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Send a new message in the chat
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isSending || chatCompleted) return;
    
    try {
      setIsSending(true);
      
      // Add user message to UI immediately
      const userMessage = {
        role: 'user',
        content: inputMessage,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, userMessage]);
      setInputMessage('');
      
      // Send message to backend
      const messageToSave = {
        sender: 'user',
        message: inputMessage,
        timestamp: new Date().toISOString()
      };
      
      await saveMessage(chatId, messageToSave);
      
      // Generate AI response (placeholder)
      // In a real implementation, you would call your AI service here
      setTimeout(() => {
        const aiResponse = "This is a placeholder AI response. In a real implementation, you would integrate with your AI service.";
        
        // Add AI response to UI
        const aiMessage = {
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, aiMessage]);
        
        // Save AI message
        saveMessage(chatId, {
          sender: 'assistant',
          message: aiResponse,
          timestamp: new Date().toISOString()
        });
        
        setIsSending(false);
      }, 1500); // Simulating AI response delay
      
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
      setIsSending(false);
    }
  };
  
  // Handle ending the negotiation
  const handleEndNegotiation = () => {
    setIsEndModalOpen(true);
  };
  
  // Complete the negotiation with final data
  const handleCompleteNegotiation = async (finalData) => {
    try {
      setIsLoading(true);
      
      // Update the negotiation with final price and completion data
      await completeNegotiation(chatId, parseFloat(finalData.finalPrice));
      
      // Update local state to reflect completion
      setChatCompleted(true);
      setIsEndModalOpen(false);
      
      // Add a system message about completion
      const completionMessage = {
        role: 'system',
        content: `Negotiation completed with final price: $${finalData.finalPrice}`,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, completionMessage]);
      
      // Save the completion message
      await saveMessage(chatId, {
        sender: 'system',
        message: completionMessage.content,
        timestamp: new Date().toISOString()
      });
      
    } catch (err) {
      console.error('Error completing negotiation:', err);
      setError('Failed to complete negotiation');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to check if a message is from system
  const isSystemMessage = (message) => {
    return message.role === 'system' || message.sender === 'system';
  };
  
  // Render setup form
  if (isSettingUp) {
    return (
      <div className="negotiation-chat setup-mode">
        <div className="setup-container">
          <h1>New Negotiation</h1>
          <p className="setup-description">
            Let's set up your negotiation scenario. Fill in the details below to get started.
          </p>
          
          {error && (
            <div className="error-message">
              <FiAlertCircle /> {error}
            </div>
          )}
          
          <form onSubmit={handleSetupSubmit}>
            <div className="form-section">
              <div className="form-field">
                <label htmlFor="itemName">
                  <FiTag className="field-icon" /> What are you negotiating for?
                </label>
                <input
                  type="text"
                  id="itemName"
                  name="itemName"
                  value={negotiationData.itemName}
                  onChange={handleInputChange}
                  placeholder="e.g., Used car, Salary, etc."
                  required
                  className="modern-input"
                />
              </div>
            </div>
            
            <div className="form-section mode-selection">
              <label className="section-label">Are you buying or selling?</label>
              <div className="toggle-buttons">
                <button
                  type="button"
                  className={`mode-button ${negotiationData.mode === 'BUYING' ? 'active' : ''}`}
                  onClick={() => setNegotiationData({...negotiationData, mode: 'BUYING'})}
                >
                  <FiTrendingDown className="mode-icon" /> Buying
                </button>
                <button
                  type="button"
                  className={`mode-button ${negotiationData.mode === 'SELLING' ? 'active' : ''}`}
                  onClick={() => setNegotiationData({...negotiationData, mode: 'SELLING'})}
                >
                  <FiTrendingUp className="mode-icon" /> Selling
                </button>
              </div>
            </div>
            
            <div className="form-section price-fields">
              <div className="form-field">
                <label htmlFor="initialPrice">
                  <FiDollarSign className="field-icon" /> Initial Price
                </label>
                <div className="price-input">
                  <span className="currency">$</span>
                  <input
                    type="number"
                    id="initialPrice"
                    name="initialPrice"
                    value={negotiationData.initialPrice}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                    className="modern-input"
                  />
                </div>
              </div>
              
              <div className="form-field">
                <label htmlFor="targetPrice">
                  <FiTarget className="field-icon" /> Your Target Price
                </label>
                <div className="price-input">
                  <span className="currency">$</span>
                  <input
                    type="number"
                    id="targetPrice"
                    name="targetPrice"
                    value={negotiationData.targetPrice}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                    className="modern-input"
                  />
                </div>
              </div>
            </div>
            
            <div className="form-section">
              <div className="form-field">
                <label htmlFor="notes">
                  <FiInfo className="field-icon" /> Additional Notes (optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={negotiationData.notes}
                  onChange={handleInputChange}
                  placeholder="Add any details or context about this negotiation..."
                  className="modern-input"
                  rows="4"
                />
              </div>
            </div>
            
            <div className="form-actions">
              <button
                type="submit"
                className="start-button"
                disabled={isLoading}
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
            </div>
          </form>
        </div>
      </div>
    );
  }
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="negotiation-chat loading">
        <LoadingSpinner />
        <p>Loading your negotiation...</p>
      </div>
    );
  }
  
  // Render error state
  if (error && !chatId) {
    return (
      <div className="negotiation-chat error">
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
    <div className="negotiation-chat">
      {/* Chat header */}
      <div className="chat-header">
        <div className="chat-details">
          <h2>{negotiationData.itemName}</h2>
          <div className="negotiation-stats">
            <span className={`mode-tag ${negotiationData.mode.toLowerCase()}`}>
              {negotiationData.mode}
            </span>
            <span className="price-range">
              <FiDollarSign />
              <span>${parseFloat(negotiationData.initialPrice).toFixed(2)}</span>
              <FiArrowRight className="arrow" />
              <span>${parseFloat(negotiationData.targetPrice).toFixed(2)}</span>
            </span>
          </div>
        </div>
        
        <div className="chat-actions">
          {!chatCompleted && (
            <button
              className="end-chat-btn"
              onClick={handleEndNegotiation}
              disabled={isSending}
            >
              End Negotiation
            </button>
          )}
          <button
            className="settings-btn"
            onClick={() => {/* Toggle settings panel */}}
          >
            <FiSettings />
          </button>
        </div>
      </div>
      
      {/* Chat messages area */}
      <div className="chat-messages" ref={chatContainerRef}>
        {messages.length === 0 ? (
          <div className="empty-chat">
            <p>No messages yet. Start your negotiation by sending a message below.</p>
          </div>
        ) : (
          <>
            {messages.filter(msg => !isSystemMessage(msg)).map((message, index) => (
              <div 
                key={index} 
                className={`message ${message.role === 'user' || message.sender === 'user' ? 'user-message' : 'ai-message'}`}
              >
                <div className="message-bubble">
                  <div className="message-content">{message.content || message.message}</div>
                  {(message.timestamp) && (
                    <div className="message-timestamp">
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
        
        {isSending && (
          <div className="message ai-message typing">
            <div className="message-bubble">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Input area */}
      <div className={`chat-input ${chatCompleted ? 'disabled' : ''}`}>
        {chatCompleted ? (
          <div className="completed-banner">
            <FiCheck />
            <span>This negotiation has been completed</span>
          </div>
        ) : (
          <form onSubmit={handleSendMessage}>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={isSending}
            />
            <button 
              type="submit" 
              disabled={!inputMessage.trim() || isSending}
            >
              <FiSend />
            </button>
          </form>
        )}
      </div>
      
      {/* End negotiation modal */}
      {isEndModalOpen && (
        <EndNegotiationModal
          isOpen={isEndModalOpen}
          onClose={() => setIsEndModalOpen(false)}
          onComplete={handleCompleteNegotiation}
          negotiationData={{
            itemName: negotiationData.itemName,
            initialPrice: negotiationData.initialPrice,
            targetPrice: negotiationData.targetPrice,
            mode: negotiationData.mode
          }}
        />
      )}
    </div>
  );
};

export default NegotiationChat2; 
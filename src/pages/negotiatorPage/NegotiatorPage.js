import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Negotiator from '../../components/negotiation/negotiator/Negotiator';
import './NegotiatorPage.scss';
import { getChatById } from '../../services/negotiationService';
import { debugInfo } from '../../debug';
import { FiMessageSquare } from 'react-icons/fi';

const isLoaded = debugInfo.checkComponent('NegotiatorPage.js');

const NegotiatorPage = () => {
  const location = useLocation();
  const [existingChat, setExistingChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchExistingChat = async () => {
      const params = new URLSearchParams(location.search);
      const chatId = params.get('chatId');
      
      if (chatId) {
        try {
          setLoading(true);
          const chatData = await getChatById(chatId);
          setExistingChat(chatData);
        } catch (err) {
          console.error('Failed to load existing chat:', err);
          setError('Could not load the requested negotiation');
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchExistingChat();
  }, [location]);
  
  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div className="header-title">
            <h1>AI Negotiation Assistant</h1>
            <p>Loading your negotiation...</p>
          </div>
        </div>
        <div className="page-content">
          <div className="loading-state">Loading your negotiation...</div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div className="header-title">
            <h1>AI Negotiation Assistant</h1>
            <p>Something went wrong</p>
          </div>
        </div>
        <div className="page-content">
          <div className="error-state">{error}</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-title">
          <h1>AI Negotiation Assistant</h1>
          <p>Enter the details below to start your negotiation</p>
        </div>
        <div className="header-actions">
          {existingChat && (
            <div className="negotiation-status">
              <FiMessageSquare />
              <span>{existingChat.mode === 'BUYING' ? 'Buying' : 'Selling'} Negotiation</span>
            </div>
          )}
        </div>
      </div>
      <div className="page-content">
        <div className="content-card negotiator-card">
          <Negotiator existingChat={existingChat} />
        </div>
      </div>
    </div>
  );
};

export default NegotiatorPage; 
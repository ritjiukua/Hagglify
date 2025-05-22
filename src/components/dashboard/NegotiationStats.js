import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiTrendingUp, FiTarget, FiMessageSquare } from 'react-icons/fi';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import './NegotiationStats.scss';

const NegotiationStats = () => {
  const [stats, setStats] = useState({
    totalNegotiations: 0,
    successfulNegotiations: 0,
    averageSavings: 0,
    totalSavings: 0,
    highestSavings: 0,
    averageMessages: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const negotiationsQuery = query(
          collection(db, 'negotiations'),
          where('userId', '==', user.uid)
        );
        
        const snapshot = await getDocs(negotiationsQuery);
        const negotiations = snapshot.docs.map(doc => doc.data());
        
        if (negotiations.length === 0) {
          setLoading(false);
          return;
        }
        
        // Calculate statistics
        const completedNegotiations = negotiations.filter(n => n.status === 'completed' || n.completed === true);
        const successfulNegotiations = negotiations.filter(n => n.target_met === true || n.successful === true);
        
        const totalSavings = negotiations.reduce((sum, n) => sum + (n.savings_amount || 0), 0);
        const highestSavings = Math.max(...negotiations.map(n => n.savings_amount || 0));
        
        const totalMessages = negotiations.reduce((sum, n) => sum + (n.messages_count || 0), 0);
        
        setStats({
          totalNegotiations: negotiations.length,
          completedNegotiations: completedNegotiations.length,
          successfulNegotiations: successfulNegotiations.length,
          successRate: negotiations.length > 0 ? 
            (successfulNegotiations.length / negotiations.length) * 100 : 0,
          averageSavings: negotiations.length > 0 ? 
            totalSavings / negotiations.length : 0,
          totalSavings,
          highestSavings,
          averageMessages: negotiations.length > 0 ?
            totalMessages / negotiations.length : 0
        });
      } catch (error) {
        console.error('Error loading negotiation stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadStats();
  }, []);

  if (loading) {
    return <div className="stats-loading">Loading your negotiation statistics...</div>;
  }

  return (
    <div className="negotiation-stats">
      <h3>Negotiation Performance</h3>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <FiTarget />
          </div>
          <div className="stat-content">
            <h4>Success Rate</h4>
            <p className="stat-value">{stats.successRate.toFixed(0)}%</p>
            <p className="stat-description">
              {stats.successfulNegotiations} of {stats.totalNegotiations} negotiations successful
            </p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <FiDollarSign />
          </div>
          <div className="stat-content">
            <h4>Total Savings</h4>
            <p className="stat-value">${stats.totalSavings.toFixed(2)}</p>
            <p className="stat-description">
              Avg. ${stats.averageSavings.toFixed(2)} per negotiation
            </p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <FiTrendingUp />
          </div>
          <div className="stat-content">
            <h4>Best Negotiation</h4>
            <p className="stat-value">${stats.highestSavings.toFixed(2)}</p>
            <p className="stat-description">
              Your highest savings amount
            </p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <FiMessageSquare />
          </div>
          <div className="stat-content">
            <h4>Conversation Length</h4>
            <p className="stat-value">{stats.averageMessages.toFixed(0)}</p>
            <p className="stat-description">
              Average messages per negotiation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NegotiationStats; 
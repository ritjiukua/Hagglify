import React from 'react';
import { FiCheck, FiX } from 'react-icons/fi';
import './Subscription.scss';

const Subscription = () => {
  return (
    <div className="subscription-page">
      <div className="subscription-header">
        <h1>Choose Your Plan</h1>
        <p>Select the perfect plan for your negotiation needs</p>
      </div>
      
      <div className="subscription-plans">
        <div className="plan-card free">
          <div className="plan-header">
            <h2>Free</h2>
            <div className="plan-price">
              <span className="price">$0</span>
              <span className="period">forever</span>
            </div>
            <p className="plan-description">
              Get started with basic negotiation tools
            </p>
          </div>
          
          <div className="plan-features">
            <ul>
              <li className="included"><FiCheck /> 5 Negotiations per month</li>
              <li className="included"><FiCheck /> AI-Powered Bargaining</li>
              <li className="excluded"><FiX /> Priority Response Time</li>
              <li className="excluded"><FiX /> Advanced Analytics</li>
              <li className="excluded"><FiX /> Custom AI Adjustments</li>
              <li className="excluded"><FiX /> Dedicated Support</li>
            </ul>
          </div>
          
          <div className="plan-cta">
            <button className="current-plan">Current Plan</button>
          </div>
        </div>
        
        <div className="plan-card gold recommended">
          <div className="recommended-badge">Most Popular</div>
          <div className="plan-header">
            <h2>Gold</h2>
            <div className="plan-price">
              <span className="price">$10</span>
              <span className="period">per month</span>
            </div>
            <p className="plan-description">
              Perfect for regular negotiators
            </p>
          </div>
          
          <div className="plan-features">
            <ul>
              <li className="included"><FiCheck /> 50 Negotiations per month</li>
              <li className="included"><FiCheck /> AI-Powered Bargaining</li>
              <li className="included"><FiCheck /> Priority Response Time</li>
              <li className="included"><FiCheck /> Advanced Analytics</li>
              <li className="excluded"><FiX /> Custom AI Adjustments</li>
              <li className="included"><FiCheck /> Dedicated Support</li>
            </ul>
          </div>
          
          <div className="plan-cta">
            <button className="subscribe-button">Subscribe to Gold</button>
          </div>
        </div>
        
        <div className="plan-card premium">
          <div className="plan-header">
            <h2>Premium</h2>
            <div className="plan-price">
              <span className="price">$25</span>
              <span className="period">per month</span>
            </div>
            <p className="plan-description">
              For power users and professionals
            </p>
          </div>
          
          <div className="plan-features">
            <ul>
              <li className="included"><FiCheck /> Unlimited Negotiations</li>
              <li className="included"><FiCheck /> AI-Powered Bargaining</li>
              <li className="included"><FiCheck /> Priority Response Time</li>
              <li className="included"><FiCheck /> Advanced Analytics</li>
              <li className="included"><FiCheck /> Custom AI Adjustments</li>
              <li className="included"><FiCheck /> 24/7 Dedicated Support</li>
            </ul>
          </div>
          
          <div className="plan-cta">
            <button className="subscribe-button premium-button">Subscribe to Premium</button>
          </div>
        </div>
      </div>
      
      <div className="subscription-note">
        <p>This is a demo showing the subscription plans. Payment gateway integration will be added in a future update.</p>
      </div>
    </div>
  );
};

export default Subscription; 
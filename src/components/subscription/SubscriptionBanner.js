import React from 'react';
import { Link } from 'react-router-dom';
import { FiStar, FiChevronRight, FiCheck, FiX } from 'react-icons/fi';
import './SubscriptionBanner.scss';

const SubscriptionBanner = ({ currentPlan = 'free' }) => {
  return (
    <div className="subscription-banner">
      <div className="banner-content">
        <div className="current-plan">
          <span className="plan-badge">
            {currentPlan === 'free' ? 'Free Plan' : 
             currentPlan === 'gold' ? 'Gold Plan' : 'Premium Plan'}
          </span>
          
          {currentPlan === 'free' && (
            <h3 className="upgrade-message">
              <FiStar className="star-icon" /> Upgrade to unlock more negotiation power
            </h3>
          )}
          
          {(currentPlan === 'gold' || currentPlan === 'premium') && (
            <h3 className="premium-message">
              <FiStar className="star-icon" /> Your premium features are active
            </h3>
          )}
          
          <div className="plan-limits">
            {currentPlan === 'free' && (
              <span className="limit-text">
                <strong>5</strong> negotiations remaining this month
              </span>
            )}
            
            {currentPlan === 'gold' && (
              <span className="limit-text">
                <strong>50</strong> negotiations per month
              </span>
            )}
            
            {currentPlan === 'premium' && (
              <span className="limit-text">
                <strong>Unlimited</strong> negotiations
              </span>
            )}
          </div>
        </div>
        
        {currentPlan === 'free' && (
          <Link to="/subscription" className="upgrade-button">
            <span>Upgrade Now</span>
            <FiChevronRight />
          </Link>
        )}
        
        {currentPlan === 'gold' && (
          <Link to="/subscription" className="upgrade-button">
            <span>Go Premium</span>
            <FiChevronRight />
          </Link>
        )}
      </div>
      
      <div className="quick-comparison">
        <div className="plan-comparison">
          <div className="plan-column free">
            <h4>Free</h4>
            <p className="price">$0</p>
            <ul>
              <li><FiCheck className="check" /> 5 Negotiations/mo</li>
              <li><FiCheck className="check" /> AI-Powered Bargaining</li>
              <li><FiX className="x" /> Priority Response</li>
              <li><FiX className="x" /> Advanced Analytics</li>
            </ul>
          </div>
          
          <div className="plan-column gold">
            <h4>Gold</h4>
            <p className="price">$10<span>/mo</span></p>
            <ul>
              <li><FiCheck className="check" /> 50 Negotiations/mo</li>
              <li><FiCheck className="check" /> AI-Powered Bargaining</li>
              <li><FiCheck className="check" /> Priority Response</li>
              <li><FiCheck className="check" /> Dedicated Support</li>
            </ul>
          </div>
          
          <div className="plan-column premium">
            <h4>Premium</h4>
            <p className="price">$25<span>/mo</span></p>
            <ul>
              <li><FiCheck className="check" /> Unlimited Negotiations</li>
              <li><FiCheck className="check" /> Custom AI Adjustments</li>
              <li><FiCheck className="check" /> 24/7 Support</li>
              <li><FiCheck className="check" /> Advanced Analytics</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionBanner; 
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Account.scss';
import { FiUser, FiMail, FiLock, FiFileText, FiCreditCard, FiShield, FiChevronRight, FiSettings } from 'react-icons/fi';
import ProfileSettings from '../../components/account/ProfileSettings';
import { useAuth } from '../../context/AuthContext';

const Account = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [animationDirection, setAnimationDirection] = useState(1);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Track tab switch direction for animations
  const handleTabChange = (tab) => {
    const tabOrder = ['profile', 'security', 'subscription', 'data', 'privacy'];
    const currentIndex = tabOrder.indexOf(activeTab);
    const newIndex = tabOrder.indexOf(tab);
    setAnimationDirection(newIndex > currentIndex ? 1 : -1);
    setActiveTab(tab);
  };
  
  // Get user data from auth context
  const userData = {
    name: user?.full_name || 'User',
    email: user?.email || 'user@example.com',
    memberSince: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
      month: 'long', 
      year: 'numeric'
    }) : 'June 2023',
    plan: 'Professional',
    negotiationCount: 42,
    successRate: '72%',
  };
  
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-title">
          <h1>My Account</h1>
          <p>Manage your profile and settings</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary">
            <FiSettings /> Account Settings
          </button>
        </div>
      </div>
      
      <div className="page-content">
        <div className="account-layout">
          <div className="account-sidebar content-card">
            <div className="user-profile-summary">
              <div className="user-info">
                <h3>{userData.name}</h3>
                <p>{userData.email}</p>
                <span className="plan-badge">{userData.plan}</span>
              </div>
            </div>
            
            <nav className="account-nav">
              {[
                { id: 'profile', icon: <FiUser />, label: 'Profile' },
                { id: 'security', icon: <FiLock />, label: 'Security' },
                { id: 'subscription', icon: <FiCreditCard />, label: 'Subscription' },
                { id: 'data', icon: <FiFileText />, label: 'My Data' },
                { id: 'privacy', icon: <FiShield />, label: 'Privacy' },
              ].map(tab => (
                <button 
                  key={tab.id}
                  className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => handleTabChange(tab.id)}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {activeTab === tab.id && <FiChevronRight className="nav-arrow" />}
                </button>
              ))}
            </nav>
          </div>
          
          <div className="account-content content-card">
            <div className={`content-wrapper direction-${animationDirection}`}>
              {activeTab === 'profile' && (
                <div 
                  className="profile-section content-section active-section"
                  key="profile"
                >
                  <ProfileSettings />
                </div>
              )}
              
              {activeTab === 'security' && (
                <div 
                  className="security-section content-section active-section"
                  key="security"
                >
                  <h2>Security Settings</h2>
                  <p className="section-description">
                    Manage your password and account security settings
                  </p>
                  
                  <div className="security-form">
                    <div className="form-group">
                      <label>Current Password</label>
                      <input type="password" placeholder="Enter current password" />
                    </div>
                    
                    <div className="form-group">
                      <label>New Password</label>
                      <input type="password" placeholder="Enter new password" />
                    </div>
                    
                    <div className="form-group">
                      <label>Confirm New Password</label>
                      <input type="password" placeholder="Confirm new password" />
                    </div>
                    
                    <div className="form-divider"></div>
                    
                    <h3>Two-Factor Authentication</h3>
                    <p className="section-description">
                      Add an extra layer of security to your account
                    </p>
                    
                    <div className="toggle-option">
                      <div className="toggle-info">
                        <h4>Enable 2FA</h4>
                        <p>Protect your account with an additional verification step</p>
                      </div>
                      <label className="toggle">
                        <input type="checkbox" />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    
                    <div className="form-actions">
                      <button className="btn btn-primary">Update Security Settings</button>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'subscription' && (
                <div 
                  className="subscription-section content-section active-section"
                  key="subscription"
                >
                  <h2>Subscription Management</h2>
                  <p className="section-description">
                    Manage your subscription plan and billing information
                  </p>
                  
                  <div className="current-plan">
                    <div className="plan-header">
                      <h3>Current Plan: Professional</h3>
                      <span className="plan-status">Active</span>
                    </div>
                    
                    <div className="plan-details">
                      <div className="plan-feature">
                        <span className="feature-check">✓</span>
                        Unlimited negotiations
                      </div>
                      <div className="plan-feature">
                        <span className="feature-check">✓</span>
                        Advanced AI suggestions
                      </div>
                      <div className="plan-feature">
                        <span className="feature-check">✓</span>
                        Performance analytics
                      </div>
                      <div className="plan-feature">
                        <span className="feature-check">✓</span>
                        Template library access
                      </div>
                    </div>
                    
                    <div className="plan-pricing">
                      <span className="price">$24.99</span> / month
                    </div>
                    
                    <div className="plan-actions">
                      <button className="btn btn-primary">Upgrade Plan</button>
                      <button className="btn btn-secondary">Cancel Subscription</button>
                    </div>
                  </div>
                  
                  <div className="billing-info">
                    <h3>Billing Information</h3>
                    
                    <div className="payment-method">
                      <div className="card-info">
                        <div className="card-icon">
                          <FiCreditCard />
                        </div>
                        <div className="card-details">
                          <p className="card-name">Visa ending in 4242</p>
                          <p className="card-expiry">Expires 09/2025</p>
                        </div>
                      </div>
                      <button className="btn btn-secondary btn-sm">Edit</button>
                    </div>
                    
                    <div className="form-actions">
                      <button className="btn btn-secondary">Add Payment Method</button>
                    </div>
                  </div>
                  
                  <div className="billing-history">
                    <h3>Billing History</h3>
                    <div className="table-container">
                      <table>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Receipt</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Jun 01, 2023</td>
                            <td>Monthly Subscription - Professional</td>
                            <td>$24.99</td>
                            <td><span className="status-badge success">Paid</span></td>
                            <td><button className="btn btn-text">View</button></td>
                          </tr>
                          <tr>
                            <td>May 01, 2023</td>
                            <td>Monthly Subscription - Professional</td>
                            <td>$24.99</td>
                            <td><span className="status-badge success">Paid</span></td>
                            <td><button className="btn btn-text">View</button></td>
                          </tr>
                          <tr>
                            <td>Apr 01, 2023</td>
                            <td>Monthly Subscription - Basic</td>
                            <td>$9.99</td>
                            <td><span className="status-badge success">Paid</span></td>
                            <td><button className="btn btn-text">View</button></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'data' && (
                <div 
                  className="data-section content-section active-section"
                  key="data"
                >
                  <h2>My Negotiation Data</h2>
                  <p className="section-description">
                    Manage all your negotiation history and data
                  </p>
                  
                  <div className="data-metrics">
                    <div className="metric-box">
                      <h4>Total Negotiations</h4>
                      <p className="metric-value">42</p>
                    </div>
                    <div className="metric-box">
                      <h4>Success Rate</h4>
                      <p className="metric-value">72%</p>
                    </div>
                    <div className="metric-box">
                      <h4>Total Savings</h4>
                      <p className="metric-value">$3,248.00</p>
                    </div>
                  </div>
                  
                  <div className="data-actions">
                    <div className="action-card">
                      <h3>Download Your Data</h3>
                      <p>Get a complete export of all your negotiation history</p>
                      <div className="action-buttons">
                        <button className="btn btn-secondary">Export CSV</button>
                        <button className="btn btn-secondary">Export JSON</button>
                      </div>
                    </div>
                    
                    <div className="action-card">
                      <h3>Delete Your Data</h3>
                      <p>Permanently remove all your negotiation history</p>
                      <div className="action-buttons">
                        <button className="btn btn-danger">Delete All Data</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'privacy' && (
                <div 
                  className="privacy-section content-section active-section"
                  key="privacy"
                >
                  <h2>Privacy Settings</h2>
                  <p className="section-description">
                    Control how your data is used and shared
                  </p>
                  
                  <div className="privacy-options">
                    <div className="toggle-option">
                      <div className="toggle-info">
                        <h4>Anonymized Data Sharing</h4>
                        <p>Allow us to use anonymized negotiation patterns to improve our AI suggestions</p>
                      </div>
                      <label className="toggle">
                        <input type="checkbox" checked />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    
                    <div className="toggle-option">
                      <div className="toggle-info">
                        <h4>Email Notifications</h4>
                        <p>Receive emails about your negotiations, tips, and platform updates</p>
                      </div>
                      <label className="toggle">
                        <input type="checkbox" checked />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    
                    <div className="toggle-option">
                      <div className="toggle-info">
                        <h4>Success Metrics</h4>
                        <p>Show your negotiation success metrics in your public profile</p>
                      </div>
                      <label className="toggle">
                        <input type="checkbox" />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    
                    <div className="form-actions">
                      <button className="btn btn-primary">Save Privacy Settings</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account; 
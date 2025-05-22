import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiArrowLeft, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import './Auth.scss';
import { requestPasswordReset } from '../../services/authService';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await requestPasswordReset(email);
      setSuccess(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Reset Password</h1>
          <p>Enter your email to receive a password reset link</p>
        </div>
        
        {error && (
          <div className="error-message">
            <FiAlertCircle />
            <span>{error}</span>
          </div>
        )}
        
        {success ? (
          <div className="success-container">
            <div className="success-icon">
              <FiCheckCircle />
            </div>
            <h2>Check Your Email</h2>
            <p>
              We've sent a password reset link to <strong>{email}</strong>.
              Please check your inbox and follow the instructions.
            </p>
            <p className="small-text">
              If you don't see the email, check your spam folder.
            </p>
            <Link to="/login" className="primary-btn back-to-login">
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">
                <FiMail className="field-icon" />
                <span>Email</span>
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Your email address"
              />
            </div>
            
            <button 
              type="submit" 
              className="primary-btn reset-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
            
            <Link to="/login" className="back-link">
              <FiArrowLeft /> Back to Login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword; 
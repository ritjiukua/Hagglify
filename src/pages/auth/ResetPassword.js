import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FiLock, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import './Auth.scss';
import { resetPassword } from '../../services/authService';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Validate password strength
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await resetPassword(token, password);
      setSuccess(true);
      
      // Redirect to login after a delay
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Password reset error:', err);
      
      // Handle Firebase specific errors
      if (err.code === 'auth/expired-action-code') {
        setError('The password reset link has expired. Please request a new one.');
      } else if (err.code === 'auth/invalid-action-code') {
        setError('The password reset link is invalid. Please request a new one.');
      } else if (err.code === 'auth/weak-password') {
        setError('The password is too weak. Please choose a stronger password.');
      } else {
        setError('Failed to reset password. Please try again or request a new link.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Create New Password</h1>
          <p>Please enter your new password</p>
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
            <h2>Password Reset Complete</h2>
            <p>
              Your password has been updated successfully.
              You will be redirected to the login page in a few seconds.
            </p>
            <Link to="/login" className="primary-btn back-to-login">
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="password">
                <FiLock className="field-icon" />
                <span>New Password</span>
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter new password"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">
                <FiLock className="field-icon" />
                <span>Confirm Password</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm new password"
              />
            </div>
            
            <div className="password-requirements">
              <p>Your password must:</p>
              <ul>
                <li>Be at least 8 characters long</li>
                <li>Include at least one uppercase letter</li>
                <li>Include at least one number</li>
                <li>Include at least one special character</li>
              </ul>
            </div>
            
            <button 
              type="submit" 
              className="primary-btn reset-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword; 
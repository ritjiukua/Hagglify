import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiUser, FiUserPlus, FiAlertCircle } from 'react-icons/fi';
import './Auth.scss';
import { register } from '../../services/authService';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [animatedField, setAnimatedField] = useState('');
  const navigate = useNavigate();
  const showcaseRef = useRef(null);
  const cursorGlowRef = useRef(null);
  
  // Handle cursor movement on showcase area
  useEffect(() => {
    const showcase = showcaseRef.current;
    const cursorGlow = cursorGlowRef.current;
    
    if (!showcase || !cursorGlow) return;
    
    const handleMouseMove = (e) => {
      const rect = showcase.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      cursorGlow.style.left = `${x}px`;
      cursorGlow.style.top = `${y}px`;
    };
    
    showcase.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      showcase.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleFocus = (field) => {
    setAnimatedField(field);
  };
  
  const handleBlur = () => {
    setAnimatedField('');
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Validate password strength
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    setIsLoading(true);
    
    // Add a visual ripple effect to the button
    const button = e.currentTarget.querySelector('button[type="submit"]');
    button.classList.add('clicked');
    setTimeout(() => button.classList.remove('clicked'), 500);
    
    try {
      // Call register function from authService
      await register(
        formData.email, 
        formData.password,
        formData.fullName
      );
      
      // Firebase handles tokens internally, no need to set localStorage
      // Navigate to dashboard after successful registration
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
      
      // Handle Firebase specific error messages
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please log in instead.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use a stronger password.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection.');
      } else if (err.message) {
        // Display any other error message
        setError(err.message);
      } else {
        setError('Failed to create account. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="logo-container">
          <img src="/Hagglify.png" alt="Hagglify Logo" className="auth-logo" />
        </div>
        
        <div className="auth-header">
          <h1>Create an Account</h1>
          <p>Join Hagglify and start saving money</p>
        </div>
        
        {error && (
          <div className="error-message">
            <FiAlertCircle />
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className={`form-group ${animatedField === 'fullName' ? 'active' : ''}`}>
            <label htmlFor="fullName">
              <FiUser className="field-icon" />
              <span>Full Name</span>
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              onFocus={() => handleFocus('fullName')}
              onBlur={handleBlur}
              required
              placeholder="Your full name"
            />
          </div>
          
          <div className={`form-group ${animatedField === 'email' ? 'active' : ''}`}>
            <label htmlFor="email">
              <FiMail className="field-icon" />
              <span>Email</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onFocus={() => handleFocus('email')}
              onBlur={handleBlur}
              required
              placeholder="Your email address"
            />
          </div>
          
          <div className={`form-group ${animatedField === 'password' ? 'active' : ''}`}>
            <label htmlFor="password">
              <FiLock className="field-icon" />
              <span>Password</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              onFocus={() => handleFocus('password')}
              onBlur={handleBlur}
              required
              placeholder="Create a password"
            />
          </div>
          
          <div className={`form-group ${animatedField === 'confirmPassword' ? 'active' : ''}`}>
            <label htmlFor="confirmPassword">
              <FiLock className="field-icon" />
              <span>Confirm Password</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              onFocus={() => handleFocus('confirmPassword')}
              onBlur={handleBlur}
              required
              placeholder="Confirm your password"
            />
          </div>
          
          <div className="terms-agreement">
            <input type="checkbox" id="terms" name="terms" required />
            <label htmlFor="terms">
              I agree to the <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>
            </label>
          </div>
          
          <button 
            type="submit" 
            className="primary-btn register-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loader"></span>
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <FiUserPlus />
              </>
            )}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
        
        <div className="powered-by">
          Powered by Uhepisa Software Solutions
        </div>
      </div>
      
      <div className="auth-showcase" ref={showcaseRef}>
        {/* Cursor following highlight */}
        <div className="cursor-glow" ref={cursorGlowRef}></div>
        
        {/* Floating decorative elements */}
        <div className="floating-shape"></div>
        <div className="floating-shape"></div>
        <div className="floating-shape"></div>
        
        <div className="showcase-content">
          <h2>Join Thousands of Smart Negotiators</h2>
          <p>Our users save an average of $420 per month using AI-powered negotiation</p>
          
          <div className="testimonial">
            <p>"I saved $240 on my first negotiation. This tool has completely changed how I approach buying decisions."</p>
            <div className="testimonial-author">
              <span className="author-name">Michael R.</span>
              <span className="author-title">Marketing Director</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register; 
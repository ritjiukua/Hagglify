import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiLogIn, FiAlertCircle } from 'react-icons/fi';
import './Auth.scss';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [animatedField, setAnimatedField] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
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
    setIsLoading(true);
    
    // Add a visual ripple effect to the button
    const button = e.currentTarget.querySelector('button[type="submit"]');
    button.classList.add('clicked');
    setTimeout(() => button.classList.remove('clicked'), 500);
    
    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      
      // Enhanced error handling for Firebase auth
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email. Please register first.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again or reset your password.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Invalid login credentials. Please check your email and password.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please try again later or reset your password.');
      } else if (err.code === 'auth/user-disabled') {
        setError('This account has been disabled. Please contact support.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection.');
      } else {
        setError('An error occurred during login. Please try again.');
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
          <h1>Welcome Back</h1>
          <p>Log in to continue to Hagglify</p>
        </div>
        
        {error && (
          <div className="error-message">
            <FiAlertCircle />
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="auth-form">
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
              placeholder="Your password"
            />
          </div>
          
          <div className="form-options">
            <div className="remember-me">
              <input type="checkbox" id="remember" name="remember" />
              <label htmlFor="remember">Remember me</label>
            </div>
            <Link to="/forgot-password" className="forgot-password">
              Forgot password?
            </Link>
          </div>
          
          <button 
            type="submit" 
            className="primary-btn login-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loader"></span>
                <span>Logging in...</span>
              </>
            ) : (
              <>
                <span>Log In</span>
                <FiLogIn />
              </>
            )}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>
            Don't have an account? <Link to="/register">Sign up</Link>
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
          <h2>Negotiate Smarter, Not Harder</h2>
          <p>Use AI to help you get better deals when buying or selling anything</p>
          
          <div className="showcase-features">
            <div className="feature">
              <div className="feature-icon">✓</div>
              <p>Save an average of 15-30% on purchases</p>
            </div>
            <div className="feature">
              <div className="feature-icon">✓</div>
              <p>Get AI-powered negotiation suggestions</p>
            </div>
            <div className="feature">
              <div className="feature-icon">✓</div>
              <p>Learn negotiation tactics as you go</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 
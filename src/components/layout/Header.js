import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiLogOut, FiSettings, FiMoon, FiSun } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import './Header.scss';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.classList.contains('dark-theme')
  );
  const navigate = useNavigate();
  
  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    }
    setIsDarkMode(!isDarkMode);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="app-header">
      <div className="header-container">
        <Link to="/" className="logo">
          <span className="logo-icon">🤝</span>
          <span className="logo-text">AI Deal Negotiator</span>
        </Link>
        
        <nav className="main-nav">
          <Link to="/" className="nav-link">Dashboard</Link>
          <Link to="/negotiator" className="nav-link">Negotiator</Link>
          <Link to="/templates" className="nav-link">Templates</Link>
          <Link to="/help" className="nav-link">Help</Link>
        </nav>
        
        <div className="header-actions">
          <button 
            className="theme-toggle" 
            onClick={toggleTheme}
            title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? <FiSun /> : <FiMoon />}
          </button>
          
          {isAuthenticated ? (
            <div className="user-menu-container">
              <button 
                className="user-menu-button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <div className="avatar">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
              </button>
              
              {userMenuOpen && (
                <div className="user-dropdown">
                  <div className="user-info">
                    <p className="user-name">{user?.full_name}</p>
                    <p className="user-email">{user?.email}</p>
                  </div>
                  
                  <div className="dropdown-divider"></div>
                  
                  <Link to="/account" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                    <FiUser />
                    <span>My Account</span>
                  </Link>
                  
                  <Link to="/account?tab=settings" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                    <FiSettings />
                    <span>Settings</span>
                  </Link>
                  
                  <div className="dropdown-divider"></div>
                  
                  <button className="dropdown-item logout-item" onClick={handleLogout}>
                    <FiLogOut />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="login-button">Login</Link>
              <Link to="/register" className="signup-button">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 
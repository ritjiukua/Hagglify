import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiActivity, FiFileText, FiHelpCircle, FiUser, FiLogOut, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.scss';

const Sidebar = ({ collapsed, setCollapsed }) => {
  const location = useLocation();
  const { logout } = useAuth();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <FiHome /> },
    { path: '/negotiator', label: 'Negotiator', icon: <FiActivity /> },
    { path: '/templates', label: 'Templates', icon: <FiFileText /> },
    { path: '/help', label: 'Help & Resources', icon: <FiHelpCircle /> },
    { path: '/account', label: 'My Account', icon: <FiUser /> }
  ];

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <Link to="/" className="logo-container">
          <span className="logo-text">Hagglify</span>
        </Link>
        <button 
          className="collapse-toggle"
          onClick={toggleSidebar}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>
      </div>

      <div className="sidebar-content">
        <nav className="sidebar-nav">
          <ul className="nav-links">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={location.pathname === item.path ? 'active' : ''}
                  title={collapsed ? item.label : ''}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="sidebar-footer">
        <button 
          className="logout-button"
          onClick={logout}
          title={collapsed ? 'Logout' : ''}
        >
          <span className="nav-icon"><FiLogOut /></span>
          <span className="nav-label">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar; 
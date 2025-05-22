import React, { useState, useEffect } from 'react';
import { FiXCircle, FiAlertTriangle, FiInfo, FiDatabase, FiUser, FiCode, FiServer } from 'react-icons/fi';
import { getDebugLogs, getErrorLogs, clearLogs, LOG_TYPES } from '../../services/debugService';
import './DebugPanel.scss';

const DebugPanel = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [logs, setLogs] = useState([]);
  const [errors, setErrors] = useState([]);
  const [filter, setFilter] = useState('');
  
  // Fetch logs
  useEffect(() => {
    const fetchLogs = () => {
      setLogs(getDebugLogs());
      setErrors(getErrorLogs());
    };
    
    fetchLogs();
    
    // Refresh logs every second when panel is open
    const interval = setInterval(() => {
      if (isOpen) {
        fetchLogs();
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isOpen]);
  
  // Filter logs based on tab and search
  const filteredLogs = logs.filter(log => {
    // Filter by tab
    if (activeTab !== 'all' && activeTab !== 'errors' && log.type !== activeTab) {
      return false;
    }
    
    // Filter errors tab
    if (activeTab === 'errors' && log.type !== LOG_TYPES.ERROR) {
      return false;
    }
    
    // Filter by search
    if (filter && !log.message.toLowerCase().includes(filter.toLowerCase())) {
      return false;
    }
    
    return true;
  });
  
  // Clear all logs
  const handleClearLogs = () => {
    clearLogs();
    setLogs([]);
    setErrors([]);
  };
  
  // Get icon for log type
  const getLogIcon = (type) => {
    switch(type) {
      case LOG_TYPES.ERROR:
        return <FiXCircle className="log-icon error" />;
      case LOG_TYPES.WARNING:
        return <FiAlertTriangle className="log-icon warning" />;
      case LOG_TYPES.FIREBASE:
        return <FiDatabase className="log-icon firebase" />;
      case LOG_TYPES.AUTH:
        return <FiUser className="log-icon auth" />;
      case LOG_TYPES.COMPONENT:
        return <FiCode className="log-icon component" />;
      case LOG_TYPES.API:
        return <FiServer className="log-icon api" />;
      default:
        return <FiInfo className="log-icon info" />;
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="debug-panel">
      <div className="debug-header">
        <h3>Debug Console</h3>
        <div className="header-actions">
          <button className="clear-btn" onClick={handleClearLogs}>Clear</button>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
      </div>
      
      <div className="debug-tabs">
        <button 
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All
        </button>
        <button 
          className={`tab ${activeTab === 'errors' ? 'active' : ''}`}
          onClick={() => setActiveTab('errors')}
        >
          Errors ({errors.length})
        </button>
        <button 
          className={`tab ${activeTab === LOG_TYPES.FIREBASE ? 'active' : ''}`}
          onClick={() => setActiveTab(LOG_TYPES.FIREBASE)}
        >
          Firebase
        </button>
        <button 
          className={`tab ${activeTab === LOG_TYPES.COMPONENT ? 'active' : ''}`}
          onClick={() => setActiveTab(LOG_TYPES.COMPONENT)}
        >
          Components
        </button>
        <button 
          className={`tab ${activeTab === LOG_TYPES.AUTH ? 'active' : ''}`}
          onClick={() => setActiveTab(LOG_TYPES.AUTH)}
        >
          Auth
        </button>
      </div>
      
      <div className="search-filter">
        <input
          type="text"
          placeholder="Filter logs..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      
      <div className="logs-container">
        {filteredLogs.length === 0 ? (
          <div className="empty-logs">
            <p>No logs to display</p>
          </div>
        ) : (
          <>
            {filteredLogs.map((log, index) => (
              <div key={index} className={`log-entry ${log.type}`}>
                <div className="log-time">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </div>
                <div className="log-icon-container">
                  {getLogIcon(log.type)}
                </div>
                <div className="log-content">
                  <div className="log-message">{log.message}</div>
                  {log.data && (
                    <div className="log-data">
                      <pre>{JSON.stringify(log.data, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default DebugPanel; 
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../sidebar/Sidebar';
import { FiMonitor } from 'react-icons/fi';
import DebugPanel from '../debug/DebugPanel';
import './Layout.scss';

const Layout = () => {
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  return (
    <div className={`app-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar collapsed={isSidebarCollapsed} setCollapsed={setIsSidebarCollapsed} />
      <div className="layout-content">
        <main className="main-content">
          <Outlet />
        </main>
      </div>
      
      {/* Debug toggle button */}
      <button 
        className="debug-toggle-btn"
        onClick={() => setIsDebugOpen(!isDebugOpen)}
        title="Toggle Debug Panel"
      >
        <FiMonitor />
      </button>
      
      {/* Debug panel */}
      <DebugPanel 
        isOpen={isDebugOpen}
        onClose={() => setIsDebugOpen(false)}
      />
    </div>
  );
};

export default Layout;

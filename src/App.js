import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Dashboard from './pages/dashboard/Dashboard';
import NegotiatorPage from './pages/negotiatorPage/NegotiatorPage';
import Templates from './pages/templates/Templates';
import HelpResources from './pages/helpResources/HelpResources';
import Account from './pages/account/Account';
import About from './pages/about/About';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import ProtectedRoute from './components/auth/ProtectedRoute';
import NegotiationHistory from './pages/negotiationHistory/NegotiationHistory';
import CreateIndexes from './components/admin/CreateIndexes';
import Subscription from './pages/subscription/Subscription';
import NegotiationChat2 from './components/negotiation/negotiationChat/NegotiationChat2';

// Import styles
import './styles/index.css';
import './styles/main.scss';
import './.env.test.js'; // Import environment variable test

function App() {
  // Initialize theme on app startup
  useEffect(() => {
    // Check localStorage for saved theme
    const savedTheme = localStorage.getItem('theme');
    
    // Check if user prefers dark mode
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Apply appropriate theme
    if (savedTheme === 'dark' || (!savedTheme && prefersDarkMode)) {
      document.documentElement.classList.add('dark-theme');
    }
  }, []);

  useEffect(() => {
    // Force browser to not cache CSS
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Cache-Control';
    meta.content = 'no-cache, no-store, must-revalidate';
    document.head.appendChild(meta);
    
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  useEffect(() => {
    // Raw HTML injection test
    const testElement = document.createElement('div');
    testElement.innerHTML = `
      <div style="position: fixed; top: 0; right: 0; background: red; color: white; padding: 10px; z-index: 999999;">
        APP.JS LOADED: ${new Date().toLocaleTimeString()}
      </div>
    `;
    document.body.appendChild(testElement);
    
    return () => {
      document.body.removeChild(testElement);
    };
  }, []);

  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/about" element={<About />} />
        
        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/negotiator" element={<NegotiatorPage />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/help" element={<HelpResources />} />
            <Route path="/account" element={<Account />} />
            <Route path="/history" element={<NegotiationHistory />} />
            <Route path="/create-indexes" element={<CreateIndexes />} />
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/direct-chat" element={<NegotiationChat2 />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;

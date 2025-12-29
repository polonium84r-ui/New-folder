import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Analysis from './pages/Analysis';
import AnalysisProcessing from './pages/AnalysisProcessing';
import AnalysisResults from './pages/AnalysisResults';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Settings from './pages/Settings';
import Login from './pages/Login';
import About from './pages/About';
import analytics from './utils/analytics';
import Security from './utils/security';
import './index.css';

// Component to conditionally render navbar
const ConditionalNavbar = () => {
  const location = useLocation();
  const hideNavbarPaths = ['/'];
  
  if (hideNavbarPaths.includes(location.pathname)) {
    return null;
  }
  
  return <Navbar />;
};

// Component to conditionally render footer
const ConditionalFooter = () => {
  const location = useLocation();
  const showFooterPaths = ['/', '/about']; // Only show footer on Login and About pages
  
  if (!showFooterPaths.includes(location.pathname)) {
    return null;
  }
  
  return <Footer />;
};

// Analytics wrapper component
const AnalyticsWrapper = ({ children }) => {
  const location = useLocation();
  
  useEffect(() => {
    // Track page loads
    analytics.trackPageLoad(location.pathname);
    
    // Track memory usage periodically
    const memoryInterval = setInterval(() => {
      analytics.trackMemoryUsage();
    }, 60000); // Every minute
    
    return () => clearInterval(memoryInterval);
  }, [location]);
  
  return children;
};

function App() {
  useEffect(() => {
    // Initialize security monitoring
    const user = Security.getUserFromToken();
    if (user) {
      Security.startSessionMonitoring();
    }
    
    // Track app initialization
    analytics.trackUserAction('app_initialized', {
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });
    
    // Performance monitoring
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <AnalyticsWrapper>
          <div className="min-h-screen flex flex-col">
            <ConditionalNavbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                <Route path="/about" element={<ProtectedRoute><About /></ProtectedRoute>} />
                <Route path="/analysis" element={<ProtectedRoute><Analysis /></ProtectedRoute>} />
                <Route path="/analysis-processing" element={<ProtectedRoute><AnalysisProcessing /></ProtectedRoute>} />
                <Route path="/analysis-results" element={<ProtectedRoute><AnalysisResults /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/admin-dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              </Routes>
            </main>
            <ConditionalFooter />
            <Toaster 
              position="top-right" 
              toastOptions={{
                duration: 6000, // General toast duration set to 6 seconds
                style: {
                  zIndex: 99999,
                  fontSize: '14px', // Reduced from 18px
                  fontWeight: '600', // Reduced from bold
                  padding: '12px 16px', // Reduced from 20px 24px
                  borderRadius: '8px', // Reduced from 12px
                  boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)', // Reduced shadow
                  maxWidth: '400px', // Reduced from 600px
                  minHeight: '40px', // Reduced from 60px
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  marginTop: '20px'
                },
                error: {
                  duration: 7000, // Error messages stay for 7 seconds
                  style: {
                    background: '#dc2626',
                    color: 'white',
                    border: '2px solid #991b1b', // Reduced from 3px
                    fontSize: '15px', // Reduced from 20px
                    fontWeight: '700', // Reduced from 900
                    padding: '14px 18px', // Reduced from 24px 32px
                    minHeight: '50px', // Reduced from 80px
                    boxShadow: '0 25px 50px rgba(220, 38, 38, 0.4)',
                    borderRadius: '16px'
                  }
                },
                success: {
                  style: {
                    background: '#059669',
                    color: 'white',
                    border: '2px solid #047857', // Reduced from 3px
                    fontSize: '14px', // Reduced from 18px
                    fontWeight: '600', // Reduced from bold
                    padding: '12px 16px', // Reduced from 20px 24px
                    minHeight: '40px' // Reduced from 60px
                  }
                }
              }}
            />
          </div>
        </AnalyticsWrapper>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
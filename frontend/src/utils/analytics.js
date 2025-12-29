// Performance monitoring and analytics utility
class Analytics {
  constructor() {
    this.startTimes = new Map();
    this.metrics = {
      pageLoads: 0,
      analysisCount: 0,
      errors: 0,
      averageAnalysisTime: 0
    };
  }

  // Track page performance
  trackPageLoad(pageName) {
    const loadTime = performance.now();
    console.log(`📊 Page Load: ${pageName} - ${loadTime.toFixed(2)}ms`);
    this.metrics.pageLoads++;
    
    // Track Core Web Vitals
    this.trackWebVitals();
  }

  // Track analysis performance
  startAnalysis(analysisId) {
    this.startTimes.set(analysisId, performance.now());
    console.log(`🔬 Analysis Started: ${analysisId}`);
  }

  endAnalysis(analysisId, success = true) {
    const startTime = this.startTimes.get(analysisId);
    if (startTime) {
      const duration = performance.now() - startTime;
      console.log(`🔬 Analysis ${success ? 'Completed' : 'Failed'}: ${analysisId} - ${duration.toFixed(2)}ms`);
      
      if (success) {
        this.metrics.analysisCount++;
        this.updateAverageAnalysisTime(duration);
      } else {
        this.metrics.errors++;
      }
      
      this.startTimes.delete(analysisId);
      return duration;
    }
  }

  // Track user interactions
  trackUserAction(action, details = {}) {
    console.log(`👤 User Action: ${action}`, details);
    
    // Track specific medical actions
    if (action.includes('medical') || action.includes('analysis')) {
      this.trackMedicalAction(action, details);
    }
  }

  // Track medical-specific actions for compliance
  trackMedicalAction(action, details) {
    const medicalLog = {
      action,
      details,
      timestamp: new Date().toISOString(),
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId()
    };
    
    console.log('🏥 Medical Action Logged:', medicalLog);
    
    // In production, this would send to a secure logging service
    if (process.env.NODE_ENV === 'production') {
      // Send to secure medical logging endpoint
      this.sendToMedicalAuditLog(medicalLog);
    }
  }

  // Track Core Web Vitals
  trackWebVitals() {
    // Largest Contentful Paint
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        console.log('📈 LCP:', entry.startTime.toFixed(2), 'ms');
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        console.log('📈 FID:', entry.processingStart - entry.startTime, 'ms');
      }
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          console.log('📈 CLS:', entry.value);
        }
      }
    }).observe({ entryTypes: ['layout-shift'] });
  }

  // Memory usage monitoring
  trackMemoryUsage() {
    if ('memory' in performance) {
      const memory = performance.memory;
      console.log('💾 Memory Usage:', {
        used: `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`
      });
    }
  }

  // Error tracking
  trackError(error, context) {
    this.metrics.errors++;
    const errorLog = {
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };
    
    console.error('🚨 Error Tracked:', errorLog);
    
    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorTracking(errorLog);
    }
  }

  // Get current metrics
  getMetrics() {
    return {
      ...this.metrics,
      memoryUsage: 'memory' in performance ? performance.memory : null,
      timestamp: new Date().toISOString()
    };
  }

  // Helper methods
  getCurrentUserId() {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      return user?.id || 'anonymous';
    } catch {
      return 'anonymous';
    }
  }

  getSessionId() {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  updateAverageAnalysisTime(newTime) {
    const count = this.metrics.analysisCount;
    this.metrics.averageAnalysisTime = 
      ((this.metrics.averageAnalysisTime * (count - 1)) + newTime) / count;
  }

  // Placeholder methods for production integrations
  sendToMedicalAuditLog(logData) {
    // In production: send to secure medical audit logging service
    console.log('🏥 Would send to medical audit log:', logData);
  }

  sendToErrorTracking(errorData) {
    // In production: send to error tracking service (Sentry, etc.)
    console.log('🚨 Would send to error tracking:', errorData);
  }
}

// Create singleton instance
const analytics = new Analytics();

// Global error handler
window.addEventListener('error', (event) => {
  analytics.trackError(event.error, 'Global Error Handler');
});

window.addEventListener('unhandledrejection', (event) => {
  analytics.trackError(new Error(event.reason), 'Unhandled Promise Rejection');
});

export default analytics;
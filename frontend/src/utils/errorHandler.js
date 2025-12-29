import { toast } from 'react-hot-toast';

// Centralized error handling utility
export class ErrorHandler {
  static handle(error, context = 'Operation') {
    console.error(`${context} Error:`, error);
    
    // Network errors
    if (!error.response) {
      toast.error('Network connection failed. Please check your internet connection.');
      return {
        type: 'network',
        message: 'Network connection failed',
        shouldRetry: true
      };
    }
    
    // HTTP errors
    const status = error.response.status;
    const data = error.response.data;
    
    switch (status) {
      case 400:
        toast.error(data.error || 'Invalid request. Please check your input.');
        return { type: 'validation', message: data.error, shouldRetry: false };
        
      case 401:
        toast.error('Session expired. Please log in again.');
        // Auto-logout on 401
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setTimeout(() => window.location.href = '/', 2000);
        return { type: 'auth', message: 'Unauthorized', shouldRetry: false };
        
      case 403:
        toast.error('Access denied. You don\'t have permission for this action.');
        return { type: 'permission', message: 'Forbidden', shouldRetry: false };
        
      case 404:
        toast.error('Resource not found. Please try again.');
        return { type: 'notFound', message: 'Not found', shouldRetry: false };
        
      case 429:
        toast.error('Too many requests. Please wait a moment and try again.');
        return { type: 'rateLimit', message: 'Rate limited', shouldRetry: true };
        
      case 500:
        toast.error('Server error. Our team has been notified.');
        return { type: 'server', message: 'Internal server error', shouldRetry: true };
        
      case 503:
        toast.error('Service temporarily unavailable. Please try again later.');
        return { type: 'service', message: 'Service unavailable', shouldRetry: true };
        
      default:
        toast.error(data.error || `${context} failed. Please try again.`);
        return { type: 'unknown', message: data.error || 'Unknown error', shouldRetry: true };
    }
  }
  
  static handleMedicalError(error, analysisId = null) {
    const result = this.handle(error, 'Medical Analysis');
    
    // Log medical errors for compliance
    if (analysisId) {
      console.error(`Medical Analysis Error [ID: ${analysisId}]:`, {
        error: result,
        timestamp: new Date().toISOString(),
        analysisId
      });
    }
    
    return result;
  }
  
  static async withRetry(operation, maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        const errorInfo = this.handle(error, `Attempt ${attempt}`);
        
        if (!errorInfo.shouldRetry || attempt === maxRetries) {
          throw error;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
      }
    }
  }
}

export default ErrorHandler;
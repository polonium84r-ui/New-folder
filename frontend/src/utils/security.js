// Security utilities for medical application
export class Security {
  // Token management
  static getToken() {
    return localStorage.getItem('token');
  }

  static setToken(token) {
    if (!token) return false;
    
    try {
      // Validate token format (basic JWT structure check)
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }
      
      localStorage.setItem('token', token);
      return true;
    } catch (error) {
      console.error('Invalid token:', error);
      return false;
    }
  }

  static removeToken() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();
  }

  // Token validation
  static isTokenValid(token = null) {
    const authToken = token || this.getToken();
    if (!authToken) return false;
    
    try {
      const payload = JSON.parse(atob(authToken.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      // Check if token is expired
      if (payload.exp && payload.exp < currentTime) {
        this.removeToken();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      this.removeToken();
      return false;
    }
  }

  // Get user from token
  static getUserFromToken(token = null) {
    const authToken = token || this.getToken();
    if (!this.isTokenValid(authToken)) return null;
    
    try {
      const payload = JSON.parse(atob(authToken.split('.')[1]));
      return {
        id: payload.id,
        email: payload.email,
        role: payload.role,
        name: payload.name
      };
    } catch (error) {
      console.error('Error extracting user from token:', error);
      return null;
    }
  }

  // Session management
  static startSession(user, token) {
    const sessionData = {
      user,
      loginTime: new Date().toISOString(),
      sessionId: this.generateSessionId(),
      lastActivity: new Date().toISOString()
    };
    
    this.setToken(token);
    localStorage.setItem('user', JSON.stringify(user));
    sessionStorage.setItem('sessionData', JSON.stringify(sessionData));
    
    // Start session monitoring
    this.startSessionMonitoring();
  }

  static updateLastActivity() {
    const sessionData = JSON.parse(sessionStorage.getItem('sessionData') || '{}');
    sessionData.lastActivity = new Date().toISOString();
    sessionStorage.setItem('sessionData', JSON.stringify(sessionData));
  }

  static endSession() {
    this.removeToken();
    sessionStorage.clear();
    
    // Clear any sensitive data from memory
    if (window.gc) {
      window.gc();
    }
  }

  // Session monitoring for auto-logout
  static startSessionMonitoring() {
    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    let inactivityTimer;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      this.updateLastActivity();
      
      inactivityTimer = setTimeout(() => {
        this.handleSessionTimeout();
      }, INACTIVITY_TIMEOUT);
    };

    // Monitor user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    // Initial timer
    resetTimer();
  }

  static handleSessionTimeout() {
    console.warn('Session timed out due to inactivity');
    this.endSession();
    window.location.href = '/?timeout=true';
  }

  // Generate secure session ID
  static generateSessionId() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Content Security Policy helpers
  static sanitizeHTML(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }

  static validateFileUpload(file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/tiff'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('File type not allowed');
    }
    
    if (file.size > maxSize) {
      throw new Error('File size too large');
    }
    
    return true;
  }

  // Medical data encryption helpers (for sensitive data)
  static async hashSensitiveData(data) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Rate limiting helper
  static createRateLimiter(maxRequests, timeWindow) {
    const requests = new Map();
    
    return (key) => {
      const now = Date.now();
      const windowStart = now - timeWindow;
      
      // Clean old requests
      for (const [requestKey, timestamps] of requests.entries()) {
        requests.set(requestKey, timestamps.filter(time => time > windowStart));
        if (requests.get(requestKey).length === 0) {
          requests.delete(requestKey);
        }
      }
      
      // Check current key
      const keyRequests = requests.get(key) || [];
      
      if (keyRequests.length >= maxRequests) {
        return false; // Rate limited
      }
      
      keyRequests.push(now);
      requests.set(key, keyRequests);
      return true; // Allowed
    };
  }

  // Medical audit logging
  static logMedicalAction(action, details = {}) {
    const user = this.getUserFromToken();
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId: user?.id || 'anonymous',
      userRole: user?.role || 'unknown',
      action,
      details,
      sessionId: JSON.parse(sessionStorage.getItem('sessionData') || '{}').sessionId,
      ipAddress: 'client-side', // Would be filled by backend
      userAgent: navigator.userAgent
    };
    
    console.log('🏥 Medical Action Audit:', logEntry);
    
    // In production, send to secure audit logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToAuditLog(logEntry);
    }
  }

  // HIPAA compliance helpers
  static maskPatientData(data) {
    if (typeof data !== 'string') return data;
    
    // Mask email addresses
    data = data.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '***@***.***');
    
    // Mask phone numbers
    data = data.replace(/\b\d{3}-?\d{3}-?\d{4}\b/g, '***-***-****');
    
    // Mask SSN-like patterns
    data = data.replace(/\b\d{3}-?\d{2}-?\d{4}\b/g, '***-**-****');
    
    return data;
  }

  // Check if user has required permissions
  static hasPermission(requiredRole, userRole = null) {
    const user = userRole || this.getUserFromToken()?.role;
    if (!user) return false;
    
    const roleHierarchy = {
      'admin': 3,
      'doctor': 2,
      'user': 1
    };
    
    return roleHierarchy[user] >= roleHierarchy[requiredRole];
  }

  // Secure data transmission
  static prepareSecurePayload(data) {
    return {
      ...data,
      timestamp: new Date().toISOString(),
      checksum: this.calculateChecksum(JSON.stringify(data))
    };
  }

  static calculateChecksum(data) {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  // Placeholder for production audit logging
  static sendToAuditLog(logEntry) {
    // In production: send to secure audit logging service
    console.log('🔒 Would send to secure audit log:', logEntry);
  }
}

export default Security;
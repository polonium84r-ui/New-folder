// Comprehensive validation utilities for medical application
export class Validator {
  // Email validation
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const errors = [];
    
    if (!email) {
      errors.push('Email is required');
    } else if (!emailRegex.test(email)) {
      errors.push('Please enter a valid email address');
    } else if (email.length > 254) {
      errors.push('Email address is too long');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Password validation
  static validatePassword(password, isTemporary = false) {
    const errors = [];
    
    if (!password) {
      errors.push('Password is required');
      return { isValid: false, errors };
    }
    
    if (password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }
    
    if (!isTemporary) {
      if (password.length > 128) {
        errors.push('Password is too long (maximum 128 characters)');
      }
      
      if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
      }
      
      if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
      }
      
      if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
      }
      
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Password must contain at least one special character');
      }
      
      // Check for common weak passwords
      const commonPasswords = [
        'password', '123456', 'password123', 'admin', 'qwerty',
        'letmein', 'welcome', 'monkey', '1234567890'
      ];
      
      if (commonPasswords.includes(password.toLowerCase())) {
        errors.push('Password is too common. Please choose a stronger password');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      strength: this.getPasswordStrength(password)
    };
  }

  // Password strength calculator
  static getPasswordStrength(password) {
    let score = 0;
    
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    if (password.length >= 16) score += 1;
    
    const strength = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    return {
      score,
      level: strength[Math.min(score, 5)],
      percentage: Math.min((score / 6) * 100, 100)
    };
  }

  // Name validation
  static validateName(name) {
    const errors = [];
    
    if (!name) {
      errors.push('Name is required');
    } else if (name.length < 2) {
      errors.push('Name must be at least 2 characters long');
    } else if (name.length > 100) {
      errors.push('Name is too long (maximum 100 characters)');
    } else if (!/^[a-zA-Z\s'-]+$/.test(name)) {
      errors.push('Name can only contain letters, spaces, hyphens, and apostrophes');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Medical image validation
  static validateMedicalImage(file) {
    const errors = [];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/tiff'];
    
    if (!file) {
      errors.push('Medical image is required');
      return { isValid: false, errors };
    }
    
    if (!allowedTypes.includes(file.type)) {
      errors.push('Only JPEG, PNG, and TIFF images are allowed for medical analysis');
    }
    
    if (file.size > maxSize) {
      errors.push('Image file size must be less than 10MB');
    }
    
    if (file.size < 1024) {
      errors.push('Image file appears to be corrupted or too small');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      }
    };
  }

  // Patient information validation
  static validatePatientInfo(patientInfo) {
    const errors = {};
    
    // Name validation
    const nameValidation = this.validateName(patientInfo.name);
    if (!nameValidation.isValid) {
      errors.name = nameValidation.errors;
    }
    
    // Patient ID validation
    if (!patientInfo.patientId) {
      errors.patientId = ['Patient ID is required'];
    } else if (!/^[A-Z0-9-]+$/i.test(patientInfo.patientId)) {
      errors.patientId = ['Patient ID can only contain letters, numbers, and hyphens'];
    }
    
    // Age validation
    const age = parseInt(patientInfo.age);
    if (!patientInfo.age) {
      errors.age = ['Age is required'];
    } else if (isNaN(age) || age < 0 || age > 150) {
      errors.age = ['Please enter a valid age between 0 and 150'];
    }
    
    // Gender validation
    const validGenders = ['male', 'female', 'other'];
    if (!patientInfo.gender) {
      errors.gender = ['Gender is required'];
    } else if (!validGenders.includes(patientInfo.gender.toLowerCase())) {
      errors.gender = ['Please select a valid gender'];
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // Form validation helper
  static validateForm(formData, rules) {
    const errors = {};
    
    for (const [field, fieldRules] of Object.entries(rules)) {
      const value = formData[field];
      const fieldErrors = [];
      
      for (const rule of fieldRules) {
        const result = rule.validator(value);
        if (!result.isValid) {
          fieldErrors.push(...result.errors);
        }
      }
      
      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors;
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // Sanitize input to prevent XSS
  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  // Validate medical analysis results
  static validateAnalysisResults(results) {
    const errors = [];
    
    if (!results) {
      errors.push('Analysis results are required');
      return { isValid: false, errors };
    }
    
    if (!results.confidence || results.confidence < 0 || results.confidence > 100) {
      errors.push('Invalid confidence score');
    }
    
    if (!results.classification || !['positive', 'negative', 'uncertain'].includes(results.classification)) {
      errors.push('Invalid classification result');
    }
    
    if (!results.cellCount || results.cellCount < 0) {
      errors.push('Invalid cell count');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default Validator;
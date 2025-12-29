# 🏥 AI-powered Leukemia Screening System - API Documentation

## 📋 **Overview**

This document provides comprehensive API documentation for the AI-powered Acute Lymphoblastic Leukemia Screening System. The API follows RESTful principles and provides secure endpoints for medical image analysis, user management, and clinical data handling.

**Base URL:** `http://localhost:5000/api`  
**Authentication:** JWT Bearer Token  
**Content-Type:** `application/json`

---

## 🔐 **Authentication Endpoints**

### **POST /auth/login**
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "doctor@hospital.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "email": "doctor@hospital.com",
    "name": "Dr. John Smith",
    "role": "doctor",
    "lastLogin": "2024-01-15T10:30:00Z",
    "analysisCount": 25,
    "mustChangePassword": false,
    "isTemporaryPassword": false
  }
}
```

**Error Responses:**
- `401`: Invalid username/email or password invalid
- `400`: Email and password are required

---

### **POST /auth/register** 🔒 *Admin Only*
Create new doctor account with temporary password.

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "email": "newdoctor@hospital.com",
  "name": "Dr. Jane Doe"
}
```

**Response (201):**
```json
{
  "message": "Doctor account created successfully",
  "user": {
    "id": "new_user_id",
    "email": "newdoctor@hospital.com",
    "name": "Dr. Jane Doe",
    "role": "doctor"
  },
  "temporaryPassword": "temp123ABC"
}
```

---

### **GET /auth/me**
Get current user information.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "user": {
    "id": "user_id",
    "email": "doctor@hospital.com",
    "name": "Dr. John Smith",
    "role": "doctor",
    "lastLogin": "2024-01-15T10:30:00Z",
    "analysisCount": 25
  }
}
```

---

### **PUT /auth/change-password**
Change user password.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

---

### **PUT /auth/force-password-change**
Force password change for temporary passwords.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "newPassword": "newSecurePassword456"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully. You can now use the app normally."
}
```

---

## 👥 **User Management Endpoints** 🔒 *Admin Only*

### **GET /auth/users**
Get all active users.

**Headers:** `Authorization: Bearer <admin_token>`

**Response (200):**
```json
{
  "users": [
    {
      "id": "user_id_1",
      "email": "doctor1@hospital.com",
      "name": "Dr. John Smith",
      "role": "doctor",
      "createdAt": "2024-01-01T00:00:00Z",
      "lastLogin": "2024-01-15T10:30:00Z",
      "analysisCount": 25
    }
  ]
}
```

---

### **POST /auth/reset-password**
Reset doctor password (generates temporary password).

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "userId": "doctor_user_id"
}
```

**Response (200):**
```json
{
  "message": "Password reset successfully",
  "temporaryPassword": "temp789XYZ",
  "user": {
    "id": "doctor_user_id",
    "email": "doctor@hospital.com",
    "name": "Dr. John Smith"
  }
}
```

---

### **DELETE /auth/users/:id**
Delete doctor account.

**Headers:** `Authorization: Bearer <admin_token>`

**Response (200):**
```json
{
  "message": "Doctor account deleted successfully",
  "deletedUser": {
    "id": "deleted_user_id",
    "name": "Dr. John Smith",
    "email": "doctor@hospital.com",
    "role": "doctor"
  }
}
```

---

## 🔬 **Analysis Endpoints**

### **POST /analysis/upload**
Upload medical image for AI analysis.

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body (FormData):**
```
image: <medical_image_file>
patientInfo: {
  "name": "Patient Name",
  "patientId": "P-123456",
  "age": 45,
  "gender": "male"
}
```

**Response (200):**
```json
{
  "analysisId": "analysis_123",
  "message": "Analysis started successfully",
  "estimatedTime": "2-3 minutes"
}
```

---

### **GET /analysis/status/:analysisId**
Get analysis status and results.

**Headers:** `Authorization: Bearer <token>`

**Response (200) - In Progress:**
```json
{
  "status": "processing",
  "progress": 75,
  "message": "Analyzing cellular structures..."
}
```

**Response (200) - Completed:**
```json
{
  "status": "completed",
  "results": {
    "analysisId": "analysis_123",
    "classification": "positive",
    "confidence": 87.5,
    "riskLevel": "HIGH",
    "cellCount": {
      "total": 1250,
      "suspicious": 156,
      "percentage": 12.48
    },
    "roboflowPredictions": [
      {
        "class": "lymphoblast",
        "confidence": 0.89,
        "bbox": [100, 150, 200, 250]
      }
    ],
    "patientInfo": {
      "name": "Patient Name",
      "patientId": "P-123456",
      "age": 45,
      "gender": "male"
    },
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

---

### **GET /analysis/history**
Get user's analysis history.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 10)
- `status`: Filter by status (completed, processing, failed)

**Response (200):**
```json
{
  "analyses": [
    {
      "id": "analysis_123",
      "patientName": "Patient Name",
      "patientId": "P-123456",
      "classification": "positive",
      "confidence": 87.5,
      "riskLevel": "HIGH",
      "timestamp": "2024-01-15T10:30:00Z",
      "status": "completed"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalResults": 47,
    "hasNext": true,
    "hasPrev": false
  },
  "statistics": {
    "totalAnalyses": 47,
    "thisWeek": 12,
    "positiveResults": 8,
    "successRate": 95.7
  }
}
```

---

### **GET /analysis/:id**
Get detailed analysis results.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "analysis": {
    "id": "analysis_123",
    "patientInfo": {
      "name": "Patient Name",
      "patientId": "P-123456",
      "age": 45,
      "gender": "male"
    },
    "results": {
      "classification": "positive",
      "confidence": 87.5,
      "riskLevel": "HIGH",
      "cellCount": {
        "total": 1250,
        "suspicious": 156,
        "percentage": 12.48
      },
      "morphologicalAnalysis": "Detailed cellular analysis...",
      "clinicalRecommendations": "Immediate hematology consultation recommended..."
    },
    "images": {
      "original": "/uploads/original_image.jpg",
      "analyzed": "/uploads/analyzed_image.jpg"
    },
    "roboflowPredictions": [...],
    "timestamp": "2024-01-15T10:30:00Z",
    "analyzedBy": "Dr. John Smith"
  }
}
```

---

## 📊 **Dashboard Endpoints**

### **GET /dashboard/stats** 🔒 *Admin Only*
Get system-wide statistics.

**Headers:** `Authorization: Bearer <admin_token>`

**Response (200):**
```json
{
  "systemStats": {
    "totalUsers": 25,
    "activeUsers": 18,
    "totalAnalyses": 1247,
    "thisMonth": 156,
    "positiveRate": 12.3,
    "averageProcessingTime": 2.4
  },
  "recentActivity": [
    {
      "type": "analysis_completed",
      "user": "Dr. John Smith",
      "timestamp": "2024-01-15T10:30:00Z",
      "details": "Positive result - HIGH risk"
    }
  ],
  "performanceMetrics": {
    "uptime": "99.8%",
    "averageResponseTime": "245ms",
    "errorRate": "0.2%"
  }
}
```

---

## 🔧 **Profile Management**

### **PUT /auth/profile**
Update user profile information.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Dr. John Smith Jr.",
  "email": "johnsmith.jr@hospital.com"
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "user_id",
    "email": "johnsmith.jr@hospital.com",
    "name": "Dr. John Smith Jr.",
    "role": "doctor",
    "analysisCount": 25
  }
}
```

---

## 🚨 **Error Handling**

### **Standard Error Response Format:**
```json
{
  "error": "Descriptive error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/endpoint"
}
```

### **Common HTTP Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `429`: Too Many Requests (rate limited)
- `500`: Internal Server Error
- `503`: Service Unavailable

---

## 🔒 **Security Features**

### **Authentication:**
- JWT tokens with expiration
- Role-based access control (Admin/Doctor)
- Automatic token refresh
- Session monitoring and timeout

### **Data Protection:**
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- File upload validation
- Rate limiting

### **Medical Compliance:**
- HIPAA-ready audit logging
- Secure patient data handling
- Encrypted data transmission
- Access control and permissions

---

## 📈 **Rate Limits**

| Endpoint Category | Limit | Window |
|------------------|-------|---------|
| Authentication | 5 requests | 15 minutes |
| Analysis Upload | 10 requests | 1 hour |
| General API | 100 requests | 15 minutes |
| Admin Operations | 50 requests | 15 minutes |

---

## 🧪 **Testing Endpoints**

### **Development/Testing Only:**

**GET /health**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "database": "connected",
  "services": {
    "roboflow": "active",
    "storage": "active"
  }
}
```

---

## 📞 **Support & Contact**

For API support, technical issues, or feature requests:
- **Technical Documentation**: See `/docs` endpoint
- **Error Reporting**: Check application logs
- **Performance Monitoring**: Built-in analytics dashboard

**This API documentation covers all endpoints for the production-ready medical screening system.**
# 🚀 AI-powered Acute Lymphoblastic Leukemia Screening System - System Access Guide

## 🌐 Application URLs

### Frontend Application
- **Main Application**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000/admin-dashboard
- **Doctor Dashboard**: http://localhost:3000/home
- **Analysis Upload**: http://localhost:3000/analysis

### Backend API
- **Base API URL**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/health
- **Authentication**: http://localhost:5000/api/auth/login
- **User Management**: http://localhost:5000/api/auth/users

## 🔐 Login Credentials & Format Rules

### 👑 Admin Account (NO @ Symbol)
```
Email:    radarprojects.com
Password: Radar@2028
Format:   NO @ symbol required
Role:     admin
Access:   Complete system administration
```

### 👨‍⚕️ Doctor Accounts (WITH @ Symbol)
```
Email:    doctor@hospital.com
Password: Doctor123!
Format:   MUST include @ symbol
Role:     doctor
Access:   Patient management and AI analysis
```

**Important Login Rules:**
- ⚠️ **Admin ONLY**: Uses `radarprojects.com` (no @ symbol)
- ⚠️ **Doctors ONLY**: Must use standard email format with @ symbol
- 🔒 **Both**: Use secure JWT authentication with bcrypt password hashing
- 🏥 **Role-Based**: Automatic redirection based on user role

## 👨‍⚕️ Doctor Account Format

Doctors MUST use standard email format with @ symbol:
```
Email:    doctor@hospital.com
Password: [set by admin]
Role:     doctor
Format:   MUST include @ symbol
```

**Doctor Account Rules:**
- ✅ **Required**: Standard email format (user@domain.com)
- ✅ **Created by**: Admin through system registration
- ✅ **Access**: Patient management and AI analysis features
- ✅ **Redirects to**: /home (doctor dashboard)

## 🎯 Quick Access Test

### Test Admin Login (Command Line)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"radarprojects.com","password":"Radar@2028"}'
```

### Test Admin Login (PowerShell)
```powershell
$body = '{"email":"radarprojects.com","password":"Radar@2028"}'
Invoke-WebRequest -Uri http://localhost:5000/api/auth/login -Method POST -ContentType "application/json" -Body $body
```

## 🏥 System Features by Role

### 👑 Admin Features
- **User Management**: View and manage all doctors
- **System Analytics**: Real-time dashboard with metrics
- **Activity Monitoring**: Track doctor activities and analysis counts
- **System Health**: Monitor backend and database status
- **Security Management**: JWT tokens and access control

### 👨‍⚕️ Doctor Features
- **Patient Management**: Create and manage patient records
- **AI Screening**: Upload blood smear images for ALL screening
- **Results Review**: View detailed analysis results and recommendations
- **Medical Reports**: Generate and export diagnostic reports
- **Analysis History**: Track previous analyses and outcomes

## 🔧 Verification Scripts

### Backend Admin Verification
```bash
cd backend
node verify-admin.js
```

### Create Admin User (if needed)
```bash
cd backend
node scripts/createAdmin.js
```

## 🚨 Security Notes

### Development Environment
- ✅ Current credentials are safe for development
- ✅ JWT tokens expire in 7 days
- ✅ Passwords are hashed with bcrypt
- ✅ Role-based access control active

### Production Deployment
- ⚠️ **Change default admin password**
- ⚠️ **Use HTTPS in production**
- ⚠️ **Secure MongoDB connection**
- ⚠️ **Implement additional rate limiting**
- ⚠️ **Regular security audits**

## 📊 System Status Verification

### Check All Services
1. **Backend Health**: http://localhost:5000/health
2. **Frontend Loading**: http://localhost:3000
3. **Admin Login**: Use credentials above
4. **Database Connection**: Verified through health check

### Expected Response (Health Check)
```json
{
  "status": "OK",
  "timestamp": "2025-12-28T19:14:13.675Z",
  "service": "AI-powered Acute Lymphoblastic Leukemia Screening API"
}
```

## 🎉 Ready for Use!

Your AI-powered Acute Lymphoblastic Leukemia Screening System is now fully configured with:

✅ **Static Admin Account**: `radarprojects.com` / `Radar@2028`  
✅ **Roboflow AI Integration**: Advanced leukemia detection  
✅ **MongoDB Database**: Secure data storage  
✅ **JWT Authentication**: Secure access control  
✅ **Professional UI**: Medical-grade interface  
✅ **Real-time Analytics**: Live system monitoring  

**🏥 The system is ready for medical professionals to start using for ALL screening!** 🩸✨

---

*For technical support or questions, refer to the API_DOCUMENTATION.md and DEPLOYMENT_GUIDE.md files.*
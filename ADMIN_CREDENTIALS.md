# 🔐 AI-powered Acute Lymphoblastic Leukemia Screening System - Admin Credentials

## Static Admin Account

The AI-powered Acute Lymphoblastic Leukemia Screening System includes a pre-configured static admin account for system administration and management.

### 🔑 Admin Login Credentials

```
Email:    radarprojects.com
Password: Radar@2028
```

**Critical Login Rules:**
- ⚠️ **NO @ Symbol**: Admin email is `radarprojects.com` (without @ symbol)
- ⚠️ **Doctors MUST use @ Symbol**: Standard email format required for doctors
- 🔒 **Case Sensitive**: Password is exactly `Radar@2028`
- 👑 **Full Access**: Admin role has complete system access
- 🏥 **Medical System**: Designed for healthcare environment administration

**Login Format Examples:**
- ✅ **Admin**: `radarprojects.com` (correct - no @ symbol)
- ❌ **Admin**: `radarprojects@com` (incorrect - has @ symbol)
- ✅ **Doctor**: `doctor@hospital.com` (correct - has @ symbol)
- ❌ **Doctor**: `doctor.hospital.com` (incorrect - no @ symbol)

### 🌐 Admin Access URLs

**Frontend Login**: http://localhost:3000  
**Admin Dashboard**: http://localhost:3000/admin-dashboard  
**Backend API**: http://localhost:5000/api

### 👑 Admin Privileges

**✅ User Management:**
- View all system users (doctors)
- Monitor user activity and login history
- Track analysis counts per doctor
- Manage user accounts and permissions

**✅ System Monitoring:**
- Real-time dashboard with auto-refresh
- System health and performance metrics
- Database connection status
- API endpoint monitoring

**✅ Analytics & Reporting:**
- Total system usage statistics
- Doctor activity analysis
- Analysis completion rates
- System performance metrics

**✅ Security Management:**
- JWT token management
- Role-based access control
- Security audit logs
- System access monitoring

### 🔐 Security Features

**🛡️ Authentication:**
- JWT-based secure authentication
- Password hashing with bcrypt
- Session management and expiration
- Role-based access control (RBAC)

**🔒 Data Protection:**
- Encrypted password storage
- Secure API endpoints
- CORS protection
- Rate limiting protection

**📊 Audit Trail:**
- Login activity tracking
- User action logging
- System access monitoring
- Security event recording

### 🚀 Quick Admin Login Test

**Using cURL:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"radarprojects.com","password":"Radar@2028"}'
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "695018ecfd6e98ac64588323",
    "email": "radarprojects.com",
    "name": "System Administrator",
    "role": "admin",
    "lastLogin": "2025-12-28T19:13:20.073Z",
    "analysisCount": 0
  }
}
```

### 🏥 Medical System Administration

**👨‍⚕️ Doctor Management:**
- Monitor doctor registrations
- Track medical analysis activity
- Review diagnostic accuracy
- Manage clinical workflows

**🩸 Analysis Oversight:**
- Monitor ALL screening analyses
- Review AI diagnostic results
- Track system accuracy metrics
- Manage quality assurance

**📈 Performance Monitoring:**
- System response times
- Database performance
- AI model accuracy
- User satisfaction metrics

### ⚠️ Important Security Notes

1. **Production Deployment**: Change default credentials before production
2. **Network Security**: Ensure HTTPS in production environment
3. **Database Security**: Secure MongoDB connection strings
4. **API Security**: Implement additional rate limiting if needed
5. **Backup Strategy**: Regular database backups recommended

### 🔧 Admin Account Management

**To Reset Admin Password:**
```bash
cd backend
node scripts/createAdmin.js
```

**To Verify Admin Account:**
```bash
# Test login endpoint
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"radarprojects.com","password":"Radar@2028"}'
```

### 📞 Support Information

**System**: AI-powered Acute Lymphoblastic Leukemia Screening System v1.0  
**Environment**: Development/Production Ready  
**Database**: MongoDB Atlas  
**AI Integration**: Roboflow Computer Vision  
**Authentication**: JWT with bcrypt  

---

## 🎯 Admin Dashboard Features

### 📊 Real-Time Monitoring
- **Auto-refresh**: Updates every 30 seconds
- **Live Statistics**: Total doctors, analyses, activity
- **System Health**: Database and API status
- **Performance Metrics**: Response times and accuracy

### 👥 User Activity Table
- **Doctor Profiles**: Name, email, registration date
- **Analysis Counts**: Total analyses per doctor
- **Last Login**: Recent activity tracking
- **Account Status**: Active/inactive monitoring

### 🔍 System Analytics
- **Usage Trends**: Daily/weekly/monthly statistics
- **Performance Data**: System efficiency metrics
- **Quality Metrics**: AI accuracy and reliability
- **Growth Analytics**: User adoption and engagement

---

**🏥 Ready for Medical Professional Use - Secure, Reliable, Professional** ✨
# 🚀 Render + MongoDB Atlas Deployment Guide

## 📋 **Overview**

This guide provides step-by-step instructions for deploying the AI-powered Acute Lymphoblastic Leukemia Screening System to **Render** (hosting) and **MongoDB Atlas** (database).

---

## 🗄️ **Step 1: MongoDB Atlas Setup**

### **1.1 Create MongoDB Atlas Account**
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign up for a free account
3. Create a new project: "ALL Screening System"

### **1.2 Create Database Cluster**
1. Click "Build a Database"
2. Choose **M0 Sandbox** (Free tier)
3. Select your preferred cloud provider and region
4. Name your cluster: `all-screening-cluster`
5. Click "Create Cluster"

### **1.3 Configure Database Access**
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Username: `all_screening_user`
5. Generate a secure password (save it!)
6. Database User Privileges: "Read and write to any database"
7. Click "Add User"

### **1.4 Configure Network Access**
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Choose "Allow Access from Anywhere" (0.0.0.0/0)
4. Comment: "Render deployment access"
5. Click "Confirm"

### **1.5 Get Connection String**
1. Go to "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Driver: Node.js, Version: 4.1 or later
5. Copy the connection string:
   ```
   mongodb+srv://all_screening_user:<password>@all-screening-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<password>` with your actual password
7. Add database name: `/all_screening` before the `?`

**Final connection string:**
```
mongodb+srv://all_screening_user:YOUR_PASSWORD@all-screening-cluster.xxxxx.mongodb.net/all_screening?retryWrites=true&w=majority
```

---

## 🚀 **Step 2: Render Deployment**

### **2.1 Prepare Repository**
1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

### **2.2 Deploy Backend to Render**

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:

   **Basic Settings:**
   - Name: `all-screening-backend`
   - Environment: `Node`
   - Region: Choose closest to your users
   - Branch: `main`
   - Root Directory: `backend`

   **Build & Deploy:**
   - Build Command: `npm install`
   - Start Command: `npm start`

   **Environment Variables:**
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://all_screening_user:YOUR_PASSWORD@all-screening-cluster.xxxxx.mongodb.net/all_screening?retryWrites=true&w=majority
   JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters_long
   JWT_EXPIRES_IN=7d
   ROBOFLOW_API_KEY=your_roboflow_api_key
   ROBOFLOW_PROJECT=your_roboflow_project_id
   FRONTEND_URL=https://all-screening-frontend.onrender.com
   RATE_LIMIT_WINDOW=15
   RATE_LIMIT_MAX=100
   BCRYPT_ROUNDS=12
   ```

5. Click "Create Web Service"
6. Wait for deployment to complete
7. Note your backend URL: `https://all-screening-backend.onrender.com`

### **2.3 Deploy Frontend to Render**

1. Click "New +" → "Static Site"
2. Connect your GitHub repository
3. Configure the service:

   **Basic Settings:**
   - Name: `all-screening-frontend`
   - Branch: `main`
   - Root Directory: `frontend`

   **Build & Deploy:**
   - Build Command: `npm install && npm run build`
   - Publish Directory: `build`

   **Environment Variables:**
   ```
   REACT_APP_API_URL=https://all-screening-backend.onrender.com/api
   REACT_APP_VERSION=1.0.0
   ```

4. Click "Create Static Site"
5. Wait for deployment to complete
6. Note your frontend URL: `https://all-screening-frontend.onrender.com`

### **2.4 Update Backend CORS Settings**

1. Go to your backend service on Render
2. Update the `FRONTEND_URL` environment variable:
   ```
   FRONTEND_URL=https://all-screening-frontend.onrender.com
   ```
3. Redeploy the backend service

---

## 🔧 **Step 3: Post-Deployment Configuration**

### **3.1 Create Admin User**

1. Go to your backend service logs on Render
2. Open the web service shell (if available) or use the following method:
3. Create a temporary script to add admin user:

Create `backend/scripts/createAdmin.js`:
```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const adminUser = new User({
      email: 'admin@hospital.com',
      password: 'Admin123!', // Change this password after first login
      name: 'System Administrator',
      role: 'admin',
      isActive: true,
      mustChangePassword: true
    });

    await adminUser.save();
    console.log('Admin user created successfully');
    console.log('Email: admin@hospital.com');
    console.log('Password: Admin123!');
    console.log('Please change the password after first login');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin();
```

4. Add script to package.json:
```json
{
  "scripts": {
    "create-admin": "node scripts/createAdmin.js"
  }
}
```

5. Run the script through Render's shell or deploy it as a one-time job

### **3.2 Test the Deployment**

1. Visit your frontend URL: `https://all-screening-frontend.onrender.com`
2. Try logging in with admin credentials:
   - Email: `admin@hospital.com`
   - Password: `Admin123!`
3. Change the admin password immediately
4. Test creating a doctor account
5. Test the analysis functionality

---

## 🔒 **Step 4: Security Configuration**

### **4.1 Environment Variables Security**
- Never commit `.env` files to Git
- Use Render's environment variable interface
- Rotate JWT secrets regularly
- Use strong, unique passwords

### **4.2 Database Security**
- Enable MongoDB Atlas IP whitelist
- Use strong database passwords
- Enable database auditing (paid tiers)
- Regular backup configuration

### **4.3 SSL/HTTPS**
- Render provides automatic SSL certificates
- Ensure all API calls use HTTPS
- Configure secure headers in backend

---

## 📊 **Step 5: Monitoring & Maintenance**

### **5.1 Render Monitoring**
- Monitor service logs in Render dashboard
- Set up health check endpoints
- Configure auto-deploy on Git push

### **5.2 MongoDB Atlas Monitoring**
- Monitor database performance
- Set up alerts for high usage
- Configure automated backups

### **5.3 Application Monitoring**
- Monitor API response times
- Track error rates
- Monitor user activity

---

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **CORS Errors:**
   - Verify FRONTEND_URL in backend environment
   - Check REACT_APP_API_URL in frontend
   - Ensure both services are deployed

2. **Database Connection Issues:**
   - Verify MongoDB connection string
   - Check IP whitelist in Atlas
   - Confirm database user permissions

3. **Build Failures:**
   - Check build logs in Render
   - Verify package.json scripts
   - Ensure all dependencies are listed

4. **Environment Variables:**
   - Double-check all required variables
   - Ensure no typos in variable names
   - Verify sensitive values are correct

### **Debugging Steps:**
1. Check Render service logs
2. Verify environment variables
3. Test API endpoints directly
4. Check MongoDB Atlas metrics
5. Review browser console errors

---

## 💰 **Cost Considerations**

### **Free Tier Limits:**
- **Render**: 750 hours/month for web services
- **MongoDB Atlas**: 512MB storage, shared cluster
- **Bandwidth**: Limited but sufficient for testing

### **Scaling Options:**
- Upgrade Render plans for more resources
- Upgrade MongoDB Atlas for dedicated clusters
- Consider CDN for static assets

---

## ✅ **Deployment Checklist**

- [ ] MongoDB Atlas cluster created and configured
- [ ] Database user created with proper permissions
- [ ] Network access configured (0.0.0.0/0 for Render)
- [ ] Backend deployed to Render with all environment variables
- [ ] Frontend deployed to Render with correct API URL
- [ ] CORS configured properly between frontend and backend
- [ ] Admin user created in database
- [ ] SSL certificates working (automatic with Render)
- [ ] Health check endpoints responding
- [ ] All functionality tested in production
- [ ] Monitoring and alerts configured

---

## 🎉 **Success!**

Your AI-powered Leukemia Screening System is now live on:
- **Frontend**: `https://all-screening-frontend.onrender.com`
- **Backend API**: `https://all-screening-backend.onrender.com`
- **Database**: MongoDB Atlas cluster

**The system is now ready for production use with enterprise-grade hosting and database infrastructure!**

---

## 📞 **Support Resources**

- **Render Documentation**: https://render.com/docs
- **MongoDB Atlas Documentation**: https://docs.atlas.mongodb.com/
- **Render Community**: https://community.render.com/
- **MongoDB Community**: https://community.mongodb.com/

**Your medical screening system is now deployed and ready to help healthcare professionals detect leukemia with AI-powered analysis!**
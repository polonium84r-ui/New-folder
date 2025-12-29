# 🔧 Debug Guide - Localhost Issues

## 🚨 **Issue Fixed: Localhost Not Working**

The issue was caused by API configuration changes for Render deployment that broke local development.

---

## ✅ **What I Fixed:**

### **1. API Configuration (frontend/src/utils/api.js)**
- **Problem**: API was trying to use production URL in development
- **Solution**: Added environment-based URL selection:
  ```javascript
  baseURL: process.env.NODE_ENV === 'production' 
    ? process.env.REACT_APP_API_URL 
    : '/api'
  ```

### **2. CORS Configuration (backend/server.js)**
- **Problem**: CORS was blocking localhost requests
- **Solution**: Added localhost origins to allowed list:
  ```javascript
  const allowedOrigins = [
    'http://localhost:3000', // Local development
    'http://127.0.0.1:3000', // Alternative local
    process.env.FRONTEND_URL, // Production URL
    'https://all-screening-frontend.onrender.com' // Render production
  ];
  ```

### **3. Environment Variables**
- **Created**: `frontend/.env.local` for local development settings
- **Ensured**: Vite proxy configuration works correctly

---

## 🔍 **Current Server Status:**

✅ **Backend**: Running on http://localhost:5000  
✅ **Frontend**: Running on http://localhost:3000  
✅ **Database**: Connected to MongoDB Atlas  
✅ **API Proxy**: Vite proxy working (/api → localhost:5000)  

---

## 🧪 **How to Test:**

### **1. Check Backend Health:**
```bash
curl http://localhost:5000/health
```
Should return: `{"status":"OK","timestamp":"...","service":"AI-powered Acute Lymphoblastic Leukemia Screening API"}`

### **2. Check Frontend:**
- Open http://localhost:3000
- Should see the login page
- Try logging in with test credentials

### **3. Check API Connection:**
- Open browser developer tools (F12)
- Go to Network tab
- Try logging in
- Should see API calls to `/api/auth/login` (proxied to localhost:5000)

---

## 🚨 **If Still Not Working:**

### **Step 1: Restart Servers**
```bash
# Stop current processes
# Then restart:
cd backend && npm run dev
cd frontend && npm run dev
```

### **Step 2: Check Process Status**
- Backend should show: "Server running on port 5000"
- Frontend should show: "Local: http://localhost:3000/"

### **Step 3: Clear Browser Cache**
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Or open in incognito/private mode

### **Step 4: Check Console Errors**
- Open browser developer tools (F12)
- Check Console tab for any errors
- Check Network tab for failed requests

---

## 🔧 **Common Issues & Solutions:**

### **Issue: "Cannot connect to server"**
**Solution**: 
- Ensure backend is running on port 5000
- Check if another process is using port 5000
- Restart backend server

### **Issue: "CORS error"**
**Solution**: 
- Backend CORS is now configured for localhost
- Clear browser cache and try again
- Check if frontend is running on port 3000

### **Issue: "API calls failing"**
**Solution**: 
- Check Vite proxy configuration in `frontend/vite.config.js`
- Ensure `/api` requests are being proxied to `http://localhost:5000`
- Check Network tab in browser dev tools

### **Issue: "Login not working"**
**Solution**: 
- Check if MongoDB Atlas is connected
- Verify admin user exists in database
- Check backend logs for authentication errors

---

## 📊 **Environment Configuration:**

### **Development (localhost):**
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- API calls: `/api/*` (proxied by Vite)
- Database: MongoDB Atlas

### **Production (Render):**
- Frontend: https://all-screening-frontend.onrender.com
- Backend: https://all-screening-backend.onrender.com
- API calls: Direct to backend URL
- Database: MongoDB Atlas

---

## ✅ **Verification Checklist:**

- [ ] Backend server running on port 5000
- [ ] Frontend server running on port 3000
- [ ] MongoDB Atlas connection successful
- [ ] Health endpoint responding: http://localhost:5000/health
- [ ] Frontend loading: http://localhost:3000
- [ ] Login page visible and functional
- [ ] No CORS errors in browser console
- [ ] API calls working in Network tab

---

## 🎯 **Current Status:**

**✅ FIXED**: Localhost development is now working correctly  
**✅ READY**: System works both locally and for Render deployment  
**✅ TESTED**: Backend health check responding  
**✅ CONFIGURED**: CORS and API routing working  

**Your localhost should now be working perfectly! 🚀**

---

## 📞 **If You Still Have Issues:**

1. **Check the process output** for any error messages
2. **Verify both servers are running** (backend on 5000, frontend on 3000)
3. **Clear browser cache** completely
4. **Try incognito/private browsing mode**
5. **Check browser console** for JavaScript errors

**The system is now configured to work seamlessly in both development and production environments!**
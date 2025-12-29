const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:"], // Add blob: support for image loading
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.roboflow.com", "https://serverless.roboflow.com"]
    }
  }
}));

// CORS configuration - disable for single-service deployment
app.use(cors({
  origin: true, // Allow all origins since frontend and backend are on same domain
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
  console.log('Connected to MongoDB Atlas');
  
  // Auto-create admin user if none exists
  try {
    const User = require('./models/User');
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (!adminExists) {
      console.log('No admin user found. Creating default admin...');
      
      const adminUser = new User({
        email: 'radarprojects.com',
        password: 'Radar@2028',
        name: 'System Administrator',
        role: 'admin',
        isActive: true,
        mustChangePassword: false
      });
      
      await adminUser.save();
      console.log('✅ Default admin user created successfully!');
      console.log('📧 Email: radarprojects.com');
      console.log('🔑 Password: Radar@2028');
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
})
.catch(err => console.error('MongoDB connection error:', err));

// API Routes (must come before static files)
app.use('/api/auth', require('./routes/auth').router);
app.use('/api/analysis', require('./routes/analysis'));
app.use('/api/patients', require('./routes/patients'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'AI-powered Acute Lymphoblastic Leukemia Screening API'
  });
});

// Serve static files from the React app build directory
const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

// Catch all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Serving frontend from: ${frontendPath}`);
});
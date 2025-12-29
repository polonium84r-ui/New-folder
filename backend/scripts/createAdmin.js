const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('../models/User');

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      console.log('📧 Email:', existingAdmin.email);
      console.log('👤 Name:', existingAdmin.name);
      process.exit(0);
    }

    // Create admin user
    const adminUser = new User({
      email: 'admin@hospital.com',
      password: 'Admin123!', // This will be hashed by the pre-save middleware
      name: 'System Administrator',
      role: 'admin',
      isActive: true,
      mustChangePassword: true, // Force password change on first login
      isTemporaryPassword: false,
      createdAt: new Date(),
      lastLogin: null,
      analysisCount: 0
    });

    await adminUser.save();
    
    console.log('🎉 Admin user created successfully!');
    console.log('📧 Email: admin@hospital.com');
    console.log('🔑 Password: Admin123!');
    console.log('⚠️  IMPORTANT: Please change the password after first login');
    console.log('🔒 The user will be forced to change password on first login');
    
    // Create a sample doctor user for testing
    const doctorUser = new User({
      email: 'doctor@hospital.com',
      password: 'Doctor123!',
      name: 'Dr. John Smith',
      role: 'doctor',
      isActive: true,
      mustChangePassword: false,
      isTemporaryPassword: false,
      createdAt: new Date(),
      lastLogin: null,
      analysisCount: 0
    });

    await doctorUser.save();
    
    console.log('👨‍⚕️ Sample doctor user created:');
    console.log('📧 Email: doctor@hospital.com');
    console.log('🔑 Password: Doctor123!');
    
    console.log('\n🚀 System is ready for deployment!');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    
    if (error.code === 11000) {
      console.log('⚠️  User with this email already exists');
    } else {
      console.error('Full error:', error.message);
    }
    
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n⏹️  Process interrupted');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⏹️  Process terminated');
  await mongoose.connection.close();
  process.exit(0);
});

// Run the script
console.log('🏥 AI-powered Leukemia Screening System - Admin Setup');
console.log('================================================');
createAdmin();
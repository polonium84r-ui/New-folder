require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');

// Create test app without starting server
const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

app.use(express.json());

// Routes
app.use('/api/auth', require('../routes/auth').router);

describe('Authentication Endpoints', () => {
  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/all-detection-test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
  });

  beforeEach(async () => {
    // Clean up database before each test
    await User.deleteMany({});
    
    // Create test admin user
    const adminUser = new User({
      email: 'radarprojects.com',
      password: 'Radar@2028',
      name: 'System Administrator',
      role: 'admin'
    });
    await adminUser.save();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/auth/login', () => {
    test('should login admin user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'radarprojects.com',
          password: 'Radar@2028'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('role', 'admin');
      expect(response.body.user).toHaveProperty('email', 'radarprojects.com');
    });

    test('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'radarprojects.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid username/email or password invalid');
    });

    test('should reject missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'radarprojects.com'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Email and password are required');
    });

    test('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@email.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid username/email or password invalid');
    });
  });

  describe('GET /api/auth/users', () => {
    let adminToken;

    beforeEach(async () => {
      // Get admin token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'radarprojects.com',
          password: 'Radar@2028'
        });
      adminToken = loginResponse.body.token;

      // Create test doctor
      const doctorUser = new User({
        email: 'doctor@hospital.com',
        password: 'password123',
        name: 'Dr. Smith',
        role: 'doctor'
      });
      await doctorUser.save();
    });

    test('should return users for admin', async () => {
      const response = await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('users');
      expect(response.body.users).toHaveLength(2); // admin + doctor
    });

    test('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/users');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Access token required');
    });

    test('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/users')
        .set('Authorization', 'Bearer invalidtoken');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Invalid or expired token');
    });
  });

  describe('POST /api/auth/register', () => {
    let adminToken;

    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'radarprojects.com',
          password: 'Radar@2028'
        });
      adminToken = loginResponse.body.token;
    });

    test('should create new doctor account', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'newdoctor@hospital.com',
          password: 'password123',
          name: 'Dr. New Doctor',
          role: 'doctor'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Doctor account created successfully');
      expect(response.body.user).toHaveProperty('email', 'newdoctor@hospital.com');
    });

    test('should reject duplicate email', async () => {
      // Create first user
      await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'duplicate@hospital.com',
          password: 'password123',
          name: 'Dr. First',
          role: 'doctor'
        });

      // Try to create duplicate
      const response = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'duplicate@hospital.com',
          password: 'password123',
          name: 'Dr. Second',
          role: 'doctor'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'User already exists');
    });

    test('should reject non-admin registration', async () => {
      // Create doctor user and get token
      const doctorUser = new User({
        email: 'doctor@hospital.com',
        password: 'password123',
        name: 'Dr. Smith',
        role: 'doctor'
      });
      await doctorUser.save();

      const doctorLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'doctor@hospital.com',
          password: 'password123'
        });

      const response = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${doctorLogin.body.token}`)
        .send({
          email: 'newdoctor@hospital.com',
          password: 'password123',
          name: 'Dr. New Doctor',
          role: 'doctor'
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Admin access required');
    });
  });
});
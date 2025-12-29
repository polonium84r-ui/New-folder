# AI-powered Acute Lymphoblastic Leukemia Screening System - Backend

Node.js + Express backend for the Acute Lymphoblastic Leukemia Detection System.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **User Management**: Admin and Doctor roles with proper permissions
- **Patient Management**: CRUD operations for patient records
- **Medical Image Analysis**: Integration with Roboflow API for AI inference
- **Security**: Helmet, CORS, rate limiting, and input validation
- **Database**: MongoDB Atlas with Mongoose ODM

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Configuration:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

3. **Create Admin User:**
   ```bash
   npm run create-admin
   ```
   This creates the admin user with credentials:
   - Email: admin@radarprojects.com
   - Password: Radar@2028

4. **Start Development Server:**
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Create new doctor (admin only)
- `GET /api/auth/me` - Get current user info
- `GET /api/auth/users` - Get all users (admin only)
- `PUT /api/auth/users/:id/deactivate` - Deactivate user (admin only)

### Patients
- `GET /api/patients` - Get all patients (with pagination)
- `POST /api/patients` - Create new patient
- `GET /api/patients/:id` - Get patient by ID
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

### Analysis
- `POST /api/analysis/upload` - Upload and analyze medical image
- `GET /api/analysis/:id` - Get analysis results
- `GET /api/analysis` - Get all analyses (with pagination)

## User Roles

### Admin
- Full system access
- User management (create/deactivate doctors)
- All patient and analysis operations
- System configuration

### Doctor
- Patient management
- Medical image analysis
- View analysis results
- Patient record management

## Security Features

- JWT token authentication
- Role-based access control
- Password hashing with bcrypt
- Rate limiting (100 requests per 15 minutes)
- CORS protection
- Helmet security headers
- Input validation and sanitization
- File upload restrictions (images only, 10MB limit)

## Database Models

### User
- Email, password, name, role
- Active status and last login tracking
- Password hashing middleware

### Patient
- Patient ID, demographics, contact info
- Medical history tracking
- Analysis references

### Analysis
- Patient reference and image data
- AI analysis results from Roboflow
- Processing status and metadata
- Confidence scores and detected cells

## Environment Variables

```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
ROBOFLOW_API_KEY=your-api-key
ROBOFLOW_MODEL_ENDPOINT=your-endpoint
FRONTEND_URL=http://localhost:3000
PORT=5000
NODE_ENV=development
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong JWT secret
3. Configure MongoDB Atlas properly
4. Set up proper CORS origins
5. Use HTTPS in production
6. Configure proper logging
7. Set up monitoring and health checks
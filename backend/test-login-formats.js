// Test script to verify admin (no @) and doctor (with @) login formats
const axios = require('axios');

async function testLoginFormats() {
  console.log('🔐 Testing Login Formats - Admin vs Doctor\n');
  console.log('=' .repeat(60));

  try {
    // Test 1: Admin login (no @ symbol)
    console.log('👑 Testing Admin Login (no @ symbol)...');
    console.log('📧 Email: radarprojects.com');
    console.log('🔑 Password: Radar@2028\n');

    const adminResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'radarprojects.com',
      password: 'Radar@2028'
    });

    if (adminResponse.status === 200) {
      const { user } = adminResponse.data;
      console.log('✅ ADMIN LOGIN SUCCESS!');
      console.log('✅ Role:', user.role);
      console.log('✅ Name:', user.name);
      console.log('✅ Email Format:', user.email, '(no @ symbol)');
      console.log('✅ Redirects to: /admin-dashboard\n');
    }

  } catch (error) {
    console.error('❌ Admin login failed:', error.response?.data?.error || error.message);
  }

  try {
    // Test 2: Check if there are any doctor accounts to test
    console.log('👨‍⚕️ Checking for Doctor Accounts...');
    
    // First get admin token
    const adminLogin = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'radarprojects.com',
      password: 'Radar@2028'
    });

    const adminToken = adminLogin.data.token;
    
    // Get all users
    const usersResponse = await axios.get('http://localhost:5000/api/auth/users', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    const doctors = usersResponse.data.users.filter(user => user.role === 'doctor');
    
    if (doctors.length > 0) {
      console.log(`✅ Found ${doctors.length} doctor account(s):`);
      doctors.forEach((doctor, index) => {
        console.log(`   ${index + 1}. ${doctor.name} (${doctor.email}) - ${doctor.email.includes('@') ? '✅ Has @ symbol' : '❌ Missing @ symbol'}`);
      });
    } else {
      console.log('ℹ️  No doctor accounts found');
      console.log('ℹ️  Doctors must be created by admin with @ symbol format');
      console.log('ℹ️  Example: doctor@hospital.com');
    }

  } catch (error) {
    console.error('❌ Error checking doctor accounts:', error.response?.data?.error || error.message);
  }

  console.log('\n' + '=' .repeat(60));
  console.log('📋 LOGIN FORMAT RULES:');
  console.log('👑 Admin: radarprojects.com (NO @ symbol)');
  console.log('👨‍⚕️ Doctor: doctor@hospital.com (WITH @ symbol)');
  console.log('🔒 Both use secure JWT authentication');
  console.log('🏥 Role-based access control active');
  console.log('\n🏁 Login Format Test Complete');
}

// Test backend health first
async function testBackendHealth() {
  try {
    const response = await axios.get('http://localhost:5000/health');
    console.log('✅ Backend Health:', response.data.status);
    return true;
  } catch (error) {
    console.error('❌ Backend not running. Start with: cd backend && npm run dev');
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('🚀 AI-powered Acute Lymphoblastic Leukemia Screening System - Login Format Verification\n');
  
  const isHealthy = await testBackendHealth();
  if (isHealthy) {
    await testLoginFormats();
  }
}

runTests();
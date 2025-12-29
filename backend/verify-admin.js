// Verify Admin Credentials Script
const axios = require('axios');

async function verifyAdminCredentials() {
  console.log('🔐 AI-powered Acute Lymphoblastic Leukemia Screening System - Admin Credentials Verification\n');
  console.log('=' .repeat(60));

  try {
    // Test backend health first
    console.log('🏥 Testing Backend Health...');
    const healthResponse = await axios.get('http://localhost:5000/health');
    console.log('✅ Backend Status:', healthResponse.data.status);
    console.log('✅ Backend running on port 5000\n');

    // Test admin login
    console.log('👑 Testing Admin Login...');
    console.log('📧 Email: radarprojects.com');
    console.log('🔑 Password: Radar@2028\n');

    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'radarprojects.com',
      password: 'Radar@2028'
    });

    if (loginResponse.status === 200) {
      const { token, user } = loginResponse.data;
      
      console.log('🎉 ADMIN LOGIN SUCCESSFUL!');
      console.log('✅ Status Code:', loginResponse.status);
      console.log('✅ JWT Token Generated:', token ? 'Yes' : 'No');
      console.log('✅ User Role:', user.role);
      console.log('✅ User Name:', user.name);
      console.log('✅ User Email:', user.email);
      console.log('✅ Last Login:', user.lastLogin);
      console.log('✅ Analysis Count:', user.analysisCount);

      // Test admin access to users endpoint
      console.log('\n🔍 Testing Admin Access to Users Endpoint...');
      const usersResponse = await axios.get('http://localhost:5000/api/auth/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (usersResponse.status === 200) {
        const { users } = usersResponse.data;
        console.log('✅ Users Endpoint Access: SUCCESS');
        console.log('✅ Total Users Found:', users.length);
        console.log('✅ Admin Privileges: CONFIRMED');
        
        // Show user summary
        users.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
        });
      }

    }

  } catch (error) {
    console.error('❌ ADMIN VERIFICATION FAILED');
    
    if (error.response?.status === 401) {
      console.error('🔑 Invalid credentials - check email and password');
    } else if (error.response?.status === 500) {
      console.error('🏥 Server error - check backend logs');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🌐 Cannot connect to backend - ensure server is running');
      console.error('   Run: cd backend && npm run dev');
    } else {
      console.error('Error:', error.response?.data || error.message);
    }
  }

  console.log('\n' + '=' .repeat(60));
  console.log('🏁 Admin Verification Complete');
}

// Run verification
verifyAdminCredentials();
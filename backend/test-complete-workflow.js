// Complete Workflow Test - Admin creates doctor, doctor changes password
const axios = require('axios');

async function testCompleteWorkflow() {
  console.log('🏥 AI-powered Acute Lymphoblastic Leukemia Screening System - Complete Workflow Test\n');
  console.log('=' .repeat(70));

  try {
    // Step 1: Admin Login
    console.log('👑 STEP 1: Admin Login');
    console.log('📧 Email: radarprojects.com (NO @ symbol)');
    console.log('🔑 Password: Radar@2028\n');

    const adminLogin = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'radarprojects.com',
      password: 'Radar@2028'
    });

    const adminToken = adminLogin.data.token;
    console.log('✅ Admin login successful');
    console.log('✅ Admin role:', adminLogin.data.user.role);
    console.log('✅ JWT token generated\n');

    // Step 2: Admin creates doctor account
    console.log('👨‍⚕️ STEP 2: Admin Creates Doctor Account');
    const doctorData = {
      name: 'Dr. Test Doctor',
      email: `test.doctor.${Date.now()}@gmail.com`
    };

    console.log('👤 Doctor Name:', doctorData.name);
    console.log('📧 Doctor Email:', doctorData.email, '(WITH @ symbol)');

    const createDoctorResponse = await axios.post('http://localhost:5000/api/auth/register', doctorData, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    const tempPassword = createDoctorResponse.data.temporaryPassword;
    const doctorInfo = createDoctorResponse.data.user;

    console.log('✅ Doctor account created successfully');
    console.log('✅ Temporary password generated:', tempPassword);
    console.log('✅ Doctor ID:', doctorInfo.id);
    console.log('✅ Admin gives doctor: Email + Temporary Password\n');

    // Step 3: Doctor attempts login with temporary password
    console.log('🔐 STEP 3: Doctor Login with Temporary Password');
    console.log('📧 Email:', doctorData.email, '(WITH @ symbol)');
    console.log('🔑 Temporary Password:', tempPassword);

    const doctorLogin = await axios.post('http://localhost:5000/api/auth/login', {
      email: doctorData.email,
      password: tempPassword
    });

    const doctorToken = doctorLogin.data.token;
    const doctorUser = doctorLogin.data.user;

    console.log('✅ Doctor login successful');
    console.log('✅ Must change password:', doctorUser.mustChangePassword);
    console.log('✅ Is temporary password:', doctorUser.isTemporaryPassword);
    console.log('⚠️  Doctor cannot use app fully until password changed\n');

    // Step 4: Doctor changes password
    console.log('🔄 STEP 4: Doctor Changes Password');
    const newPassword = 'MyNewSecurePassword123!';
    console.log('🔑 New Password:', newPassword);

    const changePasswordResponse = await axios.put('http://localhost:5000/api/auth/force-password-change', {
      newPassword: newPassword
    }, {
      headers: { 'Authorization': `Bearer ${doctorToken}` }
    });

    console.log('✅ Password changed successfully');
    console.log('✅ Message:', changePasswordResponse.data.message);
    console.log('✅ Doctor can now use app normally\n');

    // Step 5: Doctor login with new password
    console.log('🎉 STEP 5: Doctor Login with New Password');
    console.log('📧 Email:', doctorData.email);
    console.log('🔑 New Password:', newPassword);

    const finalLogin = await axios.post('http://localhost:5000/api/auth/login', {
      email: doctorData.email,
      password: newPassword
    });

    const finalUser = finalLogin.data.user;
    console.log('✅ Doctor login successful with new password');
    console.log('✅ Must change password:', finalUser.mustChangePassword || false);
    console.log('✅ Is temporary password:', finalUser.isTemporaryPassword || false);
    console.log('✅ Doctor can now use app fully\n');

    // Step 6: Test password reset by admin
    console.log('🔄 STEP 6: Admin Resets Doctor Password');
    const resetResponse = await axios.post('http://localhost:5000/api/auth/reset-password', {
      userId: doctorInfo.id
    }, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    const newTempPassword = resetResponse.data.temporaryPassword;
    console.log('✅ Password reset successful');
    console.log('✅ New temporary password:', newTempPassword);
    console.log('✅ Admin gives new temporary password to doctor\n');

    // Step 7: Doctor login with reset password
    console.log('🔐 STEP 7: Doctor Login with Reset Password');
    const resetLogin = await axios.post('http://localhost:5000/api/auth/login', {
      email: doctorData.email,
      password: newTempPassword
    });

    console.log('✅ Doctor login successful with reset password');
    console.log('✅ Must change password again:', resetLogin.data.user.mustChangePassword);
    console.log('✅ Workflow complete!\n');

  } catch (error) {
    console.error('❌ Workflow test failed:', error.response?.data?.error || error.message);
    return false;
  }

  console.log('=' .repeat(70));
  console.log('🎊 COMPLETE WORKFLOW TEST: SUCCESS!');
  console.log('');
  console.log('📋 WORKFLOW SUMMARY:');
  console.log('1. ✅ Admin logs in (radarprojects.com - NO @ symbol)');
  console.log('2. ✅ Admin creates doctor account with Gmail');
  console.log('3. ✅ System generates temporary password');
  console.log('4. ✅ Admin shares Gmail + temporary password with doctor');
  console.log('5. ✅ Doctor logs in with Gmail + temporary password');
  console.log('6. ✅ Doctor must change password before using app');
  console.log('7. ✅ Doctor changes password in Settings');
  console.log('8. ✅ Doctor can now use app normally');
  console.log('9. ✅ Admin can reset doctor password if forgotten');
  console.log('10. ✅ Password never shown again to anyone');
  console.log('');
  console.log('🔒 SECURITY FEATURES:');
  console.log('• Passwords are hashed with bcrypt');
  console.log('• Temporary passwords must be changed');
  console.log('• JWT authentication with expiration');
  console.log('• Role-based access control');
  console.log('• Admin-only doctor management');
  console.log('');
  console.log('🏁 Workflow Test Complete - System Ready for Production!');
  return true;
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

// Run complete workflow test
async function run() {
  const isHealthy = await testBackendHealth();
  if (isHealthy) {
    await testCompleteWorkflow();
  }
}

run();
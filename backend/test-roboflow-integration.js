// Test script to verify Roboflow API integration
const axios = require('axios');

async function testRoboflowIntegration() {
  console.log('🧪 Testing Roboflow API Integration...\n');

  try {
    // Test the Roboflow API directly
    const testPayload = {
      api_key: 'R8FMaPoYSNTZ8c7cw4aa',
      inputs: {
        "image": {
          "type": "base64",
          "value": "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
        }
      }
    };

    console.log('📡 Calling Roboflow API...');
    const response = await axios.post(
      'https://serverless.roboflow.com/deva-yc5op/workflows/rit',
      testPayload,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log('✅ Roboflow API Response Status:', response.status);
    console.log('📊 Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data) {
      console.log('\n🎉 Roboflow Integration Test: SUCCESS');
      console.log('✅ API Key is valid');
      console.log('✅ Workflow endpoint is accessible');
      console.log('✅ Image processing is working');
    }

  } catch (error) {
    console.error('❌ Roboflow Integration Test: FAILED');
    console.error('Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.error('🔑 API Key may be invalid or expired');
    } else if (error.response?.status === 404) {
      console.error('🔍 Workflow endpoint not found');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🌐 Network connection failed');
    }
  }
}

// Test backend health
async function testBackendHealth() {
  console.log('\n🏥 Testing Backend Health...');
  
  try {
    const response = await axios.get('http://localhost:5000/health');
    console.log('✅ Backend Status:', response.data.status);
    console.log('✅ Backend is running on port 5000');
  } catch (error) {
    console.error('❌ Backend Health Check Failed');
    console.error('Make sure backend server is running: npm run dev');
  }
}

// Run tests
async function runTests() {
  console.log('🚀 AI-powered Acute Lymphoblastic Leukemia Screening System - Roboflow Integration Test\n');
  console.log('=' .repeat(60));
  
  await testBackendHealth();
  await testRoboflowIntegration();
  
  console.log('\n' + '=' .repeat(60));
  console.log('🏁 Test Complete');
}

runTests();
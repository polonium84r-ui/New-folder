// Test script to check backend API response format
// Run this in browser console on the AnalysisResults page

async function testBackendImageResponse() {
  console.log('🔍 Testing Backend Image Response...');
  
  // Get analysis ID from current page state
  const analysisId = window.location.pathname.includes('analysis-results') 
    ? sessionStorage.getItem('currentAnalysisId') 
    : null;
  
  if (!analysisId) {
    console.log('❌ No analysis ID found. Navigate to results page first.');
    return;
  }
  
  try {
    console.log('📡 Fetching analysis data for ID:', analysisId);
    
    const response = await fetch(`/api/analysis/${analysisId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      console.log('❌ Response not OK:', response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('📦 Full response data:', data);
    
    // Check image-related fields
    console.log('\n🖼️ Image-related fields:');
    console.log('- imageUrl exists:', !!data.imageUrl);
    console.log('- imageUrl type:', typeof data.imageUrl);
    console.log('- imageUrl length:', data.imageUrl?.length || 0);
    console.log('- imageUrl starts with data:', data.imageUrl?.startsWith('data:'));
    console.log('- imageUrl preview:', data.imageUrl?.substring(0, 100) + '...');
    
    if (data.analysisResults) {
      console.log('- analysisResults.imageUrl exists:', !!data.analysisResults.imageUrl);
      console.log('- analysisResults keys:', Object.keys(data.analysisResults));
    }
    
    // Test image loading
    if (data.imageUrl) {
      console.log('\n🧪 Testing image loading...');
      
      const img = new Image();
      img.onload = () => {
        console.log('✅ Image loaded successfully!');
        console.log('- Dimensions:', img.width, 'x', img.height);
      };
      img.onerror = (e) => {
        console.log('❌ Image failed to load:', e);
      };
      img.src = data.imageUrl;
      
      // Also test if it can be used as CSS background
      const testDiv = document.createElement('div');
      testDiv.style.backgroundImage = `url(${data.imageUrl})`;
      testDiv.style.width = '100px';
      testDiv.style.height = '100px';
      testDiv.style.backgroundSize = 'cover';
      testDiv.style.position = 'fixed';
      testDiv.style.top = '10px';
      testDiv.style.right = '10px';
      testDiv.style.border = '2px solid red';
      testDiv.style.zIndex = '9999';
      testDiv.title = 'Backend Image Test';
      document.body.appendChild(testDiv);
      
      console.log('🎨 Added test div to page (top-right corner)');
      
      // Remove test div after 10 seconds
      setTimeout(() => {
        document.body.removeChild(testDiv);
        console.log('🧹 Removed test div');
      }, 10000);
    }
    
  } catch (error) {
    console.log('❌ Error testing backend response:', error);
  }
}

// Also test sessionStorage
function testSessionStorage() {
  console.log('\n💾 Testing SessionStorage...');
  
  const storedImage = sessionStorage.getItem('currentAnalysisImage');
  const storedName = sessionStorage.getItem('currentAnalysisImageName');
  
  console.log('- currentAnalysisImage exists:', !!storedImage);
  console.log('- currentAnalysisImage length:', storedImage?.length || 0);
  console.log('- currentAnalysisImage starts with data:', storedImage?.startsWith('data:'));
  console.log('- currentAnalysisImageName:', storedName);
  console.log('- currentAnalysisImage preview:', storedImage?.substring(0, 100) + '...');
  
  if (storedImage) {
    console.log('\n🧪 Testing sessionStorage image loading...');
    
    const img = new Image();
    img.onload = () => {
      console.log('✅ SessionStorage image loaded successfully!');
      console.log('- Dimensions:', img.width, 'x', img.height);
    };
    img.onerror = (e) => {
      console.log('❌ SessionStorage image failed to load:', e);
    };
    img.src = storedImage;
  }
}

// Test navigation state
function testNavigationState() {
  console.log('\n🧭 Testing Navigation State...');
  
  // Try to access React Router state (this might not work in console)
  console.log('- window.history.state:', window.history.state);
  
  // Check if there's any stored state in sessionStorage
  const keys = Object.keys(sessionStorage);
  console.log('- sessionStorage keys:', keys);
  
  keys.forEach(key => {
    if (key.includes('analysis') || key.includes('image') || key.includes('result')) {
      const value = sessionStorage.getItem(key);
      console.log(`- ${key}:`, value?.length > 100 ? value.substring(0, 100) + '...' : value);
    }
  });
}

// Run all tests
console.log('🚀 Starting Image Debug Tests...');
testBackendImageResponse();
testSessionStorage();
testNavigationState();

console.log('\n📋 To run individual tests:');
console.log('- testBackendImageResponse()');
console.log('- testSessionStorage()');
console.log('- testNavigationState()');
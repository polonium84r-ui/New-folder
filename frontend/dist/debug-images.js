// Image Debug Script for Browser Console
console.log('🔍 Starting Image Debug Script...');

// Function to test image loading
const testImageLoad = (url, method) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ 
      method, 
      success: true, 
      width: img.width, 
      height: img.height,
      url: url.substring(0, 50) + '...'
    });
    img.onerror = (e) => resolve({ 
      method, 
      success: false, 
      error: e.message || 'Load failed',
      url: url.substring(0, 50) + '...'
    });
    img.src = url;
    
    setTimeout(() => resolve({ 
      method, 
      success: false, 
      error: 'Timeout',
      url: url.substring(0, 50) + '...'
    }), 5000);
  });
};

// Main debug function
const debugImages = async () => {
  console.log('=== IMAGE DEBUG REPORT ===');
  console.log('Browser:', navigator.userAgent);
  console.log('Timestamp:', new Date().toISOString());
  
  // Check sessionStorage
  console.log('\n📦 SessionStorage Check:');
  const sessionImage = sessionStorage.getItem('currentAnalysisImage');
  const sessionImageName = sessionStorage.getItem('currentAnalysisImageName');
  console.log('- Has image:', !!sessionImage);
  console.log('- Image size:', sessionImage?.length || 0);
  console.log('- Image name:', sessionImageName);
  console.log('- Image preview:', sessionImage?.substring(0, 100) + '...');
  
  // Check navigation state
  console.log('\n🧭 Navigation State Check:');
  const locationState = window.history.state;
  console.log('- Has state:', !!locationState);
  console.log('- State keys:', locationState ? Object.keys(locationState) : []);
  
  // Check current page images
  console.log('\n🖼️ Current Page Images:');
  const images = document.querySelectorAll('img');
  images.forEach((img, i) => {
    console.log(`Image ${i}:`, {
      alt: img.alt,
      src: img.src.substring(0, 100) + '...',
      complete: img.complete,
      naturalSize: `${img.naturalWidth}x${img.naturalHeight}`,
      displaySize: `${img.width}x${img.height}`
    });
  });
  
  // Test backend API
  console.log('\n🌐 Backend API Test:');
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ No auth token found');
      return;
    }
    
    // Try to get current analysis ID from URL or state
    const urlParams = new URLSearchParams(window.location.search);
    const analysisId = urlParams.get('id') || locationState?.analysisId;
    
    if (analysisId) {
      const response = await fetch(`/api/analysis/${analysisId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend API Success');
        console.log('- Has imageUrl:', !!data.imageUrl);
        console.log('- ImageUrl preview:', data.imageUrl?.substring(0, 100) + '...');
        console.log('- Response keys:', Object.keys(data));
        
        // Test loading the backend image
        if (data.imageUrl) {
          const result = await testImageLoad(data.imageUrl, 'Backend API');
          console.log('- Backend image test:', result);
        }
      } else {
        console.error('❌ Backend API Failed:', response.status, response.statusText);
      }
    } else {
      console.warn('⚠️ No analysis ID found for backend test');
    }
  } catch (error) {
    console.error('💥 Backend API Error:', error);
  }
  
  // Test all available image sources
  console.log('\n🧪 Testing All Image Sources:');
  const testResults = [];
  
  // Test sessionStorage
  if (sessionImage) {
    const result = await testImageLoad(sessionImage, 'SessionStorage');
    testResults.push(result);
    console.log('SessionStorage test:', result);
  }
  
  // Test a simple base64 image to verify browser support
  const testBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  const testResult = await testImageLoad(testBase64, 'Test Base64');
  testResults.push(testResult);
  console.log('Base64 support test:', testResult);
  
  // Summary
  console.log('\n📊 SUMMARY:');
  console.log('- Total tests run:', testResults.length);
  console.log('- Successful tests:', testResults.filter(r => r.success).length);
  console.log('- Failed tests:', testResults.filter(r => !r.success).length);
  
  if (testResults.some(r => r.success)) {
    console.log('✅ At least one image source is working');
  } else {
    console.log('❌ No image sources are working - check CSP, CORS, or data format');
  }
  
  console.log('\n=== END DEBUG REPORT ===');
  
  return {
    sessionStorage: { hasImage: !!sessionImage, size: sessionImage?.length || 0 },
    navigationState: { hasState: !!locationState },
    currentImages: images.length,
    testResults
  };
};

// Auto-run the debug
debugImages().then(result => {
  console.log('🎉 Debug completed. Results stored in window.imageDebugResult');
  window.imageDebugResult = result;
}).catch(error => {
  console.error('💥 Debug failed:', error);
});

// Export for manual use
window.debugImages = debugImages;
window.testImageLoad = testImageLoad;
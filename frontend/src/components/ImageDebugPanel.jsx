import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ImageDebugPanel = () => {
  const [debugInfo, setDebugInfo] = useState({});
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const testImageSources = async () => {
      const info = {
        timestamp: new Date().toISOString(),
        // SessionStorage checks
        sessionStorage: {
          hasImage: !!sessionStorage.getItem('currentAnalysisImage'),
          imageSize: sessionStorage.getItem('currentAnalysisImage')?.length || 0,
          imageName: sessionStorage.getItem('currentAnalysisImageName'),
          imagePreview: sessionStorage.getItem('currentAnalysisImage')?.substring(0, 50) + '...'
        },
        
        // Navigation state checks
        navigationState: {
          hasState: !!location.state,
          hasResults: !!location.state?.results,
          hasImageUrl: !!location.state?.results?.imageUrl,
          imageUrlPreview: location.state?.results?.imageUrl?.substring(0, 50) + '...',
          hasImageData: !!location.state?.imageData,
          imageDataPreview: location.state?.imageData?.substring(0, 50) + '...',
          hasAnalysisData: !!location.state?.analysisData,
          hasAnalysisBase64: !!location.state?.analysisData?.base64,
          analysisBase64Preview: location.state?.analysisData?.base64?.substring(0, 50) + '...',
          hasAnalysisFile: !!location.state?.analysisData?.file,
          analysisFileName: location.state?.analysisData?.fileName,
          analysisFileSize: location.state?.analysisData?.fileSize,
          analysisFileType: location.state?.analysisData?.fileType
        },
        
        // Browser capabilities
        browser: {
          supportsFileReader: typeof FileReader !== 'undefined',
          supportsCreateObjectURL: typeof URL.createObjectURL !== 'undefined',
          supportsSessionStorage: typeof sessionStorage !== 'undefined'
        }
      };

      // Test backend API
      try {
        const analysisId = location.state?.analysisId;
        if (analysisId) {
          const response = await fetch(`/api/analysis/${analysisId}`, {
            headers: { 
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            info.backendAPI = {
              success: true,
              hasImageUrl: !!data.imageUrl,
              imageUrlPreview: data.imageUrl?.substring(0, 50) + '...',
              responseKeys: Object.keys(data),
              analysisResultsKeys: data.analysisResults ? Object.keys(data.analysisResults) : []
            };
          } else {
            info.backendAPI = {
              success: false,
              status: response.status,
              statusText: response.statusText
            };
          }
        } else {
          info.backendAPI = {
            success: false,
            error: 'No analysis ID available'
          };
        }
      } catch (error) {
        info.backendAPI = {
          success: false,
          error: error.message
        };
      }

      // Test image loading methods
      const testMethods = [];
      
      // Method 1: results.imageUrl
      if (location.state?.results?.imageUrl) {
        testMethods.push({
          method: 'results.imageUrl',
          available: true,
          dataType: location.state.results.imageUrl.startsWith('data:') ? 'base64' : 'url',
          preview: location.state.results.imageUrl.substring(0, 50) + '...'
        });
      }
      
      // Method 2: navigation imageData
      if (location.state?.imageData) {
        testMethods.push({
          method: 'navigation.imageData',
          available: true,
          dataType: location.state.imageData.startsWith('data:') ? 'base64' : 'url',
          preview: location.state.imageData.substring(0, 50) + '...'
        });
      }
      
      // Method 3: analysisData.base64
      if (location.state?.analysisData?.base64) {
        testMethods.push({
          method: 'analysisData.base64',
          available: true,
          dataType: location.state.analysisData.base64.startsWith('data:') ? 'base64' : 'url',
          preview: location.state.analysisData.base64.substring(0, 50) + '...'
        });
      }
      
      // Method 4: sessionStorage
      const storedImage = sessionStorage.getItem('currentAnalysisImage');
      if (storedImage) {
        testMethods.push({
          method: 'sessionStorage',
          available: true,
          dataType: storedImage.startsWith('data:') ? 'base64' : 'url',
          preview: storedImage.substring(0, 50) + '...'
        });
      }
      
      // Method 5: file object
      if (location.state?.analysisData?.file) {
        testMethods.push({
          method: 'file.object',
          available: true,
          dataType: 'File',
          fileName: location.state.analysisData.file.name,
          fileSize: location.state.analysisData.file.size,
          fileType: location.state.analysisData.file.type
        });
      }
      
      info.availableMethods = testMethods;
      
      setDebugInfo(info);
    };

    testImageSources();
  }, [location]);

  // Test image loading for each available method
  const testImageLoad = (method, src) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ success: true, width: img.width, height: img.height });
      img.onerror = (e) => resolve({ success: false, error: e.message || 'Load failed' });
      img.src = src;
      
      // Timeout after 5 seconds
      setTimeout(() => resolve({ success: false, error: 'Timeout' }), 5000);
    });
  };

  const testAllImageMethods = async () => {
    const results = [];
    
    // Test each available method
    for (const method of debugInfo.availableMethods || []) {
      let src = null;
      
      switch (method.method) {
        case 'results.imageUrl':
          src = location.state?.results?.imageUrl;
          break;
        case 'navigation.imageData':
          src = location.state?.imageData;
          break;
        case 'analysisData.base64':
          src = location.state?.analysisData?.base64;
          break;
        case 'sessionStorage':
          src = sessionStorage.getItem('currentAnalysisImage');
          break;
        case 'file.object':
          try {
            src = URL.createObjectURL(location.state.analysisData.file);
          } catch (e) {
            results.push({ method: method.method, success: false, error: e.message });
            continue;
          }
          break;
      }
      
      if (src) {
        const result = await testImageLoad(method.method, src);
        results.push({ method: method.method, ...result, src: src.substring(0, 50) + '...' });
        
        // Clean up blob URL
        if (method.method === 'file.object' && src.startsWith('blob:')) {
          URL.revokeObjectURL(src);
        }
      }
    }
    
    setDebugInfo(prev => ({ ...prev, loadTestResults: results }));
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm"
      >
        🐛 Debug Images
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Image Debug Panel</h2>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={testAllImageMethods}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Test All Image Loading Methods
            </button>
            
            <div className="bg-gray-100 p-4 rounded-lg">
              <h3 className="font-bold mb-2">Debug Information</h3>
              <pre className="text-xs overflow-auto max-h-96 whitespace-pre-wrap">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
            
            {debugInfo.loadTestResults && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-bold mb-2">Image Load Test Results</h3>
                <div className="space-y-2">
                  {debugInfo.loadTestResults.map((result, index) => (
                    <div key={index} className={`p-2 rounded ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
                      <div className="font-medium">{result.method}</div>
                      <div className="text-sm">
                        Status: {result.success ? '✅ Success' : '❌ Failed'}
                        {result.success && ` (${result.width}x${result.height})`}
                        {result.error && ` - ${result.error}`}
                      </div>
                      <div className="text-xs text-gray-600">{result.src}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageDebugPanel;
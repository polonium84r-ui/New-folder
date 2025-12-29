import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import { 
  Upload, 
  X,
  Loader,
  Sparkles,
  Target
} from 'lucide-react';

const Analysis = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/');
      return;
    }
    
    setUser(JSON.parse(userData));
  }, [navigate]);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors.some(e => e.code === 'file-too-large')) {
        toast.error('File size must be less than 10MB');
      } else if (rejection.errors.some(e => e.code === 'file-invalid-type')) {
        toast.error('Only image files (JPEG, PNG, TIFF) are allowed');
      } else {
        toast.error('Invalid file. Please try again.');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      toast.success('Image selected successfully');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.tiff', '.tif']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false
  });

  const removeFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select an image file');
      return;
    }
    
    setIsUploading(true);
    
    try {
      console.log('Starting upload process...');
      console.log('User token:', localStorage.getItem('token'));
      
      // Convert file to base64 and store in sessionStorage for reliable access
      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        const base64Data = e.target.result;
        
        // Store image data in sessionStorage for reliable access across pages
        sessionStorage.setItem('currentAnalysisImage', base64Data);
        sessionStorage.setItem('currentAnalysisImageName', selectedFile.name);
        
        // Navigate to processing page with file data
        navigate('/analysis-processing', {
          state: {
            analysisData: {
              file: selectedFile,
              fileName: selectedFile.name,
              fileSize: selectedFile.size,
              fileType: selectedFile.type,
              base64: base64Data // Include base64 data
            }
          }
        });
      };
      
      fileReader.onerror = () => {
        console.error('Failed to read file');
        toast.error('Failed to read image file. Please try again.');
        setIsUploading(false);
      };
      
      // Read file as data URL (base64)
      fileReader.readAsDataURL(selectedFile);
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to start analysis. Please try again.');
      setIsUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="rounded-full h-12 w-12 border-b-2 border-medical-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analysis workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden py-8 min-h-screen pt-24">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-medical-200 to-primary-300 rounded-full opacity-10"></div>
        <div className="absolute bottom-20 left-20 w-48 h-48 bg-gradient-to-br from-purple-200 to-success-200 rounded-full opacity-10"></div>
        
        {/* Scanning Line Effect */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-medical-400 to-transparent"></div>
        
        {/* Medical Particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-medical-300 rounded-full"></div>
        <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-success-300 rounded-full"></div>
        <div className="absolute bottom-1/4 left-3/4 w-2 h-2 bg-purple-300 rounded-full"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="icon-wrapper bg-gradient-to-br from-medical-500 to-primary-600">
              <Target className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-4">
            AI-powered Acute Lymphoblastic Leukemia Screening
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload a blood smear image for AI-powered Acute Lymphoblastic Leukemia screening
          </p>
        </div>

        {/* Large Drag-and-Drop Upload Box */}
        <div className="mb-12">
          {!selectedFile ? (
            <div
              {...getRootProps()}
              className={`border-3 border-dashed rounded-3xl p-20 text-center cursor-pointer ${
                isDragActive
                  ? 'border-medical-500 bg-gradient-to-br from-medical-50 to-primary-50 shadow-colored'
                  : 'border-gray-300 hover:border-medical-400 hover:bg-gradient-to-br hover:from-gray-50 hover:to-blue-50 hover:shadow-large'
              }`}
            >
              <input {...getInputProps()} />
              <div>
                <Upload className="w-24 h-24 text-gray-400 mx-auto mb-8" />
              </div>
              <h2 className="text-3xl font-bold text-gray-700 mb-6">
                {isDragActive ? 'Drop Blood Smear Here' : 'Drop Blood Smear Here'}
              </h2>
              <p className="text-gray-500 text-xl mb-8">or click to select a file</p>
              <div className="text-sm text-gray-400 space-y-2 max-w-md mx-auto">
                <p className="font-medium">Supported formats: JPEG, PNG, TIFF</p>
                <p>Maximum size: 10MB • Minimum resolution: 1024x1024px</p>
              </div>
            </div>
          ) : (
            <div className="card-colored">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold gradient-text">Selected Blood Smear</h2>
                <button
                  onClick={removeFile}
                  className="bg-gradient-to-r from-danger-500 to-danger-600 text-white p-3 rounded-full hover:from-danger-600 hover:to-danger-700 shadow-soft"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <img
                    src={previewUrl}
                    alt="Blood smear preview"
                    className="w-full h-80 object-cover rounded-2xl border-2 border-gray-200 shadow-medium"
                  />
                </div>
                
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-200">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                      <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
                      File Details
                    </h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><strong>Name:</strong> {selectedFile.name}</p>
                      <p><strong>Size:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      <p><strong>Type:</strong> {selectedFile.type}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Upload Button */}
              <div className="mt-8">
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="w-full btn-primary text-xl py-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <div className="flex items-center justify-center">
                      <Loader className="w-6 h-6 mr-3"></Loader>
                      Starting AI Analysis...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Sparkles className="w-6 h-6 mr-3" />
                      Start AI Analysis
                    </div>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analysis;
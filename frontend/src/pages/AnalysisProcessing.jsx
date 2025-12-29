import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../utils/api';
import { 
  CheckCircle
} from 'lucide-react';
import BloodCellAI from '../components/icons/BloodCellAI';

const AnalysisProcessing = () => {
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('Initializing analysis...');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get analysis data from navigation state
  const analysisData = location.state?.analysisData;
  const patientInfo = location.state?.patientInfo;

  const processingMessages = [
    'Initializing analysis...',
    'Uploading scan data...',
    'Preprocessing image...',
    'Communicating with Roboflow Neural Network to identify pathological markers...',
    'Analyzing cell morphology...',
    'Detecting abnormal lymphoblasts...',
    'Generating diagnostic report...',
    'Finalizing results...'
  ];

  useEffect(() => {
    if (!analysisData) {
      // If no data is provided, show a message and redirect
      toast.error('No analysis data found. Please start from the upload page.');
      setTimeout(() => {
        navigate('/analysis');
      }, 2000);
      return;
    }

    startAnalysis();
  }, [analysisData, navigate]);

  const startAnalysis = async () => {
    try {
      // Simulate realistic processing with progress updates
      let currentProgress = 0;
      let messageIndex = 0;

      const progressInterval = setInterval(() => {
        currentProgress += Math.random() * 15 + 5; // Random progress between 5-20%
        
        if (currentProgress >= 100) {
          currentProgress = 100;
          clearInterval(progressInterval);
          
          // Complete analysis after a short delay
          setTimeout(() => {
            completeAnalysis();
          }, 1000);
        }

        setProgress(Math.min(currentProgress, 100));

        // Update message based on progress
        const newMessageIndex = Math.floor((currentProgress / 100) * processingMessages.length);
        if (newMessageIndex !== messageIndex && newMessageIndex < processingMessages.length) {
          messageIndex = newMessageIndex;
          setCurrentMessage(processingMessages[messageIndex]);
        }
      }, 800);

      // Cleanup interval on unmount
      return () => clearInterval(progressInterval);

    } catch (error) {
      console.error('Analysis error:', error);
      setError('Analysis failed. Please try again.');
      toast.error('Analysis failed. Please try again.');
    }
  };

  const completeAnalysis = async () => {
    try {
      console.log('Starting analysis with data:', { analysisData, patientInfo });
      
      // Use default patient info if not provided (for simple upload flow)
      const defaultPatientInfo = patientInfo || {
        patientId: `P-${Date.now()}`,
        name: 'Patient',
        age: 25,
        gender: 'other'
      };
      
      // Convert file to base64 for API
      const fileReader = new FileReader();
      fileReader.onload = async (e) => {
        try {
          const base64Data = e.target.result.split(',')[1]; // Remove data:image/jpeg;base64, prefix
          console.log('File converted to base64, length:', base64Data.length);
          
          // Call the actual API
          const response = await api.post('/analysis/process', {
            imageData: {
              ...analysisData,
              base64: base64Data
            },
            patientInfo: defaultPatientInfo
          });

          console.log('API response:', response.data);

          if (response.data.success) {
            toast.success('Analysis completed successfully!');
            
            // Navigate to results page
            setTimeout(() => {
              navigate('/analysis-results', {
                state: {
                  results: response.data.results,
                  patientInfo: defaultPatientInfo,
                  analysisId: response.data.analysisId,
                  analysisData: analysisData
                }
              });
            }, 1500);
          } else {
            throw new Error(response.data.error || 'Analysis failed');
          }
        } catch (error) {
          console.error('Analysis completion error:', error);
          setError('Failed to complete analysis. Please try again.');
          toast.error('Failed to complete analysis. Please try again.');
        }
      };
      
      fileReader.onerror = () => {
        console.error('File reader error');
        setError('Failed to read image file. Please try again.');
        toast.error('Failed to read image file. Please try again.');
      };
      
      // Read the file as data URL (base64)
      fileReader.readAsDataURL(analysisData.file);
      
    } catch (error) {
      console.error('Analysis completion error:', error);
      setError('Failed to complete analysis. Please try again.');
      toast.error('Failed to complete analysis. Please try again.');
    }
  };

  // Handle case when no analysis data is provided
  if (!analysisData) {
    return (
      <div className="min-h-screen full-height-gradient bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BloodCellAI className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-blue-900 mb-2">No Analysis Data Found</h2>
          <p className="text-blue-700 mb-4">
            Please start your analysis from the upload page to process blood smear images.
          </p>
          <button
            onClick={() => navigate('/analysis')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Upload Page
          </button>
          <p className="text-sm text-blue-600 mt-4">Redirecting automatically in a few seconds...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen full-height-gradient bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-red-900 mb-2">Analysis Failed</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => navigate('/analysis')}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen full-height-gradient bg-gradient-to-br from-gray-50 to-white flex items-center justify-center px-4">
      <div className="text-center max-w-md mx-auto">
        {/* Circular Progress Indicator */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          {/* Background Circle */}
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 96 96">
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="#e5e7eb"
              strokeWidth="8"
              fill="none"
            />
            {/* Progress Circle */}
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="#10b981"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
              className=""
            />
          </svg>
          
          {/* Medical Icon in Center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center processing-icon medical-processing">
              <BloodCellAI className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Processing Text */}
        <h2 className="text-2xl font-semibold text-gray-900 mb-3">
          Processing Scan Data...
        </h2>
        
        {/* Current Step Message */}
        <p className="text-gray-600 mb-8 min-h-[3rem] flex items-center justify-center message-fade">
          {currentMessage}
        </p>

        {/* Progress Bar */}
        <div className="w-full max-w-xs mx-auto">
          <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-500 mt-2">
            <span>0%</span>
            <span className="font-medium">{Math.round(progress)}%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Warning Message */}
        <div className="mt-6 text-xs text-gray-500 max-w-sm mx-auto">
          <p>⚠️ Please do not close this window during analysis</p>
          <p>Analysis typically takes 15-30 seconds to complete</p>
        </div>
      </div>
    </div>
  );
};

export default AnalysisProcessing;
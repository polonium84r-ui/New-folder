import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  AlertTriangle, 
  Download,
  ArrowLeft,
  CheckCircle,
  Info,
  Brain,
  Lightbulb,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import BloodCellAI from '../components/icons/BloodCellAI';

const AnalysisResults = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [imagePreview, setImagePreview] = useState(null);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [patientDetails, setPatientDetails] = useState({
    fullName: '',
    patientId: '',
    age: '',
    gender: ''
  });

  // Get results data from navigation state
  const analysisData = location.state?.analysisData;
  const results = location.state?.results;

  // Debug logging
  useEffect(() => {
    console.log('AnalysisResults Debug Info:');
    console.log('- Results:', results);
    console.log('- Results imageUrl:', results?.imageUrl);
    console.log('- Analysis Data:', analysisData);
    console.log('- Analysis ID:', location.state?.analysisId);
    console.log('- File object available:', !!analysisData?.file);
    console.log('- File name:', analysisData?.fileName);
    console.log('- Base64 data available:', !!analysisData?.base64);
    console.log('- Navigation state imageData:', !!location.state?.imageData);
    console.log('- SessionStorage image:', !!sessionStorage.getItem('currentAnalysisImage'));
    console.log('- Current image preview:', imagePreview);
  }, [results, analysisData, imagePreview]);

  useEffect(() => {
    // Redirect if no results data
    if (!results) {
      navigate('/analysis');
      return;
    }

    // Load image using multiple fallback methods
    loadImageData();
    
    // Cleanup function to clear sessionStorage when component unmounts
    return () => {
      // Don't clear immediately, wait a bit in case user is navigating back
      setTimeout(() => {
        sessionStorage.removeItem('currentAnalysisImage');
        sessionStorage.removeItem('currentAnalysisImageName');
      }, 5000);
    };
  }, [results, analysisData, navigate]);

  // Helper function to test if an image URL is valid
  const testImageLoad = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        console.log(`✅ Image loaded successfully: ${url.substring(0, 50)}...`);
        resolve(true);
      };
      img.onerror = (error) => {
        console.warn(`❌ Image failed to load: ${url.substring(0, 50)}...`, error);
        resolve(false);
      };
      img.src = url;
      
      // Timeout after 5 seconds
      setTimeout(() => {
        console.warn(`⏰ Image load timeout: ${url.substring(0, 50)}...`);
        resolve(false);
      }, 5000);
    });
  };

  // Comprehensive image loading with multiple fallback methods
  const loadImageData = async () => {
    console.log('🔍 Loading image data with enhanced debugging...');
    
    const methods = [
      {
        name: 'Backend API Response (results.imageUrl)',
        getter: () => results?.imageUrl,
        priority: 1
      },
      {
        name: 'Navigation State Image Data',
        getter: () => location.state?.imageData,
        priority: 2
      },
      {
        name: 'Analysis Data Base64',
        getter: () => analysisData?.base64,
        priority: 3
      },
      {
        name: 'Session Storage',
        getter: () => sessionStorage.getItem('currentAnalysisImage'),
        priority: 4
      },
      {
        name: 'File Object to Blob URL',
        getter: () => {
          if (analysisData?.file) {
            try {
              const blobUrl = URL.createObjectURL(analysisData.file);
              console.log('🔗 Created blob URL:', blobUrl);
              return blobUrl;
            } catch (error) {
              console.warn('Failed to create blob URL:', error);
              return null;
            }
          }
          return null;
        },
        priority: 5
      }
    ];

    // Sort by priority and try each method
    methods.sort((a, b) => a.priority - b.priority);
    
    for (const method of methods) {
      try {
        const imageUrl = method.getter();
        if (imageUrl) {
          console.log(`🧪 Trying method: ${method.name}`);
          console.log(`📊 Image URL type: ${typeof imageUrl}`);
          console.log(`📊 Image URL length: ${imageUrl.length}`);
          console.log(`📊 Image URL preview: ${imageUrl.substring(0, 100)}...`);
          console.log(`📊 Starts with data:: ${imageUrl.startsWith('data:')}`);
          console.log(`📊 Starts with blob:: ${imageUrl.startsWith('blob:')}`);
          
          // Test if image loads successfully
          const isValid = await testImageLoad(imageUrl);
          if (isValid) {
            console.log(`🎉 SUCCESS with method: ${method.name}`);
            setImagePreview(imageUrl);
            
            // Store successful image in sessionStorage for future use (but don't overwrite if it came from sessionStorage)
            if (method.name !== 'Session Storage') {
              try {
                sessionStorage.setItem('currentAnalysisImage', imageUrl);
                console.log('💾 Stored successful image in sessionStorage');
              } catch (storageError) {
                console.warn('Failed to store in sessionStorage:', storageError);
              }
            }
            return;
          } else {
            console.warn(`❌ FAILED to load image with method: ${method.name}`);
          }
        } else {
          console.log(`⚠️ No data available for method: ${method.name}`);
        }
      } catch (error) {
        console.error(`💥 Error with method ${method.name}:`, error);
        
        // Log specific error types for debugging
        if (error.name === 'SecurityError') {
          console.error('🔒 Security error - possible CORS or CSP issue');
        } else if (error.name === 'NetworkError') {
          console.error('🌐 Network error - check connectivity');
        } else if (error.message?.includes('blob')) {
          console.error('🔗 Blob URL error - URL may have been revoked');
        }
      }
    }
    
    // If all methods fail, try backend API as last resort
    console.log('🔄 All image loading methods failed, trying backend API as last resort...');
    await fetchImageFromBackend();
  };

  // Function to fetch image from backend API
  const fetchImageFromBackend = async () => {
    try {
      const analysisId = location.state?.analysisId;
      if (!analysisId) {
        console.warn('❌ No analysis ID available to fetch image from backend');
        return;
      }

      console.log('📡 Fetching image from backend API for analysis ID:', analysisId);
      const response = await fetch(`/api/analysis/${analysisId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📊 Backend response status:', response.status);
      console.log('📊 Backend response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const analysisData = await response.json();
        console.log('📦 Backend response data keys:', Object.keys(analysisData));
        console.log('📦 Has imageUrl:', !!analysisData.imageUrl);
        console.log('📦 Has analysisResults:', !!analysisData.analysisResults);
        
        if (analysisData.imageUrl) {
          console.log('📊 Backend imageUrl preview:', analysisData.imageUrl.substring(0, 100) + '...');
          
          // Test if the backend image loads
          const isValid = await testImageLoad(analysisData.imageUrl);
          if (isValid) {
            console.log('✅ Successfully loaded image from backend API');
            setImagePreview(analysisData.imageUrl);
            // Store in sessionStorage for future use
            try {
              sessionStorage.setItem('currentAnalysisImage', analysisData.imageUrl);
              console.log('💾 Stored backend image in sessionStorage');
            } catch (storageError) {
              console.warn('Failed to store backend image in sessionStorage:', storageError);
            }
          } else {
            console.error('❌ Backend image URL failed to load');
          }
        } else {
          console.warn('⚠️ No image URL found in backend response');
          console.log('📦 Full backend response:', analysisData);
        }
      } else {
        console.error('❌ Failed to fetch analysis from backend:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('📄 Error response body:', errorText);
      }
    } catch (error) {
      console.error('💥 Error fetching image from backend:', error);
      
      // Log specific error types
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('🌐 Network error - check if backend is running');
      } else if (error.name === 'SyntaxError') {
        console.error('📄 JSON parsing error - backend may have returned non-JSON response');
      }
    }
  };

  if (!results) {
    return null;
  }

  // Unified status determination based on confidence levels and cell counts
  // 
  // EXPLICIT RISK LEVEL RULES:
  // High risk: confidence ≥ 90% or suspicious cells ≥ 30%
  // Medium risk: confidence 75–89% or suspicious cells 10–29%
  // Low risk: below that, or mostly benign cells
  //
  // CLASSIFICATION LOGIC:
  // - Risk Level must match these thresholds consistently
  // - History table: Leukemia (HIGH), Uncertain (MEDIUM), Benign (LOW)
  // - UI banner must always reflect these exact thresholds
  //
  const getAnalysisStatus = (prediction, confidence, cellCount = 0, totalCells = 100) => {
    const confidencePercent = Math.round(confidence * 100);
    const suspiciousCellPercent = totalCells > 0 ? Math.round((cellCount / totalCells) * 100) : 0;
    
    // Determine risk level based on explicit rules
    let riskLevel = 'LOW';
    let historyCategory = 'Benign';
    
    if (confidencePercent >= 90 || suspiciousCellPercent >= 30) {
      riskLevel = 'HIGH';
      historyCategory = 'Leukemia';
    } else if (confidencePercent >= 75 || suspiciousCellPercent >= 10) {
      riskLevel = 'MEDIUM';
      historyCategory = 'Uncertain';
    }
    
    // High risk cases (≥90% confidence or ≥30% suspicious cells)
    if (riskLevel === 'HIGH' && prediction === 'positive') {
      return {
        result: 'Suspicious lymphoblast-like cells detected',
        shortResult: 'POSITIVE',
        riskLevel: 'HIGH',
        historyCategory: 'Leukemia',
        priority: 'IMMEDIATE HEMATOLOGY CONSULTATION',
        color: 'text-red-600 bg-red-50 border-red-200',
        icon: 'alert'
      };
    }
    
    // Medium risk cases (75-89% confidence or 10-29% suspicious cells)
    if (riskLevel === 'MEDIUM' && prediction === 'positive') {
      return {
        result: 'Suspicious lymphoblast-like cells detected',
        shortResult: 'POSITIVE',
        riskLevel: 'MEDIUM',
        historyCategory: 'Uncertain',
        priority: 'PROMPT HEMATOLOGY REVIEW',
        color: 'text-orange-600 bg-orange-50 border-orange-200',
        icon: 'alert'
      };
    }
    
    // Low confidence or uncertain result
    if (confidencePercent < 75 && suspiciousCellPercent < 10) {
      return {
        result: 'Cellular morphology requires expert review',
        shortResult: 'INCONCLUSIVE',
        riskLevel: 'LOW',
        historyCategory: 'Uncertain',
        priority: 'EXPERT PATHOLOGIST REVIEW',
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
        icon: 'info'
      };
    }
    
    // High confidence negative result
    if (confidencePercent >= 90 && prediction === 'negative') {
      return {
        result: 'Normal cellular morphology observed',
        shortResult: 'NEGATIVE',
        riskLevel: 'LOW',
        historyCategory: 'Benign',
        priority: 'ROUTINE FOLLOW-UP',
        color: 'text-green-600 bg-green-50 border-green-200',
        icon: 'check'
      };
    }
    
    // Medium confidence negative result
    if (confidencePercent >= 75 && prediction === 'negative') {
      return {
        result: 'Predominantly normal cells with minor variants',
        shortResult: 'NEGATIVE',
        riskLevel: 'LOW',
        historyCategory: 'Benign',
        priority: 'ROUTINE MONITORING',
        color: 'text-green-600 bg-green-50 border-green-200',
        icon: 'check'
      };
    }
    
    // Fallback for any edge cases
    return {
      result: 'Cellular morphology requires expert review',
      shortResult: 'INCONCLUSIVE',
      riskLevel: 'LOW',
      historyCategory: 'Uncertain',
      priority: 'EXPERT PATHOLOGIST REVIEW',
      color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      icon: 'info'
    };
  };

  const handlePatientDetailChange = (e) => {
    const { name, value } = e.target;
    setPatientDetails({
      ...patientDetails,
      [name]: value
    });
  };

  const generatePDFReport = async () => {
    try {
      const loadingToast = toast.loading('Generating comprehensive medical report...');
      
      // Wait for images to be fully loaded in the DOM
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create a new jsPDF instance
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Helper function to split long text into multiple lines
      const splitText = (text, maxWidth) => {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        words.forEach(word => {
          const testLine = currentLine + (currentLine ? ' ' : '') + word;
          const textWidth = pdf.getTextWidth(testLine);
          
          if (textWidth > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        });
        
        if (currentLine) {
          lines.push(currentLine);
        }
        
        return lines;
      };
      
      // Set up fonts and colors
      pdf.setFont('helvetica');
      
      // Header Section
      pdf.setFillColor(59, 130, 246); // Blue background
      pdf.rect(0, 0, pageWidth, 40, 'F');
      
      pdf.setTextColor(255, 255, 255); // White text
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('AI-powered Acute Lymphoblastic Leukemia', 20, 20);
      pdf.text('Screening Report', 20, 30);
      
      // Reset text color for body
      pdf.setTextColor(0, 0, 0);
      
      // Patient Information Section
      let yPosition = 60;
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Patient Information', 20, yPosition);
      
      yPosition += 10;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Name: ${patientDetails.fullName}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Patient ID: ${patientDetails.patientId}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Age: ${patientDetails.age} years`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Gender: ${patientDetails.gender.charAt(0).toUpperCase() + patientDetails.gender.slice(1)}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Report Date: ${new Date().toLocaleDateString()}`, 20, yPosition);
      
      // 📸 BLOOD SMEAR IMAGES SECTION - Right after Patient Information
      yPosition += 15; // Reduced spacing to keep content on first page
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Blood Smear Images', 20, yPosition);
      
      yPosition += 5;
      pdf.setLineWidth(0.5);
      pdf.line(20, yPosition, pageWidth - 20, yPosition);
      yPosition += 10; // Reduced spacing
      
      // Calculate perfect image dimensions for side-by-side alignment
      const totalImageWidth = pageWidth - 40; // Total width minus margins (20mm each side)
      const imageGap = 15; // 15mm gap between images for better separation
      const imageWidth = (totalImageWidth - imageGap) / 2; // Split remaining space equally
      const imageHeight = 50; // Reduced height to fit on first page
      const leftImageX = 20; // Left margin
      const rightImageX = leftImageX + imageWidth + imageGap; // Right image position with precise calculation
      
      // Debug logging for positioning
      console.log('PDF Image Positioning:', {
        pageWidth,
        totalImageWidth,
        imageWidth,
        imageHeight,
        imageGap,
        leftImageX,
        rightImageX,
        yPosition
      });
      
      // Try to capture and embed actual images from the page
      let imagesAdded = false;
      
      try {
        // Wait a moment for DOM to be ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Find the image elements in the DOM with more specific selectors
        const originalImageElement = document.querySelector('img[alt="Original blood smear"]') || 
                                   document.querySelector('.grid img') ||
                                   document.querySelector('img[src*="blob:"]');
        
        const analyzedImageContainer = document.querySelector('.aspect-square.bg-gray-100.rounded-lg.overflow-hidden.border-2.border-red-300') ||
                                     document.querySelector('.relative.group:nth-child(2) .aspect-square') ||
                                     document.querySelector('[class*="border-red"]');
        
        console.log('Found elements:', { originalImageElement, analyzedImageContainer });
        
        if (originalImageElement) {
          // Capture original image with better settings
          const originalCanvas = await html2canvas(originalImageElement, {
            backgroundColor: '#ffffff',
            scale: 0.8, // Reduced scale for faster processing and smaller file size
            logging: false,
            useCORS: true,
            allowTaint: true,
            width: originalImageElement.naturalWidth || originalImageElement.width,
            height: originalImageElement.naturalHeight || originalImageElement.height
          });
          
          const originalImgData = originalCanvas.toDataURL('image/jpeg', 0.85);
          
          // Store the Y position for both images to ensure perfect alignment
          const imageYPosition = yPosition;
          
          // Add original image to PDF with perfect alignment
          pdf.addImage(originalImgData, 'JPEG', leftImageX, imageYPosition, imageWidth, imageHeight);
          imagesAdded = true;
          
          // Capture analyzed image with bounding boxes
          if (analyzedImageContainer) {
            const analyzedCanvas = await html2canvas(analyzedImageContainer, {
              backgroundColor: '#ffffff',
              scale: 0.8,
              logging: false,
              useCORS: true,
              allowTaint: true
            });
            
            const analyzedImgData = analyzedCanvas.toDataURL('image/jpeg', 0.85);
            
            // Add analyzed image to PDF at EXACT same Y position for perfect side-by-side alignment
            pdf.addImage(analyzedImgData, 'JPEG', rightImageX, imageYPosition, imageWidth, imageHeight);
          } else {
            // Create analyzed image by duplicating original and adding detection overlays
            pdf.addImage(originalImgData, 'JPEG', rightImageX, imageYPosition, imageWidth, imageHeight);
            
            // Add detection overlay simulation on top at the same Y position
            if (results.roboflowPredictions && results.roboflowPredictions.length > 0) {
              results.roboflowPredictions.slice(0, 3).forEach((prediction, index) => {
                // Calculate overlay position relative to right image
                const overlayX = rightImageX + (imageWidth * 0.2) + (index * 8);
                const overlayY = imageYPosition + (imageHeight * 0.2) + (index * 6);
                const overlaySize = 6;
                
                // Add colored detection box
                pdf.setFillColor(220, 38, 38, 0.7);
                pdf.rect(overlayX, overlayY, overlaySize, overlaySize, 'F');
                
                // Add confidence text
                pdf.setFontSize(5);
                pdf.setTextColor(255, 255, 255);
                pdf.text(`${Math.round(prediction.confidence * 100)}%`, overlayX + 1, overlayY + 4);
                pdf.setTextColor(0, 0, 0);
              });
            }
          }
        }
        
      } catch (imageError) {
        console.warn('Could not capture images for PDF:', imageError);
        imagesAdded = false;
      }
      
      // If no images were captured, create professional placeholders
      if (!imagesAdded) {
        // Store the Y position for both placeholders to ensure perfect alignment
        const placeholderYPosition = yPosition;
        
        // Original image placeholder with perfect alignment
        pdf.setFillColor(245, 245, 245);
        pdf.rect(leftImageX, placeholderYPosition, imageWidth, imageHeight, 'F');
        
        // Add border
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.5);
        pdf.rect(leftImageX, placeholderYPosition, imageWidth, imageHeight);
        
        // Add placeholder text
        pdf.setFontSize(10);
        pdf.setTextColor(128, 128, 128);
        pdf.text('Original Blood Smear', leftImageX + imageWidth/2 - 20, placeholderYPosition + imageHeight/2 - 3);
        pdf.text('Image', leftImageX + imageWidth/2 - 6, placeholderYPosition + imageHeight/2 + 3);
        
        // Analyzed image placeholder at EXACT same Y position
        pdf.setFillColor(245, 245, 245);
        pdf.rect(rightImageX, placeholderYPosition, imageWidth, imageHeight, 'F');
        
        // Add border
        pdf.rect(rightImageX, placeholderYPosition, imageWidth, imageHeight);
        
        // Add placeholder text
        pdf.text('AI-Analyzed Blood Smear', rightImageX + imageWidth/2 - 25, placeholderYPosition + imageHeight/2 - 3);
        pdf.text('with Detections', rightImageX + imageWidth/2 - 15, placeholderYPosition + imageHeight/2 + 3);
        
        // Add simulated detection boxes
        if (results.roboflowPredictions && results.roboflowPredictions.length > 0) {
          results.roboflowPredictions.slice(0, 3).forEach((prediction, index) => {
            const boxX = rightImageX + 10 + (index * 15);
            const boxY = placeholderYPosition + 10 + (index * 8);
            
            pdf.setFillColor(220, 38, 38);
            pdf.rect(boxX, boxY, 10, 6, 'F');
            
            pdf.setFontSize(5);
            pdf.setTextColor(255, 255, 255);
            pdf.text(`${Math.round(prediction.confidence * 100)}%`, boxX + 1, boxY + 4);
          });
        }
        
        pdf.setTextColor(0, 0, 0);
      }
      
      // Add clean captions without subtitle text - perfectly aligned under images
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Figure 1: Original Blood Smear Image', leftImageX, yPosition + imageHeight + 6);
      pdf.text('Figure 2: AI-Processed Blood Smear with Detected Cells', rightImageX, yPosition + imageHeight + 6);
      
      yPosition += imageHeight + 15; // Move past images and captions
      
      // Analysis Results Section
      yPosition += 10; // Reduced spacing
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Analysis Results', 20, yPosition);
      
      yPosition += 10; // Reduced spacing
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      
      // Result Status Box - made more compact
      const statusColor = analysisStatus.riskLevel === 'HIGH' ? [220, 38, 38] : 
                         analysisStatus.riskLevel === 'MEDIUM' ? [245, 158, 11] : [34, 197, 94];
      
      pdf.setFillColor(...statusColor);
      pdf.rect(20, yPosition - 3, pageWidth - 40, 15, 'F'); // Reduced height
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Screening Result: ${results.prediction.toUpperCase()}`, 25, yPosition + 3);
      pdf.text(`Confidence Score: ${confidencePercent}%`, 25, yPosition + 9);
      
      // Reset text color
      pdf.setTextColor(0, 0, 0);
      yPosition += 20; // Reduced spacing
      
      // Detailed Analysis - more compact
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11); // Smaller font
      pdf.text(`Finding: ${analysisStatus.result}`, 20, yPosition);
      yPosition += 6; // Reduced line spacing
      pdf.text(`Risk Level: ${analysisStatus.riskLevel}`, 20, yPosition);
      yPosition += 6;
      pdf.text(`Priority Level: ${analysisStatus.priority}`, 20, yPosition);
      yPosition += 6;
      pdf.text(`Cells Detected: ${results.roboflowPredictions?.length || results.detectedCells?.length || 0}`, 20, yPosition);
      
      // Add Note for positive results
      if (results.prediction === 'positive') {
        yPosition += 10;
        pdf.setFont('helvetica', 'bold');
        pdf.text('Note:', 20, yPosition);
        pdf.setFont('helvetica', 'normal');
        yPosition += 6;
        const noteText = '"Suspicious" findings indicate abnormal blast-like or lymphoblast-like cells that must be confirmed using standard diagnostic procedures such as flow cytometry and bone marrow evaluation.';
        const noteLines = splitText(noteText, pageWidth - 40);
        noteLines.forEach(line => {
          if (yPosition > pageHeight - 15) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(line, 20, yPosition);
          yPosition += 5;
        });
      }
      
      // AI Recommendations Section
      yPosition += 12; // Reduced spacing
      
      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('AI-Generated Recommendations', 20, yPosition);
      
      yPosition += 10; // Reduced spacing
      pdf.setFontSize(11); // Smaller font
      pdf.setFont('helvetica', 'normal');
      
      // Add recommendations - more compact
      const recommendations = results.recommendations || [
        analysisStatus.result.includes('POSITIVE')
          ? 'Immediate hematological consultation recommended for comprehensive evaluation.'
          : analysisStatus.result.includes('INCONCLUSIVE')
          ? 'Expert pathologist review recommended to clarify cellular morphology.'
          : 'Continue routine monitoring as per standard clinical protocols.',
        
        analysisStatus.result.includes('POSITIVE')
          ? 'Consider additional confirmatory tests including bone marrow biopsy.'
          : analysisStatus.result.includes('INCONCLUSIVE')
          ? 'Repeat analysis with higher quality samples may provide clearer results.'
          : 'Document findings in patient record and schedule routine follow-up.',
        
        analysisStatus.result.includes('POSITIVE')
          ? 'Monitor patient closely for clinical symptoms and coordinate care team.'
          : analysisStatus.result.includes('INCONCLUSIVE')
          ? 'Clinical correlation with patient symptoms and medical history is essential.'
          : 'Maintain standard screening intervals and patient education.'
      ];
      
      recommendations.forEach((recommendation, index) => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(`${index + 1}. ${recommendation}`, 20, yPosition);
        yPosition += 8; // Reduced line spacing
      });
      
      // Clinical Assessment Section
      yPosition += 8; // Reduced spacing
      if (yPosition > pageHeight - 50) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Clinical Assessment', 20, yPosition);
      
      yPosition += 10; // Reduced spacing
      pdf.setFontSize(11); // Smaller font
      pdf.setFont('helvetica', 'normal');
      
      const morphologyText = analysisStatus.result.includes('Suspicious') 
        ? 'Cellular morphology shows atypical lymphoblast-like cells with high nucleus-to-cytoplasm ratio and abnormal chromatin patterns, raising suspicion for acute lymphoblastic leukemia. Abnormal cells are present in the analyzed sample and require confirmatory testing.'
        : analysisStatus.result.includes('requires expert review')
        ? 'Cellular morphology shows mixed characteristics. Some cells exhibit atypical features requiring expert interpretation.'
        : 'Cellular morphology appears within normal parameters. No significant abnormalities detected in the analyzed sample.';
      
      const confidenceText = confidencePercent >= 85 
        ? `High confidence level (${confidencePercent}%) indicates strong algorithmic certainty in the analysis. Results are highly reliable for clinical decision-making.`
        : confidencePercent >= 70
        ? `Moderate confidence level (${confidencePercent}%) suggests good algorithmic certainty. Consider additional confirmatory testing for comprehensive assessment. The ${confidencePercent}% confidence score reflects the model's estimated probability that this smear is compatible with ALL and should always trigger confirmatory testing rather than definitive diagnosis.`
        : `Lower confidence level (${confidencePercent}%) indicates algorithmic uncertainty. Recommend expert review and additional diagnostic procedures.`;
      
      // Morphological Analysis
      pdf.setFont('helvetica', 'bold');
      pdf.text('Morphological Analysis:', 20, yPosition);
      yPosition += 6; // Reduced spacing
      pdf.setFont('helvetica', 'normal');
      
      const morphologyLines = splitText(morphologyText, pageWidth - 40);
      morphologyLines.forEach(line => {
        if (yPosition > pageHeight - 15) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(line, 20, yPosition);
        yPosition += 5; // Reduced line spacing
      });
      
      yPosition += 3; // Reduced spacing
      
      // Confidence Analysis
      pdf.setFont('helvetica', 'bold');
      pdf.text('Confidence Analysis:', 20, yPosition);
      yPosition += 6; // Reduced spacing
      pdf.setFont('helvetica', 'normal');
      
      const confidenceLines = splitText(confidenceText, pageWidth - 40);
      confidenceLines.forEach(line => {
        if (yPosition > pageHeight - 15) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(line, 20, yPosition);
        yPosition += 5; // Reduced line spacing
      });
      
      // Disclaimer Section
      yPosition += 10; // Reduced spacing
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('AI Analysis Disclaimer', 20, yPosition);
      
      yPosition += 8; // Reduced spacing
      pdf.setFontSize(9); // Smaller font for disclaimer
      pdf.setFont('helvetica', 'normal');
      
      const disclaimerText = 'These AI-generated insights are intended to assist clinical decision-making and should not replace professional medical judgment. All findings must be interpreted by qualified healthcare professionals in the context of complete patient clinical presentation. This analysis is for screening purposes only and requires confirmation through standard diagnostic procedures.';
      
      const disclaimerLines = splitText(disclaimerText, pageWidth - 40);
      disclaimerLines.forEach(line => {
        if (yPosition > pageHeight - 12) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(line, 20, yPosition);
        yPosition += 4; // Reduced line spacing for disclaimer
      });
      
      // Footer
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        pdf.text(`Generated by ALL Screening System - Page ${i} of ${totalPages}`, 20, pageHeight - 10);
        pdf.text(`Report ID: ${patientDetails.patientId}-${Date.now()}`, pageWidth - 80, pageHeight - 10);
      }
      
      // Save the PDF
      const fileName = `ALL_Screening_Report_${patientDetails.patientId}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      // Update patient name in the database after PDF generation
      try {
        const analysisId = location.state?.analysisId;
        if (analysisId && patientDetails.fullName && patientDetails.fullName.trim() !== '') {
          const response = await fetch('/api/analysis/update-patient-name', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              analysisId: analysisId,
              patientName: patientDetails.fullName.trim()
            })
          });
          
          if (response.ok) {
            console.log('Patient name updated successfully');
          } else {
            console.warn('Failed to update patient name');
          }
        }
      } catch (error) {
        console.error('Error updating patient name:', error);
        // Don't show error to user as PDF generation was successful
      }
      
      toast.dismiss(loadingToast);
      toast.success('Medical Report PDF Generated Successfully!', {
        duration: 6000,
        icon: '📄'
      });
      setShowPatientForm(false);
      
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF report. Please try again.');
    }
  };

  const confidencePercent = Math.round(results.confidence * 100);
  const cellCount = results.roboflowPredictions?.length || results.detectedCells?.length || 0;
  const totalCells = 100; // Assuming standard cell count for percentage calculation
  const analysisStatus = getAnalysisStatus(results.prediction, results.confidence, cellCount, totalCells);

  return (
    <div className="bg-gray-100 py-6 min-h-screen pt-24">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <Link 
                to="/analysis"
                className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-3"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Analysis
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                AI-powered Acute Lymphoblastic Leukemia Screening Results
              </h1>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowPatientForm(true)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Download className="w-4 h-4" />
                <span>Generate PDF Report</span>
              </button>
            </div>
          </div>
        </div>

        {/* Risk Alert Banner */}
        <div className={`${analysisStatus.color} border rounded-lg p-4 mb-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-white rounded-full">
                {analysisStatus.icon === 'alert' ? (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                ) : analysisStatus.icon === 'check' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <Info className="w-5 h-5 text-yellow-600" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold">Risk Level: {analysisStatus.riskLevel}</h2>
                <p className="text-sm opacity-75">Priority Level: {analysisStatus.priority}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{confidencePercent}%</div>
              <div className="text-sm opacity-75">CONFIDENCE SCORE</div>
            </div>
          </div>
        </div>

        {/* Image Comparison Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <BloodCellAI className="w-5 h-5 mr-2 text-blue-600" />
              Blood Smear Analysis Comparison
            </h2>
          </div>

          {/* Side by Side Image Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
            {/* Original Image */}
            <div className="relative group">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">Original Image</h3>
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-300 shadow-lg">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Original blood smear"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.warn('Original image failed to load:', e.target.src);
                      
                      // Try sessionStorage first
                      if (!e.target.dataset.sessionTried) {
                        const storedImage = sessionStorage.getItem('currentAnalysisImage');
                        if (storedImage && storedImage !== e.target.src) {
                          console.log('Retrying with sessionStorage image');
                          e.target.src = storedImage;
                          e.target.dataset.sessionTried = 'true';
                          return;
                        }
                      }
                      
                      // Try to recreate the blob URL if file is available
                      if (analysisData?.file && !e.target.dataset.retried) {
                        try {
                          const newUrl = URL.createObjectURL(analysisData.file);
                          e.target.src = newUrl;
                          e.target.dataset.retried = 'true';
                          console.log('Retrying with new blob URL');
                          return;
                        } catch (error) {
                          console.error('Failed to recreate blob URL:', error);
                        }
                      }
                      
                      // Last resort: try to fetch from backend
                      if (!e.target.dataset.backendTried) {
                        e.target.dataset.backendTried = 'true';
                        console.log('Trying backend fetch as last resort');
                        fetchImageFromBackend().then(() => {
                          if (imagePreview && imagePreview !== e.target.src) {
                            e.target.src = imagePreview;
                          }
                        });
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                    <BloodCellAI className="w-16 h-16 text-gray-400 mb-2" />
                    <p className="text-sm">Image not available</p>
                    {analysisData?.fileName && (
                      <p className="text-xs text-gray-400 mt-1">{analysisData.fileName}</p>
                    )}
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 text-center mt-2">Unprocessed blood smear image</p>
            </div>

            {/* Analyzed Image with Bounding Boxes */}
            <div className="relative group">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">AI Analysis Results</h3>
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-red-300 shadow-lg relative">
                {imagePreview ? (
                  <>
                    <img
                      src={imagePreview}
                      alt="Analyzed blood smear"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.warn('Analyzed image failed to load:', e.target.src);
                        
                        // Try sessionStorage first
                        if (!e.target.dataset.sessionTried) {
                          const storedImage = sessionStorage.getItem('currentAnalysisImage');
                          if (storedImage && storedImage !== e.target.src) {
                            console.log('Retrying analyzed image with sessionStorage');
                            e.target.src = storedImage;
                            e.target.dataset.sessionTried = 'true';
                            return;
                          }
                        }
                        
                        // Try to recreate the blob URL if file is available
                        if (analysisData?.file && !e.target.dataset.retried) {
                          try {
                            const newUrl = URL.createObjectURL(analysisData.file);
                            e.target.src = newUrl;
                            e.target.dataset.retried = 'true';
                            console.log('Retrying analyzed image with new blob URL');
                            return;
                          } catch (error) {
                            console.error('Failed to recreate blob URL for analyzed image:', error);
                          }
                        }
                        
                        // Last resort: try to fetch from backend
                        if (!e.target.dataset.backendTried) {
                          e.target.dataset.backendTried = 'true';
                          console.log('Trying backend fetch for analyzed image');
                          fetchImageFromBackend().then(() => {
                            if (imagePreview && imagePreview !== e.target.src) {
                              e.target.src = imagePreview;
                            }
                          });
                        }
                      }}
                    />
                    {/* Real Roboflow Bounding Boxes */}
                    <div className="absolute inset-0">
                      {results.roboflowPredictions && results.roboflowPredictions.length > 0 ? (
                        results.roboflowPredictions.map((prediction, index) => {
                          // Convert Roboflow center coordinates to CSS positioning
                          const imageWidth = results.imageWidth || 640;
                          const imageHeight = results.imageHeight || 640;
                          
                          // Calculate percentage positions for CSS
                          const leftPercent = Math.max(0, Math.min(100, ((prediction.x - prediction.width/2) / imageWidth) * 100));
                          const topPercent = Math.max(0, Math.min(100, ((prediction.y - prediction.height/2) / imageHeight) * 100));
                          const widthPercent = Math.max(2, Math.min(50, (prediction.width / imageWidth) * 100));
                          const heightPercent = Math.max(2, Math.min(50, (prediction.height / imageHeight) * 100));
                          
                          // Determine color based on confidence
                          const confidence = prediction.confidence;
                          let borderColor, bgColor, labelBg;
                          
                          if (confidence >= 0.85) {
                            borderColor = 'border-red-500';
                            bgColor = 'bg-red-500';
                            labelBg = 'bg-red-500';
                          } else if (confidence >= 0.65) {
                            borderColor = 'border-orange-500';
                            bgColor = 'bg-orange-500';
                            labelBg = 'bg-orange-500';
                          } else {
                            borderColor = 'border-yellow-500';
                            bgColor = 'bg-yellow-500';
                            labelBg = 'bg-yellow-500';
                          }
                          
                          return (
                            <div 
                              key={index}
                              className={`absolute border-2 ${borderColor} ${bgColor} bg-opacity-20`}
                              style={{
                                left: `${leftPercent}%`,
                                top: `${topPercent}%`,
                                width: `${widthPercent}%`,
                                height: `${heightPercent}%`
                              }}
                            >
                              <div className={`absolute -top-6 left-0 ${labelBg} text-white text-xs px-2 py-1 rounded whitespace-nowrap`}>
                                {prediction.class || 'Cell'} {Math.round(confidence * 100)}%
                              </div>
                            </div>
                          );
                        })
                      ) : results.detectedCells && results.detectedCells.length > 0 ? (
                        // Fallback to detectedCells if roboflowPredictions not available
                        results.detectedCells.map((cell, index) => {
                          const confidence = cell.confidence;
                          let borderColor, bgColor, labelBg;
                          
                          if (confidence >= 0.85) {
                            borderColor = 'border-red-500';
                            bgColor = 'bg-red-500';
                            labelBg = 'bg-red-500';
                          } else if (confidence >= 0.65) {
                            borderColor = 'border-orange-500';
                            bgColor = 'bg-orange-500';
                            labelBg = 'bg-orange-500';
                          } else {
                            borderColor = 'border-yellow-500';
                            bgColor = 'bg-yellow-500';
                            labelBg = 'bg-yellow-500';
                          }
                          
                          return (
                            <div 
                              key={index}
                              className={`absolute border-2 ${borderColor} ${bgColor} bg-opacity-20`}
                              style={{
                                left: `${cell.coordinates.x}%`,
                                top: `${cell.coordinates.y}%`,
                                width: `${cell.coordinates.width}%`,
                                height: `${cell.coordinates.height}%`
                              }}
                            >
                              <div className={`absolute -top-6 left-0 ${labelBg} text-white text-xs px-2 py-1 rounded whitespace-nowrap`}>
                                {cell.cellType} {Math.round(confidence * 100)}%
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        // No detections found
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-green-100 border border-green-300 rounded-lg p-4 text-center">
                            <p className="text-green-800 font-medium">No lymphoblasts detected</p>
                            <p className="text-green-600 text-sm">Normal cell morphology</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                    <BloodCellAI className="w-16 h-16 text-gray-400 mb-2" />
                    <p className="text-sm">Analysis image not available</p>
                    {analysisData?.fileName && (
                      <p className="text-xs text-gray-400 mt-1">{analysisData.fileName}</p>
                    )}
                    {/* Show detection info even without image */}
                    {(results.roboflowPredictions?.length > 0 || results.detectedCells?.length > 0) && (
                      <div className="mt-3 text-center">
                        <p className="text-xs text-blue-600 font-medium">
                          {results.roboflowPredictions?.length || results.detectedCells?.length} cells detected
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 text-center mt-2">
                {results.roboflowPredictions?.length > 0 || results.detectedCells?.length > 0 
                  ? 'AI-detected cells with confidence scores' 
                  : 'No abnormal cells detected'
                }
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {results.roboflowPredictions?.length || results.detectedCells?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Cells Detected</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{confidencePercent}%</div>
                <div className="text-sm text-gray-600">Confidence Score</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {results.prediction.toUpperCase()}
                </div>
                <div className="text-sm text-gray-600">Screening Result</div>
              </div>
            </div>
            
            {/* Add Note for positive results */}
            {results.prediction === 'positive' && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Note:</p>
                    <p className="text-sm text-blue-800">
                      "Suspicious" findings indicate abnormal blast-like or lymphoblast-like cells that must be confirmed using standard diagnostic procedures such as flow cytometry and bone marrow evaluation.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI-Generated Suggestions Box */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Brain className="w-5 h-5 mr-2 text-purple-600" />
              AI-Generated Clinical Insights & Recommendations
            </h2>
            <div className="flex items-center space-x-2 text-sm text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
              <Lightbulb className="w-4 h-4" />
              <span>AI Powered</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Clinical Assessment */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-3">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <h3 className="text-lg font-medium text-gray-900">Clinical Assessment</h3>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">Morphological Analysis</p>
                      <p className="text-sm text-blue-800">
                        {analysisStatus.result.includes('Suspicious') 
                          ? 'Cellular morphology shows atypical lymphoblast-like cells with high nucleus-to-cytoplasm ratio and abnormal chromatin patterns, raising suspicion for acute lymphoblastic leukemia. Abnormal cells are present in the analyzed sample and require confirmatory testing.'
                          : analysisStatus.result.includes('requires expert review')
                          ? 'Cellular morphology shows mixed characteristics. Some cells exhibit atypical features requiring expert interpretation.'
                          : 'Cellular morphology appears within normal parameters. No significant abnormalities detected in the analyzed sample.'
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">Confidence Analysis</p>
                      <p className="text-sm text-blue-800">
                        {confidencePercent >= 85 
                          ? `High confidence level (${confidencePercent}%) indicates strong algorithmic certainty in the analysis. Results are highly reliable for clinical decision-making.`
                          : confidencePercent >= 70
                          ? `Moderate confidence level (${confidencePercent}%) suggests good algorithmic certainty. Consider additional confirmatory testing for comprehensive assessment.`
                          : `Lower confidence level (${confidencePercent}%) indicates algorithmic uncertainty. Recommend expert review and additional diagnostic procedures.`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-3">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                <h3 className="text-lg font-medium text-gray-900">Clinical Recommendations</h3>
              </div>
              
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="space-y-3">
                  {results.recommendations && results.recommendations.length > 0 ? (
                    results.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                        <p className="text-sm text-orange-800">{recommendation}</p>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                        <p className="text-sm text-orange-800">
                          {analysisStatus.result.includes('POSITIVE')
                            ? 'Immediate hematological consultation recommended for comprehensive evaluation and treatment planning.'
                            : analysisStatus.result.includes('INCONCLUSIVE')
                            ? 'Expert pathologist review recommended to clarify cellular morphology and determine appropriate follow-up.'
                            : 'Continue routine monitoring as per standard clinical protocols. No immediate intervention required.'
                          }
                        </p>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                        <p className="text-sm text-orange-800">
                          {analysisStatus.result.includes('POSITIVE')
                            ? 'Consider additional confirmatory tests including bone marrow biopsy and flow cytometry for definitive diagnosis.'
                            : analysisStatus.result.includes('INCONCLUSIVE')
                            ? 'Repeat analysis with higher quality samples or alternative imaging techniques may provide clearer results.'
                            : 'Document findings in patient record and schedule routine follow-up as clinically indicated.'
                          }
                        </p>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                        <p className="text-sm text-orange-800">
                          {analysisStatus.result.includes('POSITIVE')
                            ? 'Monitor patient closely for clinical symptoms and coordinate multidisciplinary care team involvement.'
                            : analysisStatus.result.includes('INCONCLUSIVE')
                            ? 'Clinical correlation with patient symptoms and medical history is essential for appropriate management.'
                            : 'Maintain standard screening intervals and patient education regarding symptom awareness.'
                          }
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* AI Disclaimer */}
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-gray-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">AI Analysis Disclaimer</p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  These AI-generated insights are intended to assist clinical decision-making and should not replace professional medical judgment. 
                  All findings must be interpreted by qualified healthcare professionals in the context of complete patient clinical presentation. 
                  This analysis is for screening purposes only and requires confirmation through standard diagnostic procedures.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Simple Patient Details Popup */}
        {showPatientForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
              {/* Header with Gradient */}
              <div className="bg-gradient-to-r from-blue-500 via-teal-500 to-purple-600 p-6 rounded-t-2xl">
                <h3 className="text-2xl font-bold text-white mb-2">Patient Details</h3>
                <p className="text-blue-100">Please enter patient information for the report</p>
              </div>
              
              {/* Form Content */}
              <div className="p-6 space-y-4">
                {/* Patient Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Patient Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={patientDetails.fullName}
                    onChange={handlePatientDetailChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter name"
                  />
                </div>

                {/* Patient ID and Age Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Patient ID
                    </label>
                    <input
                      type="text"
                      name="patientId"
                      value={patientDetails.patientId}
                      onChange={handlePatientDetailChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ID-12345"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age
                    </label>
                    <input
                      type="number"
                      name="age"
                      value={patientDetails.age}
                      onChange={handlePatientDetailChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Years"
                    />
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={patientDetails.gender}
                    onChange={handlePatientDetailChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 p-6 pt-0">
                <button 
                  onClick={() => setShowPatientForm(false)}
                  className="flex-1 px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={generatePDFReport}
                  disabled={!patientDetails.fullName || !patientDetails.patientId || !patientDetails.age || !patientDetails.gender}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 via-teal-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:via-teal-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Generate PDF</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisResults;
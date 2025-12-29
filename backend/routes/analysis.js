const express = require('express');
const multer = require('multer');
const axios = require('axios');
const Analysis = require('../models/Analysis');
const Patient = require('../models/Patient');
const User = require('../models/User');
const { authenticateToken, requireDoctor } = require('./auth');

const router = express.Router();

// Apply authentication to all analysis routes
router.use(authenticateToken);
router.use(requireDoctor);

// Configure multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// POST /api/analysis/upload - Upload and analyze image
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const { patientId } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    if (!patientId) {
      return res.status(400).json({ error: 'Patient ID is required' });
    }

    // Verify patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Create analysis record
    const analysis = new Analysis({
      patientId,
      imageUrl: `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
      status: 'processing',
      processedBy: req.user.id
    });

    await analysis.save();

    // Call Roboflow API with the specific workflow endpoint
    try {
      // Convert image to base64 for Roboflow API
      const imageBase64 = req.file.buffer.toString('base64');
      const imageDataUrl = `data:${req.file.mimetype};base64,${imageBase64}`;

      const roboflowResponse = await axios.post(
        'https://serverless.roboflow.com/deva-yc5op/workflows/rit',
        {
          api_key: 'R8FMaPoYSNTZ8c7cw4aa',
          inputs: {
            "image": {
              "type": "base64",
              "value": imageBase64
            }
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Roboflow API Response:', roboflowResponse.data);

      // Process Roboflow workflow response
      const workflowResults = roboflowResponse.data;
      let prediction = 'negative';
      let confidence = 0;
      let detectedCells = [];
      let roboflowPredictions = [];

      console.log('Processing Roboflow response:', JSON.stringify(workflowResults, null, 2));

      // Handle the workflow response format with outputs array
      if (workflowResults && workflowResults.outputs && Array.isArray(workflowResults.outputs)) {
        const outputs = workflowResults.outputs;
        
        // Look for predictions in the outputs
        for (const output of outputs) {
          if (output.predictions && output.predictions.predictions) {
            const predictions = output.predictions.predictions;
            const imageInfo = output.predictions.image;
            
            console.log('Found predictions:', predictions.length);
            console.log('Image dimensions:', imageInfo);
            
            if (predictions.length > 0) {
              // Calculate average confidence
              confidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;
              
              // Classify based on confidence and number of detections
              if (predictions.length >= 3 && confidence > 0.6) {
                prediction = 'positive';
              } else if (predictions.length >= 1 && confidence > 0.4) {
                prediction = 'uncertain';
              } else {
                prediction = 'negative';
              }

              // Store raw Roboflow predictions for accurate coordinate conversion
              roboflowPredictions = predictions.map(p => ({
                x: p.x,
                y: p.y,
                width: p.width,
                height: p.height,
                confidence: p.confidence,
                class: p.class,
                class_id: p.class_id,
                detection_id: p.detection_id
              }));

              // Also create legacy format for backward compatibility
              detectedCells = predictions.map((p, index) => ({
                cellType: p.class || 'Early',
                coordinates: {
                  // Convert Roboflow center coordinates to top-left percentage coordinates
                  x: Math.max(0, Math.min(100, ((p.x - p.width/2) / (imageInfo.width || 640)) * 100)),
                  y: Math.max(0, Math.min(100, ((p.y - p.height/2) / (imageInfo.height || 640)) * 100)),
                  width: Math.max(5, Math.min(30, (p.width / (imageInfo.width || 640)) * 100)),
                  height: Math.max(5, Math.min(30, (p.height / (imageInfo.height || 640)) * 100))
                },
                confidence: p.confidence
              }));

              console.log(`✅ Processed ${predictions.length} detections with average confidence ${(confidence * 100).toFixed(1)}%`);
              break; // Found predictions, exit loop
            }
          }
        }
      }
      // Handle the direct array format (your original format)
      else if (workflowResults && Array.isArray(workflowResults) && workflowResults.length > 0) {
        const firstResult = workflowResults[0];
        
        if (firstResult.predictions && firstResult.predictions.predictions) {
          const predictions = firstResult.predictions.predictions;
          const imageInfo = firstResult.predictions.image;
          
          console.log('Found predictions:', predictions.length);
          console.log('Image dimensions:', imageInfo);
          
          if (predictions.length > 0) {
            // Calculate average confidence
            confidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;
            
            // Classify based on confidence and number of detections
            if (predictions.length >= 3 && confidence > 0.6) {
              prediction = 'positive';
            } else if (predictions.length >= 1 && confidence > 0.4) {
              prediction = 'uncertain';
            } else {
              prediction = 'negative';
            }

            // Store raw Roboflow predictions for accurate coordinate conversion
            roboflowPredictions = predictions.map(p => ({
              x: p.x,
              y: p.y,
              width: p.width,
              height: p.height,
              confidence: p.confidence,
              class: p.class,
              class_id: p.class_id,
              detection_id: p.detection_id
            }));

            // Also create legacy format for backward compatibility
            detectedCells = predictions.map((p, index) => ({
              cellType: p.class || 'Early',
              coordinates: {
                // Convert Roboflow center coordinates to top-left percentage coordinates
                x: Math.max(0, Math.min(100, ((p.x - p.width/2) / (imageInfo.width || 640)) * 100)),
                y: Math.max(0, Math.min(100, ((p.y - p.height/2) / (imageInfo.height || 640)) * 100)),
                width: Math.max(5, Math.min(30, (p.width / (imageInfo.width || 640)) * 100)),
                height: Math.max(5, Math.min(30, (p.height / (imageInfo.height || 640)) * 100))
              },
              confidence: p.confidence
            }));

            console.log(`✅ Processed ${predictions.length} detections with average confidence ${(confidence * 100).toFixed(1)}%`);
          }
        }
      }
      // Fallback for other response formats
      else if (workflowResults && workflowResults.outputs) {
        // Parse workflow outputs for ALL screening
        const outputs = workflowResults.outputs;
        
        // Look for detection results in the workflow outputs
        if (outputs.predictions && outputs.predictions.length > 0) {
          const predictions = outputs.predictions;
          confidence = Math.max(...predictions.map(p => p.confidence || 0));
          
          // Classify based on confidence and detected cells
          if (confidence > 0.7) {
            prediction = 'positive';
          } else if (confidence > 0.3) {
            prediction = 'uncertain';
          } else {
            prediction = 'negative';
          }

          detectedCells = predictions.map((p, index) => ({
            cellType: p.class || 'lymphoblast',
            coordinates: {
              // Convert Roboflow coordinates to percentage-based coordinates for frontend
              x: Math.max(0, Math.min(100, ((p.x - p.width/2) / (p.image_width || 640)) * 100)),
              y: Math.max(0, Math.min(100, ((p.y - p.height/2) / (p.image_height || 640)) * 100)),
              width: Math.max(5, Math.min(30, (p.width / (p.image_width || 640)) * 100)),
              height: Math.max(5, Math.min(30, (p.height / (p.image_height || 640)) * 100))
            },
            confidence: p.confidence || 0
          }));
        } else if (outputs.classification) {
          // Handle classification output
          const classification = outputs.classification;
          prediction = classification.predicted_class === 'positive' ? 'positive' : 'negative';
          confidence = classification.confidence || 0;
        } else if (outputs.model_predictions) {
          // Handle model predictions format
          const modelPreds = outputs.model_predictions;
          if (modelPreds.length > 0) {
            const topPrediction = modelPreds[0];
            confidence = topPrediction.confidence || 0;
            prediction = confidence > 0.7 ? 'positive' : confidence > 0.3 ? 'uncertain' : 'negative';
            
            // Create detected cells from predictions
            detectedCells = modelPreds.map((pred, index) => ({
              cellType: pred.class || 'all_cell',
              coordinates: {
                x: Math.max(0, Math.min(100, 25 + (index * 15))), // Spread across image
                y: Math.max(0, Math.min(100, 30 + (index * 10))),
                width: Math.max(10, Math.min(25, 15 + (pred.confidence * 10))),
                height: Math.max(10, Math.min(25, 15 + (pred.confidence * 10)))
              },
              confidence: pred.confidence || 0
            }));
          }
        }
      }

      // If no detections found, set as negative result
      if (prediction === 'positive' && detectedCells.length === 0 && roboflowPredictions.length === 0) {
        prediction = 'negative';
        confidence = 0.1;
        console.log('⚠️  No detections found, setting result as negative');
      }

      // Update analysis with results
      analysis.analysisResults = {
        prediction,
        confidence: Math.round(confidence * 100) / 100, // Round to 2 decimal places
        detectedCells,
        roboflowPredictions, // Store raw Roboflow predictions for accurate rendering
        imageWidth: workflowResults.outputs?.[0]?.predictions?.image?.width || 640,
        imageHeight: workflowResults.outputs?.[0]?.predictions?.image?.height || 640,
        summary: `Analysis completed with ${confidence > 0.7 ? 'high' : confidence > 0.3 ? 'moderate' : 'low'} confidence`,
        recommendations: generateRecommendations(prediction, confidence)
      };
      analysis.roboflowResponse = workflowResults;
      analysis.status = 'completed';

      // Increment doctor's analysis count
      await User.findByIdAndUpdate(req.user.id, {
        $inc: { analysisCount: 1 }
      });

    } catch (apiError) {
      console.error('Roboflow API error:', apiError.response?.data || apiError.message);
      analysis.status = 'failed';
      analysis.notes = 'AI analysis failed: ' + (apiError.response?.data?.message || apiError.message);
      analysis.analysisResults = {
        prediction: 'error',
        confidence: 0,
        detectedCells: [],
        summary: 'Analysis failed due to API error',
        recommendations: ['Please try uploading the image again', 'Ensure image quality is sufficient for analysis']
      };
    }

    await analysis.save();

    // Add analysis to patient record
    patient.analyses.push(analysis._id);
    await patient.save();

    res.json({
      analysisId: analysis._id,
      status: analysis.status,
      results: analysis.analysisResults
    });

  } catch (error) {
    console.error('Analysis upload error:', error);
    res.status(500).json({ error: 'Failed to process analysis' });
  }
});

// Helper function to generate medical recommendations
function generateRecommendations(prediction, confidence) {
  const recommendations = [];
  
  switch (prediction) {
    case 'positive':
      recommendations.push('Immediate consultation with hematologist recommended');
      recommendations.push('Additional confirmatory tests (bone marrow biopsy) may be required');
      recommendations.push('Monitor patient closely for symptoms');
      if (confidence < 0.9) {
        recommendations.push('Consider second opinion due to moderate confidence level');
      }
      break;
      
    case 'uncertain':
      recommendations.push('Repeat analysis with higher quality images recommended');
      recommendations.push('Clinical correlation with patient symptoms advised');
      recommendations.push('Consider additional diagnostic tests');
      recommendations.push('Follow-up analysis in 1-2 weeks');
      break;
      
    case 'negative':
      recommendations.push('No immediate signs of ALL detected');
      recommendations.push('Continue routine monitoring as per clinical guidelines');
      if (confidence < 0.8) {
        recommendations.push('Consider repeat analysis if clinical suspicion remains high');
      }
      break;
      
    default:
      recommendations.push('Analysis could not be completed');
      recommendations.push('Please ensure image quality and try again');
      recommendations.push('Contact technical support if issue persists');
  }
  
  return recommendations;
}

// POST /api/analysis/process - Process uploaded analysis data
router.post('/process', async (req, res) => {
  try {
    const { imageData, patientInfo } = req.body;
    
    if (!imageData || !patientInfo) {
      return res.status(400).json({ error: 'Image data and patient info are required' });
    }

    // Create or get patient
    let patient;
    try {
      patient = await Patient.findOne({ patientId: patientInfo.patientId });
      if (!patient) {
        patient = new Patient(patientInfo);
        await patient.save();
      } else {
        console.log('Using existing patient:', patient.patientId);
      }
    } catch (error) {
      if (error.code === 11000) {
        // Duplicate key error, try to find existing patient
        console.log('Duplicate patient ID, finding existing patient...');
        patient = await Patient.findOne({ patientId: patientInfo.patientId });
        if (!patient) {
          return res.status(500).json({ error: 'Failed to create or find patient record' });
        }
      } else {
        console.error('Patient creation error:', error);
        return res.status(500).json({ error: 'Failed to create patient record' });
      }
    }

    // Create analysis record
    const analysis = new Analysis({
      patientId: patient._id,
      imageUrl: `data:${imageData.fileType || 'image/jpeg'};base64,${imageData.base64 || 'placeholder'}`,
      status: 'processing',
      processedBy: req.user.id
    });

    await analysis.save();

    // Call Roboflow API for real analysis instead of mock data
    try {
      // Convert image data to proper format for Roboflow API
      const imageBase64 = imageData.base64;

      const roboflowResponse = await axios.post(
        'https://serverless.roboflow.com/deva-yc5op/workflows/rit',
        {
          api_key: 'R8FMaPoYSNTZ8c7cw4aa',
          inputs: {
            "image": {
              "type": "base64",
              "value": imageBase64
            }
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Roboflow API Response:', roboflowResponse.data);

      // Process Roboflow response (same logic as upload endpoint)
      const workflowResults = roboflowResponse.data;
      let prediction = 'negative';
      let confidence = 0;
      let detectedCells = [];
      let roboflowPredictions = [];

      // Handle the workflow response format with outputs array
      if (workflowResults && workflowResults.outputs && Array.isArray(workflowResults.outputs)) {
        const outputs = workflowResults.outputs;
        
        // Look for predictions in the outputs
        for (const output of outputs) {
          if (output.predictions && output.predictions.predictions) {
            const predictions = output.predictions.predictions;
            const imageInfo = output.predictions.image;
            
            if (predictions.length > 0) {
              confidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;
              
              if (predictions.length >= 3 && confidence > 0.6) {
                prediction = 'positive';
              } else if (predictions.length >= 1 && confidence > 0.4) {
                prediction = 'uncertain';
              } else {
                prediction = 'negative';
              }

              roboflowPredictions = predictions.map(p => ({
                x: p.x,
                y: p.y,
                width: p.width,
                height: p.height,
                confidence: p.confidence,
                class: p.class,
                class_id: p.class_id,
                detection_id: p.detection_id
              }));

              detectedCells = predictions.map((p, index) => ({
                cellType: p.class || 'Early',
                coordinates: {
                  x: Math.max(0, Math.min(100, ((p.x - p.width/2) / (imageInfo.width || 640)) * 100)),
                  y: Math.max(0, Math.min(100, ((p.y - p.height/2) / (imageInfo.height || 640)) * 100)),
                  width: Math.max(5, Math.min(30, (p.width / (imageInfo.width || 640)) * 100)),
                  height: Math.max(5, Math.min(30, (p.height / (imageInfo.height || 640)) * 100))
                },
                confidence: p.confidence
              }));
              break;
            }
          }
        }
      }
      // Handle the direct array format (fallback)
      else if (workflowResults && Array.isArray(workflowResults) && workflowResults.length > 0) {
        const firstResult = workflowResults[0];
        
        if (firstResult.predictions && firstResult.predictions.predictions) {
          const predictions = firstResult.predictions.predictions;
          const imageInfo = firstResult.predictions.image;
          
          if (predictions.length > 0) {
            confidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;
            
            if (predictions.length >= 3 && confidence > 0.6) {
              prediction = 'positive';
            } else if (predictions.length >= 1 && confidence > 0.4) {
              prediction = 'uncertain';
            } else {
              prediction = 'negative';
            }

            roboflowPredictions = predictions.map(p => ({
              x: p.x,
              y: p.y,
              width: p.width,
              height: p.height,
              confidence: p.confidence,
              class: p.class,
              class_id: p.class_id,
              detection_id: p.detection_id
            }));

            detectedCells = predictions.map((p, index) => ({
              cellType: p.class || 'Early',
              coordinates: {
                x: Math.max(0, Math.min(100, ((p.x - p.width/2) / (imageInfo.width || 640)) * 100)),
                y: Math.max(0, Math.min(100, ((p.y - p.height/2) / (imageInfo.height || 640)) * 100)),
                width: Math.max(5, Math.min(30, (p.width / (imageInfo.width || 640)) * 100)),
                height: Math.max(5, Math.min(30, (p.height / (imageInfo.height || 640)) * 100))
              },
              confidence: p.confidence
            }));
          }
        }
      }

      // Update analysis with real results
      analysis.analysisResults = {
        prediction,
        confidence: Math.round(confidence * 100) / 100,
        detectedCells,
        roboflowPredictions,
        imageWidth: workflowResults.outputs?.[0]?.predictions?.image?.width || 640,
        imageHeight: workflowResults.outputs?.[0]?.predictions?.image?.height || 640,
        summary: `Analysis completed with ${confidence > 0.7 ? 'high' : confidence > 0.3 ? 'moderate' : 'low'} confidence`,
        recommendations: generateRecommendations(prediction, confidence)
      };
      analysis.roboflowResponse = workflowResults;

    } catch (apiError) {
      console.error('Roboflow API error:', apiError.response?.data || apiError.message);
      analysis.analysisResults = {
        prediction: 'error',
        confidence: 0,
        detectedCells: [],
        roboflowPredictions: [],
        summary: 'Analysis failed due to API error',
        recommendations: ['Please try uploading the image again', 'Ensure image quality is sufficient for analysis']
      };
    }
    analysis.status = 'completed';
    await analysis.save();

    // Add analysis to patient record
    patient.analyses.push(analysis._id);
    await patient.save();

    // Increment doctor's analysis count
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { analysisCount: 1 }
    });

    res.json({
      success: true,
      analysisId: analysis._id,
      status: 'completed',
      results: {
        ...analysis.analysisResults,
        imageUrl: analysis.imageUrl // Include the image URL in the response
      }
    });

  } catch (error) {
    console.error('Analysis process error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to process analysis' 
    });
  }
});

// GET /api/analysis/:id/status - Get analysis status
router.get('/:id/status', async (req, res) => {
  try {
    const analysis = await Analysis.findById(req.params.id)
      .populate('patientId', 'name patientId');
    
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    res.json({
      analysisId: analysis._id,
      status: analysis.status,
      results: analysis.analysisResults || {
        prediction: 'processing',
        confidence: 0,
        detectedCells: [],
        summary: 'Analysis in progress...',
        recommendations: []
      }
    });
  } catch (error) {
    console.error('Get analysis status error:', error);
    res.status(500).json({ error: 'Failed to retrieve analysis status' });
  }
});

// GET /api/analysis/:id - Get analysis results
router.get('/:id', async (req, res) => {
  try {
    const analysis = await Analysis.findById(req.params.id)
      .populate('patientId', 'name patientId');
    
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    res.json(analysis);
  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({ error: 'Failed to retrieve analysis' });
  }
});

// GET /api/analysis - Get all analyses with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const analyses = await Analysis.find()
      .populate('patientId', 'name patientId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Analysis.countDocuments();

    res.json({
      analyses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get analyses error:', error);
    res.status(500).json({ error: 'Failed to retrieve analyses' });
  }
});

// POST /api/analysis/update-patient-name - Update patient name after PDF generation
router.post('/update-patient-name', async (req, res) => {
  try {
    const { analysisId, patientName } = req.body;
    
    if (!analysisId || !patientName) {
      return res.status(400).json({ error: 'Analysis ID and patient name are required' });
    }

    // Find the analysis
    const analysis = await Analysis.findById(analysisId);
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    // Update the patient name
    const patient = await Patient.findByIdAndUpdate(
      analysis.patientId,
      { name: patientName.trim() },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json({
      success: true,
      message: 'Patient name updated successfully',
      patientName: patient.name
    });

  } catch (error) {
    console.error('Update patient name error:', error);
    res.status(500).json({ error: 'Failed to update patient name' });
  }
});

module.exports = router;
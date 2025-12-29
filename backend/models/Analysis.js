const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  analysisResults: {
    prediction: {
      type: String,
      enum: ['positive', 'negative', 'uncertain'],
      required: false // Not required initially
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      required: false // Not required initially
    },
    detectedCells: [{
      cellType: String, // Changed from 'type' to avoid Mongoose conflict
      coordinates: {
        x: Number,
        y: Number,
        width: Number,
        height: Number
      },
      confidence: Number
    }],
    summary: String,
    recommendations: [String]
  },
  roboflowResponse: {
    type: mongoose.Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  processedBy: {
    type: String,
    required: true
  },
  notes: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Analysis', analysisSchema);
const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  contactInfo: {
    email: String,
    phone: String
  },
  medicalHistory: [{
    condition: String,
    date: Date,
    notes: String
  }],
  analyses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Analysis'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Patient', patientSchema);
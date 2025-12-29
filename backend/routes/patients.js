const express = require('express');
const Patient = require('../models/Patient');
const { authenticateToken, requireDoctor } = require('./auth');

const router = express.Router();

// Apply authentication to all patient routes
router.use(authenticateToken);
router.use(requireDoctor);

// POST /api/patients - Create new patient or get existing
router.post('/', async (req, res) => {
  try {
    const { patientId, name, age, gender, contactInfo, medicalHistory } = req.body;

    // Check if patient ID already exists
    const existingPatient = await Patient.findOne({ patientId });
    if (existingPatient) {
      // Return existing patient instead of error
      return res.status(200).json({ 
        patient: existingPatient,
        message: 'Patient already exists',
        isExisting: true
      });
    }

    const patient = new Patient({
      patientId,
      name,
      age,
      gender,
      contactInfo,
      medicalHistory: medicalHistory || []
    });

    await patient.save();
    res.status(201).json({ 
      patient: patient,
      message: 'Patient created successfully',
      isExisting: false
    });
  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({ error: 'Failed to create patient' });
  }
});

// GET /api/patients - Get all patients with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { patientId: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const patients = await Patient.find(query)
      .populate('analyses')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Patient.countDocuments(query);

    res.json({
      patients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ error: 'Failed to retrieve patients' });
  }
});

// GET /api/patients/:id - Get patient by ID
router.get('/:id', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('analyses');
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json(patient);
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({ error: 'Failed to retrieve patient' });
  }
});

// PUT /api/patients/:id - Update patient
router.put('/:id', async (req, res) => {
  try {
    const { name, age, gender, contactInfo, medicalHistory } = req.body;

    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { name, age, gender, contactInfo, medicalHistory },
      { new: true, runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json(patient);
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({ error: 'Failed to update patient' });
  }
});

// DELETE /api/patients/:id - Delete patient
router.delete('/:id', async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({ error: 'Failed to delete patient' });
  }
});

module.exports = router;
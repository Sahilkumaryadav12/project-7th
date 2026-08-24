const Prescription = require('../models/Prescription');
const path = require('path');
const fs = require('fs');

const getPrescriptions = async (req, res, next) => {
  try {
    const prescriptions = await Prescription.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(prescriptions);
  } catch (err) {
    next(err);
  }
};

const uploadPrescription = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a prescription file' });
    }

    const { doctorName, prescriptionDate, notes } = req.body;
    const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');
    const fileType = ext === 'jpeg' ? 'jpg' : ext;

    const fileUrl = `/uploads/${req.file.filename}`;

    const prescription = await Prescription.create({
      userId: req.user._id,
      doctorName: doctorName || '',
      prescriptionDate: prescriptionDate || new Date(),
      fileUrl,
      fileType,
      notes: notes || '',
    });

    res.status(201).json(prescription);
  } catch (err) {
    next(err);
  }
};

const deletePrescription = async (req, res, next) => {
  try {
    const prescription = await Prescription.findOne({ _id: req.params.id, userId: req.user._id });
    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    // Try deleting local uploaded file
    try {
      const filePath = path.join(__dirname, '..', prescription.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fsErr) {
      console.warn('[Prescription] Unlink error:', fsErr.message);
    }

    await Prescription.deleteOne({ _id: prescription._id });
    res.status(200).json({ message: 'Prescription deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPrescriptions,
  uploadPrescription,
  deletePrescription,
};

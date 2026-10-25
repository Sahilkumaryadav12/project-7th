const Prescription = require('../models/Prescription');
const path = require('path');
const fs = require('fs');

const getPrescriptions = async (req, res, next) => {
  try {
    const prescriptions = await Prescription.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(prescriptions.map(p => ({ ...p.toObject(), fileUrl: `/api/prescriptions/${p._id}/file` })));
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
    const header = fs.readFileSync(req.file.path).subarray(0, 8);
    const signatures = {
      pdf: header.subarray(0, 5).toString() === '%PDF-',
      jpg: header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff,
      jpeg: header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff,
      png: header.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
    };
    if (!signatures[ext]) {
      fs.unlinkSync(req.file.path);
      return res.status(422).json({ error: 'File contents do not match a supported prescription type' });
    }
    const fileType = ext === 'jpeg' ? 'jpg' : ext;

    const fileUrl = `private/${req.file.filename}`;

    const prescription = await Prescription.create({
      userId: req.user._id,
      doctorName: doctorName || '',
      prescriptionDate: prescriptionDate || new Date(),
      fileUrl,
      fileType,
      notes: notes || '',
    });

    res.status(201).json({ ...prescription.toObject(), fileUrl: `/api/prescriptions/${prescription._id}/file` });
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
      const filePath = path.join(__dirname, '..', 'uploads', path.basename(prescription.fileUrl));
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

const getPrescription = async (req, res, next) => {
  try {
    const prescription = await Prescription.findOne({ _id: req.params.id, userId: req.user._id });
    if (!prescription) return res.status(404).json({ error: 'Prescription not found' });
    res.status(200).json({ ...prescription.toObject(), fileUrl: `/api/prescriptions/${prescription._id}/file` });
  } catch (err) { next(err); }
};

const downloadPrescription = async (req, res, next) => {
  try {
    const prescription = await Prescription.findOne({ _id: req.params.id, userId: req.user._id });
    if (!prescription) return res.status(404).json({ error: 'Prescription not found' });
    const filePath = path.join(__dirname, '..', 'uploads', path.basename(prescription.fileUrl));
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', `inline; filename="prescription-${prescription._id}.${prescription.fileType}"`);
    res.sendFile(filePath, err => { if (err && !res.headersSent) next(err); });
  } catch (err) { next(err); }
};

module.exports = {
  getPrescriptions,
  getPrescription,
  downloadPrescription,
  uploadPrescription,
  deletePrescription,
};

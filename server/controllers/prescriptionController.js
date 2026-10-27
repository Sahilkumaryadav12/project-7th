const Prescription = require('../models/Prescription');
const path = require('path');
const fs = require('fs');

const getPrescriptions = async (req, res, next) => {
  try {
    const prescriptions = await Prescription.find({ userId: req.user._id }).sort({ createdAt: -1 });
    const Medicine = require('../models/Medicine');
    const prescriptionList = await Promise.all(
      prescriptions.map(async (p) => {
        const medicines = await Medicine.find({
          userId: req.user._id,
          prescriptionId: p._id,
          isActive: true,
        }).select('_id name dosage frequency reminderTimes foodInstruction startDate endDate notes');
        return {
          ...p.toObject(),
          fileUrl: `/api/prescriptions/${p._id}/file`,
          medicines,
        };
      })
    );
    res.status(200).json(prescriptionList);
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
    const fileBuffer = fs.readFileSync(req.file.path);

    const prescription = await Prescription.create({
      userId: req.user._id,
      doctorName: doctorName || '',
      prescriptionDate: prescriptionDate || new Date(),
      fileUrl,
      fileType,
      fileData: fileBuffer,
      notes: notes || '',
    });

    res.status(201).json({ ...prescription.toObject(), fileUrl: `/api/prescriptions/${prescription._id}/file`, medicines: [] });
  } catch (err) {
    next(err);
  }
};

const getPrescriptionFilePath = (prescription) => {
  const filename = path.basename(prescription.fileUrl);
  const privatePath = path.join(__dirname, '..', 'uploads', 'private', filename);
  if (fs.existsSync(privatePath)) return privatePath;
  const rootPath = path.join(__dirname, '..', 'uploads', filename);
  if (fs.existsSync(rootPath)) return rootPath;
  return null;
};

const deletePrescription = async (req, res, next) => {
  try {
    const prescription = await Prescription.findOne({ _id: req.params.id, userId: req.user._id });
    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    // Try deleting local uploaded file from uploads/private or uploads
    try {
      const filePath = getPrescriptionFilePath(prescription);
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fsErr) {
      console.warn('[Prescription] Unlink error:', fsErr.message);
    }

    const Medicine = require('../models/Medicine');
    // Unlink medicines from deleted prescription so patient's dose tracking is preserved
    await Medicine.updateMany({ userId: req.user._id, prescriptionId: prescription._id }, { $set: { prescriptionId: null } });

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
    let prescription = await Prescription.findOne({ _id: req.params.id, userId: req.user._id }).select('+fileData');
    if (!prescription && req.user.role === 'caregiver') {
      const CaregiverRelationship = require('../models/CaregiverRelationship');
      const candidate = await Prescription.findById(req.params.id).select('+fileData');
      if (candidate) {
        const hasAccess = await CaregiverRelationship.exists({
          caregiverId: req.user._id,
          patientId: candidate.userId,
          status: 'accepted',
        });
        if (hasAccess) prescription = candidate;
      }
    }
    if (!prescription) return res.status(404).json({ error: 'Prescription not found' });

    const mimeTypes = {
      pdf: 'application/pdf',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
    };
    res.setHeader('Cache-Control', 'private, max-age=86400');
    res.setHeader('Content-Type', mimeTypes[prescription.fileType] || 'application/octet-stream');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', `inline; filename="prescription-${prescription._id}.${prescription.fileType}"`);

    const filePath = getPrescriptionFilePath(prescription);
    if (filePath && fs.existsSync(filePath)) {
      return res.sendFile(filePath, err => { if (err && !res.headersSent) next(err); });
    }

    if (prescription.fileData) {
      return res.send(prescription.fileData);
    }

    return res.status(404).json({ error: 'Prescription document file not found on server' });
  } catch (err) { next(err); }
};

module.exports = {
  getPrescriptions,
  getPrescription,
  downloadPrescription,
  uploadPrescription,
  deletePrescription,
};

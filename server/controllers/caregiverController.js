const CaregiverRelationship = require('../models/CaregiverRelationship');
const User = require('../models/User');
const Medicine = require('../models/Medicine');
const MedicationLog = require('../models/MedicationLog');
const { calculateCompliance } = require('../services/complianceService');
const { materializeLogsForUserDate, normalizeToMidnight } = require('../services/doseGeneratorService');

const getAssignedPatients = async (req, res, next) => {
  try {
    const relationships = await CaregiverRelationship.find({
      caregiverId: req.user._id,
      status: 'accepted',
    }).populate('patientId', '-password');

    const patientsWithStats = await Promise.all(
      relationships.map(async (rel) => {
        const patient = rel.patientId;
        if (!patient) return null;

        const now = new Date();
        const todayMidnight = normalizeToMidnight(now);
        await materializeLogsForUserDate(patient._id, todayMidnight);

        const logs = await MedicationLog.find({ userId: patient._id });
        const compliance = calculateCompliance(logs);

        const todayLogs = logs.filter(l => new Date(l.scheduledDate).getTime() === todayMidnight.getTime());
        const takenToday = todayLogs.filter(l => l.status === 'taken').length;
        const missedToday = todayLogs.filter(l => l.status === 'missed').length;

        return {
          relationshipId: rel._id,
          patient: {
            _id: patient._id,
            name: patient.name,
            email: patient.email,
            age: patient.age,
            gender: patient.gender,
            phone: patient.phone,
            emergencyContact: patient.emergencyContact,
            profileImage: patient.profileImage,
          },
          stats: {
            compliance,
            totalMedicines: await Medicine.countDocuments({ userId: patient._id, isActive: true }),
            takenToday,
            missedToday,
            totalToday: todayLogs.length,
          },
        };
      })
    );

    res.status(200).json(patientsWithStats.filter(Boolean));
  } catch (err) {
    next(err);
  }
};

const getPatientDetail = async (req, res, next) => {
  try {
    const patientId = req.params.patientId;
    const patient = await User.findById(patientId).select('-password');
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const now = new Date();
    const todayMidnight = normalizeToMidnight(now);
    await materializeLogsForUserDate(patientId, todayMidnight);

    const medicines = await Medicine.find({ userId: patientId });

    // Per-medicine compliance
    const medicinesWithStats = await Promise.all(
      medicines.map(async (med) => {
        const medLogs = await MedicationLog.find({ userId: patientId, medicineId: med._id });
        const compliance = calculateCompliance(medLogs);
        return {
          ...med.toObject(),
          compliance,
        };
      })
    );

    // Logs for past 30 days
    const thirtyDaysAgo = new Date(todayMidnight);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

    const logs = await MedicationLog.find({
      userId: patientId,
      scheduledDate: { $gte: thirtyDaysAgo, $lte: todayMidnight },
    }).populate('medicineId').sort({ scheduledDate: -1, scheduledTime: 1 });

    const overallCompliance = calculateCompliance(logs);

    // Filter missed doses
    const missedDoses = logs.filter(l => l.status === 'missed');

    res.status(200).json({
      patient,
      overallCompliance,
      medicines: medicinesWithStats,
      recentLogs: logs,
      missedDoses,
    });
  } catch (err) {
    next(err);
  }
};

const invitePatient = async (req, res, next) => {
  try {
    const { patientEmail } = req.body;
    if (!patientEmail) {
      return res.status(400).json({ error: 'Patient email is required' });
    }

    const patient = await User.findOne({ email: patientEmail.toLowerCase(), role: 'patient' });
    if (!patient) {
      return res.status(404).json({ error: 'No patient registered with this email address' });
    }

    // Check existing relationship
    const existing = await CaregiverRelationship.findOne({
      caregiverId: req.user._id,
      patientId: patient._id,
    });

    if (existing) {
      return res.status(400).json({ error: `Caregiver invitation already exists with status: ${existing.status}` });
    }

    const relationship = await CaregiverRelationship.create({
      caregiverId: req.user._id,
      patientId: patient._id,
      status: 'pending',
    });

    res.status(201).json({
      message: 'Invitation sent to patient successfully',
      relationship,
    });
  } catch (err) {
    next(err);
  }
};

const updateRelationshipStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'revoked', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const relationship = await CaregiverRelationship.findById(req.params.id);
    if (!relationship) {
      return res.status(404).json({ error: 'Caregiver relationship not found' });
    }

    // Verify caller is either the patient or caregiver involved
    if (
      relationship.patientId.toString() !== req.user._id.toString() &&
      relationship.caregiverId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ error: 'Unauthorized to modify this relationship' });
    }

    relationship.status = status;
    await relationship.save();

    res.status(200).json(relationship);
  } catch (err) {
    next(err);
  }
};

const getPatientRelationships = async (req, res, next) => {
  try {
    // Used by patient to view caregivers who have requested/connected
    const relationships = await CaregiverRelationship.find({
      patientId: req.user._id,
    }).populate('caregiverId', 'name email phone profileImage');

    res.status(200).json(relationships);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAssignedPatients,
  getPatientDetail,
  invitePatient,
  updateRelationshipStatus,
  getPatientRelationships,
};

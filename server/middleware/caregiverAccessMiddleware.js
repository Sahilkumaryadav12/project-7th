const CaregiverRelationship = require('../models/CaregiverRelationship');

const verifyCaregiverAccess = async (req, res, next) => {
  if (req.user.role !== 'caregiver') {
    return res.status(403).json({ error: 'Only caregivers can access caregiver endpoints' });
  }

  const patientId = req.params.patientId || req.query.patientId || req.body.patientId;

  if (!patientId) {
    return res.status(400).json({ error: 'Patient ID is required' });
  }

  try {
    const relationship = await CaregiverRelationship.findOne({
      caregiverId: req.user._id,
      patientId: patientId,
      status: 'accepted',
    });

    if (!relationship) {
      return res.status(403).json({ error: 'Access denied. You do not have an accepted relationship with this patient' });
    }

    req.targetPatientId = patientId;
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Server error verifying caregiver access' });
  }
};

module.exports = { verifyCaregiverAccess };

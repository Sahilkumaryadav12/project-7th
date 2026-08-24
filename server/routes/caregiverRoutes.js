const express = require('express');
const router = express.Router();
const {
  getAssignedPatients,
  getPatientDetail,
  invitePatient,
  updateRelationshipStatus,
  getPatientRelationships,
} = require('../controllers/caregiverController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const { verifyCaregiverAccess } = require('../middleware/caregiverAccessMiddleware');

router.use(protect);

// Routes accessible by Patient to view/manage relationships
router.get('/patient-relationships', getPatientRelationships);
router.put('/relationships/:id', updateRelationshipStatus);

// Routes accessible by Caregiver
router.get('/patients', restrictTo('caregiver'), getAssignedPatients);
router.get('/patients/:patientId', restrictTo('caregiver'), verifyCaregiverAccess, getPatientDetail);
router.post('/invite', restrictTo('caregiver'), invitePatient);

module.exports = router;

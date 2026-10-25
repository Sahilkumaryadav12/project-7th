const express = require('express');
const router = express.Router();
const { getPrescriptions, getPrescription, downloadPrescription, uploadPrescription, deletePrescription } = require('../controllers/prescriptionController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);

router.route('/')
  .get(getPrescriptions)
  .post(upload.single('file'), uploadPrescription);

router.get('/:id/file', downloadPrescription);
router.get('/:id', getPrescription);

router.route('/:id')
  .delete(deletePrescription);

module.exports = router;

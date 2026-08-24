const express = require('express');
const router = express.Router();
const { getPrescriptions, uploadPrescription, deletePrescription } = require('../controllers/prescriptionController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);

router.route('/')
  .get(getPrescriptions)
  .post(upload.single('file'), uploadPrescription);

router.route('/:id')
  .delete(deletePrescription);

module.exports = router;

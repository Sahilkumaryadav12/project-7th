const express = require('express');
const router = express.Router();
const {
  getMedicines,
  createMedicine,
  bulkCreateMedicines,
  getMedicineById,
  updateMedicine,
  deleteMedicine,
} = require('../controllers/medicineController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getMedicines)
  .post(createMedicine);

router.post('/bulk', bulkCreateMedicines);

router.route('/:id')
  .get(getMedicineById)
  .put(updateMedicine)
  .delete(deleteMedicine);

module.exports = router;

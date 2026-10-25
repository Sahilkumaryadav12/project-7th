const express = require('express');
const router = express.Router();
const { getWeeklyReport, getMonthlyReport, getDailyReport, getMedicineReport } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/weekly', getWeeklyReport);
router.get('/monthly', getMonthlyReport);
router.get('/daily', getDailyReport);
router.get('/medicine/:id', getMedicineReport);

module.exports = router;

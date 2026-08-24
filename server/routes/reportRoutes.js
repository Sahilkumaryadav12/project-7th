const express = require('express');
const router = express.Router();
const { getWeeklyReport, getMonthlyReport } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/weekly', getWeeklyReport);
router.get('/monthly', getMonthlyReport);

module.exports = router;

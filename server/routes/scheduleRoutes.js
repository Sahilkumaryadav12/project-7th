const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getTodaySchedule } = require('../controllers/scheduleController');

router.get('/today', protect, getTodaySchedule);
module.exports = router;

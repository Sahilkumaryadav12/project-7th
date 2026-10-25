const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getNotifications, markRead, snoozeReminder } = require('../controllers/notificationController');
router.use(protect);
router.get('/', getNotifications);
router.patch('/:id/read', markRead);
router.post('/:id/snooze', snoozeReminder);
module.exports = router;

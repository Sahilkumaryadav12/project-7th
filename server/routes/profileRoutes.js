const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { getProfile, updateProfile } = require('../controllers/profileController');
router.use(protect);
router.get('/', getProfile);
router.put('/', upload.single('profileImage'), updateProfile);
module.exports = router;

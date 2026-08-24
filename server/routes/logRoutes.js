const express = require('express');
const router = express.Router();
const { getLogs, createOrUpsertLog, updateLogStatus } = require('../controllers/logController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getLogs)
  .post(createOrUpsertLog);

router.route('/:id')
  .put(updateLogStatus);

module.exports = router;

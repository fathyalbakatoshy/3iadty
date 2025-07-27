const express = require('express');
const { asyncHandler } = require('../middlewares/errorHandler');
const { sendSuccess } = require('../utils/response');
const { SUCCESS_MESSAGES } = require('../config/constants');

const router = express.Router();

// Placeholder routes - implement as needed
router.get('/', asyncHandler(async (req, res) => {
  return sendSuccess(res, 'المواعيد - قريباً', []);
}));

module.exports = router; 
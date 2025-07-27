const express = require('express');
const { asyncHandler } = require('../middlewares/errorHandler');
const { 
  validateUserRegistration, 
  validateUserLogin, 
  validateOTP 
} = require('../middlewares/validation');
const { isAuth } = require('../middlewares/auth');
const {
  register,
  login,
  requestVisitorOTP,
  verifyVisitorOTP,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  refreshToken,
  requestPasswordReset,
  resetPassword
} = require('../controllers/authController');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register new patient
 * @access  Public
 */
router.post('/register', validateUserRegistration, asyncHandler(register));

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', validateUserLogin, asyncHandler(login));

/**
 * @route   POST /api/auth/visitor/request-otp
 * @desc    Request OTP for visitor (guest booking)
 * @access  Public
 */
router.post('/visitor/request-otp', validateOTP, asyncHandler(requestVisitorOTP));

/**
 * @route   POST /api/auth/visitor/verify-otp
 * @desc    Verify OTP for visitor
 * @access  Public
 */
router.post('/visitor/verify-otp', validateOTP, asyncHandler(verifyVisitorOTP));

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh-token', asyncHandler(refreshToken));

/**
 * @route   POST /api/auth/request-password-reset
 * @desc    Request password reset OTP
 * @access  Public
 */
router.post('/request-password-reset', asyncHandler(requestPasswordReset));

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with OTP
 * @access  Public
 */
router.post('/reset-password', asyncHandler(resetPassword));

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', isAuth, asyncHandler(getProfile));

/**
 * @route   PUT /api/auth/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/profile', isAuth, asyncHandler(updateProfile));

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password', isAuth, asyncHandler(changePassword));

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', isAuth, asyncHandler(logout));

module.exports = router; 
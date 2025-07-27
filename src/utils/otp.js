const crypto = require('crypto');
const { ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../config/constants');

/**
 * Generate OTP (One Time Password)
 * @param {Number} length - OTP length (default: 6)
 * @returns {String} Generated OTP
 */
const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  
  return otp;
};

/**
 * Generate OTP with expiration time
 * @param {Number} length - OTP length
 * @param {Number} expiresIn - Expiration time in milliseconds
 * @returns {Object} OTP data with code and expiration
 */
const generateOTPWithExpiry = (length = 6, expiresIn = parseInt(process.env.OTP_EXPIRES_IN)) => {
  const code = generateOTP(length);
  const expiresAt = new Date(Date.now() + expiresIn);
  
  return {
    code,
    expiresAt,
    isUsed: false
  };
};

/**
 * Verify OTP code and expiration
 * @param {String} inputOTP - OTP entered by user
 * @param {Object} storedOTP - OTP stored in database
 * @returns {Object} Verification result
 */
const verifyOTP = (inputOTP, storedOTP) => {
  // Check if OTP exists
  if (!storedOTP || !storedOTP.code) {
    return {
      isValid: false,
      message: ERROR_MESSAGES.INVALID_OTP
    };
  }

  // Check if OTP is already used
  if (storedOTP.isUsed) {
    return {
      isValid: false,
      message: ERROR_MESSAGES.INVALID_OTP
    };
  }

  // Check if OTP is expired
  if (new Date() > storedOTP.expiresAt) {
    return {
      isValid: false,
      message: ERROR_MESSAGES.OTP_EXPIRED
    };
  }

  // Check if OTP matches
  if (inputOTP !== storedOTP.code) {
    return {
      isValid: false,
      message: ERROR_MESSAGES.INVALID_OTP
    };
  }

  return {
    isValid: true,
    message: SUCCESS_MESSAGES.OTP_VERIFIED
  };
};

/**
 * Check if OTP is expired
 * @param {Date} expiresAt - OTP expiration date
 * @returns {Boolean} True if expired
 */
const isOTPExpired = (expiresAt) => {
  return new Date() > new Date(expiresAt);
};

/**
 * Generate secure random OTP using crypto
 * @param {Number} length - OTP length
 * @returns {String} Secure OTP
 */
const generateSecureOTP = (length = 6) => {
  const max = Math.pow(10, length);
  const randomNumber = crypto.randomInt(0, max);
  return randomNumber.toString().padStart(length, '0');
};

/**
 * Hash OTP for secure storage (optional - for extra security)
 * @param {String} otp - OTP to hash
 * @returns {String} Hashed OTP
 */
const hashOTP = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

/**
 * Send OTP via SMS (placeholder - integrate with SMS service)
 * @param {String} mobile - Mobile number
 * @param {String} otp - OTP code
 * @returns {Promise} SMS sending result
 */
const sendOTPSMS = async (mobile, otp) => {
  try {
    // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
    console.log(`📱 إرسال رمز التحقق ${otp} إلى ${mobile}`);
    
    // Simulate SMS sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      message: SUCCESS_MESSAGES.OTP_SENT
    };
  } catch (error) {
    console.error('❌ خطأ في إرسال رمز التحقق:', error);
    return {
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR
    };
  }
};

module.exports = {
  generateOTP,
  generateOTPWithExpiry,
  verifyOTP,
  isOTPExpired,
  generateSecureOTP,
  hashOTP,
  sendOTPSMS
}; 
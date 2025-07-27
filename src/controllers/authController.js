const bcrypt = require('bcryptjs');
const { generateTokens, generateToken } = require('../utils/jwt');
const { generateOTPWithExpiry, verifyOTP, sendOTPSMS } = require('../utils/otp');
const { 
  sendSuccess, 
  sendError, 
  sendCreated, 
  sendUnauthorized 
} = require('../utils/response');
const { 
  SUCCESS_MESSAGES, 
  ERROR_MESSAGES, 
  USER_ROLES 
} = require('../config/constants');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Visitor = require('../models/Visitor');
const { logAuthentication } = require('../middlewares/auditLogger');
const { getClientIP } = require('../utils/helpers');

/**
 * Register new user (Patient)
 */
const register = async (req, res) => {
  try {
    const {
      fullName,
      mobile,
      email,
      password,
      gender,
      dateOfBirth,
      address,
      emergencyContact
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findByMobile(mobile);
    if (existingUser) {
      return sendError(res, 'رقم الجوال مسجل مسبقاً', 400);
    }

    // Create user
    const user = new User({
      fullName,
      mobile,
      email,
      password,
      gender,
      dateOfBirth,
      role: USER_ROLES.PATIENT,
      address
    });

    await user.save();

    // Create patient profile
    const patient = new Patient({
      userId: user._id,
      emergencyContact
    });

    await patient.save();

    // Generate tokens
    const tokens = generateTokens(user);

    // Remove sensitive data
    const userResponse = user.toPublicJSON();

    return sendCreated(res, SUCCESS_MESSAGES.REGISTRATION_SUCCESS, {
      user: userResponse,
      patient,
      ...tokens
    });

  } catch (error) {
    console.error('خطأ في التسجيل:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Login user
 */
const login = async (req, res) => {
  try {
    const { mobile, password } = req.body;

    // Find user by mobile
    const user = await User.findByMobile(mobile);
    if (!user) {
      return sendUnauthorized(res, ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Check if account is locked
    if (user.isLocked) {
      return sendUnauthorized(res, 'الحساب محظور مؤقتاً. حاول مرة أخرى لاحقاً');
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      // Increment login attempts
      await user.incLoginAttempts();
      
      // Log failed authentication
      await logAuthentication(user._id, 'LOGIN', {
        ipAddress: getClientIP(req),
        userAgent: req.get('User-Agent'),
        method: req.method,
        endpoint: req.originalUrl,
        mobile: mobile,
        success: false,
        errorMessage: 'كلمة المرور غير صحيحة'
      });
      
      return sendUnauthorized(res, ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Check if user is active
    if (!user.isActive) {
      return sendUnauthorized(res, 'الحساب غير مفعل');
    }

    // Reset login attempts and update last login
    await user.resetLoginAttempts();
    await user.updateLastLogin();

    // Generate tokens
    const tokens = generateTokens(user);

    // Get user profile based on role
    let profile = null;
    if (user.role === USER_ROLES.PATIENT) {
      profile = await Patient.findOne({ userId: user._id });
    } else if (user.role === USER_ROLES.DOCTOR) {
      profile = await Doctor.findOne({ userId: user._id });
    }

    // Log successful authentication
    await logAuthentication(user._id, 'LOGIN', {
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent'),
      method: req.method,
      endpoint: req.originalUrl,
      mobile: mobile
    });

    // Remove sensitive data
    const userResponse = user.toPublicJSON();

    return sendSuccess(res, SUCCESS_MESSAGES.LOGIN_SUCCESS, {
      user: userResponse,
      profile,
      ...tokens
    });

  } catch (error) {
    console.error('خطأ في تسجيل الدخول:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Request OTP for visitor
 */
const requestVisitorOTP = async (req, res) => {
  try {
    const { mobile } = req.body;

    // Find or create visitor
    let visitor = await Visitor.findByMobile(mobile);
    
    if (!visitor) {
      visitor = new Visitor({ mobile });
    }

    // Generate and send OTP
    await visitor.generateOTP();
    
    // Send OTP via SMS (placeholder)
    const otpResult = await sendOTPSMS(mobile, visitor.otp.code);
    
    if (!otpResult.success) {
      return sendError(res, 'خطأ في إرسال رمز التحقق', 500);
    }

    return sendSuccess(res, SUCCESS_MESSAGES.OTP_SENT, {
      visitorId: visitor._id,
      expiresAt: visitor.otp.expiresAt
    });

  } catch (error) {
    console.error('خطأ في طلب رمز التحقق:', error);
    
    if (error.message.includes('تم تجاوز الحد الأقصى')) {
      return sendError(res, error.message, 429);
    }
    
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Verify OTP for visitor
 */
const verifyVisitorOTP = async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    // Find visitor
    const visitor = await Visitor.findByMobile(mobile);
    
    if (!visitor) {
      return sendError(res, 'رقم الجوال غير مسجل', 400);
    }

    // Verify OTP
    const verificationResult = visitor.verifyOTP(otp);
    
    if (!verificationResult.isValid) {
      return sendError(res, verificationResult.message, 400);
    }

    return sendSuccess(res, SUCCESS_MESSAGES.OTP_VERIFIED, {
      visitorId: visitor._id,
      sessionExpiry: visitor.sessionExpiry
    });

  } catch (error) {
    console.error('خطأ في التحقق من رمز OTP:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Get current user profile
 */
const getProfile = async (req, res) => {
  try {
    const user = req.user;
    let profile = null;

    // Get specific profile based on role
    if (user.role === USER_ROLES.PATIENT) {
      profile = await Patient.findOne({ userId: user._id })
        .populate('userId', '-password -otp');
    } else if (user.role === USER_ROLES.DOCTOR) {
      profile = await Doctor.findOne({ userId: user._id })
        .populate('userId', '-password -otp')
        .populate('clinics.clinicId', 'name location');
    }

    return sendSuccess(res, SUCCESS_MESSAGES.RETRIEVED_SUCCESSFULLY, {
      user: user.toPublicJSON(),
      profile
    });

  } catch (error) {
    console.error('خطأ في جلب الملف الشخصي:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const updates = req.body;

    // Remove sensitive fields that shouldn't be updated here
    delete updates.password;
    delete updates.role;
    delete updates.mobile;
    delete updates.otp;

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -otp');

    if (!user) {
      return sendError(res, ERROR_MESSAGES.NOT_FOUND, 404);
    }

    return sendSuccess(res, SUCCESS_MESSAGES.UPDATED_SUCCESSFULLY, {
      user: user.toPublicJSON()
    });

  } catch (error) {
    console.error('خطأ في تحديث الملف الشخصي:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Change password
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, ERROR_MESSAGES.NOT_FOUND, 404);
    }

    // Verify current password
    const isPasswordMatch = await user.comparePassword(currentPassword);
    if (!isPasswordMatch) {
      return sendError(res, 'كلمة المرور الحالية غير صحيحة', 400);
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return sendSuccess(res, 'تم تغيير كلمة المرور بنجاح');

  } catch (error) {
    console.error('خطأ في تغيير كلمة المرور:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Logout user (invalidate token - client-side mostly)
 */
const logout = async (req, res) => {
  try {
    // In a real app, you might want to maintain a blacklist of tokens
    // For now, we'll just send a success response
    return sendSuccess(res, SUCCESS_MESSAGES.LOGOUT_SUCCESS);
  } catch (error) {
    console.error('خطأ في تسجيل الخروج:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Refresh access token
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return sendError(res, 'رمز التجديد مطلوب', 400);
    }

    // Verify refresh token
    const decoded = require('../utils/jwt').verifyToken(refreshToken);
    
    // Find user
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      return sendUnauthorized(res, ERROR_MESSAGES.TOKEN_INVALID);
    }

    // Generate new tokens
    const tokens = generateTokens(user);

    return sendSuccess(res, 'تم تجديد الرمز بنجاح', tokens);

  } catch (error) {
    console.error('خطأ في تجديد الرمز:', error);
    return sendUnauthorized(res, ERROR_MESSAGES.TOKEN_INVALID);
  }
};

/**
 * Request password reset OTP
 */
const requestPasswordReset = async (req, res) => {
  try {
    const { mobile } = req.body;

    // Find user
    const user = await User.findByMobile(mobile);
    if (!user) {
      return sendError(res, 'رقم الجوال غير مسجل', 400);
    }

    // Generate OTP
    const otpData = generateOTPWithExpiry();
    user.otp = otpData;
    await user.save();

    // Send OTP
    const otpResult = await sendOTPSMS(mobile, otpData.code);
    
    if (!otpResult.success) {
      return sendError(res, 'خطأ في إرسال رمز التحقق', 500);
    }

    return sendSuccess(res, SUCCESS_MESSAGES.OTP_SENT, {
      userId: user._id,
      expiresAt: otpData.expiresAt
    });

  } catch (error) {
    console.error('خطأ في طلب إعادة تعيين كلمة المرور:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Reset password with OTP
 */
const resetPassword = async (req, res) => {
  try {
    const { mobile, otp, newPassword } = req.body;

    // Find user
    const user = await User.findByMobile(mobile);
    if (!user) {
      return sendError(res, 'رقم الجوال غير مسجل', 400);
    }

    // Verify OTP
    const verificationResult = verifyOTP(otp, user.otp);
    
    if (!verificationResult.isValid) {
      return sendError(res, verificationResult.message, 400);
    }

    // Update password
    user.password = newPassword;
    user.otp = undefined; // Clear OTP
    await user.save();

    return sendSuccess(res, 'تم إعادة تعيين كلمة المرور بنجاح');

  } catch (error) {
    console.error('خطأ في إعادة تعيين كلمة المرور:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

module.exports = {
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
}; 
const { verifyToken, extractToken } = require('../utils/jwt');
const { sendUnauthorized, sendForbidden } = require('../utils/response');
const { ERROR_MESSAGES } = require('../config/constants');
const User = require('../models/User');

/**
 * Middleware to verify JWT token and authenticate user
 */
const isAuth = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.header('Authorization');
    const token = extractToken(authHeader);
    
    if (!token) {
      return sendUnauthorized(res, ERROR_MESSAGES.TOKEN_REQUIRED);
    }
    
    // Verify token
    const decoded = verifyToken(token);
    
    // Find user by ID
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return sendUnauthorized(res, ERROR_MESSAGES.TOKEN_INVALID);
    }
    
    // Check if user is active
    if (!user.isActive) {
      return sendUnauthorized(res, 'الحساب غير مفعل');
    }
    
    // Check if account is locked
    if (user.isLocked) {
      return sendUnauthorized(res, 'الحساب محظور مؤقتاً');
    }
    
    // Add user to request object
    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;
    
    next();
  } catch (error) {
    console.error('خطأ في التحقق من الهوية:', error.message);
    
    if (error.message === ERROR_MESSAGES.TOKEN_EXPIRED) {
      return sendUnauthorized(res, ERROR_MESSAGES.TOKEN_EXPIRED);
    }
    
    if (error.message === ERROR_MESSAGES.TOKEN_INVALID) {
      return sendUnauthorized(res, ERROR_MESSAGES.TOKEN_INVALID);
    }
    
    return sendUnauthorized(res, ERROR_MESSAGES.UNAUTHORIZED);
  }
};

/**
 * Middleware to make authentication optional
 * User will be added to req if token is valid, but route continues even if not
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = extractToken(authHeader);
    
    if (!token) {
      return next();
    }
    
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select('-password');
    
    if (user && user.isActive && !user.isLocked) {
      req.user = user;
      req.userId = user._id;
      req.userRole = user.role;
    }
    
    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

/**
 * Middleware to check if user has specific role
 * @param {string|Array} roles - Required role(s)
 */
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendUnauthorized(res, ERROR_MESSAGES.TOKEN_REQUIRED);
    }
    
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.user.role)) {
      return sendForbidden(res, 'ليس لديك صلاحية للوصول لهذا المحتوى');
    }
    
    next();
  };
};

/**
 * Middleware to check if user is admin
 */
const isAdmin = checkRole('admin');

/**
 * Middleware to check if user is doctor
 */
const isDoctor = checkRole('doctor');

/**
 * Middleware to check if user is patient
 */
const isPatient = checkRole('patient');

/**
 * Middleware to check if user is reception
 */
const isReception = checkRole('reception');

/**
 * Middleware to check if user is doctor or admin
 */
const isDoctorOrAdmin = checkRole(['doctor', 'admin']);

/**
 * Middleware to check if user is patient or doctor
 */
const isPatientOrDoctor = checkRole(['patient', 'doctor']);

/**
 * Middleware to check if user is admin or reception
 */
const isAdminOrReception = checkRole(['admin', 'reception']);

/**
 * Middleware to verify visitor OTP session
 */
const verifyVisitorSession = async (req, res, next) => {
  try {
    const { visitorId } = req.body;
    
    if (!visitorId) {
      return sendUnauthorized(res, 'معرف الزائر مطلوب');
    }
    
    const Visitor = require('../models/Visitor');
    const visitor = await Visitor.findById(visitorId);
    
    if (!visitor) {
      return sendUnauthorized(res, 'الزائر غير موجود');
    }
    
    if (!visitor.canBook()) {
      return sendUnauthorized(res, 'انتهت صلاحية الجلسة. يرجى طلب رمز تحقق جديد');
    }
    
    req.visitor = visitor;
    next();
  } catch (error) {
    console.error('خطأ في التحقق من جلسة الزائر:', error.message);
    return sendUnauthorized(res, ERROR_MESSAGES.UNAUTHORIZED);
  }
};

/**
 * Middleware to check if user owns the resource or is admin
 * @param {string} resourceUserIdField - Field name that contains user ID in the resource
 */
const isOwnerOrAdmin = (resourceUserIdField = 'userId') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return sendUnauthorized(res, ERROR_MESSAGES.TOKEN_REQUIRED);
      }
      
      // Admin can access everything
      if (req.user.role === 'admin') {
        return next();
      }
      
      // Get resource ID from params
      const resourceId = req.params.id;
      
      if (!resourceId) {
        return sendForbidden(res, 'معرف المورد غير موجود');
      }
      
      // This middleware expects the resource to be loaded in a previous middleware
      // or the route should implement the ownership check
      req.checkOwnership = {
        resourceUserIdField,
        userId: req.user._id
      };
      
      next();
    } catch (error) {
      console.error('خطأ في التحقق من الملكية:', error.message);
      return sendForbidden(res, ERROR_MESSAGES.FORBIDDEN);
    }
  };
};

/**
 * Middleware to rate limit requests per user
 * @param {number} maxRequests - Maximum requests per window
 * @param {number} windowMs - Window time in milliseconds
 */
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const userRequests = new Map();
  
  return (req, res, next) => {
    const userId = req.user?._id?.toString() || req.ip;
    const now = Date.now();
    const userKey = `${userId}`;
    
    // Clean up old entries
    if (Math.random() < 0.1) { // 10% chance to cleanup
      for (const [key, data] of userRequests.entries()) {
        if (now - data.resetTime > windowMs) {
          userRequests.delete(key);
        }
      }
    }
    
    let userData = userRequests.get(userKey);
    
    if (!userData || now - userData.resetTime > windowMs) {
      userData = {
        count: 1,
        resetTime: now
      };
    } else {
      userData.count++;
    }
    
    userRequests.set(userKey, userData);
    
    if (userData.count > maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'تم تجاوز الحد الأقصى للطلبات. حاول مرة أخرى لاحقاً',
        retryAfter: Math.ceil((windowMs - (now - userData.resetTime)) / 1000)
      });
    }
    
    next();
  };
};

module.exports = {
  isAuth,
  optionalAuth,
  checkRole,
  isAdmin,
  isDoctor,
  isPatient,
  isReception,
  isDoctorOrAdmin,
  isPatientOrDoctor,
  isAdminOrReception,
  verifyVisitorSession,
  isOwnerOrAdmin,
  userRateLimit
}; 
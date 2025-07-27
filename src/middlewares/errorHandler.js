const { sendError, sendServerError } = require('../utils/response');
const { ERROR_MESSAGES } = require('../config/constants');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('🔴 خطأ في التطبيق:', err);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(error => ({
      field: error.path,
      message: error.message,
      value: error.value
    }));
    
    return res.status(400).json({
      success: false,
      message: 'بيانات غير صحيحة',
      errors,
      timestamp: new Date().toISOString()
    });
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    
    let message = 'البيانات موجودة مسبقاً';
    
    // Customize message based on field
    if (field === 'mobile') {
      message = 'رقم الجوال مسجل مسبقاً';
    } else if (field === 'email') {
      message = 'البريد الإلكتروني مسجل مسبقاً';
    } else if (field === 'slug') {
      message = 'هذا العنوان موجود مسبقاً';
    }
    
    return sendError(res, message, 400, [{
      field,
      message,
      value
    }]);
  }
  
  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return sendError(res, 'معرف غير صحيح', 400);
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, ERROR_MESSAGES.TOKEN_INVALID, 401);
  }
  
  if (err.name === 'TokenExpiredError') {
    return sendError(res, ERROR_MESSAGES.TOKEN_EXPIRED, 401);
  }
  
  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return sendError(res, ERROR_MESSAGES.FILE_TOO_LARGE, 400);
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return sendError(res, 'نوع الملف غير مدعوم', 400);
  }
  
  // Custom application errors
  if (err.isOperational) {
    return sendError(res, err.message, err.statusCode || 400);
  }
  
  // MongoDB connection errors
  if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
    console.error('❌ خطأ في الاتصال مع قاعدة البيانات:', err);
    return sendServerError(res, 'خطأ في الاتصال مع قاعدة البيانات');
  }
  
  // Rate limiting errors
  if (err.status === 429) {
    return res.status(429).json({
      success: false,
      message: 'تم تجاوز الحد الأقصى للطلبات. حاول مرة أخرى لاحقاً',
      retryAfter: err.retryAfter,
      timestamp: new Date().toISOString()
    });
  }
  
  // Default server error
  return sendServerError(res, ERROR_MESSAGES.SERVER_ERROR);
};

/**
 * Handle 404 routes
 */
const notFound = (req, res, next) => {
  const error = new Error(`المسار ${req.originalUrl} غير موجود`);
  error.statusCode = 404;
  error.isOperational = true;
  next(error);
};

/**
 * Async error wrapper
 * Wraps async functions to catch errors and pass them to error handler
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Custom error class for operational errors
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Unhandled promise rejection handler
 */
const handleUnhandledRejection = () => {
  process.on('unhandledRejection', (err, promise) => {
    console.error('❌ خطأ غير معالج (Unhandled Promise Rejection):', err);
    console.error('Promise:', promise);
    
    // Close server gracefully
    process.exit(1);
  });
};

/**
 * Uncaught exception handler
 */
const handleUncaughtException = () => {
  process.on('uncaughtException', (err) => {
    console.error('❌ خطأ غير معالج (Uncaught Exception):', err);
    console.error('Stack:', err.stack);
    
    // Close server gracefully
    process.exit(1);
  });
};

/**
 * SIGTERM handler for graceful shutdown
 */
const handleSIGTERM = (server) => {
  process.on('SIGTERM', () => {
    console.log('📡 تم استلام إشارة SIGTERM. إغلاق الخادم بشكل صحيح...');
    
    server.close(() => {
      console.log('✅ تم إغلاق الخادم');
      process.exit(0);
    });
  });
};

/**
 * SIGINT handler for graceful shutdown (Ctrl+C)
 */
const handleSIGINT = (server) => {
  process.on('SIGINT', () => {
    console.log('\n📡 تم استلام إشارة SIGINT. إغلاق الخادم...');
    
    server.close(() => {
      console.log('✅ تم إغلاق الخادم');
      process.exit(0);
    });
  });
};

/**
 * Setup all error handlers
 */
const setupErrorHandlers = (server) => {
  handleUnhandledRejection();
  handleUncaughtException();
  
  if (server) {
    handleSIGTERM(server);
    handleSIGINT(server);
  }
};

module.exports = {
  errorHandler,
  notFound,
  asyncHandler,
  AppError,
  setupErrorHandlers
}; 
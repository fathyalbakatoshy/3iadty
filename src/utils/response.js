/**
 * Send success response with Arabic message
 * @param {Object} res - Express response object
 * @param {String} message - Success message in Arabic
 * @param {Object} data - Response data
 * @param {Number} statusCode - HTTP status code
 */
const sendSuccess = (res, message, data = null, statusCode = 200) => {
  const response = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };

  return res.status(statusCode).json(response);
};

/**
 * Send error response with Arabic message
 * @param {Object} res - Express response object
 * @param {String} message - Error message in Arabic
 * @param {Number} statusCode - HTTP status code
 * @param {Object} errors - Validation errors (optional)
 */
const sendError = (res, message, statusCode = 400, errors = null) => {
  const response = {
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString()
  };

  return res.status(statusCode).json(response);
};

/**
 * Send paginated response
 * @param {Object} res - Express response object
 * @param {String} message - Success message
 * @param {Array} data - Array of data
 * @param {Object} pagination - Pagination info
 */
const sendPaginatedResponse = (res, message, data, pagination) => {
  const response = {
    success: true,
    message,
    data,
    pagination: {
      currentPage: pagination.page,
      totalPages: pagination.totalPages,
      totalItems: pagination.totalItems,
      itemsPerPage: pagination.limit,
      hasNextPage: pagination.page < pagination.totalPages,
      hasPrevPage: pagination.page > 1
    },
    timestamp: new Date().toISOString()
  };

  return res.status(200).json(response);
};

/**
 * Send validation error response
 * @param {Object} res - Express response object
 * @param {Array} errors - Validation errors from express-validator
 */
const sendValidationError = (res, errors) => {
  const formattedErrors = errors.map(error => ({
    field: error.path,
    message: error.msg,
    value: error.value
  }));

  return sendError(res, 'بيانات غير صحيحة', 422, formattedErrors);
};

/**
 * Send unauthorized response
 * @param {Object} res - Express response object
 * @param {String} message - Custom message (optional)
 */
const sendUnauthorized = (res, message = 'غير مخول بالوصول') => {
  return sendError(res, message, 401);
};

/**
 * Send forbidden response
 * @param {Object} res - Express response object
 * @param {String} message - Custom message (optional)
 */
const sendForbidden = (res, message = 'ممنوع الوصول') => {
  return sendError(res, message, 403);
};

/**
 * Send not found response
 * @param {Object} res - Express response object
 * @param {String} message - Custom message (optional)
 */
const sendNotFound = (res, message = 'لم يتم العثور على البيانات المطلوبة') => {
  return sendError(res, message, 404);
};

/**
 * Send server error response
 * @param {Object} res - Express response object
 * @param {String} message - Custom message (optional)
 */
const sendServerError = (res, message = 'خطأ في الخادم') => {
  return sendError(res, message, 500);
};

/**
 * Send created response
 * @param {Object} res - Express response object
 * @param {String} message - Success message
 * @param {Object} data - Created data
 */
const sendCreated = (res, message, data) => {
  return sendSuccess(res, message, data, 201);
};

/**
 * Send updated response
 * @param {Object} res - Express response object
 * @param {String} message - Success message
 * @param {Object} data - Updated data
 */
const sendUpdated = (res, message, data) => {
  return sendSuccess(res, message, data, 200);
};

/**
 * Send deleted response
 * @param {Object} res - Express response object
 * @param {String} message - Success message
 */
const sendDeleted = (res, message) => {
  return sendSuccess(res, message, null, 200);
};

module.exports = {
  sendSuccess,
  sendError,
  sendPaginatedResponse,
  sendValidationError,
  sendUnauthorized,
  sendForbidden,
  sendNotFound,
  sendServerError,
  sendCreated,
  sendUpdated,
  sendDeleted
}; 
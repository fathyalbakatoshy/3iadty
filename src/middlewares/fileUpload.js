const { 
  upload, 
  uploadProfilePicture, 
  uploadMedicalFiles,
  processUploadedFiles,
  getFileUrl
} = require('../utils/upload');
const { sendError } = require('../utils/response');
const { ERROR_MESSAGES } = require('../config/constants');

/**
 * Middleware for single profile picture upload
 */
const uploadSingleProfilePicture = (fieldName = 'profilePicture') => {
  return (req, res, next) => {
    const uploadMiddleware = uploadProfilePicture.single(fieldName);
    
    uploadMiddleware(req, res, (err) => {
      if (err) {
        console.error('خطأ في رفع الصورة الشخصية:', err.message);
        
        if (err.code === 'LIMIT_FILE_SIZE') {
          return sendError(res, 'حجم الصورة كبير جداً. الحد الأقصى 2 ميجابايت', 400);
        }
        
        if (err.message === ERROR_MESSAGES.INVALID_FILE_TYPE) {
          return sendError(res, 'نوع الملف غير مدعوم. يرجى رفع صورة فقط', 400);
        }
        
        return sendError(res, 'خطأ في رفع الصورة', 400);
      }
      
      // Process uploaded file
      if (req.file) {
        req.uploadedFile = {
          filename: req.file.filename,
          originalName: req.file.originalname,
          url: getFileUrl(req.file.filename, 'profiles'),
          size: req.file.size,
          mimetype: req.file.mimetype
        };
      }
      
      next();
    });
  };
};

/**
 * Middleware for multiple medical files upload
 */
const uploadMultipleMedicalFiles = (fieldName = 'medicalFiles', maxCount = 10) => {
  return (req, res, next) => {
    const uploadMiddleware = uploadMedicalFiles.array(fieldName, maxCount);
    
    uploadMiddleware(req, res, (err) => {
      if (err) {
        console.error('خطأ في رفع الملفات الطبية:', err.message);
        
        if (err.code === 'LIMIT_FILE_SIZE') {
          return sendError(res, 'حجم أحد الملفات كبير جداً. الحد الأقصى 5 ميجابايت لكل ملف', 400);
        }
        
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return sendError(res, `يمكن رفع ${maxCount} ملفات كحد أقصى`, 400);
        }
        
        if (err.message === ERROR_MESSAGES.INVALID_FILE_TYPE) {
          return sendError(res, 'نوع أحد الملفات غير مدعوم', 400);
        }
        
        return sendError(res, 'خطأ في رفع الملفات', 400);
      }
      
      // Process uploaded files
      if (req.files && req.files.length > 0) {
        req.uploadedFiles = processUploadedFiles(req.files, 'medical-records');
      }
      
      next();
    });
  };
};

/**
 * Middleware for clinic logo upload
 */
const uploadClinicLogo = (fieldName = 'logo') => {
  return (req, res, next) => {
    const uploadMiddleware = uploadProfilePicture.single(fieldName);
    
    uploadMiddleware(req, res, (err) => {
      if (err) {
        console.error('خطأ في رفع شعار العيادة:', err.message);
        
        if (err.code === 'LIMIT_FILE_SIZE') {
          return sendError(res, 'حجم الشعار كبير جداً. الحد الأقصى 2 ميجابايت', 400);
        }
        
        if (err.message === ERROR_MESSAGES.INVALID_FILE_TYPE) {
          return sendError(res, 'نوع الملف غير مدعوم. يرجى رفع صورة فقط', 400);
        }
        
        return sendError(res, 'خطأ في رفع الشعار', 400);
      }
      
      // Process uploaded file
      if (req.file) {
        req.uploadedFile = {
          filename: req.file.filename,
          originalName: req.file.originalname,
          url: getFileUrl(req.file.filename, 'clinics'),
          size: req.file.size,
          mimetype: req.file.mimetype
        };
      }
      
      next();
    });
  };
};

/**
 * Middleware for multiple clinic images upload
 */
const uploadClinicImages = (fieldName = 'images', maxCount = 5) => {
  return (req, res, next) => {
    const uploadMiddleware = uploadProfilePicture.array(fieldName, maxCount);
    
    uploadMiddleware(req, res, (err) => {
      if (err) {
        console.error('خطأ في رفع صور العيادة:', err.message);
        
        if (err.code === 'LIMIT_FILE_SIZE') {
          return sendError(res, 'حجم إحدى الصور كبير جداً. الحد الأقصى 2 ميجابايت لكل صورة', 400);
        }
        
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return sendError(res, `يمكن رفع ${maxCount} صور كحد أقصى`, 400);
        }
        
        if (err.message === ERROR_MESSAGES.INVALID_FILE_TYPE) {
          return sendError(res, 'نوع إحدى الصور غير مدعوم', 400);
        }
        
        return sendError(res, 'خطأ في رفع الصور', 400);
      }
      
      // Process uploaded files
      if (req.files && req.files.length > 0) {
        req.uploadedFiles = processUploadedFiles(req.files, 'clinics');
      }
      
      next();
    });
  };
};

/**
 * Middleware for general file upload with custom configuration
 */
const uploadFiles = (config = {}) => {
  const {
    fieldName = 'files',
    maxCount = 5,
    maxSize = 5 * 1024 * 1024, // 5MB
    allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
  } = config;
  
  return (req, res, next) => {
    const uploadMiddleware = upload.array(fieldName, maxCount);
    
    uploadMiddleware(req, res, (err) => {
      if (err) {
        console.error('خطأ في رفع الملفات:', err.message);
        
        if (err.code === 'LIMIT_FILE_SIZE') {
          return sendError(res, `حجم أحد الملفات كبير جداً. الحد الأقصى ${Math.round(maxSize / (1024 * 1024))} ميجابايت`, 400);
        }
        
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return sendError(res, `يمكن رفع ${maxCount} ملفات كحد أقصى`, 400);
        }
        
        if (err.message === ERROR_MESSAGES.INVALID_FILE_TYPE) {
          return sendError(res, 'نوع أحد الملفات غير مدعوم', 400);
        }
        
        return sendError(res, 'خطأ في رفع الملفات', 400);
      }
      
      // Validate file types if specified
      if (req.files && allowedTypes.length > 0) {
        const invalidFiles = req.files.filter(file => 
          !allowedTypes.includes(file.mimetype)
        );
        
        if (invalidFiles.length > 0) {
          return sendError(res, 'نوع أحد الملفات غير مدعوم', 400);
        }
      }
      
      // Process uploaded files
      if (req.files && req.files.length > 0) {
        req.uploadedFiles = processUploadedFiles(req.files);
      }
      
      next();
    });
  };
};

/**
 * Middleware to validate file requirements
 */
const validateFileRequirements = (requirements = {}) => {
  const {
    required = false,
    minFiles = 0,
    maxFiles = 10,
    allowedExtensions = []
  } = requirements;
  
  return (req, res, next) => {
    const files = req.files || [];
    const fileCount = files.length;
    
    // Check if files are required
    if (required && fileCount === 0) {
      return sendError(res, 'يجب رفع ملف واحد على الأقل', 400);
    }
    
    // Check minimum files
    if (fileCount < minFiles) {
      return sendError(res, `يجب رفع ${minFiles} ملف على الأقل`, 400);
    }
    
    // Check maximum files
    if (fileCount > maxFiles) {
      return sendError(res, `لا يمكن رفع أكثر من ${maxFiles} ملف`, 400);
    }
    
    // Check file extensions
    if (allowedExtensions.length > 0) {
      const invalidFiles = files.filter(file => {
        const extension = file.originalname.split('.').pop().toLowerCase();
        return !allowedExtensions.includes(extension);
      });
      
      if (invalidFiles.length > 0) {
        return sendError(res, `امتدادات الملفات المسموحة: ${allowedExtensions.join(', ')}`, 400);
      }
    }
    
    next();
  };
};

/**
 * Middleware to clean up uploaded files on error
 */
const cleanupOnError = () => {
  return (err, req, res, next) => {
    // Clean up uploaded files if there's an error
    if (req.file || req.files) {
      const { deleteFile } = require('../utils/upload');
      
      if (req.file) {
        deleteFile(req.file.path).catch(console.error);
      }
      
      if (req.files) {
        req.files.forEach(file => {
          deleteFile(file.path).catch(console.error);
        });
      }
    }
    
    next(err);
  };
};

module.exports = {
  uploadSingleProfilePicture,
  uploadMultipleMedicalFiles,
  uploadClinicLogo,
  uploadClinicImages,
  uploadFiles,
  validateFileRequirements,
  cleanupOnError
}; 
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { ALLOWED_FILE_TYPES, ERROR_MESSAGES } = require('../config/constants');

// Create uploads directory if it doesn't exist
const uploadDir = process.env.UPLOAD_PATH || 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Create subdirectories
const createSubDirs = () => {
  const subdirs = ['profiles', 'medical-records', 'clinics', 'documents'];
  subdirs.forEach(dir => {
    const dirPath = path.join(uploadDir, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
};

createSubDirs();

/**
 * Configure multer storage
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subDir = 'documents'; // default
    
    // Determine subdirectory based on fieldname or request path
    if (file.fieldname === 'profilePicture' || file.fieldname === 'logo') {
      subDir = 'profiles';
    } else if (file.fieldname === 'clinicLogo') {
      subDir = 'clinics';
    } else if (file.fieldname === 'medicalFile' || file.fieldname === 'attachments') {
      subDir = 'medical-records';
    }
    
    const destPath = path.join(uploadDir, subDir);
    cb(null, destPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const filename = `${file.fieldname}-${uniqueSuffix}${extension}`;
    cb(null, filename);
  }
});

/**
 * File filter function
 */
const fileFilter = (req, file, cb) => {
  // Check file type based on fieldname
  let allowedTypes = ALLOWED_FILE_TYPES.ALL;
  
  if (file.fieldname === 'profilePicture' || file.fieldname === 'logo') {
    allowedTypes = ALLOWED_FILE_TYPES.IMAGES;
  }
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(ERROR_MESSAGES.INVALID_FILE_TYPE), false);
  }
};

/**
 * Basic multer configuration
 */
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
    files: 5 // Maximum 5 files
  },
  fileFilter: fileFilter
});

/**
 * Upload profile picture configuration
 */
const uploadProfilePicture = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB for profile pictures
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_FILE_TYPES.IMAGES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(ERROR_MESSAGES.INVALID_FILE_TYPE), false);
    }
  }
});

/**
 * Upload medical files configuration
 */
const uploadMedicalFiles = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024,
    files: 10 // Allow up to 10 medical files
  },
  fileFilter: fileFilter
});

/**
 * Delete file from storage
 * @param {String} filePath - Path to file
 * @returns {Promise} Deletion result
 */
const deleteFile = async (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return { success: true, message: 'تم حذف الملف بنجاح' };
    }
    return { success: false, message: 'الملف غير موجود' };
  } catch (error) {
    console.error('خطأ في حذف الملف:', error);
    return { success: false, message: 'خطأ في حذف الملف' };
  }
};

/**
 * Get file URL
 * @param {String} filename - Filename
 * @param {String} subdir - Subdirectory
 * @returns {String} File URL
 */
const getFileUrl = (filename, subdir = 'documents') => {
  if (!filename) return null;
  return `${process.env.API_BASE_URL}/uploads/${subdir}/${filename}`;
};

/**
 * Process uploaded files
 * @param {Array} files - Uploaded files
 * @param {String} subdir - Subdirectory
 * @returns {Array} Processed file info
 */
const processUploadedFiles = (files, subdir = 'documents') => {
  if (!files || files.length === 0) return [];
  
  return files.map(file => ({
    filename: file.filename,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    url: getFileUrl(file.filename, subdir),
    uploadedAt: new Date()
  }));
};

/**
 * Validate file size
 * @param {Number} size - File size in bytes
 * @param {Number} maxSize - Maximum allowed size
 * @returns {Boolean} Is valid
 */
const isValidFileSize = (size, maxSize = parseInt(process.env.MAX_FILE_SIZE)) => {
  return size <= maxSize;
};

/**
 * Get file extension
 * @param {String} filename - Filename
 * @returns {String} File extension
 */
const getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase();
};

/**
 * Generate safe filename
 * @param {String} originalName - Original filename
 * @returns {String} Safe filename
 */
const generateSafeFilename = (originalName) => {
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  const extension = path.extname(originalName);
  return `file-${timestamp}-${random}${extension}`;
};

module.exports = {
  upload,
  uploadProfilePicture,
  uploadMedicalFiles,
  deleteFile,
  getFileUrl,
  processUploadedFiles,
  isValidFileSize,
  getFileExtension,
  generateSafeFilename
}; 
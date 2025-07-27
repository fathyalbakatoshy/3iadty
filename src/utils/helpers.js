/**
 * استخراج عنوان IP الحقيقي للعميل
 */
const getClientIP = (req) => {
  return req.headers['x-forwarded-for'] ||
         req.headers['x-real-ip'] ||
         req.headers['x-client-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.connection?.socket?.remoteAddress ||
         req.ip ||
         'غير معروف';
};

/**
 * تنظيف البيانات الحساسة من الكائن
 */
const sanitizeData = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveFields = ['password', 'token', 'secret', 'otp', 'pin'];
  const sanitized = { ...data };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '***';
    }
  }
  
  return sanitized;
};

/**
 * تحويل البايتات إلى حجم قابل للقراءة
 */
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * توليد معرف جلسة فريد
 */
const generateSessionId = () => {
  return require('crypto').randomBytes(32).toString('hex');
};

/**
 * التحقق من صحة ObjectId
 */
const isValidObjectId = (id) => {
  return require('mongoose').Types.ObjectId.isValid(id);
};

/**
 * تنسيق التاريخ بالعربية
 */
const formatArabicDate = (date) => {
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Riyadh'
  };
  
  return new Intl.DateTimeFormat('ar-SA', options).format(new Date(date));
};

/**
 * حساب الفرق الزمني بين تاريخين
 */
const getTimeDifference = (startDate, endDate = new Date()) => {
  const diff = new Date(endDate) - new Date(startDate);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} يوم`;
  if (hours > 0) return `${hours} ساعة`;
  if (minutes > 0) return `${minutes} دقيقة`;
  return `${seconds} ثانية`;
};

/**
 * تشفير البيانات الحساسة
 */
const encryptSensitiveData = (data) => {
  const crypto = require('crypto');
  const algorithm = 'aes-256-cbc';
  const secretKey = process.env.ENCRYPTION_KEY || 'default-key-32-chars-long!!!!!';
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipher(algorithm, secretKey);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return {
    encrypted,
    iv: iv.toString('hex')
  };
};

/**
 * فك تشفير البيانات
 */
const decryptSensitiveData = (encryptedData, ivHex) => {
  const crypto = require('crypto');
  const algorithm = 'aes-256-cbc';
  const secretKey = process.env.ENCRYPTION_KEY || 'default-key-32-chars-long!!!!!';
  
  const decipher = crypto.createDecipher(algorithm, secretKey);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return JSON.parse(decrypted);
};

/**
 * إنشاء hash للبيانات
 */
const createDataHash = (data) => {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
};

/**
 * التحقق من تطابق hash
 */
const verifyDataHash = (data, hash) => {
  return createDataHash(data) === hash;
};

/**
 * تنظيف المسارات للأمان
 */
const sanitizePath = (path) => {
  return path.replace(/[^a-zA-Z0-9\/\-_\.]/g, '');
};

/**
 * استخراج معلومات المتصفح
 */
const parseUserAgent = (userAgent) => {
  const browser = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera|Internet Explorer)\/?\s*(\d+)/i);
  const os = userAgent.match(/(Windows|Mac|Linux|Android|iOS)/i);
  
  return {
    browser: browser ? `${browser[1]} ${browser[2]}` : 'غير معروف',
    os: os ? os[1] : 'غير معروف',
    isMobile: /Mobile|Android|iPhone|iPad/i.test(userAgent)
  };
};

/**
 * تحويل الكائن إلى query string
 */
const objectToQueryString = (obj) => {
  return Object.keys(obj)
    .filter(key => obj[key] !== undefined && obj[key] !== null)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
    .join('&');
};

/**
 * تنظيف المدخلات من HTML و JavaScript
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
};

/**
 * التحقق من قوة كلمة المرور
 */
const checkPasswordStrength = (password) => {
  const minLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const score = [minLength, hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar]
    .reduce((acc, curr) => acc + (curr ? 1 : 0), 0);
  
  const strength = score < 3 ? 'ضعيف' : score < 4 ? 'متوسط' : 'قوي';
  
  return {
    score,
    strength,
    requirements: {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar
    }
  };
};

/**
 * تحويل النص العربي إلى رقم إنجليزي
 */
const arabicToEnglishNumbers = (text) => {
  const arabicNumbers = '٠١٢٣٤٥٦٧٨٩';
  const englishNumbers = '0123456789';
  
  return text.replace(/[٠-٩]/g, (match) => {
    return englishNumbers[arabicNumbers.indexOf(match)];
  });
};

/**
 * تحويل الرقم الإنجليزي إلى عربي
 */
const englishToArabicNumbers = (text) => {
  const arabicNumbers = '٠١٢٣٤٥٦٧٨٩';
  const englishNumbers = '0123456789';
  
  return text.replace(/[0-9]/g, (match) => {
    return arabicNumbers[englishNumbers.indexOf(match)];
  });
};

/**
 * تقليل الكائن لإزالة القيم الفارغة
 */
const removeEmpty = (obj) => {
  return Object.keys(obj)
    .filter(key => {
      const value = obj[key];
      return value !== null && value !== undefined && value !== '';
    })
    .reduce((acc, key) => {
      acc[key] = obj[key];
      return acc;
    }, {});
};

module.exports = {
  getClientIP,
  sanitizeData,
  formatBytes,
  generateSessionId,
  isValidObjectId,
  formatArabicDate,
  getTimeDifference,
  encryptSensitiveData,
  decryptSensitiveData,
  createDataHash,
  verifyDataHash,
  sanitizePath,
  parseUserAgent,
  objectToQueryString,
  sanitizeInput,
  checkPasswordStrength,
  arabicToEnglishNumbers,
  englishToArabicNumbers,
  removeEmpty
}; 
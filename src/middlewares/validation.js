const { body, param, query, validationResult } = require('express-validator');
const { sendValidationError } = require('../utils/response');
const { ERROR_MESSAGES } = require('../config/constants');
const { validateEgyptianPhone } = require('../utils/egyptianPhoneValidator');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return sendValidationError(res, errors.array());
  }
  
  next();
};

/**
 * User registration validation
 */
const validateUserRegistration = [
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('الاسم الكامل يجب أن يكون بين 2 و 100 حرف')
    .matches(/^[\u0600-\u06FF\s]+$/)
    .withMessage('الاسم يجب أن يحتوي على أحرف عربية فقط'),
  
  body('mobile')
    .trim()
    .custom((value) => {
      const validation = validateEgyptianPhone(value, 'mobile');
      if (!validation.isValid) {
        throw new Error(validation.error);
      }
      return true;
    }),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('البريد الإلكتروني غير صحيح')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  
  body('gender')
    .isIn(['male', 'female'])
    .withMessage('الجنس يجب أن يكون ذكر أو أنثى'),
  
  body('dateOfBirth')
    .isISO8601()
    .withMessage('تاريخ الميلاد غير صحيح')
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      if (birthDate >= today) {
        throw new Error('تاريخ الميلاد يجب أن يكون في الماضي');
      }
      return true;
    }),
  
  handleValidationErrors
];

/**
 * User login validation
 */
const validateUserLogin = [
  body('mobile')
    .trim()
    .custom((value) => {
      const validation = validateEgyptianPhone(value, 'mobile');
      if (!validation.isValid) {
        throw new Error(validation.error);
      }
      return true;
    }),
  
  body('password')
    .notEmpty()
    .withMessage('كلمة المرور مطلوبة'),
  
  handleValidationErrors
];

/**
 * OTP validation
 */
const validateOTP = [
  body('mobile')
    .trim()
    .custom((value) => {
      const validation = validateEgyptianPhone(value, 'mobile');
      if (!validation.isValid) {
        throw new Error(validation.error);
      }
      return true;
    }),
  
  body('otp')
    .isLength({ min: 6, max: 6 })
    .withMessage('رمز التحقق يجب أن يكون 6 أرقام')
    .isNumeric()
    .withMessage('رمز التحقق يجب أن يحتوي على أرقام فقط'),
  
  handleValidationErrors
];

/**
 * Doctor profile validation
 */
const validateDoctorProfile = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('اسم الطبيب يجب أن يكون بين 2 و 100 حرف'),
  
  body('specialization')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('التخصص مطلوب ويجب أن يكون بين 2 و 100 حرف'),
  
  body('consultationFee')
    .isFloat({ min: 0 })
    .withMessage('سعر الكشف يجب أن يكون رقماً موجباً'),
  
  body('biography')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('السيرة الذاتية لا يجب أن تتجاوز 1000 حرف'),
  
  body('degrees')
    .optional()
    .isArray()
    .withMessage('الشهادات يجب أن تكون مصفوفة'),
  
  body('degrees.*.degree')
    .if(body('degrees').exists())
    .notEmpty()
    .withMessage('اسم الشهادة مطلوب'),
  
  body('degrees.*.institution')
    .if(body('degrees').exists())
    .notEmpty()
    .withMessage('اسم المؤسسة مطلوب'),
  
  handleValidationErrors
];

/**
 * Clinic validation
 */
const validateClinic = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('اسم العيادة يجب أن يكون بين 2 و 200 حرف'),
  
  body('location.address.street')
    .notEmpty()
    .withMessage('عنوان الشارع مطلوب'),
  
  body('location.address.city')
    .notEmpty()
    .withMessage('المدينة مطلوبة'),
  
  body('location.address.region')
    .notEmpty()
    .withMessage('المنطقة مطلوبة'),
  
  body('phones')
    .isArray({ min: 1 })
    .withMessage('رقم هاتف واحد على الأقل مطلوب'),
  
  body('phones.*.number')
    .custom((value) => {
      const validation = validateEgyptianPhone(value, 'any');
      if (!validation.isValid) {
        throw new Error(validation.error);
      }
      return true;
    }),
  
  body('workingHours')
    .optional()
    .isArray()
    .withMessage('ساعات العمل يجب أن تكون مصفوفة'),
  
  handleValidationErrors
];

/**
 * Appointment booking validation
 */
const validateAppointmentBooking = [
  body('doctorId')
    .isMongoId()
    .withMessage('معرف الطبيب غير صحيح'),
  
  body('clinicId')
    .isMongoId()
    .withMessage('معرف العيادة غير صحيح'),
  
  body('dateTime')
    .isISO8601()
    .withMessage('تاريخ ووقت الموعد غير صحيح')
    .custom((value) => {
      const appointmentDate = new Date(value);
      const now = new Date();
      if (appointmentDate <= now) {
        throw new Error('لا يمكن حجز موعد في الماضي');
      }
      return true;
    }),
  
  body('chiefComplaint')
    .optional()
    .isLength({ max: 500 })
    .withMessage('الشكوى الرئيسية لا يجب أن تتجاوز 500 حرف'),
  
  body('bookingForAnother.isBookingForAnother')
    .optional()
    .isBoolean()
    .withMessage('حقل الحجز لشخص آخر يجب أن يكون true أو false'),
  
  body('bookingForAnother.patientInfo.fullName')
    .if(body('bookingForAnother.isBookingForAnother').equals(true))
    .notEmpty()
    .withMessage('اسم المريض مطلوب عند الحجز لشخص آخر'),
  
  body('bookingForAnother.patientInfo.mobile')
    .if(body('bookingForAnother.isBookingForAnother').equals(true))
    .custom((value) => {
      const validation = validateEgyptianPhone(value, 'mobile');
      if (!validation.isValid) {
        throw new Error(validation.error);
      }
      return true;
    }),
  
  handleValidationErrors
];

/**
 * Specialization validation
 */
const validateSpecialization = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('اسم التخصص يجب أن يكون بين 2 و 100 حرف'),
  
  body('code')
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('كود التخصص يجب أن يكون بين 2 و 20 حرف')
    .matches(/^[A-Z0-9_]+$/)
    .withMessage('كود التخصص يجب أن يحتوي على أحرف كبيرة وأرقام وشرطة سفلية فقط'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('وصف التخصص يجب أن يكون بين 10 و 500 حرف'),
  
  body('commonConditions')
    .optional()
    .isArray()
    .withMessage('الأمراض الشائعة يجب أن تكون مصفوفة'),
  
  body('commonConditions.*')
    .if(body('commonConditions').exists())
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('اسم الحالة يجب أن يكون بين 2 و 50 حرف'),
  
  body('icon')
    .optional()
    .isLength({ max: 10 })
    .withMessage('الأيقونة لا يجب أن تتجاوز 10 أحرف'),
  
  handleValidationErrors
];

/**
 * Medical record validation
 */
const validateMedicalRecord = [
  body('patientId')
    .isMongoId()
    .withMessage('معرف المريض غير صحيح'),
  
  body('doctorId')
    .isMongoId()
    .withMessage('معرف الطبيب غير صحيح'),
  
  body('type')
    .isIn(['visit', 'xray', 'lab_test', 'prescription'])
    .withMessage('نوع السجل الطبي غير صحيح'),
  
  body('title')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('عنوان السجل يجب أن يكون بين 2 و 200 حرف'),
  
  body('details.diagnosis.primary')
    .optional()
    .trim()
    .isLength({ min: 2, max: 500 })
    .withMessage('التشخيص الأولي يجب أن يكون بين 2 و 500 حرف'),
  
  handleValidationErrors
];

/**
 * Review validation
 */
const validateReview = [
  body('appointmentId')
    .isMongoId()
    .withMessage('معرف الموعد غير صحيح'),
  
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('التقييم يجب أن يكون بين 1 و 5'),
  
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('التعليق لا يجب أن يتجاوز 1000 حرف'),
  
  body('detailedRatings.doctorCommunication')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('تقييم التواصل مع الطبيب يجب أن يكون بين 1 و 5'),
  
  body('detailedRatings.waitTime')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('تقييم وقت الانتظار يجب أن يكون بين 1 و 5'),
  
  handleValidationErrors
];

/**
 * MongoDB ObjectId validation
 */
const validateObjectId = (field = 'id') => [
  param(field)
    .isMongoId()
    .withMessage('المعرف غير صحيح'),
  
  handleValidationErrors
];

/**
 * Pagination validation
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('رقم الصفحة يجب أن يكون رقماً موجباً'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('عدد العناصر في الصفحة يجب أن يكون بين 1 و 100'),
  
  handleValidationErrors
];

/**
 * Date range validation
 */
const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('تاريخ البداية غير صحيح'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('تاريخ النهاية غير صحيح')
    .custom((endDate, { req }) => {
      if (req.query.startDate && endDate) {
        const start = new Date(req.query.startDate);
        const end = new Date(endDate);
        if (end < start) {
          throw new Error('تاريخ النهاية يجب أن يكون بعد تاريخ البداية');
        }
      }
      return true;
    }),
  
  handleValidationErrors
];

/**
 * Search validation
 */
const validateSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('كلمة البحث يجب أن تكون بين 2 و 100 حرف'),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateOTP,
  validateDoctorProfile,
  validateClinic,
  validateAppointmentBooking,
  validateMedicalRecord,
  validateReview,
  validateSpecialization,
  validateObjectId,
  validatePagination,
  validateDateRange,
  validateSearch
}; 
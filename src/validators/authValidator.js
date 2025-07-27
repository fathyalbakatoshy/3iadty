const { body, query, param } = require('express-validator');
const User = require('../models/User');
const { validateEgyptianPhone } = require('../utils/egyptianPhoneValidator');

/**
 * Register validation
 */
const validateRegister = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('الاسم الكامل مطلوب')
    .isLength({ min: 2, max: 100 })
    .withMessage('الاسم يجب أن يكون بين 2 و 100 حرف')
    .matches(/^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s]+$/)
    .withMessage('الاسم يجب أن يحتوي على أحرف عربية فقط'),

  body('mobile')
    .trim()
    .notEmpty()
    .withMessage('رقم الجوال مطلوب')
    .custom(async (value) => {
      const validation = validateEgyptianPhone(value, 'mobile');
      if (!validation.isValid) {
        throw new Error(validation.error);
      }
      
      const existingUser = await User.findOne({ mobile: validation.cleanNumber });
      if (existingUser) {
        throw new Error('رقم الجوال مسجل مسبقاً');
      }
      return true;
    }),

  body('email')
    .optional()
    .trim()
    .normalizeEmail()
    .isEmail()
    .withMessage('البريد الإلكتروني غير صحيح')
    .custom(async (value) => {
      if (value) {
        const existingUser = await User.findOne({ email: value });
        if (existingUser) {
          throw new Error('البريد الإلكتروني مسجل مسبقاً');
        }
      }
      return true;
    }),

  body('password')
    .isLength({ min: 6 })
    .withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage('كلمة المرور يجب أن تحتوي على أحرف وأرقام'),

  body('gender')
    .notEmpty()
    .withMessage('الجنس مطلوب')
    .isIn(['male', 'female'])
    .withMessage('الجنس يجب أن يكون ذكر أو أنثى'),

  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('تاريخ الميلاد غير صحيح')
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 12 || age > 100) {
        throw new Error('العمر يجب أن يكون بين 12 و 100 سنة');
      }
      return true;
    }),

  body('emergencyContact.name')
    .trim()
    .notEmpty()
    .withMessage('اسم جهة الاتصال في حالات الطوارئ مطلوب')
    .isLength({ min: 2, max: 100 })
    .withMessage('اسم جهة الاتصال يجب أن يكون بين 2 و 100 حرف'),

  body('emergencyContact.mobile')
    .trim()
    .notEmpty()
    .withMessage('رقم جوال جهة الاتصال مطلوب')
    .custom((value) => {
      const validation = validateEgyptianPhone(value, 'mobile');
      if (!validation.isValid) {
        throw new Error(validation.error);
      }
      return true;
    }),

  body('emergencyContact.relationship')
    .trim()
    .notEmpty()
    .withMessage('صلة القرابة مطلوبة')
    .isLength({ min: 2, max: 50 })
    .withMessage('صلة القرابة يجب أن تكون بين 2 و 50 حرف')
];

/**
 * Login validation
 */
const validateLogin = [
  body('mobile')
    .trim()
    .notEmpty()
    .withMessage('رقم الجوال مطلوب')
    .custom((value) => {
      const validation = validateEgyptianPhone(value, 'mobile');
      if (!validation.isValid) {
        throw new Error(validation.error);
      }
      return true;
    }),

  body('password')
    .notEmpty()
    .withMessage('كلمة المرور مطلوبة')
    .isLength({ min: 6 })
    .withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
];

/**
 * OTP request validation
 */
const validateOTPRequest = [
  body('mobile')
    .trim()
    .notEmpty()
    .withMessage('رقم الجوال مطلوب')
    .custom((value) => {
      const validation = validateEgyptianPhone(value, 'mobile');
      if (!validation.isValid) {
        throw new Error(validation.error);
      }
      return true;
    })
];

/**
 * OTP verification validation
 */
const validateOTPVerification = [
  body('mobile')
    .trim()
    .notEmpty()
    .withMessage('رقم الجوال مطلوب')
    .custom((value) => {
      const validation = validateEgyptianPhone(value, 'mobile');
      if (!validation.isValid) {
        throw new Error(validation.error);
      }
      return true;
    }),

  body('otp')
    .trim()
    .notEmpty()
    .withMessage('رمز التحقق مطلوب')
    .isLength({ min: 4, max: 6 })
    .withMessage('رمز التحقق يجب أن يكون بين 4 و 6 أرقام')
    .isNumeric()
    .withMessage('رمز التحقق يجب أن يحتوي على أرقام فقط')
];

/**
 * Change password validation
 */
const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('كلمة المرور الحالية مطلوبة'),

  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage('كلمة المرور يجب أن تحتوي على أحرف وأرقام')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('كلمة المرور الجديدة يجب أن تختلف عن الحالية');
      }
      return true;
    }),

  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('تأكيد كلمة المرور غير متطابق');
      }
      return true;
    })
];

/**
 * Reset password validation
 */
const validateResetPassword = [
  body('mobile')
    .trim()
    .notEmpty()
    .withMessage('رقم الجوال مطلوب')
    .custom((value) => {
      const validation = validateEgyptianPhone(value, 'mobile');
      if (!validation.isValid) {
        throw new Error(validation.error);
      }
      return true;
    }),

  body('otp')
    .trim()
    .notEmpty()
    .withMessage('رمز التحقق مطلوب')
    .isLength({ min: 4, max: 6 })
    .withMessage('رمز التحقق يجب أن يكون بين 4 و 6 أرقام'),

  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage('كلمة المرور يجب أن تحتوي على أحرف وأرقام'),

  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('تأكيد كلمة المرور غير متطابق');
      }
      return true;
    })
];

/**
 * Update profile validation
 */
const validateUpdateProfile = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('الاسم يجب أن يكون بين 2 و 100 حرف')
    .matches(/^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s]+$/)
    .withMessage('الاسم يجب أن يحتوي على أحرف عربية فقط'),

  body('email')
    .optional()
    .trim()
    .normalizeEmail()
    .isEmail()
    .withMessage('البريد الإلكتروني غير صحيح'),

  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('تاريخ الميلاد غير صحيح')
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 12 || age > 100) {
        throw new Error('العمر يجب أن يكون بين 12 و 100 سنة');
      }
      return true;
    }),

  body('address.street')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('عنوان الشارع لا يجب أن يتجاوز 255 حرف'),

  body('address.city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('اسم المدينة لا يجب أن يتجاوز 100 حرف'),

  body('address.region')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('اسم المنطقة لا يجب أن يتجاوز 100 حرف'),

  body('address.postalCode')
    .optional()
    .trim()
    .matches(/^[0-9]{5}$/)
    .withMessage('الرمز البريدي يجب أن يكون 5 أرقام')
];

/**
 * Refresh token validation
 */
const validateRefreshToken = [
  body('refreshToken')
    .notEmpty()
    .withMessage('رمز التحديث مطلوب')
    .isJWT()
    .withMessage('رمز التحديث غير صحيح')
];

module.exports = {
  validateRegister,
  validateLogin,
  validateOTPRequest,
  validateOTPVerification,
  validateChangePassword,
  validateResetPassword,
  validateUpdateProfile,
  validateRefreshToken
}; 
const { body, query, param } = require('express-validator');
const { APPOINTMENT_STATUS, PAYMENT_METHODS } = require('../config/constants');
const { validateEgyptianPhone } = require('../utils/egyptianPhoneValidator');

/**
 * Book appointment validation
 */
const validateBookAppointment = [
  body('doctorId')
    .notEmpty()
    .withMessage('معرف الطبيب مطلوب')
    .isMongoId()
    .withMessage('معرف الطبيب غير صحيح'),

  body('clinicId')
    .notEmpty()
    .withMessage('معرف العيادة مطلوب')
    .isMongoId()
    .withMessage('معرف العيادة غير صحيح'),

  body('dateTime')
    .notEmpty()
    .withMessage('تاريخ ووقت الموعد مطلوب')
    .isISO8601()
    .withMessage('تاريخ ووقت الموعد غير صحيح')
    .custom((value) => {
      const appointmentDate = new Date(value);
      const now = new Date();
      
      if (appointmentDate <= now) {
        throw new Error('لا يمكن حجز موعد في الماضي');
      }
      
      // Check if appointment is within next 6 months
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
      
      if (appointmentDate > sixMonthsFromNow) {
        throw new Error('لا يمكن حجز موعد بعد 6 أشهر من الآن');
      }
      
      return true;
    }),

  body('appointmentType')
    .optional()
    .isIn(['consultation', 'followup', 'emergency', 'procedure'])
    .withMessage('نوع الموعد غير صحيح'),

  body('chiefComplaint')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('الشكوى الرئيسية لا يجب أن تتجاوز 500 حرف'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('الملاحظات لا يجب أن تتجاوز 1000 حرف'),

  body('paymentMethod')
    .optional()
    .isIn(Object.values(PAYMENT_METHODS))
    .withMessage('طريقة الدفع غير صحيحة - الدفع يتم في العيادة فقط (كاش، فيزا، أو تقسيط)'),

  body('bookingForAnother')
    .optional()
    .isBoolean()
    .withMessage('حقل الحجز لشخص آخر يجب أن يكون true أو false'),

  body('patientInfo.fullName')
    .if(body('bookingForAnother').equals('true'))
    .notEmpty()
    .withMessage('اسم المريض مطلوب عند الحجز لشخص آخر')
    .isLength({ min: 2, max: 100 })
    .withMessage('اسم المريض يجب أن يكون بين 2 و 100 حرف'),

  body('patientInfo.mobile')
    .if(body('bookingForAnother').equals('true'))
    .notEmpty()
    .withMessage('رقم جوال المريض مطلوب عند الحجز لشخص آخر')
    .custom((value) => {
      const validation = validateEgyptianPhone(value, 'mobile');
      if (!validation.isValid) {
        throw new Error(validation.error);
      }
      return true;
    }),

  body('patientInfo.age')
    .if(body('bookingForAnother').equals('true'))
    .optional()
    .isInt({ min: 1, max: 120 })
    .withMessage('عمر المريض يجب أن يكون بين 1 و 120 سنة'),

  body('patientInfo.gender')
    .if(body('bookingForAnother').equals('true'))
    .optional()
    .isIn(['male', 'female'])
    .withMessage('جنس المريض يجب أن يكون ذكر أو أنثى'),

  body('patientInfo.relationship')
    .if(body('bookingForAnother').equals('true'))
    .notEmpty()
    .withMessage('صلة القرابة مطلوبة عند الحجز لشخص آخر')
    .isLength({ min: 2, max: 50 })
    .withMessage('صلة القرابة يجب أن تكون بين 2 و 50 حرف')
];

/**
 * Update appointment status validation
 */
const validateUpdateAppointmentStatus = [
  param('id')
    .isMongoId()
    .withMessage('معرف الموعد غير صحيح'),

  body('status')
    .notEmpty()
    .withMessage('حالة الموعد مطلوبة')
    .isIn(Object.values(APPOINTMENT_STATUS))
    .withMessage('حالة الموعد غير صحيحة'),

  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('سبب التغيير لا يجب أن يتجاوز 500 حرف'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('الملاحظات لا يجب أن تتجاوز 1000 حرف')
];

/**
 * Reschedule appointment validation
 */
const validateRescheduleAppointment = [
  param('id')
    .isMongoId()
    .withMessage('معرف الموعد غير صحيح'),

  body('newDateTime')
    .notEmpty()
    .withMessage('التاريخ والوقت الجديد مطلوب')
    .isISO8601()
    .withMessage('التاريخ والوقت الجديد غير صحيح')
    .custom((value) => {
      const newDate = new Date(value);
      const now = new Date();
      
      if (newDate <= now) {
        throw new Error('لا يمكن إعادة الجدولة لوقت في الماضي');
      }
      
      return true;
    }),

  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('سبب إعادة الجدولة لا يجب أن يتجاوز 500 حرف')
];

/**
 * Cancel appointment validation
 */
const validateCancelAppointment = [
  param('id')
    .isMongoId()
    .withMessage('معرف الموعد غير صحيح'),

  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('سبب الإلغاء لا يجب أن يتجاوز 500 حرف')
];

/**
 * Get appointments validation
 */
const validateGetAppointments = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('رقم الصفحة يجب أن يكون رقم موجب'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('عدد العناصر يجب أن يكون بين 1 و 100'),

  query('status')
    .optional()
    .isIn(Object.values(APPOINTMENT_STATUS))
    .withMessage('حالة الموعد غير صحيحة'),

  query('upcoming')
    .optional()
    .isBoolean()
    .withMessage('حقل المواعيد القادمة يجب أن يكون true أو false')
];

/**
 * Get doctor appointments validation
 */
const validateGetDoctorAppointments = [
  param('doctorId')
    .isMongoId()
    .withMessage('معرف الطبيب غير صحيح'),

  query('date')
    .optional()
    .isISO8601()
    .withMessage('التاريخ غير صحيح'),

  query('status')
    .optional()
    .isIn(Object.values(APPOINTMENT_STATUS))
    .withMessage('حالة الموعد غير صحيحة'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('رقم الصفحة يجب أن يكون رقم موجب'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('عدد العناصر يجب أن يكون بين 1 و 100')
];

/**
 * Get available slots validation
 */
const validateGetAvailableSlots = [
  param('doctorId')
    .isMongoId()
    .withMessage('معرف الطبيب غير صحيح'),

  query('date')
    .notEmpty()
    .withMessage('التاريخ مطلوب')
    .isISO8601()
    .withMessage('التاريخ غير صحيح')
    .custom((value) => {
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        throw new Error('لا يمكن الاستعلام عن مواعيد في الماضي');
      }
      
      return true;
    })
];

/**
 * Appointment ID validation
 */
const validateAppointmentId = [
  param('id')
    .isMongoId()
    .withMessage('معرف الموعد غير صحيح')
];

/**
 * Validate appointment search
 */
const validateAppointmentSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('نص البحث يجب أن يكون بين 2 و 100 حرف'),

  query('doctorId')
    .optional()
    .isMongoId()
    .withMessage('معرف الطبيب غير صحيح'),

  query('clinicId')
    .optional()
    .isMongoId()
    .withMessage('معرف العيادة غير صحيح'),

  query('patientId')
    .optional()
    .isMongoId()
    .withMessage('معرف المريض غير صحيح'),

  query('status')
    .optional()
    .isIn(Object.values(APPOINTMENT_STATUS))
    .withMessage('حالة الموعد غير صحيحة'),

  query('fromDate')
    .optional()
    .isISO8601()
    .withMessage('تاريخ البداية غير صحيح'),

  query('toDate')
    .optional()
    .isISO8601()
    .withMessage('تاريخ النهاية غير صحيح')
    .custom((value, { req }) => {
      if (req.query.fromDate && value) {
        const fromDate = new Date(req.query.fromDate);
        const toDate = new Date(value);
        
        if (toDate <= fromDate) {
          throw new Error('تاريخ النهاية يجب أن يكون بعد تاريخ البداية');
        }
      }
      return true;
    }),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('رقم الصفحة يجب أن يكون رقم موجب'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('عدد العناصر يجب أن يكون بين 1 و 100')
];

module.exports = {
  validateBookAppointment,
  validateUpdateAppointmentStatus,
  validateRescheduleAppointment,
  validateCancelAppointment,
  validateGetAppointments,
  validateGetDoctorAppointments,
  validateGetAvailableSlots,
  validateAppointmentId,
  validateAppointmentSearch
}; 
const { body, query, param } = require('express-validator');

/**
 * التحقق من صحة طلب جلب سجلات التدقيق
 */
const validateGetAuditLogs = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('رقم الصفحة يجب أن يكون رقم صحيح أكبر من 0'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('حد العرض يجب أن يكون بين 1 و 100'),

  query('sortBy')
    .optional()
    .isIn(['timestamp', 'action', 'userName', 'severity', 'category'])
    .withMessage('حقل الترتيب غير صحيح'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('اتجاه الترتيب يجب أن يكون asc أو desc'),

  query('action')
    .optional()
    .isIn(['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'APPROVE', 'REJECT'])
    .withMessage('نوع العملية غير صحيح'),

  query('modelName')
    .optional()
    .isIn(['User', 'Doctor', 'Patient', 'Clinic', 'Appointment', 'MedicalRecord', 'Review', 'Admin', 'Visitor'])
    .withMessage('نوع النموذج غير صحيح'),

  query('category')
    .optional()
    .isIn(['AUTHENTICATION', 'AUTHORIZATION', 'DATA_ACCESS', 'DATA_MODIFICATION', 'SECURITY', 'SYSTEM', 'MEDICAL'])
    .withMessage('فئة السجل غير صحيحة'),

  query('severity')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
    .withMessage('مستوى الأهمية غير صحيح'),

  query('success')
    .optional()
    .isBoolean()
    .withMessage('حالة النجاح يجب أن تكون true أو false'),

  query('userId')
    .optional()
    .isMongoId()
    .withMessage('معرف المستخدم غير صحيح'),

  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('تاريخ البداية يجب أن يكون بصيغة ISO8601'),

  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('تاريخ النهاية يجب أن يكون بصيغة ISO8601'),

  query('ipAddress')
    .optional()
    .isIP()
    .withMessage('عنوان IP غير صحيح'),

  query('search')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('كلمة البحث يجب أن تكون بين 2 و 100 حرف')
];

/**
 * التحقق من صحة معرف سجل التدقيق
 */
const validateAuditLogId = [
  param('id')
    .isMongoId()
    .withMessage('معرف سجل التدقيق غير صحيح')
];

/**
 * التحقق من صحة طلب تاريخ السجل
 */
const validateRecordHistory = [
  param('modelName')
    .isIn(['User', 'Doctor', 'Patient', 'Clinic', 'Appointment', 'MedicalRecord', 'Review', 'Admin', 'Visitor'])
    .withMessage('نوع النموذج غير صحيح'),

  param('recordId')
    .isMongoId()
    .withMessage('معرف السجل غير صحيح')
];

/**
 * التحقق من صحة طلب الإحصائيات
 */
const validateAuditStats = [
  query('timeframe')
    .optional()
    .isIn(['1h', '24h', '7d', '30d'])
    .withMessage('الفترة الزمنية يجب أن تكون إحدى القيم: 1h, 24h, 7d, 30d')
];

/**
 * التحقق من صحة طلب التصدير
 */
const validateExportRequest = [
  query('format')
    .optional()
    .isIn(['json', 'csv'])
    .withMessage('صيغة التصدير يجب أن تكون json أو csv'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('حد التصدير يجب أن يكون بين 1 و 10000'),

  query('action')
    .optional()
    .isIn(['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'APPROVE', 'REJECT'])
    .withMessage('نوع العملية غير صحيح'),

  query('category')
    .optional()
    .isIn(['AUTHENTICATION', 'AUTHORIZATION', 'DATA_ACCESS', 'DATA_MODIFICATION', 'SECURITY', 'SYSTEM', 'MEDICAL'])
    .withMessage('فئة السجل غير صحيحة'),

  query('severity')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
    .withMessage('مستوى الأهمية غير صحيح'),

  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('تاريخ البداية يجب أن يكون بصيغة ISO8601'),

  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('تاريخ النهاية يجب أن يكون بصيغة ISO8601')
];

/**
 * التحقق من صحة طلب البحث المتقدم
 */
const validateAdvancedSearch = [
  body('query')
    .notEmpty()
    .isLength({ min: 2, max: 100 })
    .withMessage('كلمة البحث مطلوبة ويجب أن تكون بين 2 و 100 حرف'),

  body('filters')
    .optional()
    .isObject()
    .withMessage('الفلاتر يجب أن تكون كائن'),

  body('filters.action')
    .optional()
    .isIn(['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'APPROVE', 'REJECT'])
    .withMessage('نوع العملية في الفلتر غير صحيح'),

  body('filters.category')
    .optional()
    .isIn(['AUTHENTICATION', 'AUTHORIZATION', 'DATA_ACCESS', 'DATA_MODIFICATION', 'SECURITY', 'SYSTEM', 'MEDICAL'])
    .withMessage('فئة السجل في الفلتر غير صحيحة'),

  body('filters.severity')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
    .withMessage('مستوى الأهمية في الفلتر غير صحيح'),

  body('filters.success')
    .optional()
    .isBoolean()
    .withMessage('حالة النجاح في الفلتر يجب أن تكون true أو false'),

  body('filters.dateFrom')
    .optional()
    .isISO8601()
    .withMessage('تاريخ البداية في الفلتر يجب أن يكون بصيغة ISO8601'),

  body('filters.dateTo')
    .optional()
    .isISO8601()
    .withMessage('تاريخ النهاية في الفلتر يجب أن يكون بصيغة ISO8601'),

  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('رقم الصفحة يجب أن يكون رقم صحيح أكبر من 0'),

  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('حد العرض يجب أن يكون بين 1 و 100')
];

/**
 * التحقق من صحة طلب تنظيف السجلات القديمة
 */
const validateCleanupRequest = [
  body('days')
    .optional()
    .isInt({ min: 30, max: 3650 })
    .withMessage('عدد الأيام يجب أن يكون بين 30 و 3650 (10 سنوات)'),

  body('confirm')
    .equals('true')
    .withMessage('يجب تأكيد عملية التنظيف'),

  body('reason')
    .notEmpty()
    .isLength({ min: 10, max: 500 })
    .withMessage('سبب التنظيف مطلوب ويجب أن يكون بين 10 و 500 حرف')
];

/**
 * التحقق من صحة فلاتر الأطباء
 */
const validateDoctorFilters = [
  query('patientId')
    .optional()
    .isMongoId()
    .withMessage('معرف المريض غير صحيح'),

  query('appointmentDate')
    .optional()
    .isISO8601()
    .withMessage('تاريخ الموعد يجب أن يكون بصيغة ISO8601'),

  query('recordType')
    .optional()
    .isIn(['Patient', 'Appointment', 'MedicalRecord'])
    .withMessage('نوع السجل يجب أن يكون إحدى القيم: Patient, Appointment, MedicalRecord')
];

/**
 * التحقق من صحة فلاتر المديرين
 */
const validateAdminFilters = [
  query('riskLevel')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
    .withMessage('مستوى الخطر غير صحيح'),

  query('includeSystem')
    .optional()
    .isBoolean()
    .withMessage('تضمين سجلات النظام يجب أن يكون true أو false'),

  query('securityOnly')
    .optional()
    .isBoolean()
    .withMessage('السجلات الأمنية فقط يجب أن يكون true أو false'),

  query('failedOnly')
    .optional()
    .isBoolean()
    .withMessage('العمليات الفاشلة فقط يجب أن يكون true أو false')
];

module.exports = {
  validateGetAuditLogs,
  validateAuditLogId,
  validateRecordHistory,
  validateAuditStats,
  validateExportRequest,
  validateAdvancedSearch,
  validateCleanupRequest,
  validateDoctorFilters,
  validateAdminFilters
}; 
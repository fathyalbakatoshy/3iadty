const express = require('express');
const router = express.Router();

// Middleware
const { isAuth, isAdmin, checkRole } = require('../middlewares/auth');
const { handleValidationErrors } = require('../middlewares/validation');

// Controllers
const {
  getAuditLogs,
  getAuditLogById,
  getRecordHistory,
  getAuditStats,
  exportAuditLogs,
  cleanupOldLogs,
  advancedSearch
} = require('../controllers/auditLogController');

// Validators
const { body, param, query } = require('express-validator');

/**
 * جلب جميع سجلات التدقيق مع التصفية
 * GET /api/audit-logs
 * يتطلب: صلاحيات إدارية أو طبيب
 */
router.get('/',
  isAuth,
  checkRole(['admin', 'doctor']),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('رقم الصفحة يجب أن يكون رقم صحيح'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('حد العرض يجب أن يكون بين 1 و 100'),
    query('sortBy').optional().isIn(['timestamp', 'action', 'userName', 'severity']).withMessage('ترتيب غير صحيح'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('اتجاه الترتيب غير صحيح'),
    query('action').optional().isIn(['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'APPROVE', 'REJECT']).withMessage('نوع العملية غير صحيح'),
    query('modelName').optional().isIn(['User', 'Doctor', 'Patient', 'Clinic', 'Appointment', 'MedicalRecord', 'Review', 'Admin', 'Visitor']).withMessage('نوع النموذج غير صحيح'),
    query('category').optional().isIn(['AUTHENTICATION', 'AUTHORIZATION', 'DATA_ACCESS', 'DATA_MODIFICATION', 'SECURITY', 'SYSTEM', 'MEDICAL']).withMessage('الفئة غير صحيحة'),
    query('severity').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).withMessage('مستوى الأهمية غير صحيح'),
    query('success').optional().isBoolean().withMessage('حالة النجاح يجب أن تكون true أو false'),
    query('userId').optional().isMongoId().withMessage('معرف المستخدم غير صحيح'),
    query('dateFrom').optional().isISO8601().withMessage('تاريخ البداية غير صحيح'),
    query('dateTo').optional().isISO8601().withMessage('تاريخ النهاية غير صحيح'),
    query('ipAddress').optional().isIP().withMessage('عنوان IP غير صحيح'),
    query('search').optional().isLength({ min: 2 }).withMessage('البحث يجب أن يكون على الأقل حرفين')
  ],
  handleValidationErrors,
  getAuditLogs
);

/**
 * جلب سجل تدقيق محدد
 * GET /api/audit-logs/:id
 * يتطلب: صلاحيات إدارية
 */
router.get('/:id',
  isAuth,
  isAdmin,
  [
    param('id').isMongoId().withMessage('معرف سجل التدقيق غير صحيح')
  ],
  handleValidationErrors,
  getAuditLogById
);

/**
 * جلب تاريخ سجل معين
 * GET /api/audit-logs/history/:modelName/:recordId
 * يتطلب: صلاحيات إدارية أو طبيب (للسجلات الطبية الخاصة به)
 */
router.get('/history/:modelName/:recordId',
  isAuth,
  checkRole(['admin', 'doctor']),
  [
    param('modelName').isIn(['User', 'Doctor', 'Patient', 'Clinic', 'Appointment', 'MedicalRecord', 'Review', 'Admin', 'Visitor']).withMessage('نوع النموذج غير صحيح'),
    param('recordId').isMongoId().withMessage('معرف السجل غير صحيح')
  ],
  handleValidationErrors,
  getRecordHistory
);

/**
 * إحصائيات سجلات التدقيق
 * GET /api/audit-logs/stats
 * يتطلب: صلاحيات إدارية
 */
router.get('/stats/overview',
  isAuth,
  isAdmin,
  [
    query('timeframe').optional().isIn(['1h', '24h', '7d', '30d']).withMessage('الفترة الزمنية غير صحيحة')
  ],
  handleValidationErrors,
  getAuditStats
);

/**
 * تصدير سجلات التدقيق
 * GET /api/audit-logs/export
 * يتطلب: صلاحيات إدارية
 */
router.get('/export/download',
  isAuth,
  isAdmin,
  [
    query('format').optional().isIn(['json', 'csv']).withMessage('صيغة التصدير غير مدعومة'),
    query('limit').optional().isInt({ min: 1, max: 10000 }).withMessage('حد التصدير يجب أن يكون بين 1 و 10000')
  ],
  handleValidationErrors,
  exportAuditLogs
);

/**
 * البحث المتقدم في سجلات التدقيق
 * POST /api/audit-logs/search
 * يتطلب: صلاحيات إدارية أو طبيب
 */
router.post('/search',
  isAuth,
  checkRole(['admin', 'doctor']),
  [
    body('query').notEmpty().isLength({ min: 2 }).withMessage('كلمة البحث مطلوبة ويجب أن تكون على الأقل حرفين'),
    body('filters').optional().isObject().withMessage('الفلاتر يجب أن تكون كائن'),
    body('page').optional().isInt({ min: 1 }).withMessage('رقم الصفحة يجب أن يكون رقم صحيح'),
    body('limit').optional().isInt({ min: 1, max: 100 }).withMessage('حد العرض يجب أن يكون بين 1 و 100')
  ],
  handleValidationErrors,
  advancedSearch
);

/**
 * حذف سجلات التدقيق القديمة
 * DELETE /api/audit-logs/cleanup
 * يتطلب: صلاحيات إدارية عليا
 */
router.delete('/cleanup',
  isAuth,
  isAdmin,
  [
    body('days').optional().isInt({ min: 30, max: 3650 }).withMessage('عدد الأيام يجب أن يكون بين 30 و 3650')
  ],
  handleValidationErrors,
  cleanupOldLogs
);

/**
 * Routes محددة للأطباء - سجلات المرضى والمواعيد فقط
 */

/**
 * جلب سجلات المرضى للطبيب
 * GET /api/audit-logs/doctor/patients
 */
router.get('/doctor/patients',
  isAuth,
  checkRole(['doctor']),
  async (req, res, next) => {
    // تحديد الفلترة لسجلات المرضى والمواعيد فقط
    req.query.category = 'MEDICAL';
    req.query.modelName = req.query.modelName || 'Patient,Appointment,MedicalRecord';
    next();
  },
  getAuditLogs
);

/**
 * جلب سجلات المواعيد للطبيب
 * GET /api/audit-logs/doctor/appointments
 */
router.get('/doctor/appointments',
  isAuth,
  checkRole(['doctor']),
  async (req, res, next) => {
    req.query.category = 'MEDICAL';
    req.query.modelName = 'Appointment';
    next();
  },
  getAuditLogs
);

/**
 * Routes محددة للمديرين - عمليات متقدمة
 */

/**
 * جلب السجلات الحساسة
 * GET /api/audit-logs/admin/sensitive
 */
router.get('/admin/sensitive',
  isAuth,
  isAdmin,
  async (req, res, next) => {
    req.query.isSensitive = 'true';
    req.query.severity = req.query.severity || 'HIGH,CRITICAL';
    next();
  },
  getAuditLogs
);

/**
 * جلب سجلات الأمان
 * GET /api/audit-logs/admin/security
 */
router.get('/admin/security',
  isAuth,
  isAdmin,
  async (req, res, next) => {
    req.query.category = 'SECURITY';
    req.query.success = req.query.success || 'false';
    next();
  },
  getAuditLogs
);

/**
 * جلب سجلات المصادقة
 * GET /api/audit-logs/admin/authentication
 */
router.get('/admin/authentication',
  isAuth,
  isAdmin,
  async (req, res, next) => {
    req.query.category = 'AUTHENTICATION';
    req.query.action = req.query.action || 'LOGIN,LOGOUT';
    next();
  },
  getAuditLogs
);

/**
 * Middleware لتحديد الصلاحيات حسب نوع السجل
 */
const checkRecordAccess = async (req, res, next) => {
  const { modelName, recordId } = req.params;
  const user = req.user;

  // المديرون لديهم صلاحية كاملة
  if (user.role === 'admin') {
    return next();
  }

  // الأطباء يمكنهم رؤية سجلات مرضاهم ومواعيدهم فقط
  if (user.role === 'doctor') {
    const allowedModels = ['Patient', 'Appointment', 'MedicalRecord'];
    if (!allowedModels.includes(modelName)) {
      return res.status(403).json({
        success: false,
        message: 'غير مخول لعرض هذا النوع من السجلات'
      });
    }

    // التحقق من ملكية السجل (يجب تنفيذه حسب منطق العمل)
    // هنا يمكن إضافة التحقق من أن الطبيب مرتبط بالمريض/الموعد
  }

  next();
};

// تطبيق middleware التحقق من الصلاحيات على route التاريخ
router.get('/history/:modelName/:recordId', checkRecordAccess);

module.exports = router; 
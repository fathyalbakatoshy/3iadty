const express = require('express');
const router = express.Router();

// Middleware
const { isAuth, isAdmin } = require('../middlewares/auth');
const { handleValidationErrors } = require('../middlewares/validation');

// Real-time service
const {
  getConnectedUsersSummary,
  getRealtimeStats,
  notifyUser,
  notifyRole,
  broadcastMaintenance,
  emergencyBroadcast
} = require('../services/realTimeAudit');

// Response utilities
const { sendSuccess, sendError } = require('../utils/response');

// Validators
const { body } = require('express-validator');

/**
 * جلب المستخدمين المتصلين حالياً
 * GET /api/realtime/connected-users
 */
router.get('/connected-users',
  isAuth,
  isAdmin,
  async (req, res) => {
    try {
      const summary = getConnectedUsersSummary();
      
      return sendSuccess(res, 'تم جلب المستخدمين المتصلين بنجاح', {
        ...summary,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('خطأ في جلب المستخدمين المتصلين:', error);
      return sendError(res, 'خطأ في جلب المستخدمين المتصلين', 500);
    }
  }
);

/**
 * إحصائيات الوقت الفعلي
 * GET /api/realtime/stats
 */
router.get('/stats',
  isAuth,
  isAdmin,
  async (req, res) => {
    try {
      const stats = await getRealtimeStats();
      
      return sendSuccess(res, 'تم جلب الإحصائيات بنجاح', stats);
    } catch (error) {
      console.error('خطأ في جلب إحصائيات الوقت الفعلي:', error);
      return sendError(res, 'خطأ في جلب الإحصائيات', 500);
    }
  }
);

/**
 * إرسال إشعار لمستخدم محدد
 * POST /api/realtime/notify-user
 */
router.post('/notify-user',
  isAuth,
  isAdmin,
  [
    body('userId')
      .notEmpty()
      .isMongoId()
      .withMessage('معرف المستخدم مطلوب ويجب أن يكون صحيح'),
    
    body('message')
      .notEmpty()
      .isLength({ min: 5, max: 200 })
      .withMessage('الرسالة مطلوبة ويجب أن تكون بين 5 و 200 حرف'),
    
    body('type')
      .optional()
      .isIn(['info', 'warning', 'success', 'error'])
      .withMessage('نوع الإشعار يجب أن يكون إحدى القيم: info, warning, success, error'),
    
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('أولوية الإشعار يجب أن تكون إحدى القيم: low, medium, high, urgent')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { userId, message, type = 'info', priority = 'medium', data = {} } = req.body;
      
      notifyUser(userId, 'admin:notification', {
        message,
        type,
        priority,
        data,
        from: {
          id: req.user.id,
          name: req.user.fullName,
          role: req.user.role
        }
      });
      
      return sendSuccess(res, 'تم إرسال الإشعار بنجاح');
    } catch (error) {
      console.error('خطأ في إرسال الإشعار:', error);
      return sendError(res, 'خطأ في إرسال الإشعار', 500);
    }
  }
);

/**
 * إرسال إشعار لجميع المستخدمين بدور محدد
 * POST /api/realtime/notify-role
 */
router.post('/notify-role',
  isAuth,
  isAdmin,
  [
    body('role')
      .notEmpty()
      .isIn(['admin', 'doctor', 'patient', 'reception'])
      .withMessage('الدور يجب أن يكون إحدى القيم: admin, doctor, patient, reception'),
    
    body('message')
      .notEmpty()
      .isLength({ min: 5, max: 200 })
      .withMessage('الرسالة مطلوبة ويجب أن تكون بين 5 و 200 حرف'),
    
    body('type')
      .optional()
      .isIn(['info', 'warning', 'success', 'error'])
      .withMessage('نوع الإشعار يجب أن يكون إحدى القيم: info, warning, success, error')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { role, message, type = 'info', data = {} } = req.body;
      
      notifyRole(role, 'admin:broadcast', {
        message,
        type,
        data,
        targetRole: role,
        from: {
          id: req.user.id,
          name: req.user.fullName,
          role: req.user.role
        }
      });
      
      return sendSuccess(res, `تم إرسال الإشعار لجميع ${role === 'admin' ? 'المديرين' : role === 'doctor' ? 'الأطباء' : role === 'patient' ? 'المرضى' : 'موظفي الاستقبال'} بنجاح`);
    } catch (error) {
      console.error('خطأ في إرسال الإشعار:', error);
      return sendError(res, 'خطأ في إرسال الإشعار', 500);
    }
  }
);

/**
 * إشعار صيانة النظام
 * POST /api/realtime/maintenance
 */
router.post('/maintenance',
  isAuth,
  isAdmin,
  [
    body('message')
      .notEmpty()
      .isLength({ min: 10, max: 300 })
      .withMessage('رسالة الصيانة مطلوبة ويجب أن تكون بين 10 و 300 حرف'),
    
    body('duration')
      .optional()
      .isInt({ min: 1, max: 1440 })
      .withMessage('مدة الصيانة يجب أن تكون بين 1 و 1440 دقيقة'),
    
    body('startTime')
      .optional()
      .isISO8601()
      .withMessage('وقت البداية يجب أن يكون بصيغة ISO8601'),
    
    body('endTime')
      .optional()
      .isISO8601()
      .withMessage('وقت النهاية يجب أن يكون بصيغة ISO8601')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { message, duration = 30, startTime, endTime } = req.body;
      
      broadcastMaintenance(message, {
        duration,
        startTime: startTime ? new Date(startTime) : new Date(),
        endTime: endTime ? new Date(endTime) : new Date(Date.now() + duration * 60 * 1000),
        announcedBy: {
          id: req.user.id,
          name: req.user.fullName
        }
      });
      
      return sendSuccess(res, 'تم إرسال إشعار الصيانة لجميع المستخدمين');
    } catch (error) {
      console.error('خطأ في إرسال إشعار الصيانة:', error);
      return sendError(res, 'خطأ في إرسال إشعار الصيانة', 500);
    }
  }
);

/**
 * إشعار طوارئ
 * POST /api/realtime/emergency
 */
router.post('/emergency',
  isAuth,
  isAdmin,
  [
    body('message')
      .notEmpty()
      .isLength({ min: 10, max: 500 })
      .withMessage('رسالة الطوارئ مطلوبة ويجب أن تكون بين 10 و 500 حرف'),
    
    body('level')
      .optional()
      .isIn(['warning', 'critical', 'urgent'])
      .withMessage('مستوى الطوارئ يجب أن يكون إحدى القيم: warning, critical, urgent'),
    
    body('requiresAction')
      .optional()
      .isBoolean()
      .withMessage('متطلب الإجراء يجب أن يكون true أو false')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { message, level = 'warning', requiresAction = false } = req.body;
      
      emergencyBroadcast(message, level, {
        requiresAction,
        announcedBy: {
          id: req.user.id,
          name: req.user.fullName
        },
        timestamp: new Date()
      });
      
      return sendSuccess(res, 'تم إرسال إشعار الطوارئ لجميع المستخدمين');
    } catch (error) {
      console.error('خطأ في إرسال إشعار الطوارئ:', error);
      return sendError(res, 'خطأ في إرسال إشعار الطوارئ', 500);
    }
  }
);

/**
 * حالة النظام المباشر
 * GET /api/realtime/system-status
 */
router.get('/system-status',
  isAuth,
  isAdmin,
  async (req, res) => {
    try {
      const connectedUsers = getConnectedUsersSummary();
      const stats = await getRealtimeStats();
      
      const systemStatus = {
        isHealthy: true,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        connectedUsers,
        auditStats: stats,
        environment: process.env.NODE_ENV,
        nodeVersion: process.version,
        timestamp: new Date()
      };
      
      return sendSuccess(res, 'تم جلب حالة النظام بنجاح', systemStatus);
    } catch (error) {
      console.error('خطأ في جلب حالة النظام:', error);
      return sendError(res, 'خطأ في جلب حالة النظام', 500);
    }
  }
);

/**
 * اختبار الاتصال المباشر
 * POST /api/realtime/test-connection
 */
router.post('/test-connection',
  isAuth,
  isAdmin,
  async (req, res) => {
    try {
      const testMessage = 'اختبار الاتصال من لوحة التحكم';
      
      // Send test notification to admin
      notifyUser(req.user.id, 'system:test', {
        message: testMessage,
        type: 'info',
        isTest: true
      });
      
      return sendSuccess(res, 'تم إرسال اختبار الاتصال بنجاح');
    } catch (error) {
      console.error('خطأ في اختبار الاتصال:', error);
      return sendError(res, 'خطأ في اختبار الاتصال', 500);
    }
  }
);

module.exports = router; 
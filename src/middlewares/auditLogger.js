const AuditLog = require('../models/AuditLog');
const { getClientIP } = require('../utils/helpers');
const { broadcastAuditLog } = require('../services/realTimeAudit');

/**
 * Middleware لتسجيل جميع العمليات التلقائية
 */
const auditLogger = (options = {}) => {
  return async (req, res, next) => {
    const startTime = Date.now();
    
    // حفظ الاستجابة الأصلية
    const originalSend = res.send;
    const originalJson = res.json;
    
    let responseData = null;
    let responseSize = 0;
    
    // اعتراض استجابة res.send
    res.send = function(data) {
      responseData = data;
      responseSize = Buffer.byteLength(data || '', 'utf8');
      return originalSend.call(this, data);
    };
    
    // اعتراض استجابة res.json
    res.json = function(data) {
      responseData = data;
      responseSize = Buffer.byteLength(JSON.stringify(data || {}), 'utf8');
      return originalJson.call(this, data);
    };
    
    // اعتراض انتهاء الاستجابة
    res.on('finish', async () => {
      try {
        await logActivity({
          req,
          res,
          startTime,
          responseData,
          responseSize,
          options
        });
      } catch (error) {
        console.error('خطأ في تسجيل Audit Log:', error);
      }
    });
    
    next();
  };
};

/**
 * تسجيل النشاط
 */
const logActivity = async ({ req, res, startTime, responseData, responseSize, options }) => {
  // تجاهل المسارات المستبعدة
  const excludedPaths = ['/health', '/favicon.ico', '/api/audit-logs'];
  if (excludedPaths.some(path => req.path.includes(path))) {
    return;
  }
  
  // تجاهل طلبات OPTIONS
  if (req.method === 'OPTIONS') {
    return;
  }
  
  const user = req.user;
  if (!user) {
    // تسجيل المحاولات غير المصرح بها
    await logUnauthorizedAccess(req, res, startTime, responseSize);
    return;
  }
  
  const action = getActionFromMethod(req.method);
  const category = getCategoryFromPath(req.path);
  const severity = getSeverityFromResponse(res.statusCode, req.method);
  
  const logData = {
    action,
    userId: user.id,
    userRole: user.role,
    userName: user.fullName || user.email,
    modelName: getModelFromPath(req.path),
    recordId: getRecordIdFromPath(req.path, req.body, req.params),
    oldValues: req.originalData || null, // يُعين من middleware آخر
    newValues: getNewValuesFromRequest(req, responseData),
    changes: calculateChanges(req.originalData, req.body),
    metadata: {
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent'),
      method: req.method,
      endpoint: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: Date.now() - startTime,
      requestSize: req.get('Content-Length') || 0,
      responseSize
    },
    sessionId: req.sessionID || req.user?.sessionId,
    severity,
    category,
    isSensitive: isSensitiveOperation(req.path, req.body),
    success: res.statusCode < 400,
    errorMessage: res.statusCode >= 400 ? getErrorMessage(responseData) : null,
    timestamp: new Date()
  };
  
  const savedLog = await AuditLog.log(logData);
  
  // Broadcast in real-time if enabled
  if (savedLog && process.env.AUDIT_LOG_ENABLED !== 'false') {
    await broadcastAuditLog(logData);
  }
};

/**
 * تسجيل المحاولات غير المصرح بها
 */
const logUnauthorizedAccess = async (req, res, startTime, responseSize) => {
  const logData = {
    action: 'UNAUTHORIZED_ACCESS',
    userId: null,
    userRole: 'UNKNOWN',
    userName: 'مجهول',
    modelName: 'System',
    recordId: new require('mongoose').Types.ObjectId(),
    metadata: {
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent'),
      method: req.method,
      endpoint: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: Date.now() - startTime,
      requestSize: req.get('Content-Length') || 0,
      responseSize
    },
    severity: 'HIGH',
    category: 'SECURITY',
    success: false,
    errorMessage: 'محاولة وصول غير مصرح بها'
  };
  
  await AuditLog.log(logData);
};

/**
 * تحويل HTTP method إلى action
 */
const getActionFromMethod = (method) => {
  const methodMap = {
    'GET': 'READ',
    'POST': 'CREATE',
    'PUT': 'UPDATE',
    'PATCH': 'UPDATE',
    'DELETE': 'DELETE'
  };
  return methodMap[method] || 'UNKNOWN';
};

/**
 * تحديد الفئة من المسار
 */
const getCategoryFromPath = (path) => {
  if (path.includes('/auth/')) return 'AUTHENTICATION';
  if (path.includes('/medical-records/')) return 'MEDICAL';
  if (path.includes('/appointments/')) return 'MEDICAL';
  if (path.includes('/doctors/')) return 'DATA_ACCESS';
  if (path.includes('/patients/')) return 'DATA_ACCESS';
  if (path.includes('/admin/')) return 'SYSTEM';
  return 'DATA_ACCESS';
};

/**
 * تحديد مستوى الأهمية
 */
const getSeverityFromResponse = (statusCode, method) => {
  if (statusCode >= 500) return 'CRITICAL';
  if (statusCode >= 400) return 'HIGH';
  if (method === 'DELETE') return 'HIGH';
  if (method === 'POST' || method === 'PUT') return 'MEDIUM';
  return 'LOW';
};

/**
 * استخراج نموذج من المسار
 */
const getModelFromPath = (path) => {
  if (path.includes('/doctors/')) return 'Doctor';
  if (path.includes('/patients/')) return 'Patient';
  if (path.includes('/clinics/')) return 'Clinic';
  if (path.includes('/appointments/')) return 'Appointment';
  if (path.includes('/medical-records/')) return 'MedicalRecord';
  if (path.includes('/reviews/')) return 'Review';
  if (path.includes('/admin/')) return 'Admin';
  if (path.includes('/auth/')) return 'User';
  return 'System';
};

/**
 * استخراج معرف السجل
 */
const getRecordIdFromPath = (path, body, params) => {
  // محاولة استخراج ID من المسار
  if (params.id) return params.id;
  if (params.doctorId) return params.doctorId;
  if (params.patientId) return params.patientId;
  if (params.appointmentId) return params.appointmentId;
  
  // محاولة استخراج من الاستجابة
  if (body && body._id) return body._id;
  if (body && body.id) return body.id;
  
  // إنشاء ObjectId فارغ للعمليات العامة
  return new require('mongoose').Types.ObjectId();
};

/**
 * استخراج القيم الجديدة
 */
const getNewValuesFromRequest = (req, responseData) => {
  if (req.method === 'GET') return null;
  
  try {
    if (typeof responseData === 'string') {
      const parsed = JSON.parse(responseData);
      return parsed.data || parsed;
    }
    return responseData?.data || responseData;
  } catch {
    return req.body;
  }
};

/**
 * حساب التغييرات
 */
const calculateChanges = (oldValues, newValues) => {
  if (!oldValues || !newValues) return null;
  
  const changes = {};
  for (const key in newValues) {
    if (oldValues[key] !== newValues[key]) {
      changes[key] = {
        old: oldValues[key],
        new: newValues[key]
      };
    }
  }
  
  return Object.keys(changes).length > 0 ? changes : null;
};

/**
 * تحديد العمليات الحساسة
 */
const isSensitiveOperation = (path, body) => {
  // العمليات الطبية حساسة
  if (path.includes('/medical-records/')) return true;
  if (path.includes('/appointments/')) return true;
  
  // تغيير كلمات المرور
  if (body && body.password) return true;
  if (body && body.newPassword) return true;
  
  // بيانات شخصية حساسة
  if (body && (body.dateOfBirth || body.nationalId)) return true;
  
  return false;
};

/**
 * استخراج رسالة الخطأ
 */
const getErrorMessage = (responseData) => {
  try {
    if (typeof responseData === 'string') {
      const parsed = JSON.parse(responseData);
      return parsed.error?.message || parsed.message;
    }
    return responseData?.error?.message || responseData?.message;
  } catch {
    return 'خطأ غير محدد';
  }
};

/**
 * Middleware لحفظ البيانات الأصلية (للمقارنة)
 */
const captureOriginalData = (modelName) => {
  return async (req, res, next) => {
    if (req.method === 'PUT' || req.method === 'PATCH') {
      try {
        const Model = require(`../models/${modelName}`);
        const recordId = req.params.id;
        
        if (recordId) {
          const originalRecord = await Model.findById(recordId).lean();
          req.originalData = originalRecord;
        }
      } catch (error) {
        console.error('خطأ في جلب البيانات الأصلية:', error);
      }
    }
    next();
  };
};

/**
 * تسجيل عمليات تسجيل الدخول والخروج
 */
const logAuthentication = async (userId, action, metadata = {}) => {
  const user = await require('../models/User').findById(userId);
  if (!user) return;
  
  const logData = {
    action,
    userId,
    userRole: user.role,
    userName: user.fullName,
    modelName: 'User',
    recordId: userId,
    metadata: {
      ...metadata,
      timestamp: new Date()
    },
    category: 'AUTHENTICATION',
    severity: action === 'LOGIN' ? 'MEDIUM' : 'LOW',
    success: true
  };
  
  await AuditLog.log(logData);
};

/**
 * تسجيل عمليات إدارية خاصة
 */
const logAdminAction = async (adminId, action, targetModel, targetId, reason, metadata = {}) => {
  const admin = await require('../models/User').findById(adminId);
  if (!admin) return;
  
  const logData = {
    action,
    userId: adminId,
    userRole: admin.role,
    userName: admin.fullName,
    modelName: targetModel,
    recordId: targetId,
    reason,
    metadata,
    category: 'SYSTEM',
    severity: 'HIGH',
    success: true
  };
  
  await AuditLog.log(logData);
};

module.exports = {
  auditLogger,
  captureOriginalData,
  logAuthentication,
  logAdminAction
}; 
const mongoose = require('mongoose');
const { USER_ROLES } = require('../config/constants');

const auditLogSchema = new mongoose.Schema({
  // العملية المنفذة
  action: {
    type: String,
    enum: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'APPROVE', 'REJECT'],
    required: true
  },
  
  // المستخدم المنفذ للعملية
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  userRole: {
    type: String,
    enum: Object.values(USER_ROLES),
    required: true
  },
  
  userName: {
    type: String,
    required: true
  },
  
  // النموذج/الجدول المتأثر
  modelName: {
    type: String,
    required: true,
    enum: ['User', 'Doctor', 'Patient', 'Clinic', 'Appointment', 'MedicalRecord', 'Review', 'Admin', 'Visitor']
  },
  
  // معرف السجل المتأثر
  recordId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  
  // البيانات قبل التغيير
  oldValues: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  
  // البيانات بعد التغيير
  newValues: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  
  // التغييرات فقط (للتحديثات)
  changes: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  
  // معلومات إضافية
  metadata: {
    ipAddress: String,
    userAgent: String,
    method: String,      // GET, POST, PUT, DELETE
    endpoint: String,    // API endpoint
    statusCode: Number,  // HTTP status code
    responseTime: Number, // وقت الاستجابة بالميلي ثانية
    requestSize: Number, // حجم الطلب
    responseSize: Number // حجم الاستجابة
  },
  
  // معلومات الجلسة
  sessionId: String,
  
  // السبب أو الوصف
  reason: String,
  
  // ملاحظات إضافية
  notes: String,
  
  // تصنيف مستوى الأهمية
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM'
  },
  
  // الفئة
  category: {
    type: String,
    enum: ['AUTHENTICATION', 'AUTHORIZATION', 'DATA_ACCESS', 'DATA_MODIFICATION', 'SECURITY', 'SYSTEM', 'MEDICAL'],
    required: true
  },
  
  // البيانات الحساسة (للعمليات الطبية)
  isSensitive: {
    type: Boolean,
    default: false
  },
  
  // نجحت العملية أم لا
  success: {
    type: Boolean,
    default: true
  },
  
  // رسالة الخطأ (إن وجد)
  errorMessage: String,
  
  // الموقع الجغرافي (اختياري)
  location: {
    country: String,
    city: String,
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  },
  
  // للأنظمة المتكاملة
  externalSystemId: String,
  externalSystemName: String,
  
  // علامة زمنية دقيقة
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // تاريخ انتهاء الصلاحية (للحذف التلقائي)
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual للمستخدم
auditLogSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Indexes للأداء
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ modelName: 1, recordId: 1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ category: 1, timestamp: -1 });
auditLogSchema.index({ severity: 1, timestamp: -1 });
auditLogSchema.index({ success: 1, timestamp: -1 });
auditLogSchema.index({ 'metadata.ipAddress': 1 });
auditLogSchema.index({ sessionId: 1 });

// Static methods
auditLogSchema.statics.log = async function(logData) {
  try {
    const auditLog = new this(logData);
    await auditLog.save();
    return auditLog;
  } catch (error) {
    console.error('خطأ في تسجيل Audit Log:', error);
    // لا نريد أن نوقف العملية الأساسية بسبب خطأ في السجل
  }
};

// Static method للبحث المتقدم
auditLogSchema.statics.searchLogs = async function(filters, options = {}) {
  const {
    page = 1,
    limit = 50,
    sortBy = 'timestamp',
    sortOrder = -1
  } = options;

  const query = {};
  
  if (filters.userId) query.userId = filters.userId;
  if (filters.action) query.action = filters.action;
  if (filters.modelName) query.modelName = filters.modelName;
  if (filters.category) query.category = filters.category;
  if (filters.severity) query.severity = filters.severity;
  if (filters.success !== undefined) query.success = filters.success;
  
  if (filters.dateFrom || filters.dateTo) {
    query.timestamp = {};
    if (filters.dateFrom) query.timestamp.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) query.timestamp.$lte = new Date(filters.dateTo);
  }
  
  if (filters.ipAddress) {
    query['metadata.ipAddress'] = filters.ipAddress;
  }

  const skip = (page - 1) * limit;
  
  const [logs, total] = await Promise.all([
    this.find(query)
        .populate('user', 'fullName email role')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
    this.countDocuments(query)
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  };
};

// Static method للإحصائيات
auditLogSchema.statics.getStats = async function(timeframe = '24h') {
  const now = new Date();
  let startDate;
  
  switch (timeframe) {
    case '1h': startDate = new Date(now - 60 * 60 * 1000); break;
    case '24h': startDate = new Date(now - 24 * 60 * 60 * 1000); break;
    case '7d': startDate = new Date(now - 7 * 24 * 60 * 60 * 1000); break;
    case '30d': startDate = new Date(now - 30 * 24 * 60 * 60 * 1000); break;
    default: startDate = new Date(now - 24 * 60 * 60 * 1000);
  }

  const stats = await this.aggregate([
    { $match: { timestamp: { $gte: startDate } } },
    {
      $group: {
        _id: null,
        totalLogs: { $sum: 1 },
        successfulActions: { $sum: { $cond: ['$success', 1, 0] } },
        failedActions: { $sum: { $cond: ['$success', 0, 1] } },
        uniqueUsers: { $addToSet: '$userId' },
        actionBreakdown: {
          $push: {
            action: '$action',
            category: '$category',
            severity: '$severity'
          }
        }
      }
    },
    {
      $project: {
        totalLogs: 1,
        successfulActions: 1,
        failedActions: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        successRate: {
          $multiply: [
            { $divide: ['$successfulActions', '$totalLogs'] },
            100
          ]
        }
      }
    }
  ]);

  return stats[0] || {
    totalLogs: 0,
    successfulActions: 0,
    failedActions: 0,
    uniqueUsers: 0,
    successRate: 0
  };
};

// Method للحصول على سجل مخصص لسجل معين
auditLogSchema.statics.getRecordHistory = async function(modelName, recordId) {
  return this.find({ modelName, recordId })
             .populate('user', 'fullName email role')
             .sort({ timestamp: -1 })
             .lean();
};

// Pre-save middleware لتعيين expiresAt
auditLogSchema.pre('save', function(next) {
  if (!this.expiresAt) {
    // الاحتفاظ بالسجلات لمدة سنة واحدة (للمتطلبات القانونية)
    this.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  }
  next();
});

module.exports = mongoose.model('AuditLog', auditLogSchema); 
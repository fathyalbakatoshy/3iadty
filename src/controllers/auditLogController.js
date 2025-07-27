const AuditLog = require('../models/AuditLog');
const { sendSuccess, sendError, sendNotFound } = require('../utils/response');
const { isValidObjectId, formatArabicDate, getTimeDifference } = require('../utils/helpers');

/**
 * جلب جميع سجلات التدقيق مع التصفية
 */
const getAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      sortBy = 'timestamp',
      sortOrder = 'desc',
      action,
      modelName,
      category,
      severity,
      success,
      userId,
      dateFrom,
      dateTo,
      ipAddress,
      search
    } = req.query;

    // بناء فلاتر البحث
    const filters = {};
    
    if (action) filters.action = action;
    if (modelName) filters.modelName = modelName;
    if (category) filters.category = category;
    if (severity) filters.severity = severity;
    if (success !== undefined) filters.success = success === 'true';
    if (userId && isValidObjectId(userId)) filters.userId = userId;
    if (ipAddress) filters.ipAddress = ipAddress;

    // فلترة بالتاريخ
    if (dateFrom || dateTo) {
      filters.dateFrom = dateFrom;
      filters.dateTo = dateTo;
    }

    // البحث النصي في الحقول المختلفة
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filters.$or = [
        { userName: searchRegex },
        { reason: searchRegex },
        { notes: searchRegex },
        { errorMessage: searchRegex }
      ];
    }

    const options = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100), // الحد الأقصى 100
      sortBy,
      sortOrder: sortOrder === 'asc' ? 1 : -1
    };

    const result = await AuditLog.searchLogs(filters, options);

    // تنسيق البيانات للعرض
    const formattedLogs = result.logs.map(log => ({
      ...log,
      formattedTimestamp: formatArabicDate(log.timestamp),
      timeDifference: getTimeDifference(log.timestamp),
      metadata: {
        ...log.metadata,
        responseTimeFormatted: `${log.metadata.responseTime}ms`,
        requestSizeFormatted: require('../utils/helpers').formatBytes(log.metadata.requestSize || 0),
        responseSizeFormatted: require('../utils/helpers').formatBytes(log.metadata.responseSize || 0)
      }
    }));

    return sendSuccess(res, 'تم جلب سجلات التدقيق بنجاح', {
      logs: formattedLogs,
      pagination: result.pagination,
      filters: req.query
    });

  } catch (error) {
    console.error('خطأ في جلب سجلات التدقيق:', error);
    return sendError(res, 'خطأ في جلب سجلات التدقيق', 500);
  }
};

/**
 * جلب سجل تدقيق محدد
 */
const getAuditLogById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendError(res, 'معرف سجل التدقيق غير صحيح', 400);
    }

    const auditLog = await AuditLog.findById(id)
      .populate('user', 'fullName email role profilePicture')
      .lean();

    if (!auditLog) {
      return sendNotFound(res, 'سجل التدقيق غير موجود');
    }

    // تنسيق البيانات
    const formattedLog = {
      ...auditLog,
      formattedTimestamp: formatArabicDate(auditLog.timestamp),
      timeDifference: getTimeDifference(auditLog.timestamp),
      metadata: {
        ...auditLog.metadata,
        responseTimeFormatted: `${auditLog.metadata?.responseTime || 0}ms`,
        requestSizeFormatted: require('../utils/helpers').formatBytes(auditLog.metadata?.requestSize || 0),
        responseSizeFormatted: require('../utils/helpers').formatBytes(auditLog.metadata?.responseSize || 0),
        userAgentParsed: require('../utils/helpers').parseUserAgent(auditLog.metadata?.userAgent || '')
      }
    };

    return sendSuccess(res, 'تم جلب سجل التدقيق بنجاح', formattedLog);

  } catch (error) {
    console.error('خطأ في جلب سجل التدقيق:', error);
    return sendError(res, 'خطأ في جلب سجل التدقيق', 500);
  }
};

/**
 * جلب تاريخ سجل معين
 */
const getRecordHistory = async (req, res) => {
  try {
    const { modelName, recordId } = req.params;

    if (!isValidObjectId(recordId)) {
      return sendError(res, 'معرف السجل غير صحيح', 400);
    }

    const allowedModels = ['User', 'Doctor', 'Patient', 'Clinic', 'Appointment', 'MedicalRecord', 'Review', 'Admin'];
    if (!allowedModels.includes(modelName)) {
      return sendError(res, 'نوع النموذج غير مدعوم', 400);
    }

    const history = await AuditLog.getRecordHistory(modelName, recordId);

    // تنسيق البيانات
    const formattedHistory = history.map(log => ({
      _id: log._id,
      action: log.action,
      user: log.user,
      timestamp: log.timestamp,
      formattedTimestamp: formatArabicDate(log.timestamp),
      timeDifference: getTimeDifference(log.timestamp),
      changes: log.changes,
      reason: log.reason,
      severity: log.severity,
      success: log.success,
      metadata: {
        ipAddress: log.metadata?.ipAddress,
        method: log.metadata?.method,
        endpoint: log.metadata?.endpoint
      }
    }));

    return sendSuccess(res, 'تم جلب تاريخ السجل بنجاح', {
      modelName,
      recordId,
      history: formattedHistory,
      totalEntries: formattedHistory.length
    });

  } catch (error) {
    console.error('خطأ في جلب تاريخ السجل:', error);
    return sendError(res, 'خطأ في جلب تاريخ السجل', 500);
  }
};

/**
 * إحصائيات سجلات التدقيق
 */
const getAuditStats = async (req, res) => {
  try {
    const { timeframe = '24h' } = req.query;
    
    const allowedTimeframes = ['1h', '24h', '7d', '30d'];
    if (!allowedTimeframes.includes(timeframe)) {
      return sendError(res, 'فترة زمنية غير صحيحة', 400);
    }

    const stats = await AuditLog.getStats(timeframe);

    // إحصائيات إضافية
    const additionalStats = await Promise.all([
      // أكثر المستخدمين نشاطاً
      AuditLog.aggregate([
        { $match: { timestamp: { $gte: getTimeframeDate(timeframe) } } },
        { $group: { _id: '$userId', count: { $sum: 1 }, userName: { $first: '$userName' } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      
      // أكثر العمليات تكراراً
      AuditLog.aggregate([
        { $match: { timestamp: { $gte: getTimeframeDate(timeframe) } } },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      // توزيع حسب الفئة
      AuditLog.aggregate([
        { $match: { timestamp: { $gte: getTimeframeDate(timeframe) } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      // الأخطاء الأكثر تكراراً
      AuditLog.aggregate([
        { 
          $match: { 
            timestamp: { $gte: getTimeframeDate(timeframe) },
            success: false,
            errorMessage: { $exists: true, $ne: null }
          }
        },
        { $group: { _id: '$errorMessage', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    const [topUsers, topActions, categoryDistribution, topErrors] = additionalStats;

    return sendSuccess(res, 'تم جلب إحصائيات التدقيق بنجاح', {
      timeframe,
      overview: stats,
      topUsers,
      topActions,
      categoryDistribution,
      topErrors,
      generatedAt: new Date()
    });

  } catch (error) {
    console.error('خطأ في جلب إحصائيات التدقيق:', error);
    return sendError(res, 'خطأ في جلب إحصائيات التدقيق', 500);
  }
};

/**
 * تصدير سجلات التدقيق
 */
const exportAuditLogs = async (req, res) => {
  try {
    const { format = 'json', ...filters } = req.query;
    
    if (!['json', 'csv'].includes(format)) {
      return sendError(res, 'صيغة التصدير غير مدعومة', 400);
    }

    // تحديد حد أقصى للتصدير
    const maxExportLimit = 10000;
    filters.limit = Math.min(filters.limit || 1000, maxExportLimit);

    const result = await AuditLog.searchLogs(filters, { 
      page: 1, 
      limit: filters.limit,
      sortBy: 'timestamp',
      sortOrder: -1
    });

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.json"`);
      return res.json(result.logs);
    }

    if (format === 'csv') {
      const csv = convertToCSV(result.logs);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send('\ufeff' + csv); // BOM for UTF-8
    }

  } catch (error) {
    console.error('خطأ في تصدير سجلات التدقيق:', error);
    return sendError(res, 'خطأ في تصدير سجلات التدقيق', 500);
  }
};

/**
 * حذف سجلات التدقيق القديمة
 */
const cleanupOldLogs = async (req, res) => {
  try {
    // التحقق من الصلاحيات (إداري فقط)
    if (req.user.role !== 'admin') {
      return sendError(res, 'غير مخول لتنفيذ هذه العملية', 403);
    }

    const { days = 365 } = req.body;
    
    if (days < 30) {
      return sendError(res, 'لا يمكن حذف سجلات أقل من 30 يوم للامتثال القانوني', 400);
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await AuditLog.deleteMany({
      timestamp: { $lt: cutoffDate },
      category: { $ne: 'MEDICAL' } // الاحتفاظ بالسجلات الطبية أطول
    });

    // تسجيل عملية التنظيف
    await require('../middlewares/auditLogger').logAdminAction(
      req.user.id,
      'CLEANUP',
      'AuditLog',
      null,
      `تنظيف السجلات الأقدم من ${days} يوم`,
      { deletedCount: result.deletedCount }
    );

    return sendSuccess(res, 'تم تنظيف السجلات القديمة بنجاح', {
      deletedCount: result.deletedCount,
      cutoffDate,
      days
    });

  } catch (error) {
    console.error('خطأ في تنظيف السجلات القديمة:', error);
    return sendError(res, 'خطأ في تنظيف السجلات القديمة', 500);
  }
};

/**
 * البحث المتقدم في سجلات التدقيق
 */
const advancedSearch = async (req, res) => {
  try {
    const {
      query,
      filters = {},
      page = 1,
      limit = 50
    } = req.body;

    if (!query || query.trim().length < 2) {
      return sendError(res, 'يجب أن يكون البحث على الأقل حرفين', 400);
    }

    const searchRegex = new RegExp(query.trim(), 'i');
    
    const searchFilters = {
      ...filters,
      $or: [
        { userName: searchRegex },
        { action: searchRegex },
        { modelName: searchRegex },
        { reason: searchRegex },
        { notes: searchRegex },
        { errorMessage: searchRegex },
        { 'metadata.endpoint': searchRegex }
      ]
    };

    const options = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100),
      sortBy: 'timestamp',
      sortOrder: -1
    };

    const result = await AuditLog.searchLogs(searchFilters, options);

    return sendSuccess(res, 'تم البحث بنجاح', {
      query,
      results: result.logs.map(log => ({
        ...log,
        formattedTimestamp: formatArabicDate(log.timestamp),
        timeDifference: getTimeDifference(log.timestamp)
      })),
      pagination: result.pagination
    });

  } catch (error) {
    console.error('خطأ في البحث المتقدم:', error);
    return sendError(res, 'خطأ في البحث المتقدم', 500);
  }
};

// Helper Functions

/**
 * الحصول على تاريخ الفترة الزمنية
 */
const getTimeframeDate = (timeframe) => {
  const now = new Date();
  switch (timeframe) {
    case '1h': return new Date(now - 60 * 60 * 1000);
    case '24h': return new Date(now - 24 * 60 * 60 * 1000);
    case '7d': return new Date(now - 7 * 24 * 60 * 60 * 1000);
    case '30d': return new Date(now - 30 * 24 * 60 * 60 * 1000);
    default: return new Date(now - 24 * 60 * 60 * 1000);
  }
};

/**
 * تحويل البيانات إلى CSV
 */
const convertToCSV = (logs) => {
  if (!logs || logs.length === 0) return '';

  const headers = [
    'التاريخ والوقت',
    'المستخدم',
    'العملية',
    'النموذج',
    'الفئة',
    'الأهمية',
    'النجاح',
    'عنوان IP',
    'المتصفح',
    'نقطة النهاية',
    'رسالة الخطأ'
  ];

  const csvRows = [headers.join(',')];

  logs.forEach(log => {
    const row = [
      `"${formatArabicDate(log.timestamp)}"`,
      `"${log.userName || ''}"`,
      `"${log.action || ''}"`,
      `"${log.modelName || ''}"`,
      `"${log.category || ''}"`,
      `"${log.severity || ''}"`,
      `"${log.success ? 'نعم' : 'لا'}"`,
      `"${log.metadata?.ipAddress || ''}"`,
      `"${log.metadata?.userAgent || ''}"`,
      `"${log.metadata?.endpoint || ''}"`,
      `"${log.errorMessage || ''}"`
    ];
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
};

module.exports = {
  getAuditLogs,
  getAuditLogById,
  getRecordHistory,
  getAuditStats,
  exportAuditLogs,
  cleanupOldLogs,
  advancedSearch
}; 
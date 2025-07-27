const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const { formatArabicDate, getTimeDifference } = require('../utils/helpers');

let io = null;
const connectedUsers = new Map(); // userId -> socket
const adminConnections = new Set(); // admin socket IDs
const doctorConnections = new Map(); // doctorId -> socket IDs

/**
 * Initialize Socket.IO server
 */
const initializeRealTimeAudit = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true
    },
    path: '/socket.io/'
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('مطلوب تسجيل الدخول للاتصال'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user || !user.isActive) {
        return next(new Error('المستخدم غير نشط'));
      }

      socket.userId = user._id.toString();
      socket.userRole = user.role;
      socket.userName = user.fullName;
      next();
    } catch (error) {
      next(new Error('خطأ في التحقق من الهوية'));
    }
  });

  // Handle connections
  io.on('connection', (socket) => {
    console.log(`🔗 اتصال جديد: ${socket.userName} (${socket.userRole})`);
    
    // Store connection
    connectedUsers.set(socket.userId, socket);
    
    // Add to role-specific collections
    if (socket.userRole === 'admin') {
      adminConnections.add(socket.id);
    } else if (socket.userRole === 'doctor') {
      if (!doctorConnections.has(socket.userId)) {
        doctorConnections.set(socket.userId, new Set());
      }
      doctorConnections.get(socket.userId).add(socket.id);
    }

    // Join user to their own room
    socket.join(`user:${socket.userId}`);
    
    // Join role-specific rooms
    socket.join(`role:${socket.userRole}`);
    
    // Admin joins all rooms for monitoring
    if (socket.userRole === 'admin') {
      socket.join('admin:all');
      socket.join('admin:security');
      socket.join('admin:medical');
      socket.join('admin:system');
    }

    // Send welcome message
    socket.emit('audit:connected', {
      message: 'مرحبا بيك! تم الاتصال بنجاح',
      timestamp: new Date(),
      userRole: socket.userRole
    });

    // Handle custom events
    socket.on('audit:subscribe', (filters) => {
      handleSubscription(socket, filters);
    });

    socket.on('audit:unsubscribe', (room) => {
      socket.leave(room);
      socket.emit('audit:unsubscribed', { room });
    });

    socket.on('audit:get_stats', async () => {
      if (socket.userRole === 'admin') {
        const stats = await getRealtimeStats();
        socket.emit('audit:stats', stats);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`❌ انقطع الاتصال: ${socket.userName}`);
      
      // Remove from collections
      connectedUsers.delete(socket.userId);
      adminConnections.delete(socket.id);
      
      if (doctorConnections.has(socket.userId)) {
        doctorConnections.get(socket.userId).delete(socket.id);
        if (doctorConnections.get(socket.userId).size === 0) {
          doctorConnections.delete(socket.userId);
        }
      }
    });
  });

  console.log('🟢 Real-time Audit Service initialized');
  return io;
};

/**
 * Handle user subscription to specific audit channels
 */
const handleSubscription = (socket, filters) => {
  const { categories, severity, modelTypes } = filters;

  // Validate permissions
  if (socket.userRole !== 'admin' && socket.userRole !== 'doctor') {
    socket.emit('audit:error', { message: 'مالكش صلاحية تشوف السجلات دي' });
    return;
  }

  // Subscribe to categories
  if (categories && Array.isArray(categories)) {
    categories.forEach(category => {
      if (socket.userRole === 'admin' || (socket.userRole === 'doctor' && category === 'MEDICAL')) {
        socket.join(`category:${category}`);
      }
    });
  }

  // Subscribe to severity levels
  if (severity && Array.isArray(severity)) {
    severity.forEach(level => {
      if (socket.userRole === 'admin') {
        socket.join(`severity:${level}`);
      }
    });
  }

  // Subscribe to model types
  if (modelTypes && Array.isArray(modelTypes)) {
    modelTypes.forEach(model => {
      if (socket.userRole === 'admin' || 
          (socket.userRole === 'doctor' && ['Patient', 'Appointment', 'MedicalRecord'].includes(model))) {
        socket.join(`model:${model}`);
      }
    });
  }

  socket.emit('audit:subscribed', { filters });
};

/**
 * Broadcast audit log in real-time
 */
const broadcastAuditLog = async (auditLogData) => {
  if (!io) return;

  try {
    // Format the audit log for broadcast
    const formattedLog = {
      ...auditLogData,
      formattedTimestamp: formatArabicDate(auditLogData.timestamp),
      timeDifference: getTimeDifference(auditLogData.timestamp),
      isRealTime: true
    };

    // Broadcast to admins (all audit logs)
    io.to('role:admin').emit('audit:new_log', formattedLog);

    // Broadcast to specific channels
    if (auditLogData.category) {
      io.to(`category:${auditLogData.category}`).emit('audit:new_log', formattedLog);
    }

    if (auditLogData.severity) {
      io.to(`severity:${auditLogData.severity}`).emit('audit:new_log', formattedLog);
    }

    if (auditLogData.modelName) {
      io.to(`model:${auditLogData.modelName}`).emit('audit:new_log', formattedLog);
    }

    // Special handling for medical logs (doctors only see their patients)
    if (auditLogData.category === 'MEDICAL' && auditLogData.doctorId) {
      io.to(`user:${auditLogData.doctorId}`).emit('audit:new_log', formattedLog);
    }

    // Security alerts for high/critical severity
    if (['HIGH', 'CRITICAL'].includes(auditLogData.severity)) {
      broadcastSecurityAlert(formattedLog);
    }

    // Failed login attempts
    if (auditLogData.action === 'LOGIN' && !auditLogData.success) {
      broadcastSecurityAlert({
        ...formattedLog,
        alertType: 'FAILED_LOGIN',
        message: `محاولة دخول فاشلة من ${auditLogData.metadata?.ipAddress || 'IP غير معروف'}`
      });
    }

  } catch (error) {
    console.error('خطأ في بث audit log:', error);
  }
};

/**
 * Broadcast security alerts
 */
const broadcastSecurityAlert = (alertData) => {
  if (!io) return;

  const securityAlert = {
    type: 'security_alert',
    data: alertData,
    timestamp: new Date(),
    alertLevel: alertData.severity === 'CRITICAL' ? 'urgent' : 'warning'
  };

  // Send to all admins
  io.to('role:admin').emit('audit:security_alert', securityAlert);
  
  // Send to security monitoring room
  io.to('admin:security').emit('audit:security_alert', securityAlert);
};

/**
 * Get real-time statistics
 */
const getRealtimeStats = async () => {
  const now = new Date();
  const oneHourAgo = new Date(now - 60 * 60 * 1000);

  try {
    const stats = await AuditLog.aggregate([
      { $match: { timestamp: { $gte: oneHourAgo } } },
      {
        $group: {
          _id: null,
          totalLogs: { $sum: 1 },
          successfulOps: { $sum: { $cond: ['$success', 1, 0] } },
          failedOps: { $sum: { $cond: ['$success', 0, 1] } },
          criticalEvents: { $sum: { $cond: [{ $eq: ['$severity', 'CRITICAL'] }, 1, 0] } },
          securityEvents: { $sum: { $cond: [{ $eq: ['$category', 'SECURITY'] }, 1, 0] } },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          totalLogs: 1,
          successfulOps: 1,
          failedOps: 1,
          criticalEvents: 1,
          securityEvents: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
          successRate: {
            $multiply: [
              { $divide: ['$successfulOps', '$totalLogs'] },
              100
            ]
          }
        }
      }
    ]);

    return {
      ...stats[0],
      connectedUsers: connectedUsers.size,
      connectedAdmins: adminConnections.size,
      connectedDoctors: doctorConnections.size,
      timeframe: 'آخر ساعة',
      lastUpdate: new Date()
    };
  } catch (error) {
    console.error('خطأ في إحصائيات الوقت الفعلي:', error);
    return {
      error: 'خطأ في جلب الإحصائيات'
    };
  }
};

/**
 * Send notification to specific user
 */
const notifyUser = (userId, event, data) => {
  if (!io) return;

  const userSocket = connectedUsers.get(userId.toString());
  if (userSocket) {
    userSocket.emit(event, {
      ...data,
      timestamp: new Date(),
      notificationType: 'user_specific'
    });
  }
};

/**
 * Send notification to all users with specific role
 */
const notifyRole = (role, event, data) => {
  if (!io) return;

  io.to(`role:${role}`).emit(event, {
    ...data,
    timestamp: new Date(),
    notificationType: 'role_broadcast'
  });
};

/**
 * Broadcast system maintenance notification
 */
const broadcastMaintenance = (message, duration) => {
  if (!io) return;

  io.emit('system:maintenance', {
    message,
    duration,
    timestamp: new Date()
  });
};

/**
 * Get connected users summary
 */
const getConnectedUsersSummary = () => {
  return {
    total: connectedUsers.size,
    admins: adminConnections.size,
    doctors: doctorConnections.size,
    byRole: {
      admin: adminConnections.size,
      doctor: doctorConnections.size,
      other: connectedUsers.size - adminConnections.size - doctorConnections.size
    }
  };
};

/**
 * Emergency broadcast to all connected users
 */
const emergencyBroadcast = (message, level = 'warning') => {
  if (!io) return;

  io.emit('system:emergency', {
    message,
    level,
    timestamp: new Date(),
    requiresAction: level === 'critical'
  });
};

module.exports = {
  initializeRealTimeAudit,
  broadcastAuditLog,
  broadcastSecurityAlert,
  notifyUser,
  notifyRole,
  broadcastMaintenance,
  emergencyBroadcast,
  getConnectedUsersSummary,
  getRealtimeStats
}; 
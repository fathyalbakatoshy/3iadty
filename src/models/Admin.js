const mongoose = require('mongoose');
const { USER_ROLES } = require('../config/constants');

const adminSchema = new mongoose.Schema({
  // Reference to User
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Admin Specific Information
  adminId: {
    type: String,
    unique: true,
    required: true
  },
  
  // Admin Level and Permissions
  adminLevel: {
    type: String,
    enum: ['super_admin', 'system_admin', 'content_admin', 'support_admin'],
    default: 'support_admin'
  },
  
  permissions: {
    // User Management
    canManageUsers: {
      type: Boolean,
      default: false
    },
    canManageDoctors: {
      type: Boolean,
      default: false
    },
    canManagePatients: {
      type: Boolean,
      default: false
    },
    
    // Clinic Management
    canManageClinics: {
      type: Boolean,
      default: false
    },
    canVerifyClinics: {
      type: Boolean,
      default: false
    },
    
    // Appointment Management
    canManageAppointments: {
      type: Boolean,
      default: true
    },
    canCancelAppointments: {
      type: Boolean,
      default: false
    },
    
    // Content Management
    canModerateReviews: {
      type: Boolean,
      default: true
    },
    canManageContent: {
      type: Boolean,
      default: false
    },
    
    // System Management
    canAccessAnalytics: {
      type: Boolean,
      default: false
    },
    canManageSettings: {
      type: Boolean,
      default: false
    },
    canManageAdmins: {
      type: Boolean,
      default: false
    },
    
    // Financial Management
    canViewFinancials: {
      type: Boolean,
      default: false
    },
    canManagePayments: {
      type: Boolean,
      default: false
    },
    
    // Medical Records
    canAccessMedicalRecords: {
      type: Boolean,
      default: false
    },
    canExportData: {
      type: Boolean,
      default: false
    }
  },
  
  // Administrative Information
  department: {
    type: String,
    enum: ['IT', 'Customer Support', 'Operations', 'Medical Affairs', 'Finance', 'Marketing'],
    required: true
  },
  
  position: {
    type: String,
    required: [true, 'المنصب مطلوب']
  },
  
  employeeId: String,
  
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  
  // Contact Information
  workEmail: {
    type: String,
    required: [true, 'البريد الإلكتروني للعمل مطلوب'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'البريد الإلكتروني غير صحيح']
  },
  
  workPhone: {
    type: String,
    validate: {
      validator: function(value) {
        if (!value) return true; // Optional field
        const { validateEgyptianPhone } = require('../utils/egyptianPhoneValidator');
        return validateEgyptianPhone(value, 'any').isValid;
      },
      message: 'رقم الهاتف غير صحيح - يجب أن يكون رقم هاتف مصري صالح'
    }
  },
  
  extension: String,
  
  // Security and Access
  lastLoginAt: Date,
  
  currentLoginIP: String,
  
  loginHistory: [{
    loginAt: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String,
    location: String,
    success: {
      type: Boolean,
      default: true
    }
  }],
  
  // Two-Factor Authentication
  twoFactorAuth: {
    isEnabled: {
      type: Boolean,
      default: false
    },
    secret: String,
    backupCodes: [String],
    lastUsedAt: Date
  },
  
  // Session Management
  activeSessions: [{
    sessionId: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    lastActivity: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String
  }],
  
  // Administrative Actions Log
  actionLog: [{
    action: {
      type: String,
      required: true
    },
    targetType: {
      type: String,
      enum: ['User', 'Doctor', 'Patient', 'Clinic', 'Appointment', 'Review', 'MedicalRecord', 'System']
    },
    targetId: String,
    details: mongoose.Schema.Types.Mixed,
    timestamp: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String
  }],
  
  // Work Schedule
  workSchedule: {
    workingDays: [{
      type: String,
      enum: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    }],
    workingHours: {
      start: {
        type: String,
        default: '09:00'
      },
      end: {
        type: String,
        default: '17:00'
      }
    },
    timezone: {
      type: String,
      default: 'Asia/Riyadh'
    }
  },
  
  // Responsibilities and Areas
  responsibilities: [String],
  
  managedAreas: [{
    type: String,
    enum: ['users', 'clinics', 'doctors', 'patients', 'appointments', 'reviews', 'analytics', 'system']
  }],
  
  // Approval Workflows
  approvalLimits: {
    maxAppointmentValue: {
      type: Number,
      default: 0
    },
    canApproveRefunds: {
      type: Boolean,
      default: false
    },
    maxRefundAmount: {
      type: Number,
      default: 0
    }
  },
  
  // Performance Metrics
  performanceMetrics: {
    ticketsResolved: {
      type: Number,
      default: 0
    },
    averageResponseTime: {
      type: Number, // in minutes
      default: 0
    },
    customerSatisfactionRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    lastEvaluationDate: Date
  },
  
  // Status and Employment
  employmentStatus: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'terminated'],
    default: 'active'
  },
  
  hireDate: {
    type: Date,
    required: [true, 'تاريخ التوظيف مطلوب']
  },
  
  terminationDate: Date,
  
  terminationReason: String,
  
  // Emergency Contact
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
    email: String
  },
  
  // Notes and Comments
  notes: [{
    note: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    category: {
      type: String,
      enum: ['general', 'performance', 'disciplinary', 'recognition']
    },
    isConfidential: {
      type: Boolean,
      default: false
    }
  }]

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for user information
adminSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Virtual for manager information
adminSchema.virtual('managerInfo', {
  ref: 'Admin',
  localField: 'manager',
  foreignField: '_id',
  justOne: true
});

// Virtual to check if admin is currently working
adminSchema.virtual('isCurrentlyWorking').get(function() {
  const now = new Date();
  const currentDay = now.toLocaleLowerCase().split('day')[0]; // Get day name
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
  
  const isWorkingDay = this.workSchedule.workingDays.includes(currentDay);
  const isWorkingHour = currentTime >= this.workSchedule.workingHours.start && 
                       currentTime <= this.workSchedule.workingHours.end;
  
  return isWorkingDay && isWorkingHour && this.employmentStatus === 'active';
});

// Indexes for better performance
adminSchema.index({ adminId: 1 });
adminSchema.index({ userId: 1 });
adminSchema.index({ workEmail: 1 });
adminSchema.index({ adminLevel: 1 });
adminSchema.index({ department: 1 });
adminSchema.index({ employmentStatus: 1 });
adminSchema.index({ createdAt: -1 });

// Pre-save middleware to generate admin ID
adminSchema.pre('save', async function(next) {
  if (this.isNew && !this.adminId) {
    // Generate admin ID: AD + YYYY + sequential number
    const year = new Date().getFullYear();
    
    // Find the last admin created this year
    const lastAdmin = await this.constructor.findOne({
      adminId: new RegExp(`^AD${year}`)
    }).sort({ adminId: -1 });
    
    let sequence = '001';
    if (lastAdmin) {
      const lastSequence = parseInt(lastAdmin.adminId.slice(-3));
      sequence = String(lastSequence + 1).padStart(3, '0');
    }
    
    this.adminId = `AD${year}${sequence}`;
  }
  next();
});

// Method to log admin action
adminSchema.methods.logAction = function(action, targetType, targetId, details, req) {
  this.actionLog.push({
    action,
    targetType,
    targetId,
    details,
    timestamp: new Date(),
    ipAddress: req?.ip || req?.connection?.remoteAddress,
    userAgent: req?.get('User-Agent')
  });
  
  return this.save();
};

// Method to check if admin has specific permission
adminSchema.methods.hasPermission = function(permission) {
  // Super admin has all permissions
  if (this.adminLevel === 'super_admin') {
    return true;
  }
  
  return this.permissions[permission] || false;
};

// Method to add login record
adminSchema.methods.addLoginRecord = function(ipAddress, userAgent, location, success = true) {
  this.loginHistory.push({
    loginAt: new Date(),
    ipAddress,
    userAgent,
    location,
    success
  });
  
  // Keep only last 50 login records
  if (this.loginHistory.length > 50) {
    this.loginHistory = this.loginHistory.slice(-50);
  }
  
  if (success) {
    this.lastLoginAt = new Date();
    this.currentLoginIP = ipAddress;
  }
  
  return this.save();
};

// Method to create session
adminSchema.methods.createSession = function(sessionId, ipAddress, userAgent) {
  this.activeSessions.push({
    sessionId,
    createdAt: new Date(),
    lastActivity: new Date(),
    ipAddress,
    userAgent
  });
  
  return this.save();
};

// Method to update session activity
adminSchema.methods.updateSessionActivity = function(sessionId) {
  const session = this.activeSessions.find(s => s.sessionId === sessionId);
  if (session) {
    session.lastActivity = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove session
adminSchema.methods.removeSession = function(sessionId) {
  this.activeSessions = this.activeSessions.filter(s => s.sessionId !== sessionId);
  return this.save();
};

// Method to add note
adminSchema.methods.addNote = function(note, addedBy, category = 'general', isConfidential = false) {
  this.notes.push({
    note,
    addedBy,
    category,
    isConfidential
  });
  
  return this.save();
};

// Method to update performance metrics
adminSchema.methods.updatePerformanceMetrics = function(metrics) {
  Object.assign(this.performanceMetrics, metrics);
  this.performanceMetrics.lastEvaluationDate = new Date();
  return this.save();
};

// Static method to find by permission
adminSchema.statics.findByPermission = function(permission) {
  return this.find({
    $or: [
      { adminLevel: 'super_admin' },
      { [`permissions.${permission}`]: true }
    ],
    employmentStatus: 'active'
  });
};

// Static method to find by department
adminSchema.statics.findByDepartment = function(department) {
  return this.find({
    department,
    employmentStatus: 'active'
  }).populate('userId', 'fullName mobile email');
};

// Static method to get admin statistics
adminSchema.statics.getAdminStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalAdmins: { $sum: 1 },
        activeAdmins: {
          $sum: { $cond: [{ $eq: ['$employmentStatus', 'active'] }, 1, 0] }
        },
        byDepartment: {
          $push: {
            department: '$department',
            count: 1
          }
        },
        byLevel: {
          $push: {
            level: '$adminLevel',
            count: 1
          }
        }
      }
    }
  ]);
};

// Static method to cleanup expired sessions
adminSchema.statics.cleanupExpiredSessions = function() {
  const expiredTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
  
  return this.updateMany(
    {},
    {
      $pull: {
        activeSessions: {
          lastActivity: { $lt: expiredTime }
        }
      }
    }
  );
};

module.exports = mongoose.model('Admin', adminSchema); 
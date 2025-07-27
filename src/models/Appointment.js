const mongoose = require('mongoose');
const { APPOINTMENT_STATUS, PAYMENT_METHODS } = require('../config/constants');

const appointmentSchema = new mongoose.Schema({
  // Basic Appointment Information
  appointmentId: {
    type: String,
    unique: true,
    required: true
  },
  
  // Patient or Visitor Information
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient'
  },
  
  visitorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visitor'
  },
  
  // For booking on behalf of someone else
  bookingForAnother: {
    isBookingForAnother: {
      type: Boolean,
      default: false
    },
    patientInfo: {
      fullName: String,
      mobile: String,
      age: Number,
      gender: {
        type: String,
        enum: ['male', 'female']
      },
      relationship: String // زوج، ابن، ابنة، إلخ
    }
  },
  
  // Doctor and Clinic Information
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: [true, 'معرف الطبيب مطلوب']
  },
  
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: [true, 'معرف العيادة مطلوب']
  },
  
  // Appointment Scheduling
  dateTime: {
    type: Date,
    required: [true, 'تاريخ ووقت الموعد مطلوب'],
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'لا يمكن حجز موعد في الماضي'
    }
  },
  
  duration: {
    type: Number, // in minutes
    default: 30
  },
  
  appointmentType: {
    type: String,
    enum: ['consultation', 'followup', 'emergency', 'procedure'],
    default: 'consultation'
  },
  
  // Status Management
  status: {
    type: String,
    enum: Object.values(APPOINTMENT_STATUS),
    default: APPOINTMENT_STATUS.PENDING
  },
  
  statusHistory: [{
    status: {
      type: String,
      enum: Object.values(APPOINTMENT_STATUS)
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    notes: String
  }],
  
  // Booking Information
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  bookingSource: {
    type: String,
    enum: ['web', 'mobile', 'phone', 'walk_in'],
    default: 'web'
  },
  
  // Medical Information
  chiefComplaint: {
    type: String,
    maxlength: [500, 'الشكوى الرئيسية لا يجب أن تتجاوز 500 حرف']
  },
  
  symptoms: [String],
  
  notes: {
    patientNotes: String,      // ملاحظات المريض
    doctorNotes: String,       // ملاحظات الطبيب
    receptionNotes: String,    // ملاحظات الاستقبال
    internalNotes: String      // ملاحظات داخلية
  },
  
  // Payment Information
  payment: {
    method: {
      type: String,
      enum: Object.values(PAYMENT_METHODS),
      default: PAYMENT_METHODS.CASH
    },
    amount: {
      type: Number,
      required: [true, 'مبلغ الكشف مطلوب'],
      min: 0
    },
    isPaid: {
      type: Boolean,
      default: false
    },
    paidAt: Date,
    transactionId: String,
    insuranceInfo: {
      company: String,
      policyNumber: String,
      approvalNumber: String,
      copayAmount: Number
    }
  },
  
  // Queue Management
  queueInfo: {
    queueNumber: Number,
    estimatedWaitTime: Number, // in minutes
    checkedInAt: Date,
    calledAt: Date
  },
  
  // Reminders and Notifications
  reminders: {
    sms: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date
    },
    email: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date
    }
  },
  
  // Cancellation Information
  cancellation: {
    canceledAt: Date,
    canceledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    refundAmount: Number,
    refundStatus: {
      type: String,
      enum: ['pending', 'processed', 'rejected'],
      default: 'pending'
    }
  },
  
  // Rescheduling Information
  reschedule: {
    originalDateTime: Date,
    rescheduledAt: Date,
    rescheduledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    rescheduleCount: {
      type: Number,
      default: 0
    }
  },
  
  // Follow-up Information
  followUp: {
    isFollowUp: {
      type: Boolean,
      default: false
    },
    originalAppointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment'
    },
    recommendedDate: Date
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for patient or visitor information
appointmentSchema.virtual('patientInfo', {
  ref: function() {
    return this.patientId ? 'Patient' : 'Visitor';
  },
  localField: function() {
    return this.patientId ? 'patientId' : 'visitorId';
  },
  foreignField: '_id',
  justOne: true
});

// Virtual for doctor information
appointmentSchema.virtual('doctor', {
  ref: 'Doctor',
  localField: 'doctorId',
  foreignField: '_id',
  justOne: true
});

// Virtual for clinic information
appointmentSchema.virtual('clinic', {
  ref: 'Clinic',
  localField: 'clinicId',
  foreignField: '_id',
  justOne: true
});

// Virtual to check if appointment is today
appointmentSchema.virtual('isToday').get(function() {
  const today = new Date();
  const appointmentDate = new Date(this.dateTime);
  
  return appointmentDate.toDateString() === today.toDateString();
});

// Virtual to check if appointment is upcoming
appointmentSchema.virtual('isUpcoming').get(function() {
  return this.dateTime > new Date() && 
         [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.APPROVED].includes(this.status);
});

// Virtual for end time
appointmentSchema.virtual('endTime').get(function() {
  return new Date(this.dateTime.getTime() + (this.duration * 60 * 1000));
});

// Indexes for better performance
appointmentSchema.index({ appointmentId: 1 });
appointmentSchema.index({ patientId: 1 });
appointmentSchema.index({ visitorId: 1 });
appointmentSchema.index({ doctorId: 1, dateTime: 1 });
appointmentSchema.index({ clinicId: 1, dateTime: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ dateTime: 1 });
appointmentSchema.index({ createdAt: -1 });

// Pre-save middleware to generate appointment ID
appointmentSchema.pre('save', async function(next) {
  if (this.isNew && !this.appointmentId) {
    // Generate appointment ID: A + YYYYMMDD + sequential number
    const today = new Date(this.dateTime);
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Find the last appointment for the same date
    const lastAppointment = await this.constructor.findOne({
      appointmentId: new RegExp(`^A${dateStr}`)
    }).sort({ appointmentId: -1 });
    
    let sequence = '001';
    if (lastAppointment) {
      const lastSequence = parseInt(lastAppointment.appointmentId.slice(-3));
      sequence = String(lastSequence + 1).padStart(3, '0');
    }
    
    this.appointmentId = `A${dateStr}${sequence}`;
  }
  next();
});

// Pre-save middleware to track status changes
appointmentSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date()
    });
  }
  next();
});

// Method to change appointment status
appointmentSchema.methods.changeStatus = function(newStatus, changedBy, reason, notes) {
  const oldStatus = this.status;
  this.status = newStatus;
  
  this.statusHistory.push({
    status: newStatus,
    changedAt: new Date(),
    changedBy,
    reason,
    notes
  });
  
  // Handle specific status changes
  if (newStatus === APPOINTMENT_STATUS.CANCELED) {
    this.cancellation = {
      canceledAt: new Date(),
      canceledBy: changedBy,
      reason
    };
  }
  
  return this.save();
};

// Method to reschedule appointment
appointmentSchema.methods.reschedule = function(newDateTime, rescheduledBy, reason) {
  this.reschedule = {
    originalDateTime: this.dateTime,
    rescheduledAt: new Date(),
    rescheduledBy,
    reason,
    rescheduleCount: (this.reschedule?.rescheduleCount || 0) + 1
  };
  
  this.dateTime = newDateTime;
  this.status = APPOINTMENT_STATUS.PENDING;
  
  return this.save();
};

// Method to check for conflicts
appointmentSchema.methods.hasConflict = async function() {
  const startTime = this.dateTime;
  const endTime = this.endTime;
  
  const conflictingAppointment = await this.constructor.findOne({
    _id: { $ne: this._id },
    doctorId: this.doctorId,
    status: { $in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.APPROVED] },
    $or: [
      {
        dateTime: { $lt: endTime },
        $expr: {
          $gt: [
            { $add: ['$dateTime', { $multiply: ['$duration', 60000] }] },
            startTime
          ]
        }
      }
    ]
  });
  
  return !!conflictingAppointment;
};

// Method to calculate wait time
appointmentSchema.methods.calculateWaitTime = async function() {
  const currentTime = new Date();
  const appointmentDate = new Date(this.dateTime);
  appointmentDate.setHours(0, 0, 0, 0);
  
  // Find previous appointments for the same doctor on the same day
  const previousAppointments = await this.constructor.find({
    doctorId: this.doctorId,
    dateTime: {
      $gte: appointmentDate,
      $lt: this.dateTime
    },
    status: { $in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.APPROVED] }
  }).sort({ dateTime: 1 });
  
  let estimatedWaitTime = 0;
  previousAppointments.forEach(apt => {
    estimatedWaitTime += apt.duration || 30;
  });
  
  return estimatedWaitTime;
};

// Static method to find appointments by date range
appointmentSchema.statics.findByDateRange = function(startDate, endDate, filters = {}) {
  return this.find({
    dateTime: {
      $gte: startDate,
      $lte: endDate
    },
    ...filters
  }).populate('doctorId clinicId');
};

// Static method to find today's appointments
appointmentSchema.statics.findTodaysAppointments = function(doctorId = null) {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));
  
  const query = {
    dateTime: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  };
  
  if (doctorId) {
    query.doctorId = doctorId;
  }
  
  return this.find(query).populate('doctorId clinicId patientId visitorId');
};

// Static method to check availability
appointmentSchema.statics.checkAvailability = function(doctorId, dateTime, duration = 30) {
  const startTime = new Date(dateTime);
  const endTime = new Date(startTime.getTime() + (duration * 60 * 1000));
  
  return this.findOne({
    doctorId,
    status: { $in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.APPROVED] },
    $or: [
      {
        dateTime: { $lt: endTime },
        $expr: {
          $gt: [
            { $add: ['$dateTime', { $multiply: ['$duration', 60000] }] },
            startTime
          ]
        }
      }
    ]
  });
};

module.exports = mongoose.model('Appointment', appointmentSchema); 
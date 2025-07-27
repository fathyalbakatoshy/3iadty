const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  // Basic Information
  mobile: {
    type: String,
    required: [true, 'رقم الجوال مطلوب'],
    unique: true,
    trim: true,
    validate: {
      validator: function(value) {
        const { validateEgyptianPhone } = require('../utils/egyptianPhoneValidator');
        return validateEgyptianPhone(value, 'mobile').isValid;
      },
      message: 'رقم الجوال غير صحيح - يجب أن يكون رقم هاتف محمول مصري صالح'
    }
  },
  
  fullName: {
    type: String,
    trim: true,
    maxlength: [100, 'الاسم لا يجب أن يتجاوز 100 حرف']
  },
  
  // OTP Management
  otp: {
    code: String,
    expiresAt: Date,
    isUsed: {
      type: Boolean,
      default: false
    },
    attempts: {
      type: Number,
      default: 0
    },
    lastSentAt: Date
  },
  
  // Session Management
  isVerified: {
    type: Boolean,
    default: false
  },
  
  lastVerifiedAt: Date,
  
  sessionExpiry: {
    type: Date,
    default: function() {
      // Session expires in 24 hours
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
  },
  
  // Booking Information
  bookings: [{
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment'
    },
    bookedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'canceled', 'completed'],
      default: 'pending'
    }
  }],
  
  // Statistics
  stats: {
    totalBookings: {
      type: Number,
      default: 0
    },
    completedBookings: {
      type: Number,
      default: 0
    },
    canceledBookings: {
      type: Number,
      default: 0
    },
    lastBookingDate: Date
  },
  
  // Additional Information (optional)
  temporaryInfo: {
    age: Number,
    gender: {
      type: String,
      enum: ['male', 'female']
    },
    reason: String, // سبب الزيارة
    notes: String
  },
  
  // Tracking
  ipAddress: String,
  userAgent: String,
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Rate limiting for OTP
  otpRequestCount: {
    type: Number,
    default: 0
  },
  
  lastOtpRequestAt: Date,
  
  isBlocked: {
    type: Boolean,
    default: false
  },
  
  blockedUntil: Date,
  
  blockReason: String

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual to check if session is expired
visitorSchema.virtual('isSessionExpired').get(function() {
  return !this.sessionExpiry || this.sessionExpiry < new Date();
});

// Virtual to check if visitor is currently blocked
visitorSchema.virtual('isCurrentlyBlocked').get(function() {
  return this.isBlocked && (!this.blockedUntil || this.blockedUntil > new Date());
});

// Virtual to check if OTP is valid
visitorSchema.virtual('isOtpValid').get(function() {
  return this.otp?.code && 
         this.otp?.expiresAt > new Date() && 
         !this.otp?.isUsed;
});

// Indexes for better performance
visitorSchema.index({ mobile: 1 });
visitorSchema.index({ isVerified: 1 });
visitorSchema.index({ sessionExpiry: 1 });
visitorSchema.index({ createdAt: -1 });
visitorSchema.index({ lastOtpRequestAt: 1 });

// Method to generate and set OTP
visitorSchema.methods.generateOTP = function() {
  const { generateOTPWithExpiry } = require('../utils/otp');
  
  // Check rate limiting (max 5 OTP requests per hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  if (this.lastOtpRequestAt > oneHourAgo && this.otpRequestCount >= 5) {
    throw new Error('تم تجاوز الحد الأقصى لطلبات رمز التحقق. حاول مرة أخرى بعد ساعة');
  }
  
  // Reset counter if last request was more than an hour ago
  if (!this.lastOtpRequestAt || this.lastOtpRequestAt <= oneHourAgo) {
    this.otpRequestCount = 0;
  }
  
  const otpData = generateOTPWithExpiry();
  this.otp = otpData;
  this.otpRequestCount += 1;
  this.lastOtpRequestAt = new Date();
  
  return this.save();
};

// Method to verify OTP
visitorSchema.methods.verifyOTP = function(inputOTP) {
  const { verifyOTP } = require('../utils/otp');
  
  // Check if visitor is blocked
  if (this.isCurrentlyBlocked) {
    return {
      isValid: false,
      message: `الحساب محظور حتى ${this.blockedUntil?.toLocaleString('ar-SA')}`
    };
  }
  
  const result = verifyOTP(inputOTP, this.otp);
  
  if (result.isValid) {
    // Mark OTP as used and verify visitor
    this.otp.isUsed = true;
    this.isVerified = true;
    this.lastVerifiedAt = new Date();
    this.sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Reset failed attempts
    this.otp.attempts = 0;
  } else {
    // Increment failed attempts
    this.otp.attempts = (this.otp.attempts || 0) + 1;
    
    // Block after 5 failed attempts
    if (this.otp.attempts >= 5) {
      this.isBlocked = true;
      this.blockedUntil = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      this.blockReason = 'تجاوز عدد محاولات إدخال رمز التحقق';
    }
  }
  
  this.save();
  return result;
};

// Method to extend session
visitorSchema.methods.extendSession = function(hours = 24) {
  this.sessionExpiry = new Date(Date.now() + hours * 60 * 60 * 1000);
  return this.save();
};

// Method to add booking
visitorSchema.methods.addBooking = function(appointmentId) {
  this.bookings.push({
    appointmentId,
    bookedAt: new Date()
  });
  
  this.stats.totalBookings += 1;
  this.stats.lastBookingDate = new Date();
  
  return this.save();
};

// Method to update booking status
visitorSchema.methods.updateBookingStatus = function(appointmentId, status) {
  const booking = this.bookings.find(b => 
    b.appointmentId.toString() === appointmentId.toString()
  );
  
  if (booking) {
    const oldStatus = booking.status;
    booking.status = status;
    
    // Update statistics
    if (status === 'completed' && oldStatus !== 'completed') {
      this.stats.completedBookings += 1;
    } else if (status === 'canceled' && oldStatus !== 'canceled') {
      this.stats.canceledBookings += 1;
    }
  }
  
  return this.save();
};

// Method to check if visitor can book
visitorSchema.methods.canBook = function() {
  return this.isVerified && 
         !this.isSessionExpired && 
         !this.isCurrentlyBlocked &&
         this.isActive;
};

// Method to clean up expired sessions and OTPs
visitorSchema.statics.cleanupExpiredSessions = function() {
  const now = new Date();
  
  return this.updateMany(
    {
      $or: [
        { sessionExpiry: { $lt: now } },
        { 'otp.expiresAt': { $lt: now } }
      ]
    },
    {
      $set: {
        isVerified: false
      },
      $unset: {
        otp: 1
      }
    }
  );
};

// Static method to find by mobile
visitorSchema.statics.findByMobile = function(mobile) {
  return this.findOne({ mobile, isActive: true });
};

// Static method to get active visitors
visitorSchema.statics.getActiveVisitors = function() {
  const now = new Date();
  return this.find({
    isActive: true,
    isVerified: true,
    sessionExpiry: { $gt: now }
  });
};

// Static method to unblock expired blocks
visitorSchema.statics.unblockExpiredBlocks = function() {
  const now = new Date();
  
  return this.updateMany(
    {
      isBlocked: true,
      blockedUntil: { $lt: now }
    },
    {
      $set: {
        isBlocked: false
      },
      $unset: {
        blockedUntil: 1,
        blockReason: 1
      }
    }
  );
};

module.exports = mongoose.model('Visitor', visitorSchema); 
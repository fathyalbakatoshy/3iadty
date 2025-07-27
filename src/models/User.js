const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { USER_ROLES, GENDER_OPTIONS } = require('../config/constants');

const userSchema = new mongoose.Schema({
  // Basic Information
  fullName: {
    type: String,
    required: [true, 'الاسم الكامل مطلوب'],
    trim: true,
    maxlength: [100, 'الاسم لا يجب أن يتجاوز 100 حرف']
  },
  
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
  
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'البريد الإلكتروني غير صحيح']
  },
  
  password: {
    type: String,
    required: [true, 'كلمة المرور مطلوبة'],
    minlength: [6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل']
  },
  
  role: {
    type: String,
    enum: Object.values(USER_ROLES),
    default: USER_ROLES.PATIENT,
    required: true
  },
  
  gender: {
    type: String,
    enum: Object.values(GENDER_OPTIONS),
    required: [true, 'الجنس مطلوب']
  },
  
  dateOfBirth: {
    type: Date,
    validate: {
      validator: function(value) {
        return value < new Date();
      },
      message: 'تاريخ الميلاد يجب أن يكون في الماضي'
    }
  },
  
  address: {
    street: String,
    city: String,
    region: String,
    postalCode: String,
    country: {
      type: String,
      default: 'مصر'
    }
  },
  
  // Profile Information
  profilePicture: {
    filename: String,
    url: String,
    uploadedAt: Date
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // OTP for verification
  otp: {
    code: String,
    expiresAt: Date,
    isUsed: {
      type: Boolean,
      default: false
    }
  },
  
  // Login tracking
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  
  lockedUntil: Date

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for age calculation
userSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Virtual to check if account is locked
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockedUntil && this.lockedUntil > Date.now());
});

// Index for better query performance
userSchema.index({ mobile: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash password if it's modified
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with salt rounds of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockedUntil && this.lockedUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockedUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = {
      lockedUntil: Date.now() + 2 * 60 * 60 * 1000 // 2 hours
    };
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockedUntil: 1 }
  });
};

// Method to update last login
userSchema.methods.updateLastLogin = function() {
  return this.updateOne({ lastLogin: new Date() });
};

// Method to generate public profile
userSchema.methods.toPublicJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.otp;
  delete user.loginAttempts;
  delete user.lockedUntil;
  return user;
};

// Static method to find by mobile
userSchema.statics.findByMobile = function(mobile) {
  return this.findOne({ mobile });
};

// Static method to find active users
userSchema.statics.findActiveUsers = function(role = null) {
  const query = { isActive: true };
  if (role) query.role = role;
  return this.find(query);
};

module.exports = mongoose.model('User', userSchema); 
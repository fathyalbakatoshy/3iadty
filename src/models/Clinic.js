const mongoose = require('mongoose');
const { CLINIC_TYPES, DAYS_OF_WEEK } = require('../config/constants');

const clinicSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'اسم العيادة مطلوب'],
    trim: true,
    maxlength: [200, 'اسم العيادة لا يجب أن يتجاوز 200 حرف']
  },
  
  slug: {
    type: String,
    unique: true,
    required: true,
    lowercase: true
  },
  
  description: {
    type: String,
    maxlength: [1000, 'الوصف لا يجب أن يتجاوز 1000 حرف']
  },
  
  type: {
    type: String,
    enum: Object.values(CLINIC_TYPES),
    default: CLINIC_TYPES.PRIVATE,
    required: true
  },
  
  // Contact Information
  phones: [{
    number: {
      type: String,
      required: true,
      validate: {
        validator: function(value) {
          const { validateEgyptianPhone } = require('../utils/egyptianPhoneValidator');
          return validateEgyptianPhone(value, 'any').isValid;
        },
        message: 'رقم الهاتف غير صحيح - يجب أن يكون رقم هاتف مصري صالح'
      }
    },
    type: {
      type: String,
      enum: ['mobile', 'landline'],
      default: 'landline'
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'البريد الإلكتروني غير صحيح']
  },
  
  website: String,
  
  // Location Information
  location: {
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    },
    address: {
      street: {
        type: String,
        required: [true, 'عنوان الشارع مطلوب']
      },
      city: {
        type: String,
        required: [true, 'المدينة مطلوبة']
      },
      region: {
        type: String,
        required: [true, 'المنطقة مطلوبة']
      },
      postalCode: String,
      country: {
        type: String,
        default: 'السعودية'
      }
    },
    landmarks: [String], // معالم قريبة
    directions: String   // إرشادات الوصول
  },
  
  // Working Hours
  workingHours: [{
    day: {
      type: String,
      enum: Object.values(DAYS_OF_WEEK),
      required: true
    },
    isOpen: {
      type: Boolean,
      default: true
    },
    shifts: [{
      name: {
        type: String, // صباحي، مسائي
        default: 'صباحي'
      },
      startTime: {
        type: String,
        required: true,
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'صيغة الوقت غير صحيحة']
      },
      endTime: {
        type: String,
        required: true,
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'صيغة الوقت غير صحيحة']
      }
    }]
  }],
  
  // Media
  logo: {
    filename: String,
    url: String,
    uploadedAt: Date
  },
  
  images: [{
    filename: String,
    url: String,
    caption: String,
    uploadedAt: Date
  }],
  
  // Associated Doctors
  doctors: [{
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true
    },
    joinDate: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    },
    specialRole: String, // رئيس القسم، استشاري، إلخ
    workingDays: [{
      day: String,
      startTime: String,
      endTime: String
    }]
  }],
  
  // Services and Specializations
  specializations: [{
    type: String,
    trim: true
  }],
  
  services: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    category: String, // تشخيص، علاج، جراحة، إلخ
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  
  // Equipment and Facilities
  facilities: [{
    name: String,
    description: String,
    category: String // معدات طبية، خدمات عامة، إلخ
  }],
  
  // Payment Methods (في العيادة فقط - بدون تأمين)
  paymentMethods: [{
    type: {
      type: String,
      enum: ['cash', 'card_in_clinic', 'installments'],
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    notes: {
      type: String,
      default: 'الدفع في العيادة'
    }
  }],
  
  // Branches (if applicable)
  isMainBranch: {
    type: Boolean,
    default: true
  },
  
  mainBranchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic'
  },
  
  branches: [{
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic'
    },
    name: String
  }],
  
  // Rating and Reviews
  stats: {
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    totalAppointments: {
      type: Number,
      default: 0
    },
    totalDoctors: {
      type: Number,
      default: 0
    }
  },
  
  // Status and Verification
  isActive: {
    type: Boolean,
    default: true
  },
  
  isVerified: {
    type: Boolean,
    default: false
  },
  
  licenseNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Owner/Manager Information
  owner: {
    name: String,
    mobile: String,
    email: String
  },
  
  manager: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    mobile: String
  },
  
  // Additional Information
  emergencyContact: {
    name: String,
    mobile: String,
    relationship: String
  },
  
  socialMedia: {
    facebook: String,
    twitter: String,
    instagram: String,
    snapchat: String
  },
  
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }]

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for doctor details
clinicSchema.virtual('doctorDetails', {
  ref: 'Doctor',
  localField: 'doctors.doctorId',
  foreignField: '_id'
});

// Virtual for branch details
clinicSchema.virtual('branchDetails', {
  ref: 'Clinic',
  localField: 'branches.branchId',
  foreignField: '_id'
});

// Indexes for better performance
clinicSchema.index({ slug: 1 });
clinicSchema.index({ 'location.coordinates': '2dsphere' });
clinicSchema.index({ type: 1 });
clinicSchema.index({ specializations: 1 });
clinicSchema.index({ 'location.address.city': 1 });
clinicSchema.index({ isActive: 1, isVerified: 1 });
clinicSchema.index({ 'stats.averageRating': -1 });
clinicSchema.index({ createdAt: -1 });

// Pre-save middleware to generate slug
clinicSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('name')) {
    const { generateUniqueSlug } = require('../utils/slug');
    const city = this.location?.address?.city || '';
    const slugText = city ? `${this.name} ${city}` : this.name;
    this.slug = await generateUniqueSlug(slugText, this.constructor, 'slug', this._id);
  }
  
  // Update stats
  this.stats.totalDoctors = this.doctors.filter(d => d.isActive).length;
  
  next();
});

// Method to check if clinic is open at specific day and time
clinicSchema.methods.isOpenAt = function(day, time) {
  const daySchedule = this.workingHours.find(wh => wh.day === day && wh.isOpen);
  if (!daySchedule) return false;
  
  return daySchedule.shifts.some(shift => {
    const shiftStart = this.timeToMinutes(shift.startTime);
    const shiftEnd = this.timeToMinutes(shift.endTime);
    const checkTime = this.timeToMinutes(time);
    
    return checkTime >= shiftStart && checkTime < shiftEnd;
  });
};

// Helper method to convert time to minutes
clinicSchema.methods.timeToMinutes = function(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

// Method to get working hours for a specific day
clinicSchema.methods.getWorkingHours = function(day) {
  const daySchedule = this.workingHours.find(wh => wh.day === day);
  return daySchedule?.isOpen ? daySchedule.shifts : [];
};

// Method to add doctor to clinic
clinicSchema.methods.addDoctor = function(doctorId, options = {}) {
  const existingDoctor = this.doctors.find(d => d.doctorId.toString() === doctorId.toString());
  
  if (existingDoctor) {
    existingDoctor.isActive = true;
    existingDoctor.joinDate = new Date();
    if (options.specialRole) existingDoctor.specialRole = options.specialRole;
    if (options.workingDays) existingDoctor.workingDays = options.workingDays;
  } else {
    this.doctors.push({
      doctorId,
      joinDate: new Date(),
      isActive: true,
      ...options
    });
  }
  
  return this.save();
};

// Method to remove doctor from clinic
clinicSchema.methods.removeDoctor = function(doctorId) {
  const doctorIndex = this.doctors.findIndex(d => d.doctorId.toString() === doctorId.toString());
  
  if (doctorIndex > -1) {
    this.doctors[doctorIndex].isActive = false;
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Static method to find by specialization
clinicSchema.statics.findBySpecialization = function(specialization) {
  return this.find({
    specializations: new RegExp(specialization, 'i'),
    isActive: true
  });
};

// Static method to find nearby clinics
clinicSchema.statics.findNearby = function(longitude, latitude, maxDistance = 5000) {
  return this.find({
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance
      }
    },
    isActive: true
  });
};

// Static method to search clinics
clinicSchema.statics.searchClinics = function(searchQuery, filters = {}) {
  const query = {
    isActive: true,
    ...filters
  };
  
  if (searchQuery) {
    query.$or = [
      { name: new RegExp(searchQuery, 'i') },
      { specializations: { $in: [new RegExp(searchQuery, 'i')] } },
      { 'location.address.city': new RegExp(searchQuery, 'i') },
      { tags: { $in: [new RegExp(searchQuery, 'i')] } }
    ];
  }
  
  return this.find(query);
};

module.exports = mongoose.model('Clinic', clinicSchema); 
const mongoose = require('mongoose');
const { DAYS_OF_WEEK } = require('../config/constants');

const doctorSchema = new mongoose.Schema({
  // Reference to User
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Professional Information
  name: {
    type: String,
    required: [true, 'اسم الطبيب مطلوب'],
    trim: true,
    maxlength: [100, 'الاسم لا يجب أن يتجاوز 100 حرف']
  },
  
  slug: {
    type: String,
    unique: true,
    required: true,
    lowercase: true
  },
  
  specialization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Specialization',
    required: [true, 'التخصص مطلوب']
  },
  
  subSpecialization: {
    type: String,
    trim: true
  },
  
  biography: {
    type: String,
    maxlength: [1000, 'السيرة الذاتية لا يجب أن تتجاوز 1000 حرف']
  },
  
  // Profile and Media
  profilePicture: {
    filename: String,
    url: String,
    uploadedAt: Date
  },
  
  // Academic and Professional Background
  degrees: [{
    degree: {
      type: String,
      required: true
    },
    institution: {
      type: String,
      required: true
    },
    year: {
      type: Number,
      min: 1950,
      max: new Date().getFullYear()
    },
    country: String
  }],
  
  certifications: [{
    name: String,
    issuedBy: String,
    issuedDate: Date,
    expiryDate: Date
  }],
  
  experience: {
    years: {
      type: Number,
      min: 0,
      max: 50
    },
    description: String
  },
  
  // Services and Pricing
  services: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    price: {
      type: Number,
      min: 0
    },
    duration: {
      type: Number, // in minutes
      default: 30
    }
  }],
  
  consultationFee: {
    type: Number,
    required: [true, 'سعر الكشف مطلوب'],
    min: [0, 'السعر لا يمكن أن يكون سالباً']
  },
  
  followupFee: {
    type: Number,
    min: 0,
    default: function() {
      return this.consultationFee * 0.7; // 70% of consultation fee
    }
  },
  
  // Contact and Availability
  isPhoneVisible: {
    type: Boolean,
    default: false
  },
  
  availability: [{
    day: {
      type: String,
      enum: Object.values(DAYS_OF_WEEK),
      required: true
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    timeSlots: [{
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
  
  // Location Information
  location: {
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    },
    address: {
      street: String,
      city: String,
      region: String,
      country: {
        type: String,
        default: 'مصر'
      }
    },
    description: String
  },
  
  // Associated Clinics
  clinics: [{
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic'
    },
    isPrimary: {
      type: Boolean,
      default: false
    },
    workingHours: [{
      day: String,
      startTime: String,
      endTime: String
    }]
  }],
  
  // Tags for search and filtering
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Statistics and Ratings
  stats: {
    totalAppointments: {
      type: Number,
      default: 0
    },
    completedAppointments: {
      type: Number,
      default: 0
    },
    canceledAppointments: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    }
  },
  
  // Professional Status
  licenseNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  
  isVerified: {
    type: Boolean,
    default: false
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  isAcceptingPatients: {
    type: Boolean,
    default: true
  },
  
  // Languages
  languages: [{
    type: String,
    default: ['العربية']
  }],
  
  // Social Media and Website
  socialMedia: {
    website: String,
    twitter: String,
    linkedin: String,
    instagram: String
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for user information
doctorSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Virtual for clinic information
doctorSchema.virtual('clinicDetails', {
  ref: 'Clinic',
  localField: 'clinics.clinicId',
  foreignField: '_id'
});

// Indexes for better performance
doctorSchema.index({ slug: 1 });
doctorSchema.index({ specialization: 1 });
doctorSchema.index({ 'location.coordinates': '2dsphere' });
doctorSchema.index({ tags: 1 });
doctorSchema.index({ consultationFee: 1 });
doctorSchema.index({ 'stats.averageRating': -1 });
doctorSchema.index({ isActive: 1, isAcceptingPatients: 1 });
doctorSchema.index({ createdAt: -1 });

// Pre-save middleware to generate slug
doctorSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('name') || this.isModified('specialization')) {
    const { generateUniqueSlug } = require('../utils/slug');
    // Get specialization name for slug
    let specializationName = '';
    if (this.specialization) {
      if (typeof this.specialization === 'string') {
        specializationName = this.specialization;
      } else {
        const Specialization = require('./Specialization');
        const specialization = await Specialization.findById(this.specialization);
        specializationName = specialization ? specialization.name : '';
      }
    }
    const slugText = `${this.name} ${specializationName}`;
    this.slug = await generateUniqueSlug(slugText, this.constructor, 'slug', this._id);
  }
  next();
});

// Method to check if doctor is available on specific day and time
doctorSchema.methods.isAvailableAt = function(day, time) {
  const dayAvailability = this.availability.find(a => a.day === day && a.isAvailable);
  if (!dayAvailability) return false;
  
  return dayAvailability.timeSlots.some(slot => {
    const slotStart = this.timeToMinutes(slot.startTime);
    const slotEnd = this.timeToMinutes(slot.endTime);
    const checkTime = this.timeToMinutes(time);
    
    return checkTime >= slotStart && checkTime < slotEnd;
  });
};

// Helper method to convert time string to minutes
doctorSchema.methods.timeToMinutes = function(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

// Method to get available time slots for a specific day
doctorSchema.methods.getAvailableSlots = function(day) {
  const dayAvailability = this.availability.find(a => a.day === day && a.isAvailable);
  return dayAvailability ? dayAvailability.timeSlots : [];
};

// Method to update rating
doctorSchema.methods.updateRating = function(newRating) {
  const totalRating = (this.stats.averageRating * this.stats.totalReviews) + newRating;
  this.stats.totalReviews += 1;
  this.stats.averageRating = totalRating / this.stats.totalReviews;
  return this.save();
};

// Static method to find by specialization
doctorSchema.statics.findBySpecialization = function(specializationId) {
  return this.find({ 
    specialization: specializationId,
    isActive: true,
    isAcceptingPatients: true
  });
};

// Static method to find nearby doctors
doctorSchema.statics.findNearby = function(longitude, latitude, maxDistance = 5000) {
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
    isActive: true,
    isAcceptingPatients: true
  });
};

// Static method to search doctors
doctorSchema.statics.searchDoctors = function(searchQuery, filters = {}) {
  const query = {
    isActive: true,
    isAcceptingPatients: true,
    ...filters
  };
  
  if (searchQuery) {
    query.$or = [
      { name: new RegExp(searchQuery, 'i') },
      { tags: { $in: [new RegExp(searchQuery, 'i')] } }
    ];
  }
  
  return this.find(query);
};

module.exports = mongoose.model('Doctor', doctorSchema); 
const mongoose = require('mongoose');

const specializationSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'اسم التخصص مطلوب'],
    unique: true,
    trim: true,
    maxlength: [100, 'اسم التخصص لا يجب أن يتجاوز 100 حرف']
  },
  
  code: {
    type: String,
    required: [true, 'كود التخصص مطلوب'],
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: [20, 'كود التخصص لا يجب أن يتجاوز 20 حرف']
  },
  
  // Description
  description: {
    type: String,
    required: [true, 'وصف التخصص مطلوب'],
    maxlength: [500, 'وصف التخصص لا يجب أن يتجاوز 500 حرف']
  },
  
  // Common Conditions
  commonConditions: [{
    type: String,
    trim: true,
    maxlength: [50, 'اسم الحالة لا يجب أن يتجاوز 50 حرف']
  }],
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // SEO
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  
  // Icon
  icon: {
    type: String,
    default: '🏥'
  },
  
  // Statistics
  stats: {
    totalDoctors: {
      type: Number,
      default: 0
    },
    activeDoctors: {
      type: Number,
      default: 0
    },
    totalAppointments: {
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
  
  // Audit
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Soft Delete
  isDeleted: {
    type: Boolean,
    default: false
  },
  
  deletedAt: Date,
  
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
specializationSchema.index({ name: 1 });
specializationSchema.index({ code: 1 });
specializationSchema.index({ isActive: 1 });
specializationSchema.index({ slug: 1 });
specializationSchema.index({ isDeleted: 1 });

// Virtual for full name with code
specializationSchema.virtual('fullName').get(function() {
  return `${this.name} (${this.code})`;
});

// Pre-save middleware to generate slug
specializationSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('name')) {
    const { generateUniqueSlug } = require('../utils/slug');
    this.slug = await generateUniqueSlug(this.name, this.constructor, 'slug', this._id);
  }
  next();
});

// Static method to find active specializations
specializationSchema.statics.findActive = function() {
  return this.find({
    isActive: true,
    isDeleted: false
  }).sort({ name: 1 });
};

// Static method to search specializations
specializationSchema.statics.searchSpecializations = function(searchQuery, filters = {}) {
  const query = {
    isDeleted: false,
    ...filters
  };
  
  if (searchQuery) {
    query.$or = [
      { name: new RegExp(searchQuery, 'i') },
      { code: new RegExp(searchQuery, 'i') },
      { description: new RegExp(searchQuery, 'i') },
      { commonConditions: { $in: [new RegExp(searchQuery, 'i')] } }
    ];
  }
  
  return this.find(query).sort({ name: 1 });
};

// Static method to get popular specializations
specializationSchema.statics.getPopular = function(limit = 10) {
  return this.find({
    isActive: true,
    isDeleted: false
  })
  .sort({ 'stats.totalDoctors': -1, 'stats.totalAppointments': -1 })
  .limit(limit);
};

// Method to update statistics
specializationSchema.methods.updateStats = function() {
  const Doctor = require('./Doctor');
  
  return Doctor.aggregate([
    {
      $match: {
        specialization: this._id,
        isActive: true
      }
    },
    {
      $group: {
        _id: null,
        totalDoctors: { $sum: 1 },
        activeDoctors: { $sum: { $cond: ['$isAcceptingPatients', 1, 0] } },
        totalAppointments: { $sum: '$stats.totalAppointments' },
        averageRating: { $avg: '$stats.averageRating' },
        totalReviews: { $sum: '$stats.totalReviews' }
      }
    }
  ]).then(results => {
    if (results.length > 0) {
      const stats = results[0];
      this.stats = {
        totalDoctors: stats.totalDoctors,
        activeDoctors: stats.activeDoctors,
        totalAppointments: stats.totalAppointments,
        averageRating: Math.round(stats.averageRating * 10) / 10,
        totalReviews: stats.totalReviews
      };
      return this.save();
    }
    return this;
  });
};

// Method to soft delete
specializationSchema.methods.softDelete = function(userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  this.isActive = false;
  return this.save();
};

// Method to restore
specializationSchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = undefined;
  this.deletedBy = undefined;
  this.isActive = true;
  return this.save();
};

module.exports = mongoose.model('Specialization', specializationSchema); 
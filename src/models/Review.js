const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  // Basic Information
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'معرف المريض مطلوب']
  },
  
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: [true, 'معرف الطبيب مطلوب']
  },
  
  // Appointment Reference (to verify patient actually visited)
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: [true, 'معرف الموعد مطلوب للتقييم']
  },
  
  // Clinic Information
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic'
  },
  
  // Rating Information
  rating: {
    type: Number,
    required: [true, 'التقييم مطلوب'],
    min: [1, 'التقييم يجب أن يكون من 1 إلى 5'],
    max: [5, 'التقييم يجب أن يكون من 1 إلى 5']
  },
  
  // Detailed Ratings
  detailedRatings: {
    doctorCommunication: {
      type: Number,
      min: 1,
      max: 5
    },
    appointmentScheduling: {
      type: Number,
      min: 1,
      max: 5
    },
    waitTime: {
      type: Number,
      min: 1,
      max: 5
    },
    clinicEnvironment: {
      type: Number,
      min: 1,
      max: 5
    },
    staffBehavior: {
      type: Number,
      min: 1,
      max: 5
    },
    treatmentEffectiveness: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  
  // Review Content
  comment: {
    type: String,
    maxlength: [1000, 'التعليق لا يجب أن يتجاوز 1000 حرف'],
    trim: true
  },
  
  // Review Categories
  reviewType: {
    type: String,
    enum: ['general', 'first_visit', 'follow_up', 'emergency'],
    default: 'general'
  },
  
  // Visit Information
  visitInfo: {
    waitTime: {
      actual: Number, // in minutes
      expected: Number // in minutes
    },
    visitDuration: Number, // in minutes
    visitDate: Date
  },
  
  // Moderation and Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'hidden'],
    default: 'pending'
  },
  
  moderationInfo: {
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    moderatedAt: Date,
    moderationReason: String,
    moderationNotes: String
  },
  
  // Helpfulness Votes
  helpfulVotes: {
    helpful: {
      type: Number,
      default: 0
    },
    notHelpful: {
      type: Number,
      default: 0
    },
    voters: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      vote: {
        type: String,
        enum: ['helpful', 'not_helpful']
      },
      votedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  
  // Flags and Reports
  flags: [{
    flaggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['inappropriate', 'spam', 'fake', 'off_topic', 'personal_info'],
      required: true
    },
    description: String,
    flaggedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved'],
      default: 'pending'
    }
  }],
  
  // Privacy Settings
  isAnonymous: {
    type: Boolean,
    default: false
  },
  
  displayName: {
    type: String,
    default: function() {
      return this.isAnonymous ? 'مريض مجهول' : '';
    }
  },
  
  // Doctor Response
  doctorResponse: {
    response: String,
    respondedAt: Date,
    isPublic: {
      type: Boolean,
      default: true
    }
  },
  
  // Verification
  isVerified: {
    type: Boolean,
    default: false
  },
  
  verificationInfo: {
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: Date,
    verificationMethod: String
  },
  
  // Update History
  updateHistory: [{
    updatedAt: Date,
    previousRating: Number,
    previousComment: String,
    updateReason: String
  }],
  
  // Metadata
  submissionSource: {
    type: String,
    enum: ['web', 'mobile', 'email', 'sms'],
    default: 'web'
  },
  
  ipAddress: String,
  
  userAgent: String

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for patient information
reviewSchema.virtual('patient', {
  ref: 'Patient',
  localField: 'patientId',
  foreignField: '_id',
  justOne: true
});

// Virtual for doctor information
reviewSchema.virtual('doctor', {
  ref: 'Doctor',
  localField: 'doctorId',
  foreignField: '_id',
  justOne: true
});

// Virtual for appointment information
reviewSchema.virtual('appointment', {
  ref: 'Appointment',
  localField: 'appointmentId',
  foreignField: '_id',
  justOne: true
});

// Virtual for clinic information
reviewSchema.virtual('clinic', {
  ref: 'Clinic',
  localField: 'clinicId',
  foreignField: '_id',
  justOne: true
});

// Virtual for helpfulness ratio
reviewSchema.virtual('helpfulnessRatio').get(function() {
  const total = this.helpfulVotes.helpful + this.helpfulVotes.notHelpful;
  return total > 0 ? (this.helpfulVotes.helpful / total) * 100 : 0;
});

// Virtual for time since review
reviewSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return 'منذ يوم واحد';
  if (diffDays < 7) return `منذ ${diffDays} أيام`;
  if (diffDays < 30) return `منذ ${Math.ceil(diffDays / 7)} أسابيع`;
  if (diffDays < 365) return `منذ ${Math.ceil(diffDays / 30)} أشهر`;
  return `منذ ${Math.ceil(diffDays / 365)} سنوات`;
});

// Indexes for better performance
reviewSchema.index({ patientId: 1, doctorId: 1 }, { unique: true });
reviewSchema.index({ doctorId: 1, status: 1 });
reviewSchema.index({ clinicId: 1, status: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ 'helpfulVotes.helpful': -1 });

// Pre-save middleware for validation
reviewSchema.pre('save', async function(next) {
  // Verify that the patient actually had an appointment with this doctor
  if (this.isNew) {
    const Appointment = mongoose.model('Appointment');
    const appointment = await Appointment.findOne({
      _id: this.appointmentId,
      patientId: this.patientId,
      doctorId: this.doctorId,
      status: 'completed'
    });
    
    if (!appointment) {
      const error = new Error('لا يمكن إضافة تقييم إلا بعد إتمام الموعد');
      return next(error);
    }
    
    // Check if review already exists for this appointment
    const existingReview = await this.constructor.findOne({
      appointmentId: this.appointmentId,
      patientId: this.patientId
    });
    
    if (existingReview) {
      const error = new Error('تم إضافة تقييم لهذا الموعد مسبقاً');
      return next(error);
    }
  }
  
  // Update doctor's rating when review is approved
  if (this.isModified('status') && this.status === 'approved') {
    const Doctor = mongoose.model('Doctor');
    await this.updateDoctorRating();
  }
  
  next();
});

// Method to update doctor's overall rating
reviewSchema.methods.updateDoctorRating = async function() {
  const Doctor = mongoose.model('Doctor');
  
  // Calculate new average rating for the doctor
  const reviews = await this.constructor.find({
    doctorId: this.doctorId,
    status: 'approved'
  });
  
  if (reviews.length > 0) {
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    
    await Doctor.findByIdAndUpdate(this.doctorId, {
      'stats.averageRating': Math.round(averageRating * 10) / 10,
      'stats.totalReviews': reviews.length
    });
  }
};

// Method to add helpful vote
reviewSchema.methods.addHelpfulVote = function(userId, vote) {
  // Check if user has already voted
  const existingVote = this.helpfulVotes.voters.find(v => 
    v.userId.toString() === userId.toString()
  );
  
  if (existingVote) {
    // Update existing vote
    if (existingVote.vote !== vote) {
      // Remove old vote count
      if (existingVote.vote === 'helpful') {
        this.helpfulVotes.helpful -= 1;
      } else {
        this.helpfulVotes.notHelpful -= 1;
      }
      
      // Add new vote count
      if (vote === 'helpful') {
        this.helpfulVotes.helpful += 1;
      } else {
        this.helpfulVotes.notHelpful += 1;
      }
      
      existingVote.vote = vote;
      existingVote.votedAt = new Date();
    }
  } else {
    // Add new vote
    this.helpfulVotes.voters.push({
      userId,
      vote,
      votedAt: new Date()
    });
    
    if (vote === 'helpful') {
      this.helpfulVotes.helpful += 1;
    } else {
      this.helpfulVotes.notHelpful += 1;
    }
  }
  
  return this.save();
};

// Method to flag review
reviewSchema.methods.flagReview = function(flaggedBy, reason, description) {
  this.flags.push({
    flaggedBy,
    reason,
    description,
    flaggedAt: new Date()
  });
  
  return this.save();
};

// Method to add doctor response
reviewSchema.methods.addDoctorResponse = function(response, isPublic = true) {
  this.doctorResponse = {
    response,
    respondedAt: new Date(),
    isPublic
  };
  
  return this.save();
};

// Method to moderate review
reviewSchema.methods.moderate = function(status, moderatedBy, reason, notes) {
  this.status = status;
  this.moderationInfo = {
    moderatedBy,
    moderatedAt: new Date(),
    moderationReason: reason,
    moderationNotes: notes
  };
  
  return this.save();
};

// Static method to get reviews for doctor
reviewSchema.statics.getReviewsForDoctor = function(doctorId, options = {}) {
  const query = {
    doctorId,
    status: 'approved'
  };
  
  const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = -1 } = options;
  
  return this.find(query)
    .populate('patientId', 'userId')
    .sort({ [sortBy]: sortOrder })
    .skip((page - 1) * limit)
    .limit(limit);
};

// Static method to get review statistics
reviewSchema.statics.getReviewStats = function(doctorId) {
  return this.aggregate([
    { $match: { doctorId: mongoose.Types.ObjectId(doctorId), status: 'approved' } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: {
            $switch: {
              branches: [
                { case: { $eq: ['$rating', 1] }, then: 'one' },
                { case: { $eq: ['$rating', 2] }, then: 'two' },
                { case: { $eq: ['$rating', 3] }, then: 'three' },
                { case: { $eq: ['$rating', 4] }, then: 'four' },
                { case: { $eq: ['$rating', 5] }, then: 'five' }
              ]
            }
          }
        }
      }
    }
  ]);
};

// Static method to get pending reviews for moderation
reviewSchema.statics.getPendingReviews = function() {
  return this.find({ status: 'pending' })
    .populate('patientId doctorId appointmentId')
    .sort({ createdAt: 1 });
};

module.exports = mongoose.model('Review', reviewSchema); 
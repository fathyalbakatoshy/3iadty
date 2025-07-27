const mongoose = require('mongoose');
const { GENDER_OPTIONS } = require('../config/constants');

const patientSchema = new mongoose.Schema({
  // Reference to User
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Personal Information (inherited from User but may have additional fields)
  patientId: {
    type: String,
    unique: true,
    required: true
  },
  
  // Emergency Contact
  emergencyContact: {
    name: {
      type: String,
      required: [true, 'اسم جهة الاتصال في حالات الطوارئ مطلوب']
    },
    relationship: {
      type: String,
      required: [true, 'صلة القرابة مطلوبة']
    },
    mobile: {
      type: String,
      required: [true, 'رقم جوال جهة الاتصال مطلوب'],
      validate: {
        validator: function(value) {
          const { validateEgyptianPhone } = require('../utils/egyptianPhoneValidator');
          return validateEgyptianPhone(value, 'mobile').isValid;
        },
        message: 'رقم الجوال غير صحيح - يجب أن يكون رقم هاتف محمول مصري صالح'
      }
    },
    email: String
  },
  
  // Medical Information
  medicalHistory: {
    bloodType: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      uppercase: true
    },
    
    weight: {
      value: Number,
      unit: {
        type: String,
        default: 'kg'
      },
      lastUpdated: Date
    },
    
    height: {
      value: Number,
      unit: {
        type: String,
        default: 'cm'
      },
      lastUpdated: Date
    },
    
    allergies: [{
      allergen: {
        type: String,
        required: true
      },
      severity: {
        type: String,
        enum: ['mild', 'moderate', 'severe'],
        default: 'mild'
      },
      reaction: String,
      notes: String
    }],
    
    chronicDiseases: [{
      disease: {
        type: String,
        required: true
      },
      diagnosedDate: Date,
      status: {
        type: String,
        enum: ['active', 'controlled', 'resolved'],
        default: 'active'
      },
      medications: [String],
      notes: String
    }],
    
    surgicalHistory: [{
      procedure: {
        type: String,
        required: true
      },
      date: Date,
      hospital: String,
      surgeon: String,
      complications: String,
      notes: String
    }],
    
    currentMedications: [{
      name: {
        type: String,
        required: true
      },
      dosage: String,
      frequency: String,
      startDate: Date,
      endDate: Date,
      prescribedBy: String,
      notes: String
    }],
    
    familyHistory: [{
      relation: {
        type: String,
        required: true
      },
      condition: {
        type: String,
        required: true
      },
      ageOfOnset: Number,
      notes: String
    }],
    
    habits: {
      smoking: {
        status: {
          type: String,
          enum: ['never', 'former', 'current'],
          default: 'never'
        },
        details: String
      },
      alcohol: {
        status: {
          type: String,
          enum: ['never', 'occasional', 'regular'],
          default: 'never'
        },
        details: String
      },
      exercise: {
        frequency: String,
        type: String
      },
      diet: {
        type: String,
        restrictions: [String]
      }
    }
  },
  
  // Insurance Information
  insurance: {
    company: String,
    policyNumber: String,
    membershipId: String,
    expiryDate: Date,
    coverage: {
      type: String,
      enum: ['basic', 'comprehensive', 'premium'],
      default: 'basic'
    },
    copayAmount: Number,
    isActive: {
      type: Boolean,
      default: true
    }
  },
  
  // Preferred Settings
  preferences: {
    language: {
      type: String,
      default: 'ar'
    },
    preferredDoctorGender: {
      type: String,
      enum: ['male', 'female', 'no_preference'],
      default: 'no_preference'
    },
    notificationSettings: {
      sms: {
        type: Boolean,
        default: true
      },
      email: {
        type: Boolean,
        default: false
      },
      appointmentReminders: {
        type: Boolean,
        default: true
      },
      healthTips: {
        type: Boolean,
        default: false
      }
    }
  },
  
  // Appointments History
  appointmentHistory: {
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
    noShowAppointments: {
      type: Number,
      default: 0
    },
    lastAppointmentDate: Date,
    favoriteDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor'
    },
    favoriteClinic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic'
    }
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  registrationSource: {
    type: String,
    enum: ['web', 'mobile', 'clinic', 'referral'],
    default: 'web'
  },
  
  notes: [{
    note: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    isPrivate: {
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
patientSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Virtual for BMI calculation
patientSchema.virtual('bmi').get(function() {
  const weight = this.medicalHistory?.weight?.value;
  const height = this.medicalHistory?.height?.value;
  
  if (!weight || !height) return null;
  
  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);
  
  return Math.round(bmi * 10) / 10; // Round to 1 decimal place
});

// Virtual for BMI category
patientSchema.virtual('bmiCategory').get(function() {
  const bmi = this.bmi;
  if (!bmi) return null;
  
  if (bmi < 18.5) return 'نقص في الوزن';
  if (bmi < 25) return 'وزن طبيعي';
  if (bmi < 30) return 'زيادة في الوزن';
  return 'سمنة';
});

// Virtual for age (calculated from user's date of birth)
patientSchema.virtual('age').get(function() {
  return this.user?.age || null;
});

// Indexes for better performance
patientSchema.index({ patientId: 1 });
patientSchema.index({ userId: 1 });
patientSchema.index({ 'medicalHistory.bloodType': 1 });
patientSchema.index({ isActive: 1 });
patientSchema.index({ createdAt: -1 });

// Pre-save middleware to generate patient ID
patientSchema.pre('save', async function(next) {
  if (this.isNew && !this.patientId) {
    // Generate patient ID: P + YYYYMMDD + sequential number
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Find the last patient created today
    const lastPatient = await this.constructor.findOne({
      patientId: new RegExp(`^P${dateStr}`)
    }).sort({ patientId: -1 });
    
    let sequence = '001';
    if (lastPatient) {
      const lastSequence = parseInt(lastPatient.patientId.slice(-3));
      sequence = String(lastSequence + 1).padStart(3, '0');
    }
    
    this.patientId = `P${dateStr}${sequence}`;
  }
  next();
});

// Method to add allergy
patientSchema.methods.addAllergy = function(allergyData) {
  this.medicalHistory.allergies.push(allergyData);
  return this.save();
};

// Method to add chronic disease
patientSchema.methods.addChronicDisease = function(diseaseData) {
  this.medicalHistory.chronicDiseases.push(diseaseData);
  return this.save();
};

// Method to add current medication
patientSchema.methods.addCurrentMedication = function(medicationData) {
  this.medicalHistory.currentMedications.push(medicationData);
  return this.save();
};

// Method to update appointment statistics
patientSchema.methods.updateAppointmentStats = function(status) {
  this.appointmentHistory.totalAppointments += 1;
  
  switch (status) {
    case 'completed':
      this.appointmentHistory.completedAppointments += 1;
      break;
    case 'canceled':
      this.appointmentHistory.canceledAppointments += 1;
      break;
    case 'no_show':
      this.appointmentHistory.noShowAppointments += 1;
      break;
  }
  
  this.appointmentHistory.lastAppointmentDate = new Date();
  return this.save();
};

// Method to add note
patientSchema.methods.addNote = function(noteText, addedBy, isPrivate = false) {
  this.notes.push({
    note: noteText,
    addedBy,
    isPrivate
  });
  return this.save();
};

// Static method to search patients
patientSchema.statics.searchPatients = function(searchQuery) {
  return this.find({
    $or: [
      { patientId: new RegExp(searchQuery, 'i') }
    ],
    isActive: true
  }).populate('userId', 'fullName mobile email');
};

// Static method to find by blood type
patientSchema.statics.findByBloodType = function(bloodType) {
  return this.find({
    'medicalHistory.bloodType': bloodType,
    isActive: true
  });
};

module.exports = mongoose.model('Patient', patientSchema); 
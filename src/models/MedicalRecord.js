const mongoose = require('mongoose');
const { MEDICAL_RECORD_TYPES } = require('../config/constants');

const medicalRecordSchema = new mongoose.Schema({
  // Basic Information
  recordId: {
    type: String,
    unique: true,
    required: true
  },
  
  // Patient Information
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'معرف المريض مطلوب']
  },
  
  // Doctor Information
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: [true, 'معرف الطبيب مطلوب']
  },
  
  // Appointment Reference (optional)
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  
  // Clinic Information
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic'
  },
  
  // Record Type and Classification
  type: {
    type: String,
    enum: Object.values(MEDICAL_RECORD_TYPES),
    required: [true, 'نوع السجل الطبي مطلوب']
  },
  
  category: {
    type: String,
    enum: ['consultation', 'diagnosis', 'treatment', 'surgery', 'lab_result', 'imaging', 'prescription', 'follow_up'],
    required: true
  },
  
  title: {
    type: String,
    required: [true, 'عنوان السجل مطلوب'],
    maxlength: [200, 'العنوان لا يجب أن يتجاوز 200 حرف']
  },
  
  // Medical Content
  details: {
    // Chief Complaint
    chiefComplaint: String,
    
    // History of Present Illness
    historyOfPresentIllness: String,
    
    // Physical Examination
    physicalExamination: {
      vitalSigns: {
        temperature: Number,
        bloodPressure: {
          systolic: Number,
          diastolic: Number
        },
        heartRate: Number,
        respiratoryRate: Number,
        oxygenSaturation: Number,
        weight: Number,
        height: Number,
        bmi: Number
      },
      generalAppearance: String,
      systemicExamination: {
        cardiovascular: String,
        respiratory: String,
        abdominal: String,
        neurological: String,
        musculoskeletal: String,
        other: String
      }
    },
    
    // Diagnosis
    diagnosis: {
      primary: String,
      secondary: [String],
      differential: [String],
      icdCodes: [String]
    },
    
    // Treatment Plan
    treatment: {
      medications: [{
        name: String,
        dosage: String,
        frequency: String,
        duration: String,
        instructions: String
      }],
      procedures: [{
        name: String,
        description: String,
        date: Date,
        outcome: String
      }],
      recommendations: [String],
      followUpInstructions: String,
      nextVisitDate: Date
    },
    
    // Laboratory Results
    labResults: [{
      testName: String,
      result: String,
      normalRange: String,
      unit: String,
      date: Date,
      status: {
        type: String,
        enum: ['normal', 'abnormal', 'critical'],
        default: 'normal'
      }
    }],
    
    // Imaging Results
    imagingResults: [{
      type: String, // X-ray, CT, MRI, Ultrasound
      bodyPart: String,
      findings: String,
      impression: String,
      date: Date,
      radiologist: String
    }],
    
    // Additional Notes
    notes: String,
    
    // Follow-up Information
    followUp: {
      required: Boolean,
      date: Date,
      reason: String,
      instructions: String
    }
  },
  
  // File Attachments
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    originalName: String,
    url: String,
    fileType: String,
    fileSize: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    description: String,
    category: {
      type: String,
      enum: ['image', 'document', 'lab_report', 'xray', 'prescription']
    }
  }],
  
  // Record Date and Time
  recordDate: {
    type: Date,
    required: [true, 'تاريخ السجل مطلوب'],
    default: Date.now
  },
  
  // Privacy and Access Control
  isPrivate: {
    type: Boolean,
    default: false
  },
  
  accessLevel: {
    type: String,
    enum: ['public', 'doctor_only', 'patient_doctor', 'restricted'],
    default: 'patient_doctor'
  },
  
  // Sharing and Permissions
  sharedWith: [{
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    },
    sharedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permissions: {
      canView: {
        type: Boolean,
        default: true
      },
      canEdit: {
        type: Boolean,
        default: false
      },
      canDownload: {
        type: Boolean,
        default: true
      }
    }
  }],
  
  // Record Status
  status: {
    type: String,
    enum: ['draft', 'completed', 'reviewed', 'archived'],
    default: 'draft'
  },
  
  // Version Control
  version: {
    type: Number,
    default: 1
  },
  
  previousVersions: [{
    versionNumber: Number,
    modifiedAt: Date,
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changes: String,
    data: mongoose.Schema.Types.Mixed
  }],
  
  // Audit Trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  lastModifiedAt: Date,
  
  // Tags for categorization and search
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // External References
  externalReferences: [{
    system: String, // Lab system, Hospital system, etc.
    referenceId: String,
    url: String
  }]

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for patient information
medicalRecordSchema.virtual('patient', {
  ref: 'Patient',
  localField: 'patientId',
  foreignField: '_id',
  justOne: true
});

// Virtual for doctor information
medicalRecordSchema.virtual('doctor', {
  ref: 'Doctor',
  localField: 'doctorId',
  foreignField: '_id',
  justOne: true
});

// Virtual for appointment information
medicalRecordSchema.virtual('appointment', {
  ref: 'Appointment',
  localField: 'appointmentId',
  foreignField: '_id',
  justOne: true
});

// Virtual for clinic information
medicalRecordSchema.virtual('clinic', {
  ref: 'Clinic',
  localField: 'clinicId',
  foreignField: '_id',
  justOne: true
});

// Indexes for better performance
medicalRecordSchema.index({ recordId: 1 });
medicalRecordSchema.index({ patientId: 1, recordDate: -1 });
medicalRecordSchema.index({ doctorId: 1, recordDate: -1 });
medicalRecordSchema.index({ type: 1 });
medicalRecordSchema.index({ category: 1 });
medicalRecordSchema.index({ status: 1 });
medicalRecordSchema.index({ tags: 1 });
medicalRecordSchema.index({ recordDate: -1 });
medicalRecordSchema.index({ createdAt: -1 });

// Pre-save middleware to generate record ID
medicalRecordSchema.pre('save', async function(next) {
  if (this.isNew && !this.recordId) {
    // Generate record ID: MR + YYYYMMDD + sequential number
    const today = new Date(this.recordDate);
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Find the last record created today
    const lastRecord = await this.constructor.findOne({
      recordId: new RegExp(`^MR${dateStr}`)
    }).sort({ recordId: -1 });
    
    let sequence = '001';
    if (lastRecord) {
      const lastSequence = parseInt(lastRecord.recordId.slice(-3));
      sequence = String(lastSequence + 1).padStart(3, '0');
    }
    
    this.recordId = `MR${dateStr}${sequence}`;
  }
  
  // Update last modified fields
  if (this.isModified() && !this.isNew) {
    this.lastModifiedAt = new Date();
  }
  
  next();
});

// Method to add attachment
medicalRecordSchema.methods.addAttachment = function(attachmentData) {
  this.attachments.push(attachmentData);
  return this.save();
};

// Method to remove attachment
medicalRecordSchema.methods.removeAttachment = function(attachmentId) {
  this.attachments.id(attachmentId).remove();
  return this.save();
};

// Method to share with doctor
medicalRecordSchema.methods.shareWithDoctor = function(doctorId, sharedBy, permissions = {}) {
  const defaultPermissions = {
    canView: true,
    canEdit: false,
    canDownload: true
  };
  
  // Check if already shared
  const existingShare = this.sharedWith.find(s => 
    s.doctorId.toString() === doctorId.toString()
  );
  
  if (existingShare) {
    existingShare.permissions = { ...defaultPermissions, ...permissions };
    existingShare.sharedAt = new Date();
    existingShare.sharedBy = sharedBy;
  } else {
    this.sharedWith.push({
      doctorId,
      sharedBy,
      permissions: { ...defaultPermissions, ...permissions }
    });
  }
  
  return this.save();
};

// Method to unshare with doctor
medicalRecordSchema.methods.unshareWithDoctor = function(doctorId) {
  const shareIndex = this.sharedWith.findIndex(s => 
    s.doctorId.toString() === doctorId.toString()
  );
  
  if (shareIndex > -1) {
    this.sharedWith.splice(shareIndex, 1);
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Method to create new version
medicalRecordSchema.methods.createVersion = function(modifiedBy, changes) {
  // Store current version in history
  this.previousVersions.push({
    versionNumber: this.version,
    modifiedAt: new Date(),
    modifiedBy,
    changes,
    data: this.toObject()
  });
  
  // Increment version number
  this.version += 1;
  this.lastModifiedBy = modifiedBy;
  this.lastModifiedAt = new Date();
  
  return this.save();
};

// Method to check if user can access record
medicalRecordSchema.methods.canAccess = function(userId, userRole) {
  // Patient can always access their own records
  if (this.patientId && this.patientId.toString() === userId.toString()) {
    return true;
  }
  
  // Doctor who created the record can access
  if (this.doctorId && this.doctorId.toString() === userId.toString()) {
    return true;
  }
  
  // Check if shared with user
  const sharedEntry = this.sharedWith.find(s => 
    s.doctorId.toString() === userId.toString()
  );
  
  if (sharedEntry && sharedEntry.permissions.canView) {
    return true;
  }
  
  // Admin can access all records
  if (userRole === 'admin') {
    return true;
  }
  
  return false;
};

// Static method to find by patient
medicalRecordSchema.statics.findByPatient = function(patientId, options = {}) {
  const query = { patientId };
  
  if (options.type) query.type = options.type;
  if (options.category) query.category = options.category;
  if (options.status) query.status = options.status;
  
  return this.find(query)
    .populate('doctorId', 'name specialization')
    .populate('clinicId', 'name')
    .sort({ recordDate: -1 });
};

// Static method to find by doctor
medicalRecordSchema.statics.findByDoctor = function(doctorId, options = {}) {
  const query = { doctorId };
  
  if (options.patientId) query.patientId = options.patientId;
  if (options.type) query.type = options.type;
  if (options.dateRange) {
    query.recordDate = {
      $gte: options.dateRange.start,
      $lte: options.dateRange.end
    };
  }
  
  return this.find(query)
    .populate('patientId', 'patientId userId')
    .populate('clinicId', 'name')
    .sort({ recordDate: -1 });
};

// Static method to search records
medicalRecordSchema.statics.searchRecords = function(searchQuery, filters = {}) {
  const query = { ...filters };
  
  if (searchQuery) {
    query.$or = [
      { title: new RegExp(searchQuery, 'i') },
      { 'details.diagnosis.primary': new RegExp(searchQuery, 'i') },
      { 'details.diagnosis.secondary': { $in: [new RegExp(searchQuery, 'i')] } },
      { tags: { $in: [new RegExp(searchQuery, 'i')] } }
    ];
  }
  
  return this.find(query)
    .populate('patientId doctorId clinicId')
    .sort({ recordDate: -1 });
};

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema); 
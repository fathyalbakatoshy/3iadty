const { 
  sendSuccess, 
  sendError, 
  sendCreated, 
  sendUpdated,
  sendDeleted,
  sendNotFound,
  sendPaginatedResponse
} = require('../utils/response');
const { 
  SUCCESS_MESSAGES, 
  ERROR_MESSAGES, 
  MEDICAL_RECORD_TYPES,
  USER_ROLES 
} = require('../config/constants');
const MedicalRecord = require('../models/MedicalRecord');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { processUploadedFiles, deleteFile } = require('../utils/upload');

/**
 * Create new medical record
 */
const createMedicalRecord = async (req, res) => {
  try {
    const {
      patientId,
      type,
      title,
      description,
      diagnosis,
      prescriptions,
      recommendations,
      followUpDate,
      notes,
      isPrivate = false
    } = req.body;

    const user = req.user;

    // Get doctor ID
    const doctor = await Doctor.findOne({ userId: user.id });
    if (!doctor) {
      return sendError(res, 'الطبيب غير موجود', 404);
    }

    // Validate patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return sendNotFound(res, 'المريض غير موجود');
    }

    // Process uploaded files
    const attachments = req.files ? processUploadedFiles(req.files, 'medical-records') : [];

    // Create medical record
    const medicalRecord = new MedicalRecord({
      patientId,
      doctorId: doctor._id,
      type,
      title,
      description,
      diagnosis,
      prescriptions: prescriptions ? JSON.parse(prescriptions) : [],
      recommendations,
      followUpDate: followUpDate ? new Date(followUpDate) : null,
      attachments,
      notes,
      isPrivate,
      createdBy: user.id
    });

    await medicalRecord.save();

    // Populate response data
    await medicalRecord.populate([
      { path: 'patientId', select: 'patientId', populate: { path: 'userId', select: 'fullName' } },
      { path: 'doctorId', select: 'name specialization' }
    ]);

    return sendCreated(res, SUCCESS_MESSAGES.CREATED_SUCCESSFULLY, medicalRecord);

  } catch (error) {
    console.error('خطأ في إنشاء السجل الطبي:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Get patient medical records
 */
const getPatientMedicalRecords = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { page = 1, limit = 10, type, fromDate, toDate } = req.query;
    const user = req.user;

    // Check authorization
    const hasAccess = await checkMedicalRecordAccess(patientId, user);
    if (!hasAccess) {
      return sendError(res, 'غير مخول بالوصول لهذه السجلات', 403);
    }

    // Build query
    const query = { patientId };

    if (type) {
      query.type = type;
    }

    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) query.date.$gte = new Date(fromDate);
      if (toDate) query.date.$lte = new Date(toDate);
    }

    // If patient is viewing their own records, hide private notes from other doctors
    if (user.role === USER_ROLES.PATIENT) {
      query.$or = [
        { isPrivate: false },
        { isPrivate: true, doctorId: await getCurrentDoctorId(user) }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Execute query
    const medicalRecords = await MedicalRecord.find(query)
      .populate('doctorId', 'name specialization profilePicture')
      .populate('clinicId', 'name location.address')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limitNum);

    const totalRecords = await MedicalRecord.countDocuments(query);
    const totalPages = Math.ceil(totalRecords / limitNum);

    const pagination = {
      page: parseInt(page),
      limit: limitNum,
      totalItems: totalRecords,
      totalPages
    };

    return sendPaginatedResponse(res, 'تم الحصول على السجلات الطبية بنجاح', medicalRecords, pagination);

  } catch (error) {
    console.error('خطأ في الحصول على السجلات الطبية:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Get medical record by ID
 */
const getMedicalRecordById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const medicalRecord = await MedicalRecord.findById(id)
      .populate('patientId', 'patientId', null, { populate: { path: 'userId', select: 'fullName mobile gender dateOfBirth' } })
      .populate('doctorId', 'name specialization profilePicture')
      .populate('clinicId', 'name location.address')
      .populate('createdBy', 'fullName');

    if (!medicalRecord) {
      return sendNotFound(res, 'السجل الطبي غير موجود');
    }

    // Check authorization
    const hasAccess = await checkMedicalRecordAccess(medicalRecord.patientId._id, user);
    if (!hasAccess) {
      return sendError(res, 'غير مخول بالوصول لهذا السجل', 403);
    }

    // If record is private and user is not the doctor who created it or admin
    if (medicalRecord.isPrivate && 
        user.role !== USER_ROLES.ADMIN && 
        medicalRecord.doctorId.userId?.toString() !== user.id) {
      return sendError(res, 'هذا السجل خاص ولا يمكن الوصول إليه', 403);
    }

    return sendSuccess(res, 'تم الحصول على السجل الطبي بنجاح', medicalRecord);

  } catch (error) {
    console.error('خطأ في الحصول على السجل الطبي:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Update medical record
 */
const updateMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const user = req.user;

    const medicalRecord = await MedicalRecord.findById(id);
    if (!medicalRecord) {
      return sendNotFound(res, 'السجل الطبي غير موجود');
    }

    // Check if user can update this record
    const canUpdate = await checkUpdatePermission(medicalRecord, user);
    if (!canUpdate) {
      return sendError(res, 'غير مخول بتحديث هذا السجل', 403);
    }

    // Parse prescriptions if provided as string
    if (updateData.prescriptions && typeof updateData.prescriptions === 'string') {
      updateData.prescriptions = JSON.parse(updateData.prescriptions);
    }

    // Process new uploaded files
    if (req.files && req.files.length > 0) {
      const newAttachments = processUploadedFiles(req.files, 'medical-records');
      updateData.attachments = [...(medicalRecord.attachments || []), ...newAttachments];
    }

    // Update follow-up date if provided
    if (updateData.followUpDate) {
      updateData.followUpDate = new Date(updateData.followUpDate);
    }

    updateData.updatedBy = user.id;
    updateData.updatedAt = new Date();

    const updatedRecord = await MedicalRecord.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'patientId', select: 'patientId', populate: { path: 'userId', select: 'fullName' } },
      { path: 'doctorId', select: 'name specialization' }
    ]);

    return sendUpdated(res, SUCCESS_MESSAGES.UPDATED_SUCCESSFULLY, updatedRecord);

  } catch (error) {
    console.error('خطأ في تحديث السجل الطبي:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Delete medical record
 */
const deleteMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const medicalRecord = await MedicalRecord.findById(id);
    if (!medicalRecord) {
      return sendNotFound(res, 'السجل الطبي غير موجود');
    }

    // Check if user can delete this record
    const canDelete = await checkDeletePermission(medicalRecord, user);
    if (!canDelete) {
      return sendError(res, 'غير مخول بحذف هذا السجل', 403);
    }

    // Delete associated files
    if (medicalRecord.attachments && medicalRecord.attachments.length > 0) {
      for (const attachment of medicalRecord.attachments) {
        const filePath = `uploads/medical-records/${attachment.filename}`;
        await deleteFile(filePath);
      }
    }

    await MedicalRecord.findByIdAndDelete(id);

    return sendDeleted(res, SUCCESS_MESSAGES.DELETED_SUCCESSFULLY);

  } catch (error) {
    console.error('خطأ في حذف السجل الطبي:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Remove attachment from medical record
 */
const removeAttachment = async (req, res) => {
  try {
    const { id, attachmentId } = req.params;
    const user = req.user;

    const medicalRecord = await MedicalRecord.findById(id);
    if (!medicalRecord) {
      return sendNotFound(res, 'السجل الطبي غير موجود');
    }

    // Check permission
    const canUpdate = await checkUpdatePermission(medicalRecord, user);
    if (!canUpdate) {
      return sendError(res, 'غير مخول بتحديث هذا السجل', 403);
    }

    // Find and remove attachment
    const attachmentIndex = medicalRecord.attachments.findIndex(
      att => att._id.toString() === attachmentId
    );

    if (attachmentIndex === -1) {
      return sendNotFound(res, 'المرفق غير موجود');
    }

    const attachment = medicalRecord.attachments[attachmentIndex];
    
    // Delete file from storage
    const filePath = `uploads/medical-records/${attachment.filename}`;
    await deleteFile(filePath);

    // Remove from record
    medicalRecord.attachments.splice(attachmentIndex, 1);
    await medicalRecord.save();

    return sendSuccess(res, 'تم حذف المرفق بنجاح');

  } catch (error) {
    console.error('خطأ في حذف المرفق:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Get medical records by type
 */
const getRecordsByType = async (req, res) => {
  try {
    const { patientId, type } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const user = req.user;

    // Check authorization
    const hasAccess = await checkMedicalRecordAccess(patientId, user);
    if (!hasAccess) {
      return sendError(res, 'غير مخول بالوصول لهذه السجلات', 403);
    }

    // Validate type
    if (!Object.values(MEDICAL_RECORD_TYPES).includes(type)) {
      return sendError(res, 'نوع السجل غير صحيح', 400);
    }

    // Build query
    const query = { patientId, type };

    // If patient is viewing, hide private records from other doctors
    if (user.role === USER_ROLES.PATIENT) {
      query.$or = [
        { isPrivate: false },
        { isPrivate: true, doctorId: await getCurrentDoctorId(user) }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const records = await MedicalRecord.find(query)
      .populate('doctorId', 'name specialization')
      .populate('clinicId', 'name')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limitNum);

    const totalRecords = await MedicalRecord.countDocuments(query);
    const totalPages = Math.ceil(totalRecords / limitNum);

    const pagination = {
      page: parseInt(page),
      limit: limitNum,
      totalItems: totalRecords,
      totalPages
    };

    const typeNames = {
      [MEDICAL_RECORD_TYPES.VISIT]: 'الزيارات',
      [MEDICAL_RECORD_TYPES.XRAY]: 'الأشعة',
      [MEDICAL_RECORD_TYPES.LAB_TEST]: 'التحاليل',
      [MEDICAL_RECORD_TYPES.PRESCRIPTION]: 'الروشتات'
    };

    return sendPaginatedResponse(
      res, 
      `تم الحصول على سجلات ${typeNames[type]} بنجاح`, 
      records, 
      pagination
    );

  } catch (error) {
    console.error('خطأ في الحصول على السجلات حسب النوع:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Get doctor's medical records
 */
const getDoctorMedicalRecords = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, patientId } = req.query;
    const user = req.user;

    const doctor = await Doctor.findOne({ userId: user.id });
    if (!doctor) {
      return sendError(res, 'الطبيب غير موجود', 404);
    }

    // Build query
    const query = { doctorId: doctor._id };

    if (type) {
      query.type = type;
    }

    if (patientId) {
      query.patientId = patientId;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const records = await MedicalRecord.find(query)
      .populate({
        path: 'patientId',
        select: 'patientId',
        populate: { path: 'userId', select: 'fullName mobile' }
      })
      .populate('clinicId', 'name')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limitNum);

    const totalRecords = await MedicalRecord.countDocuments(query);
    const totalPages = Math.ceil(totalRecords / limitNum);

    const pagination = {
      page: parseInt(page),
      limit: limitNum,
      totalItems: totalRecords,
      totalPages
    };

    return sendPaginatedResponse(res, 'تم الحصول على السجلات الطبية بنجاح', records, pagination);

  } catch (error) {
    console.error('خطأ في الحصول على سجلات الطبيب:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Search medical records
 */
const searchMedicalRecords = async (req, res) => {
  try {
    const { q, patientId, type, page = 1, limit = 10 } = req.query;
    const user = req.user;

    if (!q) {
      return sendError(res, 'نص البحث مطلوب', 400);
    }

    // Build query
    const query = {
      $or: [
        { title: new RegExp(q, 'i') },
        { description: new RegExp(q, 'i') },
        { diagnosis: new RegExp(q, 'i') },
        { 'prescriptions.medication': new RegExp(q, 'i') }
      ]
    };

    // Add filters
    if (patientId) {
      query.patientId = patientId;
      
      // Check access to patient records
      const hasAccess = await checkMedicalRecordAccess(patientId, user);
      if (!hasAccess) {
        return sendError(res, 'غير مخول بالوصول لهذه السجلات', 403);
      }
    } else if (user.role === USER_ROLES.DOCTOR) {
      // Doctor can only search their own records
      const doctor = await Doctor.findOne({ userId: user.id });
      query.doctorId = doctor._id;
    } else if (user.role === USER_ROLES.PATIENT) {
      // Patient can only search their own records
      const patient = await Patient.findOne({ userId: user.id });
      query.patientId = patient._id;
    }

    if (type) {
      query.type = type;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const records = await MedicalRecord.find(query)
      .populate('patientId', 'patientId', null, { populate: { path: 'userId', select: 'fullName' } })
      .populate('doctorId', 'name specialization')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limitNum);

    const totalRecords = await MedicalRecord.countDocuments(query);
    const totalPages = Math.ceil(totalRecords / limitNum);

    const pagination = {
      page: parseInt(page),
      limit: limitNum,
      totalItems: totalRecords,
      totalPages
    };

    return sendPaginatedResponse(res, 'تم البحث في السجلات الطبية بنجاح', records, pagination);

  } catch (error) {
    console.error('خطأ في البحث في السجلات الطبية:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

// Helper Functions

/**
 * Check medical record access permission
 */
const checkMedicalRecordAccess = async (patientId, user) => {
  // Admin can access all records
  if (user.role === USER_ROLES.ADMIN) return true;

  // Patient can access their own records
  if (user.role === USER_ROLES.PATIENT) {
    const patient = await Patient.findOne({ userId: user.id });
    return patient?._id.toString() === patientId.toString();
  }

  // Doctor can access records of their patients
  if (user.role === USER_ROLES.DOCTOR) {
    const doctor = await Doctor.findOne({ userId: user.id });
    // This could be enhanced to check if doctor has treated this patient
    return true; // For now, allow doctors to access all records
  }

  return false;
};

/**
 * Check update permission
 */
const checkUpdatePermission = async (medicalRecord, user) => {
  // Admin can update all
  if (user.role === USER_ROLES.ADMIN) return true;

  // Doctor can update their own records
  if (user.role === USER_ROLES.DOCTOR) {
    const doctor = await Doctor.findOne({ userId: user.id });
    return medicalRecord.doctorId.toString() === doctor?._id.toString();
  }

  return false;
};

/**
 * Check delete permission
 */
const checkDeletePermission = async (medicalRecord, user) => {
  // Only admin and the creating doctor can delete
  if (user.role === USER_ROLES.ADMIN) return true;

  if (user.role === USER_ROLES.DOCTOR) {
    const doctor = await Doctor.findOne({ userId: user.id });
    return medicalRecord.doctorId.toString() === doctor?._id.toString();
  }

  return false;
};

/**
 * Get current doctor ID for user
 */
const getCurrentDoctorId = async (user) => {
  if (user.role === USER_ROLES.DOCTOR) {
    const doctor = await Doctor.findOne({ userId: user.id });
    return doctor?._id;
  }
  return null;
};

module.exports = {
  createMedicalRecord,
  getPatientMedicalRecords,
  getMedicalRecordById,
  updateMedicalRecord,
  deleteMedicalRecord,
  removeAttachment,
  getRecordsByType,
  getDoctorMedicalRecords,
  searchMedicalRecords
}; 
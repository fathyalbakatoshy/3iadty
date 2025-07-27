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
  USER_ROLES 
} = require('../config/constants');
const Patient = require('../models/Patient');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');
const { processUploadedFiles } = require('../utils/upload');

/**
 * Get all patients (Admin/Doctor only)
 */
const getAllPatients = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const user = req.user;

    // Check permission
    if (![USER_ROLES.ADMIN, USER_ROLES.DOCTOR, USER_ROLES.RECEPTION].includes(user.role)) {
      return sendError(res, 'غير مخول بالوصول لهذه البيانات', 403);
    }

    // Build query
    let query = { isActive: true };

    if (search) {
      query.$or = [
        { patientId: new RegExp(search, 'i') },
        { 'emergencyContact.name': new RegExp(search, 'i') }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Sort
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const patients = await Patient.find(query)
      .populate('userId', 'fullName mobile email gender dateOfBirth profilePicture')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const totalPatients = await Patient.countDocuments(query);
    const totalPages = Math.ceil(totalPatients / limitNum);

    const pagination = {
      page: parseInt(page),
      limit: limitNum,
      totalItems: totalPatients,
      totalPages
    };

    return sendPaginatedResponse(res, 'تم الحصول على المرضى بنجاح', patients, pagination);

  } catch (error) {
    console.error('خطأ في الحصول على المرضى:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Get patient by ID
 */
const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const patient = await Patient.findById(id)
      .populate('userId', 'fullName mobile email gender dateOfBirth address profilePicture lastLogin')
      .populate('appointmentHistory.favoriteDoctor', 'name specialization')
      .populate('appointmentHistory.favoriteClinic', 'name location.address');

    if (!patient) {
      return sendNotFound(res, 'المريض غير موجود');
    }

    // Check access permission
    const hasAccess = await checkPatientAccess(patient, user);
    if (!hasAccess) {
      return sendError(res, 'غير مخول بالوصول لهذه البيانات', 403);
    }

    return sendSuccess(res, 'تم الحصول على بيانات المريض بنجاح', patient);

  } catch (error) {
    console.error('خطأ في الحصول على بيانات المريض:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Update patient profile
 */
const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const user = req.user;

    const patient = await Patient.findById(id);
    if (!patient) {
      return sendNotFound(res, 'المريض غير موجود');
    }

    // Check access permission
    const hasAccess = await checkPatientUpdatePermission(patient, user);
    if (!hasAccess) {
      return sendError(res, 'غير مخول بتحديث هذه البيانات', 403);
    }

    // Parse nested JSON strings if needed
    if (updateData.medicalHistory && typeof updateData.medicalHistory === 'string') {
      updateData.medicalHistory = JSON.parse(updateData.medicalHistory);
    }

    if (updateData.preferences && typeof updateData.preferences === 'string') {
      updateData.preferences = JSON.parse(updateData.preferences);
    }

    if (updateData.emergencyContact && typeof updateData.emergencyContact === 'string') {
      updateData.emergencyContact = JSON.parse(updateData.emergencyContact);
    }

    if (updateData.insurance && typeof updateData.insurance === 'string') {
      updateData.insurance = JSON.parse(updateData.insurance);
    }

    // Update patient data
    const updatedPatient = await Patient.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('userId', 'fullName mobile email gender dateOfBirth address profilePicture');

    return sendUpdated(res, SUCCESS_MESSAGES.UPDATED_SUCCESSFULLY, updatedPatient);

  } catch (error) {
    console.error('خطأ في تحديث بيانات المريض:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Get patient's medical history
 */
const getPatientMedicalHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const patient = await Patient.findById(id);
    if (!patient) {
      return sendNotFound(res, 'المريض غير موجود');
    }

    // Check access permission
    const hasAccess = await checkPatientAccess(patient, user);
    if (!hasAccess) {
      return sendError(res, 'غير مخول بالوصول لهذه البيانات', 403);
    }

    // Get comprehensive medical history
    const medicalHistory = {
      basicInfo: {
        bloodType: patient.medicalHistory?.bloodType,
        weight: patient.medicalHistory?.weight,
        height: patient.medicalHistory?.height,
        bmi: patient.bmi,
        bmiCategory: patient.bmiCategory
      },
      allergies: patient.medicalHistory?.allergies || [],
      chronicDiseases: patient.medicalHistory?.chronicDiseases || [],
      surgicalHistory: patient.medicalHistory?.surgicalHistory || [],
      currentMedications: patient.medicalHistory?.currentMedications || [],
      familyHistory: patient.medicalHistory?.familyHistory || [],
      habits: patient.medicalHistory?.habits || {},
      insurance: patient.insurance || {}
    };

    return sendSuccess(res, 'تم الحصول على التاريخ الطبي بنجاح', medicalHistory);

  } catch (error) {
    console.error('خطأ في الحصول على التاريخ الطبي:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Update patient's medical history
 */
const updateMedicalHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const user = req.user;

    const patient = await Patient.findById(id);
    if (!patient) {
      return sendNotFound(res, 'المريض غير موجود');
    }

    // Check permission (only doctors and admins can update medical history)
    if (![USER_ROLES.ADMIN, USER_ROLES.DOCTOR].includes(user.role)) {
      // Allow patients to update basic info only
      if (user.role === USER_ROLES.PATIENT) {
        const userPatient = await Patient.findOne({ userId: user.id });
        if (patient._id.toString() !== userPatient?._id.toString()) {
          return sendError(res, 'غير مخول بتحديث هذه البيانات', 403);
        }
        
        // Patients can only update basic medical info
        const allowedFields = ['weight', 'height', 'allergies', 'currentMedications', 'habits'];
        const filteredUpdate = {};
        
        Object.keys(updateData).forEach(key => {
          if (allowedFields.includes(key)) {
            filteredUpdate[key] = updateData[key];
          }
        });
        
        updateData = { medicalHistory: filteredUpdate };
      } else {
        return sendError(res, 'غير مخول بتحديث التاريخ الطبي', 403);
      }
    }

    // Update weight/height timestamp
    if (updateData.medicalHistory?.weight) {
      updateData.medicalHistory.weight.lastUpdated = new Date();
    }
    if (updateData.medicalHistory?.height) {
      updateData.medicalHistory.height.lastUpdated = new Date();
    }

    // Merge with existing medical history
    const currentMedicalHistory = patient.medicalHistory || {};
    const updatedMedicalHistory = {
      ...currentMedicalHistory,
      ...updateData.medicalHistory
    };

    const updatedPatient = await Patient.findByIdAndUpdate(
      id,
      { medicalHistory: updatedMedicalHistory },
      { new: true, runValidators: true }
    ).populate('userId', 'fullName mobile email');

    return sendUpdated(res, 'تم تحديث التاريخ الطبي بنجاح', updatedPatient);

  } catch (error) {
    console.error('خطأ في تحديث التاريخ الطبي:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Add allergy to patient
 */
const addAllergy = async (req, res) => {
  try {
    const { id } = req.params;
    const { allergen, severity, reaction, notes } = req.body;
    const user = req.user;

    const patient = await Patient.findById(id);
    if (!patient) {
      return sendNotFound(res, 'المريض غير موجود');
    }

    // Check permission
    if (![USER_ROLES.ADMIN, USER_ROLES.DOCTOR].includes(user.role)) {
      const userPatient = await Patient.findOne({ userId: user.id });
      if (patient._id.toString() !== userPatient?._id.toString()) {
        return sendError(res, 'غير مخول بتحديث هذه البيانات', 403);
      }
    }

    const allergyData = { allergen, severity, reaction, notes };
    await patient.addAllergy(allergyData);

    return sendSuccess(res, 'تم إضافة الحساسية بنجاح');

  } catch (error) {
    console.error('خطأ في إضافة الحساسية:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Add chronic disease to patient
 */
const addChronicDisease = async (req, res) => {
  try {
    const { id } = req.params;
    const { disease, diagnosedDate, status, medications, notes } = req.body;
    const user = req.user;

    const patient = await Patient.findById(id);
    if (!patient) {
      return sendNotFound(res, 'المريض غير موجود');
    }

    // Check permission (only doctors and admins)
    if (![USER_ROLES.ADMIN, USER_ROLES.DOCTOR].includes(user.role)) {
      return sendError(res, 'غير مخول بإضافة مرض مزمن', 403);
    }

    const diseaseData = {
      disease,
      diagnosedDate: diagnosedDate ? new Date(diagnosedDate) : null,
      status,
      medications: medications || [],
      notes
    };

    await patient.addChronicDisease(diseaseData);

    return sendSuccess(res, 'تم إضافة المرض المزمن بنجاح');

  } catch (error) {
    console.error('خطأ في إضافة المرض المزمن:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Add current medication to patient
 */
const addCurrentMedication = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, dosage, frequency, startDate, endDate, prescribedBy, notes } = req.body;
    const user = req.user;

    const patient = await Patient.findById(id);
    if (!patient) {
      return sendNotFound(res, 'المريض غير موجود');
    }

    // Check permission
    if (![USER_ROLES.ADMIN, USER_ROLES.DOCTOR].includes(user.role)) {
      const userPatient = await Patient.findOne({ userId: user.id });
      if (patient._id.toString() !== userPatient?._id.toString()) {
        return sendError(res, 'غير مخول بتحديث هذه البيانات', 403);
      }
    }

    const medicationData = {
      name,
      dosage,
      frequency,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      prescribedBy,
      notes
    };

    await patient.addCurrentMedication(medicationData);

    return sendSuccess(res, 'تم إضافة الدواء بنجاح');

  } catch (error) {
    console.error('خطأ في إضافة الدواء:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Get patient's appointments
 */
const getPatientAppointments = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, status, upcoming } = req.query;
    const user = req.user;

    const patient = await Patient.findById(id);
    if (!patient) {
      return sendNotFound(res, 'المريض غير موجود');
    }

    // Check access permission
    const hasAccess = await checkPatientAccess(patient, user);
    if (!hasAccess) {
      return sendError(res, 'غير مخول بالوصول لهذه البيانات', 403);
    }

    // Build query
    let query = { patientId: id };

    if (status) {
      query.status = status;
    }

    if (upcoming === 'true') {
      query.dateTime = { $gte: new Date() };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const appointments = await Appointment.find(query)
      .populate('doctorId', 'name specialization consultationFee profilePicture')
      .populate('clinicId', 'name location.address phones')
      .sort({ dateTime: upcoming === 'true' ? 1 : -1 })
      .skip(skip)
      .limit(limitNum);

    const totalAppointments = await Appointment.countDocuments(query);
    const totalPages = Math.ceil(totalAppointments / limitNum);

    const pagination = {
      page: parseInt(page),
      limit: limitNum,
      totalItems: totalAppointments,
      totalPages
    };

    return sendPaginatedResponse(res, 'تم الحصول على المواعيد بنجاح', appointments, pagination);

  } catch (error) {
    console.error('خطأ في الحصول على المواعيد:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Get patient's medical records
 */
const getPatientMedicalRecords = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, type } = req.query;
    const user = req.user;

    const patient = await Patient.findById(id);
    if (!patient) {
      return sendNotFound(res, 'المريض غير موجود');
    }

    // Check access permission
    const hasAccess = await checkPatientAccess(patient, user);
    if (!hasAccess) {
      return sendError(res, 'غير مخول بالوصول لهذه البيانات', 403);
    }

    // Build query
    let query = { patientId: id };

    if (type) {
      query.type = type;
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
 * Add note to patient
 */
const addPatientNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { note, isPrivate = false } = req.body;
    const user = req.user;

    const patient = await Patient.findById(id);
    if (!patient) {
      return sendNotFound(res, 'المريض غير موجود');
    }

    // Check permission (only doctors and admins can add notes)
    if (![USER_ROLES.ADMIN, USER_ROLES.DOCTOR].includes(user.role)) {
      return sendError(res, 'غير مخول بإضافة ملاحظات', 403);
    }

    await patient.addNote(note, user.id, isPrivate);

    return sendSuccess(res, 'تم إضافة الملاحظة بنجاح');

  } catch (error) {
    console.error('خطأ في إضافة الملاحظة:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Search patients
 */
const searchPatients = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    const user = req.user;

    // Check permission
    if (![USER_ROLES.ADMIN, USER_ROLES.DOCTOR, USER_ROLES.RECEPTION].includes(user.role)) {
      return sendError(res, 'غير مخول بالبحث في المرضى', 403);
    }

    if (!q) {
      return sendError(res, 'نص البحث مطلوب', 400);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const patients = await Patient.searchPatients(q)
      .skip(skip)
      .limit(limitNum);

    const totalPatients = await Patient.countDocuments({
      $or: [
        { patientId: new RegExp(q, 'i') }
      ],
      isActive: true
    });

    const totalPages = Math.ceil(totalPatients / limitNum);

    const pagination = {
      page: parseInt(page),
      limit: limitNum,
      totalItems: totalPatients,
      totalPages
    };

    return sendPaginatedResponse(res, 'تم البحث في المرضى بنجاح', patients, pagination);

  } catch (error) {
    console.error('خطأ في البحث في المرضى:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Get patient statistics
 */
const getPatientStats = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const patient = await Patient.findById(id);
    if (!patient) {
      return sendNotFound(res, 'المريض غير موجود');
    }

    // Check access permission
    const hasAccess = await checkPatientAccess(patient, user);
    if (!hasAccess) {
      return sendError(res, 'غير مخول بالوصول لهذه البيانات', 403);
    }

    // Get comprehensive statistics
    const stats = {
      appointments: patient.appointmentHistory,
      medicalRecords: {
        total: await MedicalRecord.countDocuments({ patientId: id }),
        byType: await MedicalRecord.aggregate([
          { $match: { patientId: patient._id } },
          { $group: { _id: '$type', count: { $sum: 1 } } }
        ])
      },
      healthMetrics: {
        bmi: patient.bmi,
        bmiCategory: patient.bmiCategory,
        age: patient.age,
        bloodType: patient.medicalHistory?.bloodType,
        allergiesCount: patient.medicalHistory?.allergies?.length || 0,
        chronicDiseasesCount: patient.medicalHistory?.chronicDiseases?.length || 0,
        currentMedicationsCount: patient.medicalHistory?.currentMedications?.length || 0
      }
    };

    return sendSuccess(res, 'تم الحصول على إحصائيات المريض بنجاح', stats);

  } catch (error) {
    console.error('خطأ في الحصول على إحصائيات المريض:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

// Helper Functions

/**
 * Check patient access permission
 */
const checkPatientAccess = async (patient, user) => {
  // Admin can access all patients
  if (user.role === USER_ROLES.ADMIN) return true;

  // Doctors and reception can access all patients
  if ([USER_ROLES.DOCTOR, USER_ROLES.RECEPTION].includes(user.role)) return true;

  // Patient can access their own data
  if (user.role === USER_ROLES.PATIENT) {
    const userPatient = await Patient.findOne({ userId: user.id });
    return patient._id.toString() === userPatient?._id.toString();
  }

  return false;
};

/**
 * Check patient update permission
 */
const checkPatientUpdatePermission = async (patient, user) => {
  // Admin can update all patients
  if (user.role === USER_ROLES.ADMIN) return true;

  // Patient can update their own basic info
  if (user.role === USER_ROLES.PATIENT) {
    const userPatient = await Patient.findOne({ userId: user.id });
    return patient._id.toString() === userPatient?._id.toString();
  }

  // Doctors can update patient info
  if (user.role === USER_ROLES.DOCTOR) return true;

  return false;
};

/**
 * Get current doctor ID for user
 */
const getCurrentDoctorId = async (user) => {
  if (user.role === USER_ROLES.DOCTOR) {
    const Doctor = require('../models/Doctor');
    const doctor = await Doctor.findOne({ userId: user.id });
    return doctor?._id;
  }
  return null;
};

module.exports = {
  getAllPatients,
  getPatientById,
  updatePatient,
  getPatientMedicalHistory,
  updateMedicalHistory,
  addAllergy,
  addChronicDisease,
  addCurrentMedication,
  getPatientAppointments,
  getPatientMedicalRecords,
  addPatientNote,
  searchPatients,
  getPatientStats
}; 
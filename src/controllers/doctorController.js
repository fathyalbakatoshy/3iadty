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
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Clinic = require('../models/Clinic');

/**
 * Get all doctors with filtering and pagination
 */
const getAllDoctors = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      specialization,
      city,
      minRating,
      maxPrice,
      isAcceptingPatients = true,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {
      isActive: true
    };

    if (isAcceptingPatients !== undefined) {
      query.isAcceptingPatients = isAcceptingPatients === 'true';
    }

    if (specialization) {
      query.specialization = new RegExp(specialization, 'i');
    }

    if (city) {
      query['location.address.city'] = new RegExp(city, 'i');
    }

    if (minRating) {
      query['stats.averageRating'] = { $gte: parseFloat(minRating) };
    }

    if (maxPrice) {
      query.consultationFee = { $lte: parseFloat(maxPrice) };
    }

    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { specialization: new RegExp(search, 'i') },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Sort
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const doctors = await Doctor.find(query)
      .populate('userId', 'fullName mobile email')
      .populate('clinics.clinicId', 'name location.address')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Count total documents
    const totalDoctors = await Doctor.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(totalDoctors / limitNum);

    return sendPaginatedResponse(res, SUCCESS_MESSAGES.RETRIEVED_SUCCESSFULLY, doctors, {
      page: parseInt(page),
      limit: limitNum,
      totalItems: totalDoctors,
      totalPages
    });

  } catch (error) {
    console.error('خطأ في جلب الأطباء:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Get doctor by ID or slug
 */
const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try to find by ObjectId first, then by slug
    let doctor;
    
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      // Valid ObjectId
      doctor = await Doctor.findById(id);
    } else {
      // Assume it's a slug
      doctor = await Doctor.findOne({ slug: id });
    }

    if (!doctor || !doctor.isActive) {
      return sendNotFound(res, 'الطبيب غير موجود');
    }

    // Populate related data
    await doctor.populate([
      {
        path: 'userId',
        select: 'fullName mobile email -_id'
      },
      {
        path: 'clinics.clinicId',
        select: 'name location phones workingHours'
      }
    ]);

    return sendSuccess(res, SUCCESS_MESSAGES.RETRIEVED_SUCCESSFULLY, doctor);

  } catch (error) {
    console.error('خطأ في جلب الطبيب:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Create new doctor profile
 */
const createDoctor = async (req, res) => {
  try {
    const {
      userId,
      name,
      specialization,
      consultationFee,
      biography,
      degrees,
      experience,
      services,
      availability,
      location,
      languages,
      tags
    } = req.body;

    // Check if user exists and has doctor role
    const user = await User.findById(userId);
    if (!user || user.role !== USER_ROLES.DOCTOR) {
      return sendError(res, 'المستخدم غير موجود أو ليس طبيباً', 400);
    }

    // Check if doctor profile already exists
    const existingDoctor = await Doctor.findOne({ userId });
    if (existingDoctor) {
      return sendError(res, 'ملف الطبيب موجود مسبقاً', 400);
    }

    // Create doctor profile
    const doctorData = {
      userId,
      name: name || user.fullName,
      specialization,
      consultationFee,
      biography,
      degrees,
      experience,
      services,
      availability,
      location,
      languages,
      tags
    };

    // Handle profile picture if uploaded
    if (req.uploadedFile) {
      doctorData.profilePicture = {
        filename: req.uploadedFile.filename,
        url: req.uploadedFile.url,
        uploadedAt: new Date()
      };
    }

    const doctor = new Doctor(doctorData);
    await doctor.save();

    return sendCreated(res, SUCCESS_MESSAGES.CREATED_SUCCESSFULLY, doctor);

  } catch (error) {
    console.error('خطأ في إنشاء ملف الطبيب:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Update doctor profile
 */
const updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.userId;
    delete updates.slug;
    delete updates.stats;

    // Handle profile picture if uploaded
    if (req.uploadedFile) {
      updates.profilePicture = {
        filename: req.uploadedFile.filename,
        url: req.uploadedFile.url,
        uploadedAt: new Date()
      };
    }

    const doctor = await Doctor.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('userId', 'fullName mobile email');

    if (!doctor) {
      return sendNotFound(res, 'الطبيب غير موجود');
    }

    return sendUpdated(res, SUCCESS_MESSAGES.UPDATED_SUCCESSFULLY, doctor);

  } catch (error) {
    console.error('خطأ في تحديث ملف الطبيب:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Delete doctor profile
 */
const deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete by setting isActive to false
    const doctor = await Doctor.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!doctor) {
      return sendNotFound(res, 'الطبيب غير موجود');
    }

    return sendDeleted(res, SUCCESS_MESSAGES.DELETED_SUCCESSFULLY);

  } catch (error) {
    console.error('خطأ في حذف الطبيب:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Search doctors
 */
const searchDoctors = async (req, res) => {
  try {
    const { q, filters = {} } = req.query;

    if (!q || q.trim().length < 2) {
      return sendError(res, 'كلمة البحث يجب أن تكون حرفين على الأقل', 400);
    }

    const doctors = await Doctor.searchDoctors(q, filters);

    return sendSuccess(res, SUCCESS_MESSAGES.RETRIEVED_SUCCESSFULLY, doctors);

  } catch (error) {
    console.error('خطأ في البحث عن الأطباء:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Get doctors by specialization
 */
const getDoctorsBySpecialization = async (req, res) => {
  try {
    const { specialization } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const doctors = await Doctor.findBySpecialization(specialization)
      .populate('userId', 'fullName')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalDoctors = await Doctor.countDocuments({
      specialization: new RegExp(specialization, 'i'),
      isActive: true,
      isAcceptingPatients: true
    });

    const totalPages = Math.ceil(totalDoctors / limit);

    return sendPaginatedResponse(res, SUCCESS_MESSAGES.RETRIEVED_SUCCESSFULLY, doctors, {
      page: parseInt(page),
      limit: parseInt(limit),
      totalItems: totalDoctors,
      totalPages
    });

  } catch (error) {
    console.error('خطأ في جلب الأطباء حسب التخصص:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Get nearby doctors
 */
const getNearbyDoctors = async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 5000 } = req.query;

    if (!longitude || !latitude) {
      return sendError(res, 'خط الطول والعرض مطلوبان', 400);
    }

    const doctors = await Doctor.findNearby(
      parseFloat(longitude),
      parseFloat(latitude),
      parseInt(maxDistance)
    ).populate('userId', 'fullName');

    return sendSuccess(res, SUCCESS_MESSAGES.RETRIEVED_SUCCESSFULLY, doctors);

  } catch (error) {
    console.error('خطأ في جلب الأطباء القريبين:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Add doctor to clinic
 */
const addDoctorToClinic = async (req, res) => {
  try {
    const { doctorId, clinicId } = req.params;
    const { workingDays, specialRole } = req.body;

    // Find doctor and clinic
    const doctor = await Doctor.findById(doctorId);
    const clinic = await Clinic.findById(clinicId);

    if (!doctor || !clinic) {
      return sendNotFound(res, 'الطبيب أو العيادة غير موجود');
    }

    // Add clinic to doctor
    const clinicData = {
      clinicId,
      workingDays,
      specialRole
    };

    // Check if already associated
    const existingAssociation = doctor.clinics.find(c => 
      c.clinicId.toString() === clinicId
    );

    if (existingAssociation) {
      return sendError(res, 'الطبيب مرتبط بهذه العيادة مسبقاً', 400);
    }

    doctor.clinics.push(clinicData);
    await doctor.save();

    // Add doctor to clinic
    await clinic.addDoctor(doctorId, { specialRole, workingDays });

    return sendSuccess(res, 'تم ربط الطبيب بالعيادة بنجاح');

  } catch (error) {
    console.error('خطأ في ربط الطبيب بالعيادة:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Remove doctor from clinic
 */
const removeDoctorFromClinic = async (req, res) => {
  try {
    const { doctorId, clinicId } = req.params;

    // Find doctor and clinic
    const doctor = await Doctor.findById(doctorId);
    const clinic = await Clinic.findById(clinicId);

    if (!doctor || !clinic) {
      return sendNotFound(res, 'الطبيب أو العيادة غير موجود');
    }

    // Remove clinic from doctor
    doctor.clinics = doctor.clinics.filter(c => 
      c.clinicId.toString() !== clinicId
    );
    await doctor.save();

    // Remove doctor from clinic
    await clinic.removeDoctor(doctorId);

    return sendSuccess(res, 'تم إلغاء ربط الطبيب من العيادة بنجاح');

  } catch (error) {
    console.error('خطأ في إلغاء ربط الطبيب من العيادة:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Get doctor statistics
 */
const getDoctorStats = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return sendNotFound(res, 'الطبيب غير موجود');
    }

    const stats = {
      totalAppointments: doctor.stats.totalAppointments,
      completedAppointments: doctor.stats.completedAppointments,
      canceledAppointments: doctor.stats.canceledAppointments,
      averageRating: doctor.stats.averageRating,
      totalReviews: doctor.stats.totalReviews
    };

    return sendSuccess(res, SUCCESS_MESSAGES.RETRIEVED_SUCCESSFULLY, stats);

  } catch (error) {
    console.error('خطأ في جلب إحصائيات الطبيب:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

module.exports = {
  getAllDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  searchDoctors,
  getDoctorsBySpecialization,
  getNearbyDoctors,
  addDoctorToClinic,
  removeDoctorFromClinic,
  getDoctorStats
}; 
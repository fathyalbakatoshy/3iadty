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
const Clinic = require('../models/Clinic');
const Doctor = require('../models/Doctor');
const { generateUniqueSlug } = require('../utils/slug');

/**
 * Get all clinics with filtering and pagination
 */
const getAllClinics = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      type,
      city,
      specialization,
      isVerified,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {
      isActive: true
    };

    if (type) {
      query.type = type;
    }

    if (city) {
      query['location.address.city'] = new RegExp(city, 'i');
    }

    if (specialization) {
      query.specializations = { $in: [new RegExp(specialization, 'i')] };
    }

    if (isVerified !== undefined) {
      query.isVerified = isVerified === 'true';
    }

    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { specializations: { $in: [new RegExp(search, 'i')] } },
        { 'location.address.city': new RegExp(search, 'i') },
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
    const clinics = await Clinic.find(query)
      .populate('doctors.doctorId', 'name specialization')
      .populate('manager.userId', 'fullName mobile email')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count
    const totalClinics = await Clinic.countDocuments(query);
    const totalPages = Math.ceil(totalClinics / limitNum);

    const pagination = {
      page: parseInt(page),
      limit: limitNum,
      totalItems: totalClinics,
      totalPages
    };

    return sendPaginatedResponse(res, 'تم الاستعلام عن العيادات بنجاح', clinics, pagination);

  } catch (error) {
    console.error('خطأ في الحصول على العيادات:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Get clinic by ID
 */
const getClinicById = async (req, res) => {
  try {
    const { id } = req.params;

    const clinic = await Clinic.findById(id)
      .populate('doctors.doctorId', 'name specialization consultationFee stats.averageRating')
      .populate('manager.userId', 'fullName mobile email')
      .populate('branches.branchId', 'name location.address');

    if (!clinic) {
      return sendNotFound(res, 'العيادة غير موجودة');
    }

    return sendSuccess(res, 'تم الحصول على تفاصيل العيادة بنجاح', clinic);

  } catch (error) {
    console.error('خطأ في الحصول على تفاصيل العيادة:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Get clinic by slug (public)
 */
const getClinicBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const clinic = await Clinic.findOne({ slug, isActive: true })
      .populate({
        path: 'doctors.doctorId',
        match: { isActive: true, isAcceptingPatients: true },
        select: 'name specialization consultationFee stats.averageRating profilePicture'
      })
      .select('-manager.userId -owner');

    if (!clinic) {
      return sendNotFound(res, 'العيادة غير موجودة');
    }

    return sendSuccess(res, 'تم الحصول على تفاصيل العيادة بنجاح', clinic);

  } catch (error) {
    console.error('خطأ في الحصول على تفاصيل العيادة:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Create new clinic
 */
const createClinic = async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      phones,
      email,
      website,
      location,
      workingHours,
      specializations,
      services,
      facilities,
      paymentMethods,
      owner,
      manager,
      tags
    } = req.body;

    // Generate unique slug
    const slug = await generateUniqueSlug(name, Clinic);

    // Create clinic
    const clinic = new Clinic({
      name,
      slug,
      description,
      type,
      phones,
      email,
      website,
      location,
      workingHours,
      specializations,
      services,
      facilities,
      paymentMethods,
      owner,
      manager,
      tags
    });

    await clinic.save();

    return sendCreated(res, SUCCESS_MESSAGES.CREATED_SUCCESSFULLY, clinic);

  } catch (error) {
    console.error('خطأ في إنشاء العيادة:', error);
    if (error.code === 11000) {
      return sendError(res, 'اسم العيادة موجود مسبقاً', 400);
    }
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Update clinic
 */
const updateClinic = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // If name is being updated, regenerate slug
    if (updateData.name) {
      updateData.slug = await generateUniqueSlug(updateData.name, Clinic, 'slug', id);
    }

    const clinic = await Clinic.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('doctors.doctorId', 'name specialization');

    if (!clinic) {
      return sendNotFound(res, 'العيادة غير موجودة');
    }

    return sendUpdated(res, SUCCESS_MESSAGES.UPDATED_SUCCESSFULLY, clinic);

  } catch (error) {
    console.error('خطأ في تحديث العيادة:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Delete clinic (soft delete)
 */
const deleteClinic = async (req, res) => {
  try {
    const { id } = req.params;

    const clinic = await Clinic.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!clinic) {
      return sendNotFound(res, 'العيادة غير موجودة');
    }

    return sendDeleted(res, SUCCESS_MESSAGES.DELETED_SUCCESSFULLY);

  } catch (error) {
    console.error('خطأ في حذف العيادة:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Search clinics
 */
const searchClinics = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    if (!q) {
      return sendError(res, 'نص البحث مطلوب', 400);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const clinics = await Clinic.searchClinics(q)
      .populate('doctors.doctorId', 'name specialization')
      .sort({ 'stats.averageRating': -1 })
      .skip(skip)
      .limit(limitNum);

    const totalClinics = await Clinic.countDocuments({
      $or: [
        { name: new RegExp(q, 'i') },
        { specializations: { $in: [new RegExp(q, 'i')] } },
        { 'location.address.city': new RegExp(q, 'i') },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ],
      isActive: true
    });

    const totalPages = Math.ceil(totalClinics / limitNum);

    const pagination = {
      page: parseInt(page),
      limit: limitNum,
      totalItems: totalClinics,
      totalPages
    };

    return sendPaginatedResponse(res, 'تم البحث في العيادات بنجاح', clinics, pagination);

  } catch (error) {
    console.error('خطأ في البحث في العيادات:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Get nearby clinics
 */
const getNearby = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 5000 } = req.query;

    if (!latitude || !longitude) {
      return sendError(res, 'الإحداثيات مطلوبة', 400);
    }

    const clinics = await Clinic.findNearby(
      parseFloat(longitude),
      parseFloat(latitude),
      parseInt(maxDistance)
    ).populate('doctors.doctorId', 'name specialization')
     .limit(20);

    return sendSuccess(res, 'تم الحصول على العيادات القريبة بنجاح', clinics);

  } catch (error) {
    console.error('خطأ في الحصول على العيادات القريبة:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Get clinics by specialization
 */
const getBySpecialization = async (req, res) => {
  try {
    const { specialization } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const clinics = await Clinic.findBySpecialization(specialization)
      .populate('doctors.doctorId', 'name specialization')
      .sort({ 'stats.averageRating': -1 })
      .skip(skip)
      .limit(limitNum);

    const totalClinics = await Clinic.countDocuments({
      specializations: new RegExp(specialization, 'i'),
      isActive: true
    });

    const totalPages = Math.ceil(totalClinics / limitNum);

    const pagination = {
      page: parseInt(page),
      limit: limitNum,
      totalItems: totalClinics,
      totalPages
    };

    return sendPaginatedResponse(res, `تم الحصول على عيادات ${specialization} بنجاح`, clinics, pagination);

  } catch (error) {
    console.error('خطأ في الحصول على العيادات حسب التخصص:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Add doctor to clinic
 */
const addDoctorToClinic = async (req, res) => {
  try {
    const { clinicId, doctorId } = req.params;
    const { workingDays, specialRole } = req.body;

    const clinic = await Clinic.findById(clinicId);
    const doctor = await Doctor.findById(doctorId);

    if (!clinic || !doctor) {
      return sendNotFound(res, 'العيادة أو الطبيب غير موجود');
    }

    // Add doctor to clinic
    await clinic.addDoctor(doctorId, { workingDays, specialRole });

    // Add clinic to doctor
    const clinicData = {
      clinicId,
      workingDays,
      specialRole
    };

    const existingAssociation = doctor.clinics.find(c => 
      c.clinicId.toString() === clinicId
    );

    if (!existingAssociation) {
      doctor.clinics.push(clinicData);
      await doctor.save();
    }

    return sendSuccess(res, 'تم إضافة الطبيب للعيادة بنجاح');

  } catch (error) {
    console.error('خطأ في إضافة الطبيب للعيادة:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Remove doctor from clinic
 */
const removeDoctorFromClinic = async (req, res) => {
  try {
    const { clinicId, doctorId } = req.params;

    const clinic = await Clinic.findById(clinicId);
    const doctor = await Doctor.findById(doctorId);

    if (!clinic || !doctor) {
      return sendNotFound(res, 'العيادة أو الطبيب غير موجود');
    }

    // Remove doctor from clinic
    await clinic.removeDoctor(doctorId);

    // Remove clinic from doctor
    doctor.clinics = doctor.clinics.filter(c => 
      c.clinicId.toString() !== clinicId
    );
    await doctor.save();

    return sendSuccess(res, 'تم إزالة الطبيب من العيادة بنجاح');

  } catch (error) {
    console.error('خطأ في إزالة الطبيب من العيادة:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Get clinic statistics
 */
const getClinicStats = async (req, res) => {
  try {
    const { id } = req.params;

    const clinic = await Clinic.findById(id);
    if (!clinic) {
      return sendNotFound(res, 'العيادة غير موجودة');
    }

    // Get detailed statistics
    const stats = {
      basic: clinic.stats,
      doctors: {
        total: clinic.doctors.length,
        active: clinic.doctors.filter(d => d.isActive).length
      },
      services: {
        total: clinic.services.length,
        active: clinic.services.filter(s => s.isActive).length
      },
      facilities: clinic.facilities.length,
      workingDays: clinic.workingHours.filter(wh => wh.isOpen).length
    };

    return sendSuccess(res, 'تم الحصول على إحصائيات العيادة بنجاح', stats);

  } catch (error) {
    console.error('خطأ في الحصول على إحصائيات العيادة:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

module.exports = {
  getAllClinics,
  getClinicById,
  getClinicBySlug,
  createClinic,
  updateClinic,
  deleteClinic,
  searchClinics,
  getNearby,
  getBySpecialization,
  addDoctorToClinic,
  removeDoctorFromClinic,
  getClinicStats
}; 
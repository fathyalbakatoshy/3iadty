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
const Specialization = require('../models/Specialization');
const Doctor = require('../models/Doctor');

/**
 * Get all specializations with filtering and pagination (Admin only)
 */
const getAllSpecializations = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      isActive = true,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    // Build query
    const query = {
      isDeleted: false
    };

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { code: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { commonConditions: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Sort
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const specializations = await Specialization.find(query)
      .populate('createdBy', 'fullName')
      .populate('updatedBy', 'fullName')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const totalSpecializations = await Specialization.countDocuments(query);
    const totalPages = Math.ceil(totalSpecializations / limitNum);

    // Get statistics
    const stats = await Specialization.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } },
          verified: { $sum: { $cond: ['$isVerified', 1, 0] } }
        }
      }
    ]);

    const pagination = {
      page: parseInt(page),
      limit: limitNum,
      totalItems: totalSpecializations,
      totalPages
    };

    const response = {
      specializations,
      statistics: stats[0] || { total: 0, active: 0, verified: 0 }
    };

    return sendPaginatedResponse(res, SUCCESS_MESSAGES.RETRIEVED_SUCCESSFULLY, response, pagination);

  } catch (error) {
    console.error('خطأ في جلب التخصصات:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Get specialization by ID
 */
const getSpecializationById = async (req, res) => {
  try {
    const { id } = req.params;

    const specialization = await Specialization.findOne({
      _id: id,
      isDeleted: false
    })
    .populate('createdBy', 'fullName')
    .populate('updatedBy', 'fullName');

    if (!specialization) {
      return sendNotFound(res, 'التخصص غير موجود');
    }

    // Get doctors in this specialization
    const doctors = await Doctor.find({
      specialization: specialization._id,
      isActive: true
    })
    .select('name consultationFee stats.averageRating stats.totalReviews')
    .limit(10);

    const response = {
      specialization,
      doctors: {
        count: doctors.length,
        list: doctors
      }
    };

    return sendSuccess(res, SUCCESS_MESSAGES.RETRIEVED_SUCCESSFULLY, response);

  } catch (error) {
    console.error('خطأ في جلب التخصص:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Create new specialization
 */
const createSpecialization = async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== USER_ROLES.ADMIN) {
      return sendError(res, 'غير مخول بإنشاء تخصص جديد', 403);
    }

    const {
      name,
      code,
      description,
      commonConditions,
      icon
    } = req.body;

    // Check if specialization already exists
    const existingSpecialization = await Specialization.findOne({
      $or: [
        { name },
        { code: code.toUpperCase() }
      ],
      isDeleted: false
    });

    if (existingSpecialization) {
      return sendError(res, 'التخصص موجود مسبقاً', 400);
    }

    // Create specialization
    const specializationData = {
      name,
      code: code.toUpperCase(),
      description,
      commonConditions,
      icon,
      createdBy: user._id
    };

    const specialization = new Specialization(specializationData);
    await specialization.save();

    return sendCreated(res, SUCCESS_MESSAGES.CREATED_SUCCESSFULLY, specialization);

  } catch (error) {
    console.error('خطأ في إنشاء التخصص:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Update specialization
 */
const updateSpecialization = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const updateData = req.body;

    if (user.role !== USER_ROLES.ADMIN) {
      return sendError(res, 'غير مخول بتحديث التخصص', 403);
    }

    const specialization = await Specialization.findOne({
      _id: id,
      isDeleted: false
    });

    if (!specialization) {
      return sendNotFound(res, 'التخصص غير موجود');
    }

    // Check if name or code already exists (excluding current specialization)
    if (updateData.name || updateData.code) {
      const existingSpecialization = await Specialization.findOne({
        $or: [
          { name: updateData.name || specialization.name },
          { code: (updateData.code || specialization.code).toUpperCase() }
        ],
        _id: { $ne: id },
        isDeleted: false
      });

      if (existingSpecialization) {
        return sendError(res, 'التخصص موجود مسبقاً', 400);
      }
    }

    // Update data
    Object.assign(specialization, updateData);
    specialization.updatedBy = user._id;

    await specialization.save();

    return sendUpdated(res, SUCCESS_MESSAGES.UPDATED_SUCCESSFULLY, specialization);

  } catch (error) {
    console.error('خطأ في تحديث التخصص:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Delete specialization (soft delete)
 */
const deleteSpecialization = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (user.role !== USER_ROLES.ADMIN) {
      return sendError(res, 'غير مخول بحذف التخصص', 403);
    }

    const specialization = await Specialization.findOne({
      _id: id,
      isDeleted: false
    });

    if (!specialization) {
      return sendNotFound(res, 'التخصص غير موجود');
    }

    // Check if there are doctors using this specialization
    const doctorsCount = await Doctor.countDocuments({
      specialization: specialization._id,
      isActive: true
    });

    if (doctorsCount > 0) {
      return sendError(res, `لا يمكن حذف التخصص لوجود ${doctorsCount} طبيب يستخدمونه`, 400);
    }

    await specialization.softDelete(user._id);

    return sendDeleted(res, SUCCESS_MESSAGES.DELETED_SUCCESSFULLY);

  } catch (error) {
    console.error('خطأ في حذف التخصص:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Restore deleted specialization
 */
const restoreSpecialization = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (user.role !== USER_ROLES.ADMIN) {
      return sendError(res, 'غير مخول باستعادة التخصص', 403);
    }

    const specialization = await Specialization.findOne({
      _id: id,
      isDeleted: true
    });

    if (!specialization) {
      return sendNotFound(res, 'التخصص غير موجود');
    }

    await specialization.restore();

    return sendSuccess(res, 'تم استعادة التخصص بنجاح', specialization);

  } catch (error) {
    console.error('خطأ في استعادة التخصص:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Get active specializations (public)
 */
const getActiveSpecializations = async (req, res) => {
  try {
    const specializations = await Specialization.find({
      isActive: true,
      isDeleted: false
    })
    .select('name code description commonConditions icon stats')
    .sort({ name: 1 })
    .lean();

    return sendSuccess(res, SUCCESS_MESSAGES.RETRIEVED_SUCCESSFULLY, specializations);

  } catch (error) {
    console.error('خطأ في جلب التخصصات النشطة:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Get popular specializations
 */
const getPopularSpecializations = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const specializations = await Specialization.getPopular(parseInt(limit));

    return sendSuccess(res, SUCCESS_MESSAGES.RETRIEVED_SUCCESSFULLY, specializations);

  } catch (error) {
    console.error('خطأ في جلب التخصصات الشائعة:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Search specializations
 */
const searchSpecializations = async (req, res) => {
  try {
    const { q } = req.query;

    const filters = {
      isActive: true,
      isDeleted: false
    };

    const specializations = await Specialization.searchSpecializations(q, filters);

    return sendSuccess(res, SUCCESS_MESSAGES.RETRIEVED_SUCCESSFULLY, specializations);

  } catch (error) {
    console.error('خطأ في البحث في التخصصات:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Update specialization statistics
 */
const updateSpecializationStats = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (user.role !== USER_ROLES.ADMIN) {
      return sendError(res, 'غير مخول بتحديث إحصائيات التخصص', 403);
    }

    const specialization = await Specialization.findOne({
      _id: id,
      isDeleted: false
    });

    if (!specialization) {
      return sendNotFound(res, 'التخصص غير موجود');
    }

    await specialization.updateStats();

    return sendSuccess(res, 'تم تحديث إحصائيات التخصص بنجاح', specialization);

  } catch (error) {
    console.error('خطأ في تحديث إحصائيات التخصص:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Verify specialization
 */
const verifySpecialization = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const { isVerified } = req.body;

    if (user.role !== USER_ROLES.ADMIN) {
      return sendError(res, 'غير مخول بالتحقق من التخصص', 403);
    }

    const specialization = await Specialization.findOne({
      _id: id,
      isDeleted: false
    });

    if (!specialization) {
      return sendNotFound(res, 'التخصص غير موجود');
    }

    specialization.isVerified = isVerified;
    specialization.updatedBy = user._id;

    await specialization.save();

    return sendSuccess(res, 'تم التحقق من التخصص بنجاح', specialization);

  } catch (error) {
    console.error('خطأ في التحقق من التخصص:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

module.exports = {
  getAllSpecializations,
  getSpecializationById,
  createSpecialization,
  updateSpecialization,
  deleteSpecialization,
  restoreSpecialization,
  getActiveSpecializations,
  getPopularSpecializations,
  searchSpecializations,
  updateSpecializationStats,
  verifySpecialization
}; 
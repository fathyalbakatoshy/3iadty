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
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Clinic = require('../models/Clinic');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');
const Review = require('../models/Review');
const Visitor = require('../models/Visitor');
const Admin = require('../models/Admin');

/**
 * Get dashboard statistics
 */
const getDashboardStats = async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== USER_ROLES.ADMIN) {
      return sendError(res, 'غير مخول بالوصول لهذه البيانات', 403);
    }

    // Get current date ranges
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Basic counts
    const totalUsers = await User.countDocuments({ isActive: true });
    const totalPatients = await Patient.countDocuments({ isActive: true });
    const totalDoctors = await Doctor.countDocuments({ isActive: true });
    const totalClinics = await Clinic.countDocuments({ isActive: true });

    // Appointments statistics
    const totalAppointments = await Appointment.countDocuments();
    const todayAppointments = await Appointment.countDocuments({
      dateTime: { $gte: startOfToday }
    });
    const pendingAppointments = await Appointment.countDocuments({
      status: 'pending'
    });
    const completedAppointments = await Appointment.countDocuments({
      status: 'completed'
    });

    // Revenue statistics (if applicable)
    const monthlyRevenue = await Appointment.aggregate([
      {
        $match: {
          dateTime: { $gte: startOfMonth },
          status: 'completed',
          isPaid: true
        }
      },
      {
        $lookup: {
          from: 'doctors',
          localField: 'doctorId',
          foreignField: '_id',
          as: 'doctor'
        }
      },
      {
        $unwind: '$doctor'
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$doctor.consultationFee' }
        }
      }
    ]);

    // Recent activity
    const recentAppointments = await Appointment.find()
      .populate('doctorId', 'name specialization')
      .populate('patientId', 'patientId', null, { populate: { path: 'userId', select: 'fullName' } })
      .sort({ createdAt: -1 })
      .limit(5);

    const recentReviews = await Review.find({ isApproved: true })
      .populate('doctorId', 'name specialization')
      .populate('patientId', 'patientId', null, { populate: { path: 'userId', select: 'fullName' } })
      .sort({ createdAt: -1 })
      .limit(5);

    // Growth statistics
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    const stats = {
      overview: {
        totalUsers,
        totalPatients,
        totalDoctors,
        totalClinics,
        totalAppointments,
        todayAppointments,
        pendingAppointments,
        completedAppointments,
        monthlyRevenue: monthlyRevenue[0]?.total || 0
      },
      recentActivity: {
        appointments: recentAppointments,
        reviews: recentReviews
      },
      growth: {
        userGrowth
      }
    };

    return sendSuccess(res, 'تم الحصول على إحصائيات لوحة التحكم بنجاح', stats);

  } catch (error) {
    console.error('خطأ في الحصول على إحصائيات لوحة التحكم:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Get users management data
 */
const getUsersManagement = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const user = req.user;

    if (user.role !== USER_ROLES.ADMIN) {
      return sendError(res, 'غير مخول بالوصول لهذه البيانات', 403);
    }

    // Build query
    let query = {};

    if (role) {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { fullName: new RegExp(search, 'i') },
        { mobile: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Sort
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const users = await User.find(query)
      .select('-password -otp')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limitNum);

    // Get users by role statistics
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    const pagination = {
      page: parseInt(page),
      limit: limitNum,
      totalItems: totalUsers,
      totalPages
    };

    const response = {
      users,
      statistics: {
        total: totalUsers,
        byRole: usersByRole
      }
    };

    return sendPaginatedResponse(res, 'تم الحصول على بيانات المستخدمين بنجاح', response, pagination);

  } catch (error) {
    console.error('خطأ في الحصول على بيانات المستخدمين:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Update user status
 */
const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive, isVerified } = req.body;
    const user = req.user;

    if (user.role !== USER_ROLES.ADMIN) {
      return sendError(res, 'غير مخول بهذا الإجراء', 403);
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return sendNotFound(res, 'المستخدم غير موجود');
    }

    // Prevent admin from deactivating themselves
    if (targetUser._id.toString() === user.id && isActive === false) {
      return sendError(res, 'لا يمكن إلغاء تفعيل حسابك الخاص', 400);
    }

    const updateData = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isVerified !== undefined) updateData.isVerified = isVerified;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password -otp');

    return sendUpdated(res, 'تم تحديث حالة المستخدم بنجاح', updatedUser);

  } catch (error) {
    console.error('خطأ في تحديث حالة المستخدم:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Get appointments management data
 */
const getAppointmentsManagement = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      doctorId, 
      clinicId, 
      date,
      sortBy = 'dateTime', 
      sortOrder = 'desc' 
    } = req.query;
    const user = req.user;

    if (user.role !== USER_ROLES.ADMIN) {
      return sendError(res, 'غير مخول بالوصول لهذه البيانات', 403);
    }

    // Build query
    let query = {};

    if (status) query.status = status;
    if (doctorId) query.doctorId = doctorId;
    if (clinicId) query.clinicId = clinicId;

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      query.dateTime = {
        $gte: startDate,
        $lt: endDate
      };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Sort
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const appointments = await Appointment.find(query)
      .populate('doctorId', 'name specialization')
      .populate('clinicId', 'name location.address')
      .populate({
        path: 'patientId',
        select: 'patientId',
        populate: { path: 'userId', select: 'fullName mobile' }
      })
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    const totalAppointments = await Appointment.countDocuments(query);
    const totalPages = Math.ceil(totalAppointments / limitNum);

    // Get appointments statistics
    const appointmentStats = await Appointment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { 
            $sum: { 
              $cond: [
                { $eq: ['$status', 'completed'] },
                '$consultationFee',
                0
              ]
            }
          }
        }
      }
    ]);

    const pagination = {
      page: parseInt(page),
      limit: limitNum,
      totalItems: totalAppointments,
      totalPages
    };

    const response = {
      appointments,
      statistics: {
        total: totalAppointments,
        byStatus: appointmentStats
      }
    };

    return sendPaginatedResponse(res, 'تم الحصول على بيانات المواعيد بنجاح', response, pagination);

  } catch (error) {
    console.error('خطأ في الحصول على بيانات المواعيد:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Verify doctor
 */
const verifyDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { isVerified, verificationNotes } = req.body;
    const user = req.user;

    if (user.role !== USER_ROLES.ADMIN) {
      return sendError(res, 'غير مخول بهذا الإجراء', 403);
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return sendNotFound(res, 'الطبيب غير موجود');
    }

    doctor.isVerified = isVerified;
    doctor.verificationNotes = verificationNotes;
    doctor.verifiedBy = user.id;
    doctor.verifiedAt = new Date();

    await doctor.save();

    // Update user verification status
    await User.findByIdAndUpdate(doctor.userId, { isVerified });

    return sendSuccess(res, `تم ${isVerified ? 'تأكيد' : 'إلغاء تأكيد'} الطبيب بنجاح`);

  } catch (error) {
    console.error('خطأ في تأكيد الطبيب:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Verify clinic
 */
const verifyClinic = async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { isVerified, verificationNotes } = req.body;
    const user = req.user;

    if (user.role !== USER_ROLES.ADMIN) {
      return sendError(res, 'غير مخول بهذا الإجراء', 403);
    }

    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      return sendNotFound(res, 'العيادة غير موجودة');
    }

    clinic.isVerified = isVerified;
    clinic.verificationNotes = verificationNotes;
    clinic.verifiedBy = user.id;
    clinic.verifiedAt = new Date();

    await clinic.save();

    return sendSuccess(res, `تم ${isVerified ? 'تأكيد' : 'إلغاء تأكيد'} العيادة بنجاح`);

  } catch (error) {
    console.error('خطأ في تأكيد العيادة:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Get reviews for moderation
 */
const getReviewsForModeration = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'pending' } = req.query;
    const user = req.user;

    if (user.role !== USER_ROLES.ADMIN) {
      return sendError(res, 'غير مخول بالوصول لهذه البيانات', 403);
    }

    // Build query
    let query = {};
    
    if (status === 'pending') {
      query.isApproved = false;
      query.status = { $ne: 'rejected' };
    } else if (status === 'reported') {
      query['reports.0'] = { $exists: true };
    } else {
      query.status = status;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const reviews = await Review.find(query)
      .populate('doctorId', 'name specialization')
      .populate({
        path: 'patientId',
        select: 'patientId',
        populate: { path: 'userId', select: 'fullName' }
      })
      .populate('reports.reportedBy', 'fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const totalReviews = await Review.countDocuments(query);
    const totalPages = Math.ceil(totalReviews / limitNum);

    const pagination = {
      page: parseInt(page),
      limit: limitNum,
      totalItems: totalReviews,
      totalPages
    };

    return sendPaginatedResponse(res, 'تم الحصول على التقييمات للمراجعة بنجاح', reviews, pagination);

  } catch (error) {
    console.error('خطأ في الحصول على التقييمات للمراجعة:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Get system reports
 */
const getSystemReports = async (req, res) => {
  try {
    const { type = 'overview', period = 'month' } = req.query;
    const user = req.user;

    if (user.role !== USER_ROLES.ADMIN) {
      return sendError(res, 'غير مخول بالوصول لهذه البيانات', 403);
    }

    // Define date ranges
    const now = new Date();
    let startDate;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    let report = {};

    switch (type) {
      case 'appointments':
        report = await generateAppointmentsReport(startDate);
        break;
      case 'revenue':
        report = await generateRevenueReport(startDate);
        break;
      case 'users':
        report = await generateUsersReport(startDate);
        break;
      case 'doctors':
        report = await generateDoctorsReport(startDate);
        break;
      default:
        report = await generateOverviewReport(startDate);
    }

    return sendSuccess(res, 'تم إنشاء التقرير بنجاح', report);

  } catch (error) {
    console.error('خطأ في إنشاء التقرير:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Create admin user
 */
const createAdmin = async (req, res) => {
  try {
    const { fullName, mobile, email, password, permissions } = req.body;
    const user = req.user;

    if (user.role !== USER_ROLES.ADMIN) {
      return sendError(res, 'غير مخول بهذا الإجراء', 403);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ mobile }, { email }] 
    });

    if (existingUser) {
      return sendError(res, 'المستخدم موجود مسبقاً', 400);
    }

    // Create user
    const newUser = new User({
      fullName,
      mobile,
      email,
      password,
      role: USER_ROLES.ADMIN,
      isVerified: true,
      isActive: true
    });

    await newUser.save();

    // Create admin profile
    const admin = new Admin({
      userId: newUser._id,
      permissions: permissions || ['full_access'],
      createdBy: user.id
    });

    await admin.save();

    const userResponse = newUser.toPublicJSON();

    return sendCreated(res, 'تم إنشاء المدير بنجاح', { user: userResponse, admin });

  } catch (error) {
    console.error('خطأ في إنشاء المدير:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Delete user (Admin only)
 */
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = req.user;

    if (user.role !== USER_ROLES.ADMIN) {
      return sendError(res, 'غير مخول بهذا الإجراء', 403);
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return sendNotFound(res, 'المستخدم غير موجود');
    }

    // Prevent admin from deleting themselves
    if (targetUser._id.toString() === user.id) {
      return sendError(res, 'لا يمكن حذف حسابك الخاص', 400);
    }

    // Soft delete user
    await User.findByIdAndUpdate(userId, { isActive: false });

    // Also deactivate related records
    if (targetUser.role === USER_ROLES.DOCTOR) {
      await Doctor.findOneAndUpdate({ userId }, { isActive: false });
    } else if (targetUser.role === USER_ROLES.PATIENT) {
      await Patient.findOneAndUpdate({ userId }, { isActive: false });
    }

    return sendSuccess(res, 'تم حذف المستخدم بنجاح');

  } catch (error) {
    console.error('خطأ في حذف المستخدم:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

// Helper Functions for Reports

const generateOverviewReport = async (startDate) => {
  const endDate = new Date();

  const totalUsers = await User.countDocuments({ 
    createdAt: { $gte: startDate, $lte: endDate } 
  });

  const totalAppointments = await Appointment.countDocuments({ 
    createdAt: { $gte: startDate, $lte: endDate } 
  });

  const totalRevenue = await Appointment.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: 'completed',
        isPaid: true
      }
    },
    {
      $lookup: {
        from: 'doctors',
        localField: 'doctorId',
        foreignField: '_id',
        as: 'doctor'
      }
    },
    {
      $unwind: '$doctor'
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$doctor.consultationFee' }
      }
    }
  ]);

  return {
    period: { startDate, endDate },
    summary: {
      newUsers: totalUsers,
      totalAppointments,
      totalRevenue: totalRevenue[0]?.total || 0
    }
  };
};

const generateAppointmentsReport = async (startDate) => {
  const endDate = new Date();

  const appointmentStats = await Appointment.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const dailyAppointments = await Appointment.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);

  return {
    period: { startDate, endDate },
    statusBreakdown: appointmentStats,
    dailyTrend: dailyAppointments
  };
};

const generateRevenueReport = async (startDate) => {
  const endDate = new Date();

  const revenueData = await Appointment.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: 'completed',
        isPaid: true
      }
    },
    {
      $lookup: {
        from: 'doctors',
        localField: 'doctorId',
        foreignField: '_id',
        as: 'doctor'
      }
    },
    {
      $unwind: '$doctor'
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        dailyRevenue: { $sum: '$doctor.consultationFee' },
        appointmentCount: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);

  const topDoctors = await Appointment.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: 'completed',
        isPaid: true
      }
    },
    {
      $lookup: {
        from: 'doctors',
        localField: 'doctorId',
        foreignField: '_id',
        as: 'doctor'
      }
    },
    {
      $unwind: '$doctor'
    },
    {
      $group: {
        _id: '$doctorId',
        doctorName: { $first: '$doctor.name' },
        totalRevenue: { $sum: '$doctor.consultationFee' },
        appointmentCount: { $sum: 1 }
      }
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: 10 }
  ]);

  return {
    period: { startDate, endDate },
    dailyRevenue: revenueData,
    topPerformers: topDoctors
  };
};

const generateUsersReport = async (startDate) => {
  const endDate = new Date();

  const userGrowth = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
          role: '$role'
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);

  const usersByRole = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 }
      }
    }
  ]);

  return {
    period: { startDate, endDate },
    growthTrend: userGrowth,
    roleDistribution: usersByRole
  };
};

const generateDoctorsReport = async (startDate) => {
  const endDate = new Date();

  const doctorStats = await Doctor.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$specialization',
        count: { $sum: 1 },
        averageRating: { $avg: '$stats.averageRating' },
        totalAppointments: { $sum: '$stats.totalAppointments' }
      }
    },
    { $sort: { count: -1 } }
  ]);

  return {
    period: { startDate, endDate },
    specializationBreakdown: doctorStats
  };
};

module.exports = {
  getDashboardStats,
  getUsersManagement,
  updateUserStatus,
  getAppointmentsManagement,
  verifyDoctor,
  verifyClinic,
  getReviewsForModeration,
  getSystemReports,
  createAdmin,
  deleteUser
}; 
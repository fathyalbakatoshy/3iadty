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
  USER_ROLES,
  APPOINTMENT_STATUS
} = require('../config/constants');
const Review = require('../models/Review');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');

/**
 * Create new review
 */
const createReview = async (req, res) => {
  try {
    const {
      doctorId,
      rating,
      comment,
      appointmentId,
      reviewType = 'doctor' // doctor or clinic
    } = req.body;

    const user = req.user;

    // Only patients can create reviews
    if (user.role !== USER_ROLES.PATIENT) {
      return sendError(res, 'فقط المرضى يمكنهم إضافة تقييمات', 403);
    }

    // Get patient
    const patient = await Patient.findOne({ userId: user.id });
    if (!patient) {
      return sendError(res, 'ملف المريض غير موجود', 404);
    }

    // Validate doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return sendNotFound(res, 'الطبيب غير موجود');
    }

    // Check if patient has completed appointment with this doctor
    const hasCompletedAppointment = await Appointment.findOne({
      patientId: patient._id,
      doctorId,
      status: APPOINTMENT_STATUS.COMPLETED
    });

    if (!hasCompletedAppointment) {
      return sendError(res, 'يجب إكمال موعد مع الطبيب قبل إضافة تقييم', 400);
    }

    // Check if patient already reviewed this doctor
    const existingReview = await Review.findOne({
      patientId: patient._id,
      doctorId,
      appointmentId: appointmentId || hasCompletedAppointment._id
    });

    if (existingReview) {
      return sendError(res, 'لقد قمت بتقييم هذا الطبيب مسبقاً', 400);
    }

    // Create review
    const review = new Review({
      patientId: patient._id,
      doctorId,
      rating,
      comment,
      appointmentId: appointmentId || hasCompletedAppointment._id,
      reviewType
    });

    await review.save();

    // Update doctor's rating
    await updateDoctorRating(doctorId);

    // Populate response data
    await review.populate([
      { path: 'patientId', select: 'patientId', populate: { path: 'userId', select: 'fullName' } },
      { path: 'doctorId', select: 'name specialization' }
    ]);

    return sendCreated(res, 'تم إضافة التقييم بنجاح', review);

  } catch (error) {
    console.error('خطأ في إنشاء التقييم:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Get doctor reviews
 */
const getDoctorReviews = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { page = 1, limit = 10, rating, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Validate doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return sendNotFound(res, 'الطبيب غير موجود');
    }

    // Build query
    const query = { doctorId, isApproved: true };

    if (rating) {
      query.rating = parseInt(rating);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Sort
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const reviews = await Review.find(query)
      .populate({
        path: 'patientId',
        select: 'patientId',
        populate: { path: 'userId', select: 'fullName' }
      })
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    const totalReviews = await Review.countDocuments(query);
    const totalPages = Math.ceil(totalReviews / limitNum);

    // Get rating distribution
    const ratingDistribution = await Review.aggregate([
      { $match: { doctorId: doctor._id, isApproved: true } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const pagination = {
      page: parseInt(page),
      limit: limitNum,
      totalItems: totalReviews,
      totalPages
    };

    const response = {
      reviews,
      ratingStats: {
        averageRating: doctor.stats.averageRating,
        totalReviews: doctor.stats.totalReviews,
        distribution: ratingDistribution
      }
    };

    return sendPaginatedResponse(res, 'تم الحصول على التقييمات بنجاح', response, pagination);

  } catch (error) {
    console.error('خطأ في الحصول على التقييمات:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Get patient reviews
 */
const getPatientReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const user = req.user;

    const patient = await Patient.findOne({ userId: user.id });
    if (!patient) {
      return sendError(res, 'ملف المريض غير موجود', 404);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const reviews = await Review.find({ patientId: patient._id })
      .populate('doctorId', 'name specialization profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const totalReviews = await Review.countDocuments({ patientId: patient._id });
    const totalPages = Math.ceil(totalReviews / limitNum);

    const pagination = {
      page: parseInt(page),
      limit: limitNum,
      totalItems: totalReviews,
      totalPages
    };

    return sendPaginatedResponse(res, 'تم الحصول على تقييماتك بنجاح', reviews, pagination);

  } catch (error) {
    console.error('خطأ في الحصول على تقييمات المريض:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Get review by ID
 */
const getReviewById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const review = await Review.findById(id)
      .populate({
        path: 'patientId',
        select: 'patientId',
        populate: { path: 'userId', select: 'fullName' }
      })
      .populate('doctorId', 'name specialization profilePicture')
      .populate('appointmentId', 'appointmentId dateTime status');

    if (!review) {
      return sendNotFound(res, 'التقييم غير موجود');
    }

    // Check access permission
    const hasAccess = await checkReviewAccess(review, user);
    if (!hasAccess) {
      return sendError(res, 'غير مخول بالوصول لهذا التقييم', 403);
    }

    return sendSuccess(res, 'تم الحصول على التقييم بنجاح', review);

  } catch (error) {
    console.error('خطأ في الحصول على التقييم:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Update review
 */
const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const user = req.user;

    const review = await Review.findById(id);
    if (!review) {
      return sendNotFound(res, 'التقييم غير موجود');
    }

    // Check if user can update this review
    const canUpdate = await checkReviewUpdatePermission(review, user);
    if (!canUpdate) {
      return sendError(res, 'غير مخول بتحديث هذا التقييم', 403);
    }

    // Check if review can be updated (within 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (review.createdAt < thirtyDaysAgo) {
      return sendError(res, 'لا يمكن تحديث التقييم بعد مرور 30 يوماً', 400);
    }

    const oldRating = review.rating;

    // Update review
    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    review.updatedAt = new Date();

    await review.save();

    // Update doctor's rating if rating changed
    if (oldRating !== review.rating) {
      await updateDoctorRating(review.doctorId);
    }

    await review.populate([
      { path: 'patientId', select: 'patientId', populate: { path: 'userId', select: 'fullName' } },
      { path: 'doctorId', select: 'name specialization' }
    ]);

    return sendUpdated(res, 'تم تحديث التقييم بنجاح', review);

  } catch (error) {
    console.error('خطأ في تحديث التقييم:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Delete review
 */
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const review = await Review.findById(id);
    if (!review) {
      return sendNotFound(res, 'التقييم غير موجود');
    }

    // Check if user can delete this review
    const canDelete = await checkReviewDeletePermission(review, user);
    if (!canDelete) {
      return sendError(res, 'غير مخول بحذف هذا التقييم', 403);
    }

    await Review.findByIdAndDelete(id);

    // Update doctor's rating
    await updateDoctorRating(review.doctorId);

    return sendDeleted(res, 'تم حذف التقييم بنجاح');

  } catch (error) {
    console.error('خطأ في حذف التقييم:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Report review (flag as inappropriate)
 */
const reportReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const user = req.user;

    const review = await Review.findById(id);
    if (!review) {
      return sendNotFound(res, 'التقييم غير موجود');
    }

    // Check if already reported by this user
    const existingReport = review.reports.find(r => r.reportedBy.toString() === user.id);
    if (existingReport) {
      return sendError(res, 'لقد قمت بالإبلاغ عن هذا التقييم مسبقاً', 400);
    }

    // Add report
    review.reports.push({
      reportedBy: user.id,
      reason,
      reportedAt: new Date()
    });

    // Auto-hide review if reported multiple times
    if (review.reports.length >= 3) {
      review.isApproved = false;
      review.status = 'under_review';
    }

    await review.save();

    return sendSuccess(res, 'تم الإبلاغ عن التقييم بنجاح');

  } catch (error) {
    console.error('خطأ في الإبلاغ عن التقييم:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Approve/reject review (Admin only)
 */
const moderateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, moderationNotes } = req.body; // action: 'approve' or 'reject'
    const user = req.user;

    if (user.role !== USER_ROLES.ADMIN) {
      return sendError(res, 'غير مخول بهذا الإجراء', 403);
    }

    const review = await Review.findById(id);
    if (!review) {
      return sendNotFound(res, 'التقييم غير موجود');
    }

    if (action === 'approve') {
      review.isApproved = true;
      review.status = 'approved';
    } else if (action === 'reject') {
      review.isApproved = false;
      review.status = 'rejected';
    } else {
      return sendError(res, 'إجراء غير صحيح', 400);
    }

    review.moderatedBy = user.id;
    review.moderatedAt = new Date();
    review.moderationNotes = moderationNotes;

    await review.save();

    // Update doctor rating if approved
    if (action === 'approve') {
      await updateDoctorRating(review.doctorId);
    }

    return sendSuccess(res, `تم ${action === 'approve' ? 'قبول' : 'رفض'} التقييم بنجاح`);

  } catch (error) {
    console.error('خطأ في مراجعة التقييم:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Get reviews summary/statistics
 */
const getReviewsSummary = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return sendNotFound(res, 'الطبيب غير موجود');
    }

    // Get rating distribution
    const ratingStats = await Review.aggregate([
      { $match: { doctorId: doctor._id, isApproved: true } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          ratingDistribution: {
            $push: {
              rating: '$rating',
              count: 1
            }
          }
        }
      },
      {
        $project: {
          totalReviews: 1,
          averageRating: { $round: ['$averageRating', 1] },
          ratingDistribution: {
            $reduce: {
              input: { $range: [1, 6] },
              initialValue: [],
              in: {
                $concatArrays: [
                  '$$value',
                  [{
                    rating: '$$this',
                    count: {
                      $size: {
                        $filter: {
                          input: '$ratingDistribution',
                          cond: { $eq: ['$$item.rating', '$$this'] }
                        }
                      }
                    }
                  }]
                ]
              }
            }
          }
        }
      }
    ]);

    // Get recent reviews
    const recentReviews = await Review.find({
      doctorId,
      isApproved: true
    })
    .populate({
      path: 'patientId',
      select: 'patientId',
      populate: { path: 'userId', select: 'fullName' }
    })
    .sort({ createdAt: -1 })
    .limit(5);

    const summary = {
      stats: ratingStats[0] || {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: []
      },
      recentReviews
    };

    return sendSuccess(res, 'تم الحصول على ملخص التقييمات بنجاح', summary);

  } catch (error) {
    console.error('خطأ في الحصول على ملخص التقييمات:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

// Helper Functions

/**
 * Update doctor's average rating
 */
const updateDoctorRating = async (doctorId) => {
  try {
    const stats = await Review.aggregate([
      { $match: { doctorId, isApproved: true } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    const doctor = await Doctor.findById(doctorId);
    if (doctor && stats.length > 0) {
      doctor.stats.averageRating = Math.round(stats[0].averageRating * 10) / 10;
      doctor.stats.totalReviews = stats[0].totalReviews;
      await doctor.save();
    }
  } catch (error) {
    console.error('خطأ في تحديث تقييم الطبيب:', error);
  }
};

/**
 * Check review access permission
 */
const checkReviewAccess = async (review, user) => {
  // Admin can access all reviews
  if (user.role === USER_ROLES.ADMIN) return true;

  // Patient can access their own reviews
  if (user.role === USER_ROLES.PATIENT) {
    const patient = await Patient.findOne({ userId: user.id });
    return review.patientId.toString() === patient?._id.toString();
  }

  // Doctor can access reviews about them
  if (user.role === USER_ROLES.DOCTOR) {
    const doctor = await Doctor.findOne({ userId: user.id });
    return review.doctorId.toString() === doctor?._id.toString();
  }

  return false;
};

/**
 * Check review update permission
 */
const checkReviewUpdatePermission = async (review, user) => {
  // Only the patient who wrote the review can update it
  if (user.role === USER_ROLES.PATIENT) {
    const patient = await Patient.findOne({ userId: user.id });
    return review.patientId.toString() === patient?._id.toString();
  }

  // Admin can update any review
  if (user.role === USER_ROLES.ADMIN) return true;

  return false;
};

/**
 * Check review delete permission
 */
const checkReviewDeletePermission = async (review, user) => {
  // Patient can delete their own review within 30 days
  if (user.role === USER_ROLES.PATIENT) {
    const patient = await Patient.findOne({ userId: user.id });
    const isOwner = review.patientId.toString() === patient?._id.toString();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return isOwner && review.createdAt > thirtyDaysAgo;
  }

  // Admin can delete any review
  if (user.role === USER_ROLES.ADMIN) return true;

  return false;
};

module.exports = {
  createReview,
  getDoctorReviews,
  getPatientReviews,
  getReviewById,
  updateReview,
  deleteReview,
  reportReview,
  moderateReview,
  getReviewsSummary
}; 
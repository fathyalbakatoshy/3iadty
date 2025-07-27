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
  APPOINTMENT_STATUS,
  USER_ROLES 
} = require('../config/constants');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Clinic = require('../models/Clinic');
const Patient = require('../models/Patient');
const Visitor = require('../models/Visitor');
const moment = require('moment');

/**
 * Book new appointment
 */
const bookAppointment = async (req, res) => {
  try {
    const {
      doctorId,
      clinicId,
      dateTime,
      appointmentType = 'consultation',
      chiefComplaint,
      notes,
      paymentMethod = 'cash',
      bookingForAnother,
      patientInfo
    } = req.body;

    const user = req.user;

    // Validate doctor and clinic exist
    const doctor = await Doctor.findById(doctorId);
    const clinic = await Clinic.findById(clinicId);

    if (!doctor || !clinic) {
      return sendNotFound(res, 'الطبيب أو العيادة غير موجود');
    }

    // Check if doctor is active and accepting patients
    if (!doctor.isActive || !doctor.isAcceptingPatients) {
      return sendError(res, 'الطبيب غير متاح حالياً', 400);
    }

    // Check appointment time is in future
    const appointmentDate = new Date(dateTime);
    if (appointmentDate <= new Date()) {
      return sendError(res, 'لا يمكن حجز موعد في الماضي', 400);
    }

    // Check for conflicts
    const conflictingAppointment = await checkAppointmentConflict(
      doctorId, 
      appointmentDate, 
      30 // default duration
    );

    if (conflictingAppointment) {
      return sendError(res, 'يوجد تعارض في المواعيد، الرجاء اختيار وقت آخر', 400);
    }

    // Generate appointment ID
    const appointmentId = await generateAppointmentId();

    // Determine patient or visitor
    let patientId = null;
    let visitorId = null;

    if (user.role === USER_ROLES.PATIENT) {
      const patient = await Patient.findOne({ userId: user.id });
      patientId = patient?._id;
    } else if (user.role === USER_ROLES.GUEST) {
      const visitor = await Visitor.findOne({ mobile: user.mobile });
      visitorId = visitor?._id;
    }

    // Create appointment
    const appointment = new Appointment({
      appointmentId,
      patientId,
      visitorId,
      doctorId,
      clinicId,
      dateTime: appointmentDate,
      appointmentType,
      chiefComplaint,
      notes,
      paymentMethod,
      bookedBy: user.id,
      bookingSource: 'web',
      bookingForAnother: {
        isBookingForAnother: !!bookingForAnother,
        patientInfo: bookingForAnother ? patientInfo : undefined
      }
    });

    await appointment.save();

    // Add to visitor's bookings if applicable
    if (visitorId) {
      const visitor = await Visitor.findById(visitorId);
      await visitor.addBooking(appointment._id);
    }

    // Update doctor statistics
    doctor.stats.totalAppointments += 1;
    await doctor.save();

    // Populate response data
    await appointment.populate([
      { path: 'doctorId', select: 'name specialization consultationFee' },
      { path: 'clinicId', select: 'name location.address phones' },
      { path: 'patientId', select: 'patientId', populate: { path: 'userId', select: 'fullName mobile' } }
    ]);

    return sendCreated(res, SUCCESS_MESSAGES.APPOINTMENT_BOOKED, appointment);

  } catch (error) {
    console.error('خطأ في حجز الموعد:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Get user appointments
 */
const getUserAppointments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, upcoming } = req.query;
    const user = req.user;

    // Build query based on user role
    let query = {};

    if (user.role === USER_ROLES.PATIENT) {
      const patient = await Patient.findOne({ userId: user.id });
      query.patientId = patient?._id;
    } else if (user.role === USER_ROLES.GUEST) {
      const visitor = await Visitor.findOne({ mobile: user.mobile });
      query.visitorId = visitor?._id;
    } else if (user.role === USER_ROLES.DOCTOR) {
      const doctor = await Doctor.findOne({ userId: user.id });
      query.doctorId = doctor?._id;
    }

    // Add filters
    if (status) {
      query.status = status;
    }

    if (upcoming === 'true') {
      query.dateTime = { $gte: new Date() };
      query.status = { $in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.APPROVED] };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Execute query
    const appointments = await Appointment.find(query)
      .populate('doctorId', 'name specialization consultationFee profilePicture')
      .populate('clinicId', 'name location.address phones')
      .populate({
        path: 'patientId',
        select: 'patientId',
        populate: { path: 'userId', select: 'fullName mobile' }
      })
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
 * Get appointment by ID
 */
const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const appointment = await Appointment.findById(id)
      .populate('doctorId', 'name specialization consultationFee profilePicture')
      .populate('clinicId', 'name location.address phones workingHours')
      .populate({
        path: 'patientId',
        select: 'patientId emergencyContact',
        populate: { path: 'userId', select: 'fullName mobile email gender dateOfBirth' }
      })
      .populate('bookedBy', 'fullName mobile');

    if (!appointment) {
      return sendNotFound(res, 'الموعد غير موجود');
    }

    // Check authorization
    const hasAccess = await checkAppointmentAccess(appointment, user);
    if (!hasAccess) {
      return sendError(res, 'غير مخول بالوصول لهذا الموعد', 403);
    }

    return sendSuccess(res, 'تم الحصول على تفاصيل الموعد بنجاح', appointment);

  } catch (error) {
    console.error('خطأ في الحصول على تفاصيل الموعد:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Update appointment status
 */
const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason, notes } = req.body;
    const user = req.user;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return sendNotFound(res, 'الموعد غير موجود');
    }

    // Check authorization for status change
    const canUpdate = await checkStatusUpdatePermission(appointment, user, status);
    if (!canUpdate) {
      return sendError(res, 'غير مخول بتحديث حالة هذا الموعد', 403);
    }

    // Update status with history
    const oldStatus = appointment.status;
    appointment.status = status;
    
    appointment.statusHistory.push({
      status,
      changedAt: new Date(),
      changedBy: user.id,
      reason,
      notes
    });

    // Update additional fields based on status
    if (status === APPOINTMENT_STATUS.COMPLETED) {
      appointment.completedAt = new Date();
      
      // Update patient statistics
      if (appointment.patientId) {
        const patient = await Patient.findById(appointment.patientId);
        await patient.updateAppointmentStats('completed');
      }

      // Update doctor statistics
      const doctor = await Doctor.findById(appointment.doctorId);
      doctor.stats.completedAppointments += 1;
      await doctor.save();
    }

    await appointment.save();

    return sendUpdated(res, 'تم تحديث حالة الموعد بنجاح', appointment);

  } catch (error) {
    console.error('خطأ في تحديث حالة الموعد:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Reschedule appointment
 */
const rescheduleAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { newDateTime, reason } = req.body;
    const user = req.user;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return sendNotFound(res, 'الموعد غير موجود');
    }

    // Check authorization
    const hasAccess = await checkAppointmentAccess(appointment, user);
    if (!hasAccess) {
      return sendError(res, 'غير مخول بإعادة جدولة هذا الموعد', 403);
    }

    // Validate new date time
    const newDate = new Date(newDateTime);
    if (newDate <= new Date()) {
      return sendError(res, 'لا يمكن إعادة الجدولة لوقت في الماضي', 400);
    }

    // Check for conflicts
    const conflictingAppointment = await checkAppointmentConflict(
      appointment.doctorId,
      newDate,
      appointment.duration,
      id
    );

    if (conflictingAppointment) {
      return sendError(res, 'يوجد تعارض في المواعيد، الرجاء اختيار وقت آخر', 400);
    }

    // Update appointment
    const oldDateTime = appointment.dateTime;
    appointment.dateTime = newDate;
    appointment.status = APPOINTMENT_STATUS.PENDING; // Reset to pending

    // Add to status history
    appointment.statusHistory.push({
      status: 'rescheduled',
      changedAt: new Date(),
      changedBy: user.id,
      reason,
      notes: `تم تغيير الموعد من ${moment(oldDateTime).format('YYYY-MM-DD HH:mm')} إلى ${moment(newDate).format('YYYY-MM-DD HH:mm')}`
    });

    await appointment.save();

    return sendUpdated(res, 'تم إعادة جدولة الموعد بنجاح', appointment);

  } catch (error) {
    console.error('خطأ في إعادة جدولة الموعد:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Cancel appointment
 */
const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const user = req.user;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return sendNotFound(res, 'الموعد غير موجود');
    }

    // Check authorization
    const hasAccess = await checkAppointmentAccess(appointment, user);
    if (!hasAccess) {
      return sendError(res, 'غير مخول بإلغاء هذا الموعد', 403);
    }

    // Check if appointment can be cancelled
    if (appointment.status === APPOINTMENT_STATUS.COMPLETED) {
      return sendError(res, 'لا يمكن إلغاء موعد مكتمل', 400);
    }

    if (appointment.status === APPOINTMENT_STATUS.CANCELED) {
      return sendError(res, 'الموعد ملغي مسبقاً', 400);
    }

    // Update appointment
    appointment.status = APPOINTMENT_STATUS.CANCELED;
    appointment.canceledAt = new Date();
    appointment.canceledBy = user.id;
    appointment.cancellationReason = reason;

    appointment.statusHistory.push({
      status: APPOINTMENT_STATUS.CANCELED,
      changedAt: new Date(),
      changedBy: user.id,
      reason
    });

    await appointment.save();

    // Update statistics
    if (appointment.patientId) {
      const patient = await Patient.findById(appointment.patientId);
      await patient.updateAppointmentStats('canceled');
    }

    const doctor = await Doctor.findById(appointment.doctorId);
    doctor.stats.canceledAppointments += 1;
    await doctor.save();

    return sendSuccess(res, SUCCESS_MESSAGES.APPOINTMENT_CANCELED);

  } catch (error) {
    console.error('خطأ في إلغاء الموعد:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Get doctor's appointments
 */
const getDoctorAppointments = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date, status, page = 1, limit = 20 } = req.query;

    let query = { doctorId };

    // Filter by date
    if (date) {
      const startDate = moment(date).startOf('day');
      const endDate = moment(date).endOf('day');
      query.dateTime = {
        $gte: startDate.toDate(),
        $lte: endDate.toDate()
      };
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const appointments = await Appointment.find(query)
      .populate({
        path: 'patientId',
        select: 'patientId',
        populate: { path: 'userId', select: 'fullName mobile age gender' }
      })
      .populate('clinicId', 'name')
      .sort({ dateTime: 1 })
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

    return sendPaginatedResponse(res, 'تم الحصول على مواعيد الطبيب بنجاح', appointments, pagination);

  } catch (error) {
    console.error('خطأ في الحصول على مواعيد الطبيب:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * Get available time slots for a doctor
 */
const getAvailableSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return sendError(res, 'التاريخ مطلوب', 400);
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return sendNotFound(res, 'الطبيب غير موجود');
    }

    const targetDate = moment(date);
    const dayName = targetDate.format('dddd').toLowerCase();

    // Get doctor's availability for this day
    const dayAvailability = doctor.availability.find(a => a.day === dayName && a.isAvailable);
    
    if (!dayAvailability) {
      return sendSuccess(res, 'الطبيب غير متاح في هذا اليوم', []);
    }

    // Get existing appointments for this date
    const startDate = targetDate.startOf('day');
    const endDate = targetDate.endOf('day');
    
    const existingAppointments = await Appointment.find({
      doctorId,
      dateTime: {
        $gte: startDate.toDate(),
        $lte: endDate.toDate()
      },
      status: { $in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.APPROVED] }
    }).select('dateTime duration');

    // Generate available slots
    const availableSlots = generateAvailableSlots(
      dayAvailability.timeSlots,
      existingAppointments,
      targetDate,
      30 // default slot duration
    );

    return sendSuccess(res, 'تم الحصول على المواعيد المتاحة بنجاح', availableSlots);

  } catch (error) {
    console.error('خطأ في الحصول على المواعيد المتاحة:', error);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

// Helper Functions

/**
 * Check appointment conflict
 */
const checkAppointmentConflict = async (doctorId, dateTime, duration = 30, excludeId = null) => {
  const startTime = moment(dateTime);
  const endTime = moment(dateTime).add(duration, 'minutes');

  const query = {
    doctorId,
    status: { $in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.APPROVED] },
    $or: [
      {
        dateTime: {
          $gte: startTime.toDate(),
          $lt: endTime.toDate()
        }
      },
      {
        $expr: {
          $and: [
            { $lte: ['$dateTime', endTime.toDate()] },
            { $gte: [{ $add: ['$dateTime', { $multiply: ['$duration', 60000] }] }, startTime.toDate()] }
          ]
        }
      }
    ]
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return await Appointment.findOne(query);
};

/**
 * Generate appointment ID
 */
const generateAppointmentId = async () => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

  const lastAppointment = await Appointment.findOne({
    appointmentId: new RegExp(`^A${dateStr}`)
  }).sort({ appointmentId: -1 });

  let sequence = '001';
  if (lastAppointment) {
    const lastSequence = parseInt(lastAppointment.appointmentId.slice(-3));
    sequence = String(lastSequence + 1).padStart(3, '0');
  }

  return `A${dateStr}${sequence}`;
};

/**
 * Check appointment access permission
 */
const checkAppointmentAccess = async (appointment, user) => {
  // Admin can access all
  if (user.role === USER_ROLES.ADMIN) return true;

  // Doctor can access their appointments
  if (user.role === USER_ROLES.DOCTOR) {
    const doctor = await Doctor.findOne({ userId: user.id });
    return appointment.doctorId.toString() === doctor?._id.toString();
  }

  // Patient can access their appointments
  if (user.role === USER_ROLES.PATIENT) {
    const patient = await Patient.findOne({ userId: user.id });
    return appointment.patientId?.toString() === patient?._id.toString();
  }

  // Visitor can access their appointments
  if (user.role === USER_ROLES.GUEST) {
    const visitor = await Visitor.findOne({ mobile: user.mobile });
    return appointment.visitorId?.toString() === visitor?._id.toString();
  }

  return false;
};

/**
 * Check status update permission
 */
const checkStatusUpdatePermission = async (appointment, user, newStatus) => {
  // Admin can update any status
  if (user.role === USER_ROLES.ADMIN) return true;

  // Doctor can approve, complete, or cancel their appointments
  if (user.role === USER_ROLES.DOCTOR) {
    const doctor = await Doctor.findOne({ userId: user.id });
    if (appointment.doctorId.toString() === doctor?._id.toString()) {
      return [APPOINTMENT_STATUS.APPROVED, APPOINTMENT_STATUS.COMPLETED, APPOINTMENT_STATUS.CANCELED].includes(newStatus);
    }
  }

  // Patient/Visitor can only cancel their appointments
  if ([USER_ROLES.PATIENT, USER_ROLES.GUEST].includes(user.role)) {
    return newStatus === APPOINTMENT_STATUS.CANCELED;
  }

  return false;
};

/**
 * Generate available time slots
 */
const generateAvailableSlots = (timeSlots, existingAppointments, date, slotDuration) => {
  const slots = [];
  
  timeSlots.forEach(slot => {
    const startTime = moment(date).set({
      hour: parseInt(slot.startTime.split(':')[0]),
      minute: parseInt(slot.startTime.split(':')[1]),
      second: 0,
      millisecond: 0
    });
    
    const endTime = moment(date).set({
      hour: parseInt(slot.endTime.split(':')[0]),
      minute: parseInt(slot.endTime.split(':')[1]),
      second: 0,
      millisecond: 0
    });

    // Generate slots every slotDuration minutes
    let currentTime = startTime.clone();
    
    while (currentTime.isBefore(endTime)) {
      const slotEnd = currentTime.clone().add(slotDuration, 'minutes');
      
      // Check if this slot conflicts with existing appointments
      const hasConflict = existingAppointments.some(apt => {
        const aptStart = moment(apt.dateTime);
        const aptEnd = moment(apt.dateTime).add(apt.duration || 30, 'minutes');
        
        return currentTime.isBefore(aptEnd) && slotEnd.isAfter(aptStart);
      });

      // Only add if no conflict and not in the past
      if (!hasConflict && currentTime.isAfter(moment())) {
        slots.push({
          startTime: currentTime.format('HH:mm'),
          endTime: slotEnd.format('HH:mm'),
          dateTime: currentTime.toISOString(),
          available: true
        });
      }

      currentTime.add(slotDuration, 'minutes');
    }
  });

  return slots;
};

module.exports = {
  bookAppointment,
  getUserAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  rescheduleAppointment,
  cancelAppointment,
  getDoctorAppointments,
  getAvailableSlots
}; 
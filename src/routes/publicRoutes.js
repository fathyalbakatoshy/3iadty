const express = require('express');
const { asyncHandler } = require('../middlewares/errorHandler');
const { validatePagination, validateSearch } = require('../middlewares/validation');
const Doctor = require('../models/Doctor');
const Clinic = require('../models/Clinic');
const { sendSuccess, sendNotFound, sendError } = require('../utils/response');
const { SUCCESS_MESSAGES } = require('../config/constants');
const { getAvailablePaymentMethods } = require('../utils/paymentHelpers');

const router = express.Router();

/**
 * @route   GET /api/public/doctors
 * @desc    Get public list of doctors (SEO friendly)
 * @access  Public
 */
router.get('/doctors', validatePagination, asyncHandler(async (req, res) => {
  const { page = 1, limit = 12, specialization, city } = req.query;
  
  const query = {
    isActive: true,
    isAcceptingPatients: true
  };
  
  if (specialization) {
    query.specialization = specialization;
  }
  
  if (city) {
    query['location.address.city'] = new RegExp(city, 'i');
  }
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const doctors = await Doctor.find(query)
    .populate('userId', 'fullName')
    .populate('specialization', 'name code description icon')
    .select('name slug specialization consultationFee stats.averageRating stats.totalReviews profilePicture location.address.city isPhoneVisible')
    .sort({ 'stats.averageRating': -1, createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();
  
  const totalDoctors = await Doctor.countDocuments(query);
  const totalPages = Math.ceil(totalDoctors / parseInt(limit));
  
  return res.status(200).json({
    success: true,
    message: SUCCESS_MESSAGES.RETRIEVED_SUCCESSFULLY,
    data: doctors,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalItems: totalDoctors,
      itemsPerPage: parseInt(limit)
    }
  });
}));

/**
 * @route   GET /api/public/doctor/:slug
 * @desc    Get doctor public profile by slug (SEO friendly)
 * @access  Public
 */
router.get('/doctor/:slug', asyncHandler(async (req, res) => {
  const { slug } = req.params;
  
  const doctor = await Doctor.findOne({ 
    slug, 
    isActive: true 
  })
  .populate('userId', 'fullName')
  .populate('specialization', 'name code description icon')
  .populate('clinics.clinicId', 'name location.address phones workingHours')
  .select('-userId.password -userId.otp')
  .lean();
  
  if (!doctor) {
    return sendNotFound(res, 'الطبيب غير موجود');
  }
  
  return sendSuccess(res, SUCCESS_MESSAGES.RETRIEVED_SUCCESSFULLY, doctor);
}));

/**
 * @route   GET /api/public/clinics
 * @desc    Get public list of clinics
 * @access  Public
 */
router.get('/clinics', validatePagination, asyncHandler(async (req, res) => {
  const { page = 1, limit = 12, city, type } = req.query;
  
  const query = {
    isActive: true
  };
  
  if (city) {
    query['location.address.city'] = new RegExp(city, 'i');
  }
  
  if (type) {
    query.type = type;
  }
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const clinics = await Clinic.find(query)
    .select('name slug type location.address phones stats logo')
    .sort({ 'stats.averageRating': -1, createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();
  
  const totalClinics = await Clinic.countDocuments(query);
  const totalPages = Math.ceil(totalClinics / parseInt(limit));
  
  return res.status(200).json({
    success: true,
    message: SUCCESS_MESSAGES.RETRIEVED_SUCCESSFULLY,
    data: clinics,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalItems: totalClinics,
      itemsPerPage: parseInt(limit)
    }
  });
}));

/**
 * @route   GET /api/public/specializations
 * @desc    Get list of available specializations
 * @access  Public
 */
router.get('/specializations', asyncHandler(async (req, res) => {
  const specializations = await Doctor.distinct('specialization', {
    isActive: true,
    isAcceptingPatients: true
  });
  
  // Count doctors per specialization
  const specializationCounts = await Promise.all(
    specializations.map(async (spec) => {
      const count = await Doctor.countDocuments({
        specialization: spec,
        isActive: true,
        isAcceptingPatients: true
      });
      return { name: spec, count };
    })
  );
  
  // Sort by count descending
  specializationCounts.sort((a, b) => b.count - a.count);
  
  return sendSuccess(res, SUCCESS_MESSAGES.RETRIEVED_SUCCESSFULLY, specializationCounts);
}));

/**
 * @route   GET /api/public/cities
 * @desc    Get list of cities with doctors/clinics
 * @access  Public
 */
router.get('/cities', asyncHandler(async (req, res) => {
  // Get cities from doctors
  const doctorCities = await Doctor.distinct('location.address.city', {
    isActive: true,
    'location.address.city': { $exists: true, $ne: null }
  });
  
  // Get cities from clinics
  const clinicCities = await Clinic.distinct('location.address.city', {
    isActive: true,
    'location.address.city': { $exists: true, $ne: null }
  });
  
  // Combine and deduplicate
  const allCities = [...new Set([...doctorCities, ...clinicCities])];
  
  // Count entities per city
  const cityCounts = await Promise.all(
    allCities.map(async (city) => {
      const doctorCount = await Doctor.countDocuments({
        'location.address.city': city,
        isActive: true
      });
      
      const clinicCount = await Clinic.countDocuments({
        'location.address.city': city,
        isActive: true
      });
      
      return { 
        name: city, 
        doctors: doctorCount, 
        clinics: clinicCount,
        total: doctorCount + clinicCount
      };
    })
  );
  
  // Sort by total count descending
  cityCounts.sort((a, b) => b.total - a.total);
  
  return sendSuccess(res, SUCCESS_MESSAGES.RETRIEVED_SUCCESSFULLY, cityCounts);
}));

/**
 * @route   GET /api/public/search
 * @desc    Global search for doctors and clinics
 * @access  Public
 */
router.get('/search', validateSearch, asyncHandler(async (req, res) => {
  const { q, type = 'all' } = req.query;
  
  if (!q || q.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: 'كلمة البحث يجب أن تكون حرفين على الأقل'
    });
  }
  
  const searchResults = {};
  
  if (type === 'all' || type === 'doctors') {
    const doctors = await Doctor.find({
      $or: [
        { name: new RegExp(q, 'i') },
        { specialization: new RegExp(q, 'i') },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ],
      isActive: true,
      isAcceptingPatients: true
    })
    .populate('userId', 'fullName')
    .select('name slug specialization consultationFee stats.averageRating profilePicture')
    .limit(10)
    .lean();
    
    searchResults.doctors = doctors;
  }
  
  if (type === 'all' || type === 'clinics') {
    const clinics = await Clinic.find({
      $or: [
        { name: new RegExp(q, 'i') },
        { specializations: { $in: [new RegExp(q, 'i')] } },
        { 'location.address.city': new RegExp(q, 'i') }
      ],
      isActive: true
    })
    .select('name slug type location.address stats logo')
    .limit(10)
    .lean();
    
    searchResults.clinics = clinics;
  }
  
  return sendSuccess(res, SUCCESS_MESSAGES.RETRIEVED_SUCCESSFULLY, searchResults);
}));

/**
 * @route   GET /api/public/stats
 * @desc    Get public platform statistics
 * @access  Public
 */
router.get('/stats', asyncHandler(async (req, res) => {
  const [
    totalDoctors,
    totalClinics,
    totalSpecializations,
    totalCities
  ] = await Promise.all([
    Doctor.countDocuments({ isActive: true }),
    Clinic.countDocuments({ isActive: true }),
    Doctor.distinct('specialization').then(specs => specs.length),
    Doctor.distinct('location.address.city').then(cities => cities.length)
  ]);
  
  const stats = {
    totalDoctors,
    totalClinics,
    totalSpecializations,
    totalCities,
    lastUpdated: new Date().toISOString()
  };
  
  return sendSuccess(res, SUCCESS_MESSAGES.RETRIEVED_SUCCESSFULLY, stats);
}));

/**
 * Get platform information including payment policy
 * GET /api/public/platform-info
 */
router.get('/platform-info', async (req, res) => {
  try {
    const platformInfo = {
      name: 'عياداتنا',
      description: 'منصة العيادات الطبية في كوم حمادة والبحيرة',
      location: {
        city: 'كوم حمادة',
        governorate: 'البحيرة',
        country: 'مصر'
      },
      contact: {
        phone: '+20 45 123 4567',
        email: 'info@3ayadatna.com',
        address: 'كوم حمادة، البحيرة، مصر'
      },
      paymentPolicy: {
        policy: 'جميع المدفوعات تتم في العيادة فقط (بدون تأمين صحي حالياً)',
        noOnlinePayment: true,
        noInsurance: true,
        availableMethods: [
          'كاش في العيادة',
          'فيزا/ماستركارد في العيادة',
          'تقسيط مع العيادة'
        ],
        note: 'لا توجد أي مدفوعات أونلاين أو إلكترونية - ولا يوجد تأمين صحي حالياً',
        reminder: 'احضر طريقة الدفع المناسبة معك عند زيارة العيادة'
      },
      coverage: {
        primary: ['كوم حمادة'],
        expanding: ['دمنهور', 'كفر الدوار', 'أبو حمص', 'إيتاي البارود'],
        future: ['رشيد', 'إدكو', 'أبو المطامير', 'الرحمانية']
      },
      services: [
        'حجز المواعيد',
        'إدارة السجلات الطبية', 
        'تقييم الأطباء',
        'البحث عن العيادات',
        'المتابعة الطبية'
      ],
      version: '1.0.0'
    };

    return sendSuccess(res, 'معلومات منصة عياداتنا', platformInfo);
  } catch (error) {
    console.error('خطأ في جلب معلومات المنصة:', error);
    return sendError(res, 'خطأ في جلب معلومات المنصة', 500);
  }
});

/**
 * Get all available payment methods
 * GET /api/public/payment-methods
 */
router.get('/payment-methods', async (req, res) => {
  try {
    const paymentMethods = getAvailablePaymentMethods();
    
    return sendSuccess(res, 'طرق الدفع المتاحة في عياداتنا', {
      methods: paymentMethods,
      notice: 'جميع المدفوعات تتم في العيادة فقط - لا توجد مدفوعات أونلاين',
      supportInfo: {
        phone: '+20 45 123 4567',
        location: 'كوم حمادة، البحيرة، مصر'
      }
    });
  } catch (error) {
    console.error('خطأ في جلب طرق الدفع:', error);
    return sendError(res, 'خطأ في جلب طرق الدفع', 500);
  }
});

module.exports = router; 
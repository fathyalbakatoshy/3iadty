const express = require('express');
const { asyncHandler } = require('../middlewares/errorHandler');
const { 
  validateDoctorProfile,
  validateObjectId,
  validatePagination,
  validateSearch 
} = require('../middlewares/validation');
const { 
  isAuth, 
  isAdmin, 
  isDoctor, 
  isDoctorOrAdmin,
  optionalAuth 
} = require('../middlewares/auth');
const { uploadSingleProfilePicture } = require('../middlewares/fileUpload');
const {
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
} = require('../controllers/doctorController');

const router = express.Router();

/**
 * @route   GET /api/doctors
 * @desc    Get all doctors with filtering and pagination
 * @access  Public
 */
router.get('/', validatePagination, optionalAuth, asyncHandler(getAllDoctors));

/**
 * @route   GET /api/doctors/search
 * @desc    Search doctors
 * @access  Public
 */
router.get('/search', validateSearch, asyncHandler(searchDoctors));

/**
 * @route   GET /api/doctors/nearby
 * @desc    Get nearby doctors based on location
 * @access  Public
 */
router.get('/nearby', asyncHandler(getNearbyDoctors));

/**
 * @route   GET /api/doctors/specialization/:specialization
 * @desc    Get doctors by specialization
 * @access  Public
 */
router.get('/specialization/:specialization', validatePagination, asyncHandler(getDoctorsBySpecialization));

/**
 * @route   POST /api/doctors
 * @desc    Create new doctor profile
 * @access  Private (Admin only)
 */
router.post('/', 
  isAuth, 
  isAdmin, 
  uploadSingleProfilePicture(), 
  validateDoctorProfile, 
  asyncHandler(createDoctor)
);

/**
 * @route   GET /api/doctors/:id
 * @desc    Get doctor by ID or slug
 * @access  Public
 */
router.get('/:id', asyncHandler(getDoctorById));

/**
 * @route   PUT /api/doctors/:id
 * @desc    Update doctor profile
 * @access  Private (Doctor or Admin)
 */
router.put('/:id', 
  isAuth, 
  isDoctorOrAdmin, 
  uploadSingleProfilePicture(), 
  validateObjectId('id'),
  asyncHandler(updateDoctor)
);

/**
 * @route   DELETE /api/doctors/:id
 * @desc    Delete doctor profile (soft delete)
 * @access  Private (Admin only)
 */
router.delete('/:id', 
  isAuth, 
  isAdmin, 
  validateObjectId('id'),
  asyncHandler(deleteDoctor)
);

/**
 * @route   GET /api/doctors/:id/stats
 * @desc    Get doctor statistics
 * @access  Private (Doctor or Admin)
 */
router.get('/:id/stats', 
  isAuth, 
  isDoctorOrAdmin,
  validateObjectId('id'),
  asyncHandler(getDoctorStats)
);

/**
 * @route   POST /api/doctors/:doctorId/clinics/:clinicId
 * @desc    Add doctor to clinic
 * @access  Private (Admin only)
 */
router.post('/:doctorId/clinics/:clinicId',
  isAuth,
  isAdmin,
  validateObjectId('doctorId'),
  validateObjectId('clinicId'),
  asyncHandler(addDoctorToClinic)
);

/**
 * @route   DELETE /api/doctors/:doctorId/clinics/:clinicId
 * @desc    Remove doctor from clinic
 * @access  Private (Admin only)
 */
router.delete('/:doctorId/clinics/:clinicId',
  isAuth,
  isAdmin,
  validateObjectId('doctorId'),
  validateObjectId('clinicId'),
  asyncHandler(removeDoctorFromClinic)
);

module.exports = router; 
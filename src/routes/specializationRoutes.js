const express = require('express');
const { asyncHandler } = require('../middlewares/errorHandler');
const { 
  validateSpecialization,
  validateObjectId,
  validatePagination,
  validateSearch 
} = require('../middlewares/validation');
const { 
  isAuth, 
  isAdmin 
} = require('../middlewares/auth');
const {
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
} = require('../controllers/specializationController');

const router = express.Router();

/**
 * @route   GET /api/specializations
 * @desc    Get all specializations with filtering and pagination (Admin only)
 * @access  Private (Admin)
 */
router.get('/',
  isAuth,
  isAdmin,
  validatePagination,
  asyncHandler(getAllSpecializations)
);

/**
 * @route   GET /api/specializations/active
 * @desc    Get active specializations (Public)
 * @access  Public
 */
router.get('/active',
  asyncHandler(getActiveSpecializations)
);

/**
 * @route   GET /api/specializations/popular
 * @desc    Get popular specializations
 * @access  Public
 */
router.get('/popular',
  asyncHandler(getPopularSpecializations)
);

/**
 * @route   GET /api/specializations/search
 * @desc    Search specializations
 * @access  Public
 */
router.get('/search',
  validateSearch,
  asyncHandler(searchSpecializations)
);

/**
 * @route   GET /api/specializations/:id
 * @desc    Get specialization by ID
 * @access  Public
 */
router.get('/:id',
  validateObjectId,
  asyncHandler(getSpecializationById)
);

/**
 * @route   POST /api/specializations
 * @desc    Create new specialization
 * @access  Private (Admin)
 */
router.post('/',
  isAuth,
  isAdmin,
  validateSpecialization,
  asyncHandler(createSpecialization)
);

/**
 * @route   PUT /api/specializations/:id
 * @desc    Update specialization
 * @access  Private (Admin)
 */
router.put('/:id',
  isAuth,
  isAdmin,
  validateObjectId,
  asyncHandler(updateSpecialization)
);

/**
 * @route   DELETE /api/specializations/:id
 * @desc    Delete specialization (soft delete)
 * @access  Private (Admin)
 */
router.delete('/:id',
  isAuth,
  isAdmin,
  validateObjectId,
  asyncHandler(deleteSpecialization)
);

/**
 * @route   POST /api/specializations/:id/restore
 * @desc    Restore deleted specialization
 * @access  Private (Admin)
 */
router.post('/:id/restore',
  isAuth,
  isAdmin,
  validateObjectId,
  asyncHandler(restoreSpecialization)
);

/**
 * @route   POST /api/specializations/:id/verify
 * @desc    Verify specialization
 * @access  Private (Admin)
 */
router.post('/:id/verify',
  isAuth,
  isAdmin,
  validateObjectId,
  asyncHandler(verifySpecialization)
);

/**
 * @route   POST /api/specializations/:id/update-stats
 * @desc    Update specialization statistics
 * @access  Private (Admin)
 */
router.post('/:id/update-stats',
  isAuth,
  isAdmin,
  validateObjectId,
  asyncHandler(updateSpecializationStats)
);

module.exports = router; 
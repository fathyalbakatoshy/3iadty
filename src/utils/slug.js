const slugify = require('slugify');

/**
 * Generate slug from Arabic text
 * @param {String} text - Text to convert to slug
 * @param {Object} options - Slugify options
 * @returns {String} Generated slug
 */
const generateSlug = (text, options = {}) => {
  const defaultOptions = {
    replacement: '-',
    remove: /[*+~.()'"!:@]/g,
    lower: true,
    strict: false,
    locale: 'ar'
  };

  const mergedOptions = { ...defaultOptions, ...options };
  
  return slugify(text, mergedOptions);
};

/**
 * Generate unique slug by checking database
 * @param {String} text - Text to convert
 * @param {Object} Model - Mongoose model to check against
 * @param {String} field - Field name to check (default: 'slug')
 * @param {String} excludeId - ID to exclude from check (for updates)
 * @returns {String} Unique slug
 */
const generateUniqueSlug = async (text, Model, field = 'slug', excludeId = null) => {
  let baseSlug = generateSlug(text);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query = { [field]: slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existingDoc = await Model.findOne(query);
    
    if (!existingDoc) {
      break;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

/**
 * Update slug if text has changed
 * @param {String} newText - New text
 * @param {String} currentSlug - Current slug
 * @param {Object} Model - Mongoose model
 * @param {String} excludeId - ID to exclude
 * @returns {String} Updated or current slug
 */
const updateSlugIfNeeded = async (newText, currentSlug, Model, excludeId) => {
  const newBaseSlug = generateSlug(newText);
  
  // If the base slug hasn't changed, keep the current slug
  if (currentSlug.startsWith(newBaseSlug)) {
    return currentSlug;
  }

  // Generate new unique slug
  return await generateUniqueSlug(newText, Model, 'slug', excludeId);
};

/**
 * Validate slug format
 * @param {String} slug - Slug to validate
 * @returns {Boolean} True if valid
 */
const isValidSlug = (slug) => {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
};

/**
 * Clean and normalize Arabic text for slug generation
 * @param {String} text - Arabic text
 * @returns {String} Cleaned text
 */
const cleanArabicText = (text) => {
  return text
    .trim()
    .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)) // Convert Arabic-Indic digits
    .replace(/[أإآ]/g, 'ا')  // Normalize alif
    .replace(/[ة]/g, 'ه')   // Replace taa marbouta with haa
    .replace(/[ى]/g, 'ي');  // Replace alif maksura with yaa
};

/**
 * Generate doctor profile slug
 * @param {String} name - Doctor name
 * @param {String} specialization - Doctor specialization
 * @returns {String} SEO-friendly slug
 */
const generateDoctorSlug = (name, specialization) => {
  const cleanName = cleanArabicText(name);
  const cleanSpec = cleanArabicText(specialization);
  return generateSlug(`${cleanName} ${cleanSpec}`);
};

/**
 * Generate clinic slug
 * @param {String} name - Clinic name
 * @param {String} city - City name (optional)
 * @returns {String} SEO-friendly slug
 */
const generateClinicSlug = (name, city = '') => {
  const cleanName = cleanArabicText(name);
  const cleanCity = city ? cleanArabicText(city) : '';
  const fullText = city ? `${cleanName} ${cleanCity}` : cleanName;
  return generateSlug(fullText);
};

module.exports = {
  generateSlug,
  generateUniqueSlug,
  updateSlugIfNeeded,
  isValidSlug,
  cleanArabicText,
  generateDoctorSlug,
  generateClinicSlug
}; 
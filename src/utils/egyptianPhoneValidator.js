/**
 * Egyptian Phone Number Validator
 * محقق أرقام الهواتف المصرية
 * 
 * يدعم جميع أنماط أرقام الهواتف المصرية:
 * - الهواتف المحمولة: 01[0-2,5][0-9]{8}
 * - الهواتف الأرضية: 02[0-9]{8}, 03[0-9]{8}, 04[0-9]{8}, 07[0-9]{8}, 08[0-9]{8}, 09[0-9]{8}
 * - أرقام الخدمات: 19[0-9]{7}, 15[0-9]{7}
 */

const EGYPTIAN_PHONE_PATTERNS = {
  // الهواتف المحمولة - Mobile Phones
  MOBILE: {
    pattern: /^01[0-2,5][0-9]{8}$/,
    description: 'هاتف محمول مصري (يبدأ بـ 010, 011, 012, 015)',
    examples: ['01012345678', '01112345678', '01212345678', '01512345678']
  },
  
  // الهواتف الأرضية - Landline Phones
  LANDLINE: {
    pattern: /^0[2-4,7-9][0-9]{8}$/,
    description: 'هاتف أرضي مصري (يبدأ بـ 02, 03, 04, 07, 08, 09)',
    examples: ['0212345678', '0312345678', '0412345678', '0712345678', '0812345678', '0912345678']
  },
  
  // أرقام الخدمات - Service Numbers
  SERVICE: {
    pattern: /^1[59][0-9]{7}$/,
    description: 'رقم خدمة مصري (يبدأ بـ 15, 19)',
    examples: ['151234567', '191234567']
  },
  
  // أرقام الطوارئ - Emergency Numbers
  EMERGENCY: {
    pattern: /^1[0-4][0-9]{6}$/,
    description: 'رقم طوارئ مصري (يبدأ بـ 10, 11, 12, 13, 14)',
    examples: ['101234567', '111234567', '121234567', '131234567', '141234567']
  }
};

/**
 * التحقق من صحة رقم الهاتف المصري
 * @param {string} phoneNumber - رقم الهاتف للتحقق منه
 * @param {string} type - نوع الهاتف المطلوب (mobile, landline, service, emergency, any)
 * @returns {object} - نتيجة التحقق
 */
const validateEgyptianPhone = (phoneNumber, type = 'any') => {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return {
      isValid: false,
      error: 'رقم الهاتف مطلوب ويجب أن يكون نصاً',
      type: null
    };
  }

  // تنظيف الرقم من المسافات والرموز
  const cleanNumber = phoneNumber.replace(/[\s\-\(\)\+]/g, '');
  
  // التحقق من أن الرقم يحتوي على أرقام فقط
  if (!/^\d+$/.test(cleanNumber)) {
    return {
      isValid: false,
      error: 'رقم الهاتف يجب أن يحتوي على أرقام فقط',
      type: null
    };
  }

  // التحقق حسب النوع المطلوب
  if (type !== 'any') {
    const pattern = EGYPTIAN_PHONE_PATTERNS[type.toUpperCase()];
    if (!pattern) {
      return {
        isValid: false,
        error: `نوع الهاتف غير صحيح. الأنواع المتاحة: ${Object.keys(EGYPTIAN_PHONE_PATTERNS).join(', ')}`,
        type: null
      };
    }

    if (pattern.pattern.test(cleanNumber)) {
      return {
        isValid: true,
        type: type,
        cleanNumber: cleanNumber,
        formattedNumber: formatEgyptianPhone(cleanNumber, type)
      };
    } else {
      return {
        isValid: false,
        error: `رقم الهاتف لا يتطابق مع نمط ${pattern.description}`,
        type: type,
        expectedFormat: pattern.examples[0]
      };
    }
  }

  // التحقق من جميع الأنماط
  for (const [phoneType, config] of Object.entries(EGYPTIAN_PHONE_PATTERNS)) {
    if (config.pattern.test(cleanNumber)) {
      return {
        isValid: true,
        type: phoneType.toLowerCase(),
        cleanNumber: cleanNumber,
        formattedNumber: formatEgyptianPhone(cleanNumber, phoneType.toLowerCase())
      };
    }
  }

  return {
    isValid: false,
    error: 'رقم الهاتف غير صحيح - يجب أن يكون رقم هاتف مصري صالح',
    type: null
  };
};

/**
 * تنسيق رقم الهاتف المصري
 * @param {string} phoneNumber - رقم الهاتف
 * @param {string} type - نوع الهاتف
 * @returns {string} - الرقم المنسق
 */
const formatEgyptianPhone = (phoneNumber, type) => {
  const cleanNumber = phoneNumber.replace(/[\s\-\(\)\+]/g, '');
  
  switch (type) {
    case 'mobile':
      // تنسيق الهاتف المحمول: 010-1234-5678
      return cleanNumber.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    
    case 'landline':
      // تنسيق الهاتف الأرضي: 02-1234-5678
      return cleanNumber.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
    
    case 'service':
      // تنسيق رقم الخدمة: 15-123-4567
      return cleanNumber.replace(/(\d{2})(\d{3})(\d{4})/, '$1-$2-$3');
    
    case 'emergency':
      // تنسيق رقم الطوارئ: 10-123-4567
      return cleanNumber.replace(/(\d{2})(\d{3})(\d{4})/, '$1-$2-$3');
    
    default:
      return cleanNumber;
  }
};

/**
 * استخراج نوع الهاتف من الرقم
 * @param {string} phoneNumber - رقم الهاتف
 * @returns {string|null} - نوع الهاتف أو null
 */
const getPhoneType = (phoneNumber) => {
  const validation = validateEgyptianPhone(phoneNumber, 'any');
  return validation.isValid ? validation.type : null;
};

/**
 * التحقق من أن الرقم هاتف محمول مصري
 * @param {string} phoneNumber - رقم الهاتف
 * @returns {boolean} - true إذا كان هاتف محمول مصري
 */
const isEgyptianMobile = (phoneNumber) => {
  return validateEgyptianPhone(phoneNumber, 'mobile').isValid;
};

/**
 * التحقق من أن الرقم هاتف أرضي مصري
 * @param {string} phoneNumber - رقم الهاتف
 * @returns {boolean} - true إذا كان هاتف أرضي مصري
 */
const isEgyptianLandline = (phoneNumber) => {
  return validateEgyptianPhone(phoneNumber, 'landline').isValid;
};

/**
 * إنشاء رقم هاتف مصري عشوائي للاختبار
 * @param {string} type - نوع الهاتف (mobile, landline, service, emergency)
 * @returns {string} - رقم هاتف عشوائي
 */
const generateRandomEgyptianPhone = (type = 'mobile') => {
  const patterns = {
    mobile: ['010', '011', '012', '015'],
    landline: ['02', '03', '04', '07', '08', '09'],
    service: ['15', '19'],
    emergency: ['10', '11', '12', '13', '14']
  };

  const prefix = patterns[type][Math.floor(Math.random() * patterns[type].length)];
  const remainingDigits = type === 'mobile' ? 8 : (type === 'landline' ? 8 : 7);
  
  let number = prefix;
  for (let i = 0; i < remainingDigits; i++) {
    number += Math.floor(Math.random() * 10);
  }
  
  return number;
};

/**
 * تحويل رقم الهاتف إلى التنسيق الدولي
 * @param {string} phoneNumber - رقم الهاتف المصري
 * @returns {string} - الرقم بالتنسيق الدولي
 */
const toInternationalFormat = (phoneNumber) => {
  const cleanNumber = phoneNumber.replace(/[\s\-\(\)\+]/g, '');
  
  // إزالة الصفر من البداية إذا كان موجوداً
  const numberWithoutZero = cleanNumber.startsWith('0') ? cleanNumber.slice(1) : cleanNumber;
  
  return `+20${numberWithoutZero}`;
};

/**
 * تحويل الرقم الدولي إلى التنسيق المحلي
 * @param {string} internationalNumber - الرقم الدولي
 * @returns {string} - الرقم بالتنسيق المحلي
 */
const fromInternationalFormat = (internationalNumber) => {
  const cleanNumber = internationalNumber.replace(/[\s\-\(\)\+]/g, '');
  
  // إزالة رمز الدولة +20
  if (cleanNumber.startsWith('20')) {
    return `0${cleanNumber.slice(2)}`;
  }
  
  return cleanNumber;
};

module.exports = {
  validateEgyptianPhone,
  formatEgyptianPhone,
  getPhoneType,
  isEgyptianMobile,
  isEgyptianLandline,
  generateRandomEgyptianPhone,
  toInternationalFormat,
  fromInternationalFormat,
  EGYPTIAN_PHONE_PATTERNS
}; 
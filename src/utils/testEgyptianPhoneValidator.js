/**
 * Test file for Egyptian Phone Validator
 * ملف اختبار محقق أرقام الهواتف المصرية
 */

const {
  validateEgyptianPhone,
  formatEgyptianPhone,
  getPhoneType,
  isEgyptianMobile,
  isEgyptianLandline,
  generateRandomEgyptianPhone,
  toInternationalFormat,
  fromInternationalFormat,
  EGYPTIAN_PHONE_PATTERNS
} = require('./egyptianPhoneValidator');

/**
 * Test cases for mobile phones
 */
const testMobilePhones = () => {
  console.log('\n📱 اختبار الهواتف المحمولة:');
  
  const validMobiles = [
    '01012345678',
    '01112345678', 
    '01212345678',
    '01512345678',
    '010-1234-5678',
    '010 1234 5678',
    '+2001012345678'
  ];
  
  const invalidMobiles = [
    '0101234567',    // قصير
    '010123456789',  // طويل
    '02012345678',   // أرضي
    '1234567890',    // بدون صفر
    'abc12345678',   // أحرف
    '0101234567a'    // حرف في النهاية
  ];
  
  console.log('✅ الأرقام الصحيحة:');
  validMobiles.forEach(phone => {
    const result = validateEgyptianPhone(phone, 'mobile');
    console.log(`  ${phone} -> ${result.isValid ? '✅ صحيح' : '❌ خطأ'}`);
    if (result.isValid) {
      console.log(`    النوع: ${result.type}, المنسق: ${result.formattedNumber}`);
    }
  });
  
  console.log('\n❌ الأرقام الخاطئة:');
  invalidMobiles.forEach(phone => {
    const result = validateEgyptianPhone(phone, 'mobile');
    console.log(`  ${phone} -> ${result.isValid ? '✅ صحيح' : '❌ خطأ'}`);
    if (!result.isValid) {
      console.log(`    الخطأ: ${result.error}`);
    }
  });
};

/**
 * Test cases for landline phones
 */
const testLandlinePhones = () => {
  console.log('\n🏠 اختبار الهواتف الأرضية:');
  
  const validLandlines = [
    '0212345678',
    '0312345678',
    '0412345678',
    '0712345678',
    '0812345678',
    '0912345678',
    '02-1234-5678',
    '02 1234 5678'
  ];
  
  const invalidLandlines = [
    '021234567',     // قصير
    '02123456789',   // طويل
    '01012345678',   // محمول
    '1234567890',    // بدون صفر
    '021234567a'     // حرف
  ];
  
  console.log('✅ الأرقام الصحيحة:');
  validLandlines.forEach(phone => {
    const result = validateEgyptianPhone(phone, 'landline');
    console.log(`  ${phone} -> ${result.isValid ? '✅ صحيح' : '❌ خطأ'}`);
    if (result.isValid) {
      console.log(`    النوع: ${result.type}, المنسق: ${result.formattedNumber}`);
    }
  });
  
  console.log('\n❌ الأرقام الخاطئة:');
  invalidLandlines.forEach(phone => {
    const result = validateEgyptianPhone(phone, 'landline');
    console.log(`  ${phone} -> ${result.isValid ? '✅ صحيح' : '❌ خطأ'}`);
    if (!result.isValid) {
      console.log(`    الخطأ: ${result.error}`);
    }
  });
};

/**
 * Test cases for service numbers
 */
const testServiceNumbers = () => {
  console.log('\n🔧 اختبار أرقام الخدمات:');
  
  const validServices = [
    '151234567',
    '191234567',
    '15-123-4567',
    '19 123 4567'
  ];
  
  const invalidServices = [
    '15123456',      // قصير
    '1512345678',    // طويل
    '161234567',     // رقم خاطئ
    '15123456a'      // حرف
  ];
  
  console.log('✅ الأرقام الصحيحة:');
  validServices.forEach(phone => {
    const result = validateEgyptianPhone(phone, 'service');
    console.log(`  ${phone} -> ${result.isValid ? '✅ صحيح' : '❌ خطأ'}`);
    if (result.isValid) {
      console.log(`    النوع: ${result.type}, المنسق: ${result.formattedNumber}`);
    }
  });
  
  console.log('\n❌ الأرقام الخاطئة:');
  invalidServices.forEach(phone => {
    const result = validateEgyptianPhone(phone, 'service');
    console.log(`  ${phone} -> ${result.isValid ? '✅ صحيح' : '❌ خطأ'}`);
    if (!result.isValid) {
      console.log(`    الخطأ: ${result.error}`);
    }
  });
};

/**
 * Test cases for emergency numbers
 */
const testEmergencyNumbers = () => {
  console.log('\n🚨 اختبار أرقام الطوارئ:');
  
  const validEmergency = [
    '101234567',
    '111234567',
    '121234567',
    '131234567',
    '141234567',
    '10-123-4567',
    '11 123 4567'
  ];
  
  const invalidEmergency = [
    '10123456',      // قصير
    '1012345678',    // طويل
    '151234567',     // رقم خدمة
    '10123456a'      // حرف
  ];
  
  console.log('✅ الأرقام الصحيحة:');
  validEmergency.forEach(phone => {
    const result = validateEgyptianPhone(phone, 'emergency');
    console.log(`  ${phone} -> ${result.isValid ? '✅ صحيح' : '❌ خطأ'}`);
    if (result.isValid) {
      console.log(`    النوع: ${result.type}, المنسق: ${result.formattedNumber}`);
    }
  });
  
  console.log('\n❌ الأرقام الخاطئة:');
  invalidEmergency.forEach(phone => {
    const result = validateEgyptianPhone(phone, 'emergency');
    console.log(`  ${phone} -> ${result.isValid ? '✅ صحيح' : '❌ خطأ'}`);
    if (!result.isValid) {
      console.log(`    الخطأ: ${result.error}`);
    }
  });
};

/**
 * Test phone type detection
 */
const testPhoneTypeDetection = () => {
  console.log('\n🔍 اختبار اكتشاف نوع الهاتف:');
  
  const testNumbers = [
    '01012345678',   // mobile
    '0212345678',    // landline
    '151234567',     // service
    '101234567',     // emergency
    'invalid123'     // invalid
  ];
  
  testNumbers.forEach(phone => {
    const type = getPhoneType(phone);
    const isMobile = isEgyptianMobile(phone);
    const isLandline = isEgyptianLandline(phone);
    
    console.log(`  ${phone}:`);
    console.log(`    النوع: ${type || 'غير معروف'}`);
    console.log(`    محمول: ${isMobile ? 'نعم' : 'لا'}`);
    console.log(`    أرضي: ${isLandline ? 'نعم' : 'لا'}`);
  });
};

/**
 * Test formatting functions
 */
const testFormatting = () => {
  console.log('\n🎨 اختبار التنسيق:');
  
  const testCases = [
    { number: '01012345678', type: 'mobile' },
    { number: '0212345678', type: 'landline' },
    { number: '151234567', type: 'service' },
    { number: '101234567', type: 'emergency' }
  ];
  
  testCases.forEach(({ number, type }) => {
    const formatted = formatEgyptianPhone(number, type);
    const international = toInternationalFormat(number);
    const local = fromInternationalFormat(international);
    
    console.log(`  ${number} (${type}):`);
    console.log(`    المنسق: ${formatted}`);
    console.log(`    دولي: ${international}`);
    console.log(`    محلي: ${local}`);
  });
};

/**
 * Test random phone generation
 */
const testRandomGeneration = () => {
  console.log('\n🎲 اختبار إنشاء أرقام عشوائية:');
  
  const types = ['mobile', 'landline', 'service', 'emergency'];
  
  types.forEach(type => {
    console.log(`\n  ${type}:`);
    for (let i = 0; i < 3; i++) {
      const randomPhone = generateRandomEgyptianPhone(type);
      const validation = validateEgyptianPhone(randomPhone, type);
      console.log(`    ${randomPhone} -> ${validation.isValid ? '✅ صحيح' : '❌ خطأ'}`);
    }
  });
};

/**
 * Test patterns
 */
const testPatterns = () => {
  console.log('\n📋 أنماط أرقام الهواتف المصرية:');
  
  Object.entries(EGYPTIAN_PHONE_PATTERNS).forEach(([type, config]) => {
    console.log(`\n  ${type}:`);
    console.log(`    الوصف: ${config.description}`);
    console.log(`    أمثلة: ${config.examples.join(', ')}`);
  });
};

/**
 * Run all tests
 */
const runAllTests = () => {
  console.log('🧪 بدء اختبار محقق أرقام الهواتف المصرية\n');
  console.log('=' .repeat(60));
  
  testMobilePhones();
  testLandlinePhones();
  testServiceNumbers();
  testEmergencyNumbers();
  testPhoneTypeDetection();
  testFormatting();
  testRandomGeneration();
  testPatterns();
  
  console.log('\n' + '=' .repeat(60));
  console.log('✅ انتهى الاختبار بنجاح!');
};

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testMobilePhones,
  testLandlinePhones,
  testServiceNumbers,
  testEmergencyNumbers,
  testPhoneTypeDetection,
  testFormatting,
  testRandomGeneration,
  testPatterns,
  runAllTests
}; 
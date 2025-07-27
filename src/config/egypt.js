// Egypt-specific configurations for 3ayadatna platform
// محافظة البحيرة - كوم حمادة

const EGYPT_CONFIG = {
  // Basic Information
  COUNTRY: 'مصر',
  GOVERNORATE: 'البحيرة',
  MAIN_CITY: 'كوم حمادة',
  PHONE_CODE: '+20',
  CURRENCY: 'جنيه مصري',
  CURRENCY_CODE: 'EGP',
  TIMEZONE: 'Africa/Cairo',
  
  // Dynamic Expansion Settings
  EXPANSION: {
    ENABLED: true,
    AUTO_APPROVE_DOCTORS: false, // المديرين يراجعوا الأطباء الجداد
    AUTO_APPROVE_CLINICS: false, // المديرين يراجعوا العيادات الجديدة
    MAX_DOCTORS_PER_GOVERNORATE: 500,
    MAX_CLINICS_PER_CITY: 50,
    EXPANSION_NOTIFICATION: true // إشعار المديرين لما يسجل طبيب جديد
  },
  
  // Coverage Areas - المناطق المغطاة
  COVERAGE_AREAS: {
    PRIMARY: ['كوم حمادة'], // المنطقة الأساسية
    SECONDARY: [ // المناطق المخطط توسيعها ليها
      'دمنهور',
      'كفر الدوار', 
      'أبو حمص',
      'إيتاي البارود'
    ],
    FUTURE: [ // للمستقبل
      'رشيد',
      'إدكو',
      'أبو المطامير',
      'الرحمانية'
    ]
  },
  
  // Egyptian Medical Specializations with local terms
  MEDICAL_SPECIALIZATIONS_EGYPTIAN: {
    'باطنة': {
      code: 'INTERNAL',
      description: 'طب باطني وأمراض بالغين',
      common_conditions: ['ضغط', 'سكري', 'كوليسترول', 'أنيميا']
    },
    'أطفال': {
      code: 'PEDIATRICS', 
      description: 'طب الأطفال وحديثي الولادة',
      common_conditions: ['حمى', 'نزلات برد', 'تطعيمات', 'نمو']
    },
    'نساء وتوليد': {
      code: 'GYNECOLOGY',
      description: 'أمراض النساء والولادة',
      common_conditions: ['حمل', 'ولادة', 'كشف دوري', 'تأخر إنجاب']
    },
    'عظام': {
      code: 'ORTHOPEDICS',
      description: 'جراحة العظام والمفاصل',
      common_conditions: ['كسور', 'خشونة مفاصل', 'انزلاق غضروفي', 'التهاب أوتار']
    },
    'قلب': {
      code: 'CARDIOLOGY',
      description: 'أمراض القلب والأوعية الدموية',
      common_conditions: ['ضغط دم', 'جلطات', 'عدم انتظام ضربات', 'قصور شرايين']
    },
    'جلدية': {
      code: 'DERMATOLOGY',
      description: 'الأمراض الجلدية والتناسلية',
      common_conditions: ['حساسية', 'أكزيما', 'صدفية', 'حبوب الشباب']
    },
    'عيون': {
      code: 'OPHTHALMOLOGY',
      description: 'طب وجراحة العيون',
      common_conditions: ['ضعف نظر', 'مياه بيضاء', 'مياه زرقاء', 'شبكية']
    },
    'أنف وأذن وحنجرة': {
      code: 'ENT',
      description: 'أمراض الأنف والأذن والحنجرة',
      common_conditions: ['احتقان جيوب', 'التهاب أذن', 'حساسية أنف', 'اللوز']
    },
    'أسنان': {
      code: 'DENTISTRY',
      description: 'طب وتجميل الأسنان',
      common_conditions: ['تسوس', 'التهاب لثة', 'تقويم', 'حشو وتركيبات']
    },
    'مخ وأعصاب': {
      code: 'NEUROLOGY',
      description: 'الأمراض العصبية والدماغ',
      common_conditions: ['صداع نصفي', 'صرع', 'جلطة دماغية', 'ضعف أعصاب']
    }
  },
  
  // Payment Methods Popular in Egypt (في العيادة فقط - بدون تأمين)
  PAYMENT_METHODS_EGYPT: {
    CASH: {
      name: 'كاش',
      icon: '💵',
      popular: true,
      location: 'في العيادة',
      description: 'دفع نقدي في العيادة مباشرة'
    },
    CARD_IN_CLINIC: {
      name: 'فيزا / ماستركارد',
      icon: '💳',
      popular: true,
      location: 'في العيادة',
      description: 'بطاقة بنكية في ماكينة العيادة'
    },
    INSTALLMENTS: {
      name: 'تقسيط',
      icon: '📊',
      popular: false,
      location: 'في العيادة',
      description: 'تقسيط مع العيادة حسب الاتفاق'
    }
  },
  
  // Pricing Guidelines (in EGP)
  PRICING_GUIDELINES: {
    CONSULTATION_FEES: {
      GENERAL_PRACTICE: { min: 100, max: 300, currency: 'EGP' },
      SPECIALIST: { min: 200, max: 500, currency: 'EGP' },
      CONSULTANT: { min: 300, max: 800, currency: 'EGP' },
      PROFESSOR: { min: 500, max: 1200, currency: 'EGP' }
    },
    PROCEDURES: {
      BASIC_PROCEDURE: { min: 200, max: 1000, currency: 'EGP' },
      ADVANCED_PROCEDURE: { min: 1000, max: 5000, currency: 'EGP' },
      SURGICAL: { min: 3000, max: 20000, currency: 'EGP' }
    }
  },
  
  // Real-time Features for Egypt
  REALTIME_CONFIG: {
    ENABLED: true,
    NOTIFICATIONS_ARABIC: true,
    EMERGENCY_ALERTS: true,
    DOCTOR_AVAILABILITY_UPDATES: true,
    APPOINTMENT_REMINDERS: true,
    SYSTEM_MAINTENANCE_ALERTS: true
  },
  
  // Audit Log Settings for Medical Compliance
  AUDIT_SETTINGS: {
    RETENTION_DAYS: 2555, // 7 سنين للسجلات الطبية
    ENCRYPTION_REQUIRED: true,
    BACKUP_FREQUENCY: 'daily',
    COMPLIANCE_STANDARD: 'Egyptian Medical Records Law',
    SENSITIVE_DATA_MASKING: true
  }
};

module.exports = EGYPT_CONFIG; 